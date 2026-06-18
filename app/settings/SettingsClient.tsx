'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

interface Props {
  shop: Shop;
}

export default function SettingsClient({
  shop,
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

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />
      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-12">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#1a6b3c]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#1a6b3c] flex items-center justify-center text-white">
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

        {/* Shop Details */}
        <section className="mb-8">
          <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
            Business Details
          </h2>
          <form
            onSubmit={handleSaveShop}
            className="bg-white rounded-none border border-[#e5e7eb] p-6 space-y-4 shadow-xs"
          >
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
                    disabled={uploadingLogo}
                    className="block w-full text-sm text-[#4b5563] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-[#e5e7eb] file:text-xs file:font-bold file:bg-[#f3f4f6] file:text-[#111827] hover:file:bg-[#e5e7eb] transition-colors cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1.5">
                    JPG, PNG, WebP up to 2MB. 
                    {uploadingLogo && <span className="text-[#1a6b3c] ml-1 font-bold">Uploading logo...</span>}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Shop Name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
            <Input
              label="Invoice Prefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g. INV, AF"
            />
            <Input
              label="Address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
            />
            <Input
              label="Phone"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              type="tel"
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
                  className="w-10 h-6 bg-gray-200 checked:bg-[#1a6b3c] rounded-none appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
                />
              </div>

              {gstRegistered && (
                <Input
                  label="GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 33AAAAA1111A1Z1"
                  required
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
                    className="w-10 h-6 bg-gray-200 checked:bg-[#1a6b3c] rounded-none appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
                  />
                </div>
              </div>
            )}

            <Button type="submit" loading={savingShop}>
              Save Changes
            </Button>
          </form>
        </section>
      </PageTransition>
    </div>
  );
}
