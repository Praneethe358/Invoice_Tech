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
import { Shop, Product } from '@/lib/types';

interface Props {
  shop: Shop;
  initialProducts: Product[];
}

export default function SettingsClient({
  shop,
  initialProducts,
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

  // ─── Products ─────────────────────────────────────────────
  const [products, setProducts] = useState(initialProducts);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newHsn, setNewHsn] = useState('');
  const [newGst, setNewGst] = useState('0');
  const [addingProduct, setAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editHsn, setEditHsn] = useState('');
  const [editGst, setEditGst] = useState('0');

  const handleAddProduct = async () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);
    const hsn = newHsn.trim();
    const gstRate = parseFloat(newGst) || 0;

    if (!name) {
      showToast('Enter a product name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    setAddingProduct(true);
    const { data, error } = await supabase
      .from('products')
      .insert({ shop_id: shop.id, name, price, hsn_code: hsn || null, gst_rate: gstRate })
      .select()
      .single();

    if (error) {
      showToast('Failed to add product', 'error');
    } else if (data) {
      setProducts((prev) => [...prev, data as Product]);
      setNewName('');
      setNewPrice('');
      setNewHsn('');
      setNewGst('0');
      showToast('Product added', 'success');
    }
    setAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Failed to delete product', 'error');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product deleted', 'success');
    }
    setConfirmDeleteId(null);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditHsn(product.hsn_code || '');
    setEditGst(String(product.gst_rate || 0));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    const price = parseFloat(editPrice);
    const hsn = editHsn.trim();
    const gstRate = parseFloat(editGst) || 0;

    if (!name || isNaN(price) || price <= 0) {
      showToast('Enter valid name and price', 'error');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ name, price, hsn_code: hsn || null, gst_rate: gstRate })
      .eq('id', editingId);

    if (error) {
      showToast('Failed to update product', 'error');
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId ? { ...p, name, price, hsn_code: hsn || null, gst_rate: gstRate } : p
        )
      );
      setEditingId(null);
      showToast('Product updated', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-12">
        <h1 className="text-xl font-bold text-[#111827] mb-6">
          Settings
        </h1>

        {/* Shop Details */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Shop Details
          </h2>
          <form
            onSubmit={handleSaveShop}
            className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4"
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#4b5563] uppercase tracking-wide">
                Shop Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#e5e7eb] overflow-hidden flex items-center justify-center bg-[#f9fafb]">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
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
                    className="block w-full text-sm text-[#4b5563] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#f3f4f6] file:text-[#111827] hover:file:bg-[#e5e7eb] transition-colors cursor-pointer"
                  />
                  <p className="text-[10px] text-[#6b7280] mt-1">
                    JPG, PNG, WebP up to 2MB. 
                    {uploadingLogo && <span className="text-[#1a6b3c] ml-1">Uploading...</span>}
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
                  className="w-10 h-6 bg-gray-200 checked:bg-[#1a6b3c] rounded-full appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
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

            <Button type="submit" loading={savingShop}>
              Save Changes
            </Button>
          </form>
        </section>

        {/* Product Catalog */}
        <section>
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Product Catalog
          </h2>

          {/* Add Product Form */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 mb-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Product name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input
                  placeholder="Price"
                  type="number"
                  prefix="₹"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
            </div>
            {gstRegistered && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="HSN Code (optional)"
                    value={newHsn}
                    onChange={(e) => setNewHsn(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <select
                    value={newGst}
                    onChange={(e) => setNewGst(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none min-h-[44px]"
                  >
                    <option value="0">0% GST</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>
            )}
            <Button
              onClick={handleAddProduct}
              loading={addingProduct}
              disabled={!newName || !newPrice}
              fullWidth
            >
              Add Product
            </Button>
          </div>

          {/* Product Limit Warning */}
          {products.length > 50 && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
              You have a large catalog — consider removing unused items to keep your invoice builder fast.
            </div>
          )}

          {/* Product List */}
          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description="Add your first item above. These products will appear in your invoice builder for quick selection."
            />
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-[#e5e7eb] p-4"
                  >
                    {editingId === product.id ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              value={editName}
                              onChange={(e) =>
                                setEditName(e.target.value)
                              }
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              prefix="₹"
                              value={editPrice}
                              onChange={(e) =>
                                setEditPrice(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        {gstRegistered && (
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <Input
                                placeholder="HSN Code"
                                value={editHsn}
                                onChange={(e) => setEditHsn(e.target.value)}
                              />
                            </div>
                            <div className="w-28">
                              <select
                                value={editGst}
                                onChange={(e) => setEditGst(e.target.value)}
                                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none min-h-[44px]"
                              >
                                <option value="0">0% GST</option>
                                <option value="5">5% GST</option>
                                <option value="12">12% GST</option>
                                <option value="18">18% GST</option>
                                <option value="28">28% GST</option>
                              </select>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={handleSaveEdit}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-xs text-[#6b7280]">
                            <span className="tabular-nums">
                              ₹{Number(product.price).toLocaleString('en-IN')}
                            </span>
                            {gstRegistered && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c]">
                                  {product.gst_rate || 0}% GST
                                </span>
                                {product.hsn_code && (
                                  <>
                                    <span>•</span>
                                    <span>HSN: {product.hsn_code}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(product)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#6b7280] transition-colors"
                            aria-label={`Edit ${product.name}`}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-red-50 text-[#dc2626] transition-colors"
                            aria-label={`Delete ${product.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                    {confirmDeleteId === product.id && editingId !== product.id && (
                      <div className="mt-3 pt-3 border-t border-[#e5e7eb] flex items-center justify-between text-sm">
                        <p className="text-[#111827] font-medium">Delete {product.name}?</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setConfirmDeleteId(null)} 
                            className="px-3 py-1.5 bg-[#f3f4f6] text-[#4b5563] rounded-lg font-semibold text-xs hover:bg-[#e5e7eb]"
                          >
                            No
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)} 
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold text-xs hover:bg-red-100"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </PageTransition>
    </div>
  );
}
