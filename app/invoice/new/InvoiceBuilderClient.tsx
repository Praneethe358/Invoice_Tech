'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import CatalogCard from '@/components/CatalogCard';
import LineItem from '@/components/LineItem';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SuccessAnimation from '@/components/SuccessAnimation';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Product, InvoiceItem, Customer, ApiError } from '@/lib/types';
import { validatePhone } from '@/lib/validators';
import { useMemo } from 'react';
import { SHOP_CONFIG } from '@/lib/shop-config';
import { ShopType } from '@/lib/starter-catalogs';

interface Props {
  products: Product[];
  shopId: string;
  shop: {
    id: string;
    gst_registered: boolean;
    gstin: string | null;
    inventory_enabled: boolean;
    shop_type: string;
  };
}

export default function InvoiceBuilderClient({ products, shopId, shop }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customHsn, setCustomHsn] = useState('');
  const [customGst, setCustomGst] = useState('0');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const config = SHOP_CONFIG[shop.shop_type as ShopType] || SHOP_CONFIG.other;

  const categoriesExist = useMemo(() => {
    return localProducts.some(p => p.category);
  }, [localProducts]);

  const activeCategories = useMemo(() => {
    const list = Array.from(new Set(localProducts.map(p => p.category).filter(Boolean))) as string[];
    if (localProducts.some(p => !p.category)) {
      if (!list.includes('Others')) {
        list.push('Others');
      }
    }
    return list;
  }, [localProducts]);

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  const filteredProducts = useMemo(() => {
    if (!categoriesExist || selectedCategoryTab === 'All') return localProducts;
    if (selectedCategoryTab === 'Others') {
      return localProducts.filter(p => !p.category || p.category === 'Others');
    }
    return localProducts.filter(p => p.category === selectedCategoryTab);
  }, [localProducts, categoriesExist, selectedCategoryTab]);

  const favoriteProducts = useMemo(() => {
    return localProducts.filter(p => p.is_favorite).slice(0, 8);
  }, [localProducts]);

  const recentlyUsedProducts = useMemo(() => {
    return localProducts
      .filter(p => p.last_used_at)
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
      .slice(0, 5);
  }, [localProducts]);

  const handleToggleFavorite = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !product.is_favorite;

    setLocalProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_favorite: nextVal } : p))
    );

    const { error } = await supabase
      .from('products')
      .update({ is_favorite: nextVal })
      .eq('id', product.id);

    if (error) {
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_favorite: !nextVal } : p))
      );
      showToast('Failed to update favorite status', 'error');
    } else {
      showToast(nextVal ? `"${product.name}" added to Favorites` : `"${product.name}" removed from Favorites`, 'success');
    }
  };

  const handlePriceUpdate = async (product: Product, newPrice: number) => {
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, price: newPrice } : p))
    );

    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', product.id);

    if (error) {
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, price: product.price } : p))
      );
      showToast('Failed to update price', 'error');
    } else {
      showToast(`Price of "${product.name}" updated to ₹${newPrice}`, 'success');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchedProducts = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return filteredProducts;
    return filteredProducts.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.hsn_code && p.hsn_code.toLowerCase().includes(query))
    );
  }, [filteredProducts, debouncedSearchQuery]);

  // ─── Customer autocomplete ─────────────────────────────────
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [debouncedPhone, setDebouncedPhone] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce phone input for search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(phone), 300);
    return () => clearTimeout(timer);
  }, [phone]);

  // Search customers when phone changes
  useEffect(() => {
    if (!debouncedPhone || debouncedPhone.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId)
        .or(`phone.ilike.%${debouncedPhone}%,name.ilike.%${debouncedPhone}%`)
        .limit(5);

      const results = (data ?? []) as Customer[];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    };

    search();
  }, [debouncedPhone, shopId, supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCustomer = (c: Customer) => {
    setPhone(c.phone.slice(-10));
    setCustomerName(c.name);
    setCustomerGstin(c.gstin || '');
    setSelectedCustomer(c);
    setShowSuggestions(false);
    setPhoneError('');
  };

  // ─── Item management ─────────────────────────────────────
  const addOrIncrement = useCallback(
    (name: string, price: number, hsn_code?: string | null, gst_rate?: number) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.name === name);
        if (existing) {
          return prev.map((i) =>
            i.name === name
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { name, price, quantity: 1, hsn_code: hsn_code || null, gst_rate: gst_rate || 0 }];
      });
    },
    []
  );

  const updateQty = useCallback(
    (name: string, qty: number) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => i.name !== name));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.name === name ? { ...i, quantity: qty } : i
          )
        );
      }
    },
    []
  );

  const getItemQty = (name: string): number => {
    return items.find((i) => i.name === name)?.quantity ?? 0;
  };

  // ─── Custom item ──────────────────────────────────────────
  const handleAddCustom = () => {
    const name = customName.trim().toUpperCase();
    const price = parseFloat(customPrice);
    const hsn = customHsn.trim();
    const gstRate = parseFloat(customGst) || 0;

    if (!name) {
      showToast('Enter an item name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    addOrIncrement(name, price, hsn, gstRate);
    setCustomName('');
    setCustomPrice('');
    setCustomHsn('');
    setCustomGst('0');
    setShowCustom(false);
  };

  // ─── Phone validation ─────────────────────────────────────
  const handlePhoneBlur = () => {
    if (phone && !validatePhone(phone)) {
      setPhoneError('Enter a valid 10-digit mobile number');
    } else {
      setPhoneError('');
    }
  };

  // ─── Total Calculations ────────────────────────────────────
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const baseAmount = item.price * item.quantity;
      subtotal += baseAmount;

      if (shop.gst_registered) {
        const gstRate = item.gst_rate || 0;
        const gstAmount = baseAmount * (gstRate / 100);
        const cgst = gstAmount / 2;
        const sgst = gstAmount / 2;

        totalCgst += cgst;
        totalSgst += sgst;
        totalGst += gstAmount;
      }
    });

    const total = subtotal + totalGst;

    return {
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      totalGst,
      total,
    };
  }, [items, shop.gst_registered]);

  const total = calculations.total;

  // ─── Send Invoice ─────────────────────────────────────────
  const canSend =
    items.length > 0 && validatePhone(phone) && !loading;

  const handleSend = async () => {
    if (!canSend) return;

    if (customerGstin.trim() && customerGstin.trim().length !== 15) {
      showToast('Customer GSTIN must be exactly 15 characters', 'error');
      return;
    }

    if (paymentStatus === 'partial') {
      const amt = Number(partialAmount);
      if (isNaN(amt) || amt <= 0 || amt >= total) {
        showToast(`Partial amount must be between ₹0.01 and ₹${(total - 0.01).toFixed(2)}`, 'error');
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: Create invoice
      const createRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            hsn_code: item.hsn_code || null,
            gst_rate: item.gst_rate || 0,
          })),
          customer_phone: phone.trim(),
          customer_name: customerName.trim().toUpperCase() || undefined,
          customer_gstin: customerGstin.trim().toUpperCase() || undefined,
          payment_status: paymentStatus,
          payment_method: (paymentStatus === 'paid' || paymentStatus === 'partial') ? paymentMethod : undefined,
          payment_note: (paymentStatus === 'paid' || paymentStatus === 'partial') ? (paymentNote.trim() || undefined) : undefined,
          amount_paid: paymentStatus === 'partial' ? Number(partialAmount) : undefined,
        }),
      });

      if (!createRes.ok) {
        const err = (await createRes.json()) as ApiError;
        throw new Error(err.error);
      }

      const { id, invoice_number } = await createRes.json();

      // Step 2: Send via WhatsApp
      const sendRes = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
      });

      if (!sendRes.ok) {
        const err = (await sendRes.json()) as ApiError;
        throw new Error(err.error);
      }

      // Success!
      setSuccessInvoice(invoice_number);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send invoice';
      showToast(message, 'error');
      setLoading(false);
    }
  };

  // ─── Success state ────────────────────────────────────────
  if (successInvoice) {
    return <SuccessAnimation invoiceNumber={successInvoice} />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-36">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] transition-colors text-[#6b7280]"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-[#111827]">
            New Invoice
          </h1>
        </div>

        {/* Search Bar */}
        {localProducts.length > 0 && (
          <div className="mb-6">
            <Input
              placeholder="🔍 Search items by name, category, or HSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Favourites Section */}
        {favoriteProducts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3 flex items-center gap-1">
              ⭐ Favourites
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {favoriteProducts.map((product) => (
                <CatalogCard
                  key={`fav-${product.id}`}
                  product={product}
                  quantity={getItemQty(product.name)}
                  gstRegistered={shop.gst_registered}
                  onTap={() => {
                    if (shop.inventory_enabled && product.track_inventory && (product.stock_qty || 0) <= 0) {
                      showToast(`⚠️ Warning: "${product.name}" is out of stock. You can still dispatch, but stock will go negative.`, 'warning');
                    }
                    addOrIncrement(
                      product.name,
                      Number(product.price),
                      product.hsn_code,
                      product.gst_rate
                    );
                  }}
                  onFavoriteToggle={(e) => handleToggleFavorite(product, e)}
                  onPriceUpdate={(newPrice) => handlePriceUpdate(product, newPrice)}
                  inventoryEnabled={shop.inventory_enabled}
                  stockUnitShort={config.stockUnitShort || undefined}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Used Section */}
        {recentlyUsedProducts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3 flex items-center gap-1">
              🕐 Recently Used
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {recentlyUsedProducts.map((product) => (
                <div key={`recent-${product.id}`} className="min-w-[150px] max-w-[180px] shrink-0">
                  <CatalogCard
                    product={product}
                    quantity={getItemQty(product.name)}
                    gstRegistered={shop.gst_registered}
                    onTap={() => {
                      if (shop.inventory_enabled && product.track_inventory && (product.stock_qty || 0) <= 0) {
                        showToast(`⚠️ Warning: "${product.name}" is out of stock. You can still dispatch, but stock will go negative.`, 'warning');
                      }
                      addOrIncrement(
                        product.name,
                        Number(product.price),
                        product.hsn_code,
                        product.gst_rate
                      );
                    }}
                    onFavoriteToggle={(e) => handleToggleFavorite(product, e)}
                    onPriceUpdate={(newPrice) => handlePriceUpdate(product, newPrice)}
                    inventoryEnabled={shop.inventory_enabled}
                    stockUnitShort={config.stockUnitShort || undefined}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories Tab Strip / Tip Banner */}
        {localProducts.length > 0 && (
          <div className="mb-4">
            {categoriesExist ? (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryTab('All')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCategoryTab === 'All'
                      ? 'bg-[#1a6b3c] text-white'
                      : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'
                  }`}
                >
                  All
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    selectedCategoryTab === 'All' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {localProducts.length}
                  </span>
                </button>
                {activeCategories.map(cat => {
                  const count = localProducts.filter(p => p.category === cat || (cat === 'Others' && !p.category)).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        selectedCategoryTab === cat
                          ? 'bg-[#1a6b3c] text-white'
                          : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'
                      }`}
                    >
                      {cat}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        selectedCategoryTab === cat ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    )}

    {/* Main Catalog Cards */}
    {searchedProducts.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
          Tap to add
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {searchedProducts.map((product) => (
            <CatalogCard
              key={product.id}
              product={product}
              quantity={getItemQty(product.name)}
              gstRegistered={shop.gst_registered}
              onTap={() => {
                if (shop.inventory_enabled && product.track_inventory && (product.stock_qty || 0) <= 0) {
                  showToast(`⚠️ Warning: "${product.name}" is out of stock. You can still dispatch, but stock will go negative.`, 'warning');
                }
                addOrIncrement(
                  product.name,
                  Number(product.price),
                  product.hsn_code,
                  product.gst_rate
                );
              }}
              onFavoriteToggle={(e) => handleToggleFavorite(product, e)}
              onPriceUpdate={(newPrice) => handlePriceUpdate(product, newPrice)}
              inventoryEnabled={shop.inventory_enabled}
              stockUnitShort={config.stockUnitShort || undefined}
            />
          ))}
        </div>
      </section>
    )}

        {/* Custom Item */}
        <section className="mb-6">
          <AnimatePresence>
            {showCustom ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={customName}
                        onChange={(e) =>
                          setCustomName(e.target.value)
                        }
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        placeholder="Price"
                        type="number"
                        prefix="₹"
                        value={customPrice}
                        onChange={(e) =>
                          setCustomPrice(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  {shop.gst_registered && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="HSN Code (optional)"
                          value={customHsn}
                          onChange={(e) => setCustomHsn(e.target.value)}
                        />
                      </div>
                      <div className="w-28">
                        <select
                          value={customGst}
                          onChange={(e) => setCustomGst(e.target.value)}
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
                      onClick={handleAddCustom}
                      className="flex-1"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowCustom(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowCustom(true)}
              >
                + Add custom item
              </Button>
            )}
          </AnimatePresence>
        </section>

        {/* Line Items */}
        {items.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Invoice Items
            </h2>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] px-4">
              <AnimatePresence>
                {items.map((item) => (
                  <LineItem
                    key={item.name}
                    item={item}
                    onQtyChange={(qty) =>
                      updateQty(item.name, qty)
                    }
                    gstRegistered={shop.gst_registered}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Tax Breakdown Summary (only if gst_registered) */}
        {shop.gst_registered && items.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-2 mb-6 text-sm">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2">
              Tax Summary
            </h2>
            <div className="flex justify-between text-[#6b7280]">
              <span>Subtotal (Base Value)</span>
              <span className="tabular-nums">₹{calculations.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>CGST (2.5% / 6% / 9% / 14%)</span>
              <span className="tabular-nums">₹{calculations.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>SGST (2.5% / 6% / 9% / 14%)</span>
              <span className="tabular-nums">₹{calculations.sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#111827] border-t border-[#f3f4f6] pt-2 mt-1">
              <span>Total (GST Inclusive)</span>
              <span className="tabular-nums">₹{calculations.total.toFixed(2)}</span>
            </div>
          </section>
        )}

        {/* Customer Details Form */}
        <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4 mb-6">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            Customer details
          </h2>

          <Input
            label="Customer Name"
            placeholder="e.g. PRANEETH"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          {shop.gst_registered && (
            <Input
              label="Customer GSTIN (Optional)"
              placeholder="e.g. 33AAAAA0000A1Z2"
              value={customerGstin}
              onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
            />
          )}

          <div className="relative" ref={dropdownRef}>
            <Input
              label="Customer WhatsApp Number"
              placeholder="9876543210"
              prefix="+91"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPhone(val);
                setSelectedCustomer(null);
                if (phoneError) setPhoneError('');
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={handlePhoneBlur}
              error={phoneError}
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-[#e5e7eb] shadow-lg overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f9fafb] transition-colors min-h-[44px]"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      c.tag === 'vip' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                      <p className="text-xs text-[#6b7280]">+91 {c.phone.slice(-10)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                      c.tag === 'vip' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {c.tag}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected customer indicator */}
            {selectedCustomer && (
              <p className="text-xs text-[#1a6b3c] font-semibold mt-1.5">
                Sending to: {selectedCustomer.name} ({selectedCustomer.tag === 'vip' ? 'VIP' : 'Regular'})
              </p>
            )}

            {/* New customer hint */}
            {!selectedCustomer && phone.length === 10 && suggestions.length === 0 && !showSuggestions && (
              <p className="text-xs text-[#6b7280] font-medium mt-1.5">
                New customer — will be saved after sending
              </p>
            )}
          </div>

          {/* Payment Status Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-[#4b5563] uppercase tracking-wide mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#f3f4f6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-[#1a6b3c] text-white shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('partial')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentStatus === 'partial'
                    ? 'bg-[#d97706] text-white shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                Partial
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentStatus === 'unpaid'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                Unpaid
              </button>
            </div>

            <AnimatePresence>
              {(paymentStatus === 'paid' || paymentStatus === 'partial') && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  {paymentStatus === 'partial' && (
                    <div>
                      <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">
                        Amount Paid Upfront
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm font-semibold text-gray-400">₹</span>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          className="pl-7"
                          max={total}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        [
                          { value: 'cash', label: '💵 Cash' },
                          { value: 'upi', label: '📱 UPI' },
                          { value: 'bank_transfer', label: '🏦 Bank' },
                          { value: 'other', label: '⚙️ Other' },
                        ] as const
                      ).map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center ${
                            paymentMethod === method.value
                              ? 'bg-[#1a6b3c]/10 text-[#1a6b3c] border-[#1a6b3c]'
                              : 'bg-[#f9fafb] text-[#4b5563] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">
                      Payment Note (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Received via GPay / Advance payment"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </PageTransition>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/90 backdrop-blur-lg border-t border-[#e5e7eb] z-30">
        <div className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] font-medium">
              Total
            </p>
            <p className="text-2xl font-bold text-[#111827] tabular-nums">
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            loading={loading}
            className="px-8"
          >
            Send Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
