'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Shop } from '@/lib/types';
import { SHOP_CONFIG } from '@/lib/shop-config';
import { ShopType } from '@/lib/starter-catalogs';
import { hasPermission, UserRole } from '@/lib/permissions';

interface Props {
  shop: Shop;
  role: UserRole;
}

export default function SettingsClient({
  shop,
  role,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  // ─── Shop Details ─────────────────────────────────────────
  const [shopName, setShopName] = useState(shop.name);
  const [shopAddress, setShopAddress] = useState(
    shop.address || ''
  );
  const [shopPhone, setShopPhone] = useState(shop.phone || '');
  const [invoicePrefix, setInvoicePrefix] = useState(shop.invoice_prefix || 'INV');
  const [logoUrl, setLogoUrl] = useState(shop.logo_url || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingShop, setSavingShop] = useState(false);

  // GST State Details
  const [gstRegistered, setGstRegistered] = useState(shop.gst_registered || false);
  const [gstin, setGstin] = useState(shop.gstin || '');

  const config = SHOP_CONFIG[shop.shop_type as ShopType] || SHOP_CONFIG.other;
  const isInventoryAllowed = config.inventoryEnabled || shop.shop_type === 'other';
  const [inventoryEnabledGlobal, setInventoryEnabledGlobal] = useState(shop.inventory_enabled);

  // Phase 12 export and rate limiting
  const [exportCount, setExportCount] = useState<number | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (role === 'owner') {
      const fetchExportCount = async () => {
        setCheckingLimit(true);
        try {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const { count, error } = await supabase
            .from('data_exports')
            .select('id', { count: 'exact', head: true })
            .eq('shop_id', shop.id)
            .eq('export_type', 'full')
            .gte('created_at', startOfToday.toISOString());
          if (!error && count !== null) {
            setExportCount(count);
          }
        } catch (err) {
          console.error('Error fetching export limit count:', err);
        } finally {
          setCheckingLimit(false);
        }
      };
      fetchExportCount();
    }
  }, [role, shop.id, supabase]);

  const handleCopyShopId = () => {
    navigator.clipboard.writeText(shop.id);
    showToast('Shop ID copied to clipboard ✓', 'success');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/export/full');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `TruBill_FullExport_${shop.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      showToast('Data exported successfully ✓', 'success');
      setExportCount(prev => (prev !== null ? prev + 1 : 1));
    } catch (err: any) {
      showToast(err.message || 'Failed to download data', 'error');
    } finally {
      setExporting(false);
    }
  };


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, and WebP are allowed', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be less than 2MB', 'error');
      return;
    }

    setUploadingLogo(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${shop.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('shop-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast('Failed to upload logo', 'error');
      setUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage.from('shop-logos').getPublicUrl(filePath);
    
    setLogoUrl(data.publicUrl);
    setUploadingLogo(false);
    showToast('Logo uploaded', 'success');
  };

  const handleSaveShop = async (e: FormEvent) => {
    e.preventDefault();

    if (gstRegistered) {
      const trimmedGstin = gstin.trim().toUpperCase();
      const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d$/;
      if (!trimmedGstin) {
        showToast('GSTIN is required if GST is enabled', 'error');
        return;
      }
      if (!gstinRegex.test(trimmedGstin)) {
        showToast('Invalid GSTIN format (15 characters, e.g. 33AAAAA1111A1Z1)', 'error');
        return;
      }
    }

    setSavingShop(true);

    const { error } = await supabase
      .from('shops')
      .update({
        name: shopName.trim(),
        address: shopAddress.trim() || null,
        phone: shopPhone.trim() || null,
        invoice_prefix: invoicePrefix.trim() || 'INV',
        logo_url: logoUrl || null,
        gst_registered: gstRegistered,
        gstin: gstRegistered ? gstin.trim().toUpperCase() : null,
        inventory_enabled: inventoryEnabledGlobal,
      })
      .eq('id', shop.id);

    if (error) {
      showToast('Failed to update shop details', 'error');
    } else {
      showToast('Shop details updated', 'success');
      router.refresh();
    }
    setSavingShop(false);
  };

  const canEditShop = hasPermission(role, 'settings.shop');

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />
      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-12">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#0050e8] flex items-center justify-center text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {shopName || shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Business Settings & Tax Profiles
              </p>
            </div>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
            Settings
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Manage business profile, tax configurations, and system preferences.
          </p>
        </div>

        {/* Shop Administration - Owner Only */}
        {role === 'owner' && (
          <section className="mb-8">
            <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
              Shop Administration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/settings/staff"
                className="flex items-center justify-between p-5 bg-white border border-[#e5e7eb] hover:border-[#0050e8] hover:bg-[#0050e8]/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0050e8]/10 text-[#0050e8] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Team Members</h3>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Manage staff roles and access permissions</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#0050e8] group-hover:translate-x-0.5 transition-all">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>

              <Link
                href="/settings/audit"
                className="flex items-center justify-between p-5 bg-white border border-[#e5e7eb] hover:border-[#0050e8] hover:bg-[#0050e8]/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0050e8]/10 text-[#0050e8] flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Audit Trail</h3>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Track actions and logs of your business account</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-[#0050e8] group-hover:translate-x-0.5 transition-all">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </section>
        )}

        {/* Shop Details */}
        <section className="mb-8">
          <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
            Business Details
          </h2>
          <form
            onSubmit={handleSaveShop}
            className="bg-white rounded-none border border-[#e5e7eb] p-6 space-y-4 shadow-xs"
          >
            {!canEditShop && (
              <div className="bg-amber-50 border border-amber-200 p-4 mb-4 text-xs font-bold text-amber-800">
                ⚠️ Only the Shop Owner has permission to edit business profile details.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#4b5563] uppercase tracking-wide">
                Business Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-none border border-[#e5e7eb] overflow-hidden flex items-center justify-center bg-[#f9fafb]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="0" ry="0" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo || !canEditShop}
                    className="block w-full text-sm text-[#4b5563] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-[#e5e7eb] file:text-xs file:font-bold file:bg-[#f3f4f6] file:text-[#111827] hover:file:bg-[#e5e7eb] transition-colors cursor-pointer disabled:opacity-50"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1.5">
                    JPG, PNG, WebP up to 2MB. 
                    {uploadingLogo && <span className="text-[#0050e8] ml-1 font-bold">Uploading logo...</span>}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Shop Name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              disabled={!canEditShop}
            />
            <Input
              label="Invoice Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g. INV, AF"
              disabled={!canEditShop}
            />
            <Input
              label="Address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              disabled={!canEditShop}
            />
            <Input
              label="Phone"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              type="tel"
              disabled={!canEditShop}
            />

            {/* GST Compliant Billing details */}
            <div className="border-t border-[#f3f4f6] pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[#4b5563] uppercase tracking-wide">GST Compliant Billing</h3>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">Enable HSN & state tax calculations (CGST/SGST)</p>
                </div>
                <input
                  type="checkbox"
                  checked={gstRegistered}
                  onChange={(e) => setGstRegistered(e.target.checked)}
                  disabled={!canEditShop}
                  className="w-10 h-6 bg-gray-200 checked:bg-[#0050e8] rounded-none appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300 disabled:opacity-50"
                />
              </div>

              {gstRegistered && (
                <Input
                  label="GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 33AAAAA1111A1Z1"
                  required
                  disabled={!canEditShop}
                />
              )}
            </div>

            {/* Inventory Tracking Details */}
            {isInventoryAllowed && (
              <div className="border-t border-[#f3f4f6] pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#4b5563] uppercase tracking-wide">Inventory Tracking</h3>
                    <p className="text-[10px] text-[#6b7280] mt-0.5">Track stock levels and warning notifications for products</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={inventoryEnabledGlobal}
                    onChange={(e) => setInventoryEnabledGlobal(e.target.checked)}
                    disabled={!canEditShop}
                    className="w-10 h-6 bg-gray-200 checked:bg-[#0050e8] rounded-none appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300 disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {canEditShop && (
              <Button type="submit" loading={savingShop}>
                Save Changes
              </Button>
            )}
          </form>
        </section>

        {/* Danger Zone - Owner Only */}
        {role === 'owner' && (
          <section className="mb-8 border-l-4 border-red-500 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-extrabold text-red-600 uppercase tracking-wider mb-6 font-heading">
              Danger Zone
            </h2>
            
            {/* Sub-section 1 — Export My Data */}
            <div className="mb-6 pb-6 border-b border-[#f3f4f6]">
              <h3 className="text-xs font-extrabold text-gray-950 uppercase tracking-wider mb-1">
                Export Your Data
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mb-3">
                Download a complete copy of all your TruBill data as an Excel workbook.
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting || (exportCount !== null && exportCount >= 3)}
                  className="px-5 py-2.5 text-xs font-bold text-white transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {exporting ? 'Preparing export...' : 'Download All Data'}
                </button>
                
                <div className="text-[10px] text-gray-500 font-semibold">
                  {exportCount !== null && exportCount >= 3 ? (
                    <span className="text-red-500 font-bold block">
                      Daily limit reached. Try again tomorrow.
                    </span>
                  ) : (
                    <span>
                      You can export up to 3 times per day. 
                      {exportCount !== null && ` (Used today: ${exportCount}/3)`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-section 2 — Account Information */}
            <div className="mb-6 pb-6 border-b border-[#f3f4f6]">
              <h3 className="text-xs font-extrabold text-gray-905 uppercase tracking-wider mb-3">
                Account Information
              </h3>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-semibold">Shop ID:</span>
                  <code className="text-[11px] text-gray-700 font-mono bg-gray-50 px-2 py-0.5 border border-gray-150">
                    {shop.id}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyShopId}
                    className="text-[10px] text-[#0050e8] hover:underline font-bold cursor-pointer"
                  >
                    [Copy Shop ID]
                  </button>
                </div>
                <div className="text-[11px] text-gray-500 font-semibold">
                  Member since: <span className="text-gray-700 font-bold">{new Date(shop.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-semibold">Subscription status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Active (Pro)
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-section 3 — Delete Account (stub only) */}
            <div className="p-4 bg-gray-50/70 border border-gray-200">
              <h3 className="text-xs font-bold text-gray-900 mb-1">
                Delete Account
              </h3>
              <p className="text-[11px] text-gray-600 font-medium italic">
                Want to delete your account? Contact us at <a href="mailto:support@trubill.in" className="text-[#0050e8] underline">support@trubill.in</a> and we will process your request within 24 hours.
              </p>
            </div>
          </section>
        )}
      </PageTransition>
    </div>
  );
}
