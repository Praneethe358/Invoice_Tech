/* eslint-disable prefer-const, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import { useState, useCallback, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Product, InvoiceItem, Customer, ApiError, ProductVariant } from '@/lib/types';
import { validatePhone } from '@/lib/validators';
import { useMemo } from 'react';
import { SHOP_CONFIG } from '@/lib/shop-config';
import { ShopType } from '@/lib/starter-catalogs';
import { getSubscriptionAccess } from '@/lib/subscription';
import { getClothingGstRate } from '@/lib/clothing/gst';
import { getFootwearGstRate, getItemGstRate } from '@/lib/footwear/gst';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { resolveBarcode } from '@/lib/barcodeResolver';
import { playBeep, triggerHaptic } from '@/lib/sound';

interface Props {
  products: Product[];
  initialVariants?: ProductVariant[];
  shopId: string;
  shop: {
    id: string;
    name: string;
    logo_url?: string | null;
    gst_registered: boolean;
    gstin: string | null;
    inventory_enabled: boolean;
    shop_type: string;
    subscription_status?: string | null;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
  };
  initialDraft?: any;
}

export default function InvoiceBuilderClient({ products: initialProducts, initialVariants = [], shopId, shop, initialDraft }: Props) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const refreshCatalog = useCallback(async () => {
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: true });
      
      if (prods) {
        setProducts(prods as Product[]);
        
        if ((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && prods.length > 0) {
          const { data: vars } = await supabase
            .from('product_variants')
            .select('*')
            .in('product_id', prods.map((p: any) => p.id));
          if (vars) {
            setVariants(vars);
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing catalog:', err);
    }
  }, [shopId, shop.shop_type, supabase]);

  useEffect(() => {
    refreshCatalog();

    const handleFocus = () => {
      refreshCatalog();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshCatalog]);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (initialDraft?.invoice_items) {
      return initialDraft.invoice_items.map((item: any) => ({
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.qty !== undefined ? item.qty : item.quantity),
        hsn_code: item.hsn_code,
        gst_rate: Number(item.gst_rate || 0),
        cgst: Number(item.cgst || 0),
        sgst: Number(item.sgst || 0),
        line_total: Number(item.line_total || 0),
        variant_id: item.variant_id || null,
      }));
    }
    return [];
  });
  const [phone, setPhone] = useState(initialDraft?.customer_phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [customerName, setCustomerName] = useState(initialDraft?.customer_name || '');
  const [customerGstin, setCustomerGstin] = useState(initialDraft?.customer_gstin || '');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>(initialDraft?.payment_status || 'paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>(initialDraft?.payment_method || 'cash');
  const [paymentNote, setPaymentNote] = useState(initialDraft?.payment_note || '');
  const [partialAmount, setPartialAmount] = useState(initialDraft?.amount_paid ? initialDraft.amount_paid.toString() : '');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customHsn, setCustomHsn] = useState('');
  const [customGst, setCustomGst] = useState('0');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState('');
  const router = useRouter();
  const { showToast } = useToast();
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [mobileActiveTab, setMobileActiveTab] = useState<'catalog' | 'checkout'>('catalog');

  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getProductStock = useCallback(
    (product: Product) => {
      if (shop.shop_type === 'clothing' || shop.shop_type === 'footwear') {
        const prodVars = variants.filter((v) => v.product_id === product.id);
        return prodVars.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
      }
      return product.stock_qty || 0;
    },
    [shop.shop_type, variants]
  );

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
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(10);
  }, [debouncedSearchQuery, selectedCategoryTab]);

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

  const visibleProducts = useMemo(() => {
    return searchedProducts.slice(0, visibleCount);
  }, [searchedProducts, visibleCount]);

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

  // Recalculate cart item prices when customer price tier changes
  useEffect(() => {
    if (items.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        let finalPrice = item.price;
        const isWholesale = selectedCustomer?.price_tier === 'wholesale';
        
        if (item.variant_id) {
          const v = variants.find((val) => val.id === item.variant_id);
          if (v) {
            const p = products.find((prod) => prod.id === v.product_id);
            if (p) {
              finalPrice = isWholesale && p.wholesale_price !== null && p.wholesale_price !== undefined
                ? Number(p.wholesale_price)
                : Number(p.price);
            }
          }
        } else {
          const p = products.find((prod) => prod.name === item.name);
          if (p) {
            finalPrice = isWholesale && p.wholesale_price !== null && p.wholesale_price !== undefined
              ? Number(p.wholesale_price)
              : Number(p.price);
          }
        }

        const rate = getItemGstRate(shop.shop_type, finalPrice, item.hsn_code, item.gst_rate || 0);

        return {
          ...item,
          price: finalPrice,
          gst_rate: rate,
        };
      })
    );
  }, [selectedCustomer, variants, products, shop.shop_type]);

  const selectCustomer = (c: Customer) => {
    setPhone(c.phone.slice(-10));
    setCustomerName(c.name);
    setCustomerGstin(c.gstin || '');
    setSelectedCustomer(c);
    setShowSuggestions(false);
    setPhoneError('');
  };

  const addOrIncrement = useCallback(
    (name: string, price: number, hsn_code?: string | null, gst_rate?: number, variant_id?: string | null) => {
      let finalPrice = price;
      if (selectedCustomer?.price_tier === 'wholesale') {
        if (variant_id) {
          const v = variants.find((val) => val.id === variant_id);
          if (v) {
            const p = products.find((prod) => prod.id === v.product_id);
            if (p && p.wholesale_price !== null && p.wholesale_price !== undefined) {
              finalPrice = Number(p.wholesale_price);
            }
          }
        } else {
          const p = products.find((prod) => prod.name === name);
          if (p && p.wholesale_price !== null && p.wholesale_price !== undefined) {
            finalPrice = Number(p.wholesale_price);
          }
        }
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.name === name && i.variant_id === variant_id);
        if (existing) {
          return prev.map((i) =>
            (i.name === name && i.variant_id === variant_id)
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        const rate = getItemGstRate(shop.shop_type, finalPrice, hsn_code, gst_rate || 0);
        return [...prev, { name, price: finalPrice, quantity: 1, hsn_code: hsn_code || null, gst_rate: rate, variant_id: variant_id || null }];
      });
    },
    [shop.shop_type, selectedCustomer, variants, products]
  );

  const updateQty = useCallback(
    (name: string, qty: number, variant_id?: string | null) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => !(i.name === name && i.variant_id === variant_id)));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            (i.name === name && i.variant_id === variant_id) ? { ...i, quantity: qty } : i
          )
        );
      }
    },
    []
  );

  const updatePrice = useCallback(
    (name: string, price: number, variant_id?: string | null) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.name === name && i.variant_id === variant_id) {
            const rate = getItemGstRate(shop.shop_type, price, i.hsn_code, i.gst_rate || 0);
            return { ...i, price, gst_rate: rate };
          }
          return i;
        })
      );
    },
    [shop.shop_type]
  );

  const getItemQty = (name: string): number => {
    return items
      .filter((i) => i.name === name || i.name.startsWith(name + ' ('))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    // Use consolidated barcode lookup engine
    const resolved = resolveBarcode(trimmed, products, variants);

    if (resolved) {
      playBeep('success');
      triggerHaptic();

      if (resolved.type === 'variant' && resolved.variant) {
        const displayName = `${resolved.product.name} (${resolved.variant.size} / ${resolved.variant.color})`;
        addOrIncrement(
          displayName,
          Number(resolved.product.price),
          resolved.product.hsn_code,
          resolved.product.gst_rate,
          resolved.variant.id
        );
        showToast(`Added: ${displayName}`, 'success');
      } else {
        addOrIncrement(
          resolved.product.name,
          Number(resolved.product.price),
          resolved.product.hsn_code,
          resolved.product.gst_rate,
          null
        );
        showToast(`Added: ${resolved.product.name}`, 'success');
      }
    } else {
      playBeep('error');
      showToast(`No product or variant found with barcode: "${trimmed}"`, 'error');
    }
  };

  // Keyboard wedge listener for hardware USB/Bluetooth barcode scanners
  useEffect(() => {
    if (shop.shop_type !== 'clothing' && shop.shop_type !== 'footwear') return;

    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const currentTime = Date.now();
      const delay = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (delay > 50) {
        buffer = '';
      }

      // Block scanner keystrokes from polluting inputs
      if (isInput && delay < 50 && e.key.length === 1) {
        e.preventDefault();
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          e.stopPropagation();
          handleBarcodeScanned(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [shop.shop_type, products, variants, selectedCustomer]);

  // Automatically open camera scanner modal on mount for clothing shops
  useEffect(() => {
    if (shop.shop_type === 'clothing') {
      setIsScannerOpen(true);
    }
  }, [shop.shop_type]);

  // ─── Custom item ──────────────────────────────────────────
  const handleAddCustom = () => {
    const name = customName.trim().toUpperCase();
    const price = parseFloat(customPrice);
    const hsn = customHsn.trim();
    let gstRate = parseFloat(customGst) || 0;

    if (!name) {
      showToast('Enter an item name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    if (shop.shop_type === 'footwear') {
      gstRate = getFootwearGstRate(price, hsn);
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

  // ─── Submit Invoice ─────────────────────────────────────────
  const isValid =
    items.length > 0 && validatePhone(phone) && !loading;

  const handleSubmit = async (targetStatus: 'draft' | 'saved' | 'sent') => {
    if (!isValid) return;

    if (customerGstin.trim() && customerGstin.trim().length !== 15) {
      showToast('Customer GSTIN must be exactly 15 characters', 'error');
      return;
    }

    if (paymentStatus === 'partial' && targetStatus !== 'draft') {
      const amt = Number(partialAmount);
      if (isNaN(amt) || amt <= 0 || amt >= total) {
        showToast(`Partial amount must be between ₹0.01 and ₹${(total - 0.01).toFixed(2)}`, 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const isEditingDraft = !!initialDraft;
      const url = isEditingDraft ? `/api/invoices/${initialDraft.id}` : '/api/invoices';
      const method = isEditingDraft ? 'PUT' : 'POST';

      // 'sent' status translates to 'saved' database status initially, then sent via WhatsApp API.
      const dbStatus = targetStatus === 'sent' ? 'saved' : targetStatus;

      const payload = {
        items: items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          hsn_code: item.hsn_code || null,
          gst_rate: item.gst_rate || 0,
          variant_id: item.variant_id || null,
        })),
        customer_phone: phone.trim(),
        customer_name: customerName.trim().toUpperCase() || undefined,
        customer_gstin: customerGstin.trim().toUpperCase() || undefined,
        payment_status: paymentStatus,
        payment_method: (paymentStatus === 'paid' || paymentStatus === 'partial') ? paymentMethod : undefined,
        payment_note: (paymentStatus === 'paid' || paymentStatus === 'partial') ? (paymentNote.trim() || undefined) : undefined,
        amount_paid: paymentStatus === 'partial' ? Number(partialAmount) : undefined,
        status: (initialDraft && initialDraft.status !== 'draft') ? initialDraft.status : (isEditingDraft ? 'draft' : dbStatus),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit invoice');
      }

      const id = isEditingDraft ? initialDraft.id : resData.id;
      const invoice_number = isEditingDraft ? initialDraft.invoice_number : resData.invoice_number;

      const isAlreadyPublished = initialDraft && (initialDraft.status === 'saved' || initialDraft.status === 'sent');

      if (isEditingDraft && !isAlreadyPublished && (targetStatus === 'saved' || targetStatus === 'sent')) {
        const transitionRes = await fetch(`/api/invoices/${id}/save`, {
          method: 'POST',
        });
        const transData = await transitionRes.json().catch(() => ({}));
        if (!transitionRes.ok) {
          throw new Error(transData.error || 'Failed to save invoice.');
        }
      }

      if (targetStatus === 'sent') {
        // Step 2: Send via WhatsApp
        const sendRes = await fetch(`/api/invoices/${id}/send`, {
          method: 'POST',
        });

        const sendData = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok) {
          throw new Error(sendData.error || 'Invoice saved, but failed to send WhatsApp message');
        }

        // Success!
        setSuccessInvoice(invoice_number);
      } else {
        showToast(targetStatus === 'draft' ? 'Draft saved successfully' : 'Invoice saved successfully', 'success');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process request', 'error');
      setLoading(false);
    }
  };

  const subAccess = getSubscriptionAccess({
    subscription_status: shop.subscription_status || 'trial',
    trial_ends_at: shop.trial_ends_at || null,
    subscription_ends_at: shop.subscription_ends_at || null,
  });

  if (!subAccess.canSendInvoices) {
    const isTrial = (shop.subscription_status || 'trial') === 'trial';
    return (
      <div className="min-h-screen bg-[#f9fafb]">
        <Navbar />
        <PageTransition className="w-full px-4 lg:px-8 py-12 pb-36 flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 max-w-[400px] w-full text-center shadow-md space-y-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                <span>🔒</span> Subscription Required
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your {isTrial ? 'free trial' : 'subscription'} has ended.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upgrade to ₹349/month to continue sending professional invoices to your customers on WhatsApp.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href="/upgrade" className="w-full">
                <button className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer">
                  Upgrade Now
                </button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer">
                  View Dashboard
                </button>
              </Link>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  // ─── Success state ────────────────────────────────────────
  if (successInvoice) {
    return <SuccessAnimation invoiceNumber={successInvoice} />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <PageTransition className="w-full px-4 lg:px-8 pt-6 lg:pt-0 pb-36">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border-b border-[#e5e7eb] -mx-4 lg:-mx-8 px-6 lg:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
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
                {shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                {shop.shop_type.replace('_', ' ').toUpperCase()} · GSTIN: {shop.gstin || 'None'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Logged In As</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              Good {mounted ? (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') : 'day'}!
            </p>
          </div>
        </div>

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

        {/* Mobile View Tab Bar */}
        <div className="flex lg:hidden bg-white/60 backdrop-blur-sm border border-[#e5e7eb] p-1.5 rounded-2xl mb-6 gap-1">
          <button
            type="button"
            onClick={() => setMobileActiveTab('catalog')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mobileActiveTab === 'catalog'
                ? 'bg-[#0050e8] text-white shadow-sm'
                : 'text-[#6b7280]'
            }`}
          >
            1. Select Products ({items.reduce((sum, i) => sum + i.quantity, 0)})
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveTab('checkout')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all relative ${
              mobileActiveTab === 'checkout'
                ? 'bg-[#0050e8] text-white shadow-sm'
                : 'text-[#6b7280]'
            }`}
          >
            2. Customer & Pay
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {items.length}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Catalog / Item Selector */}
          <div className={`lg:col-span-6 xl:col-span-7 space-y-6 ${mobileActiveTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
            {/* Products Header & Search */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Products
              </h2>
              {localProducts.length > 0 && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search products by name or HSN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all placeholder-slate-400 min-h-[44px]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      refreshCatalog();
                      setIsScannerOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors border border-slate-950 min-h-[44px]"
                    title="Scan Barcode / QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    <span className="hidden sm:inline">Scan Barcode</span>
                  </button>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            {localProducts.length > 0 && categoriesExist && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategoryTab('All')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                    selectedCategoryTab === 'All'
                      ? 'bg-[#0050e8]/8 text-[#0050e8] border-[#0050e8]'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({localProducts.length})
                </button>
                {activeCategories.map(cat => {
                  const count = localProducts.filter(p => p.category === cat || (cat === 'Others' && !p.category)).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                        selectedCategoryTab === cat
                          ? 'bg-[#0050e8]/8 text-[#0050e8] border-[#0050e8]'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Products Listing */}
            {searchedProducts.length > 0 ? (
              <>
                {/* Desktop Products Table */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 w-10 text-center"></th>
                        <th className="py-3 px-4 font-bold">Item Name</th>
                        <th className="py-3 px-4 font-bold">Category</th>
                        <th className="py-3 px-4 text-right font-bold">Sale Price</th>
                        <th className="py-3 px-4 text-right font-bold">Stock Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleProducts.map((product) => {
                        const qty = getItemQty(product.name);
                        const currentStock = getProductStock(product);
                        const isOutOfStock = shop.inventory_enabled && product.track_inventory && currentStock <= 0;
                        const isLowStock = shop.inventory_enabled && product.track_inventory && !isOutOfStock && currentStock <= (product.low_stock_threshold || 5);

                        return (
                          <Fragment key={product.id}>
                            <tr
                              onClick={() => {
                                const prodVars = variants.filter(v => v.product_id === product.id);
                                if ((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && prodVars.length > 0) {
                                  setExpandedProductId(prev => prev === product.id ? null : product.id);
                                } else {
                                  if (shop.inventory_enabled && product.track_inventory && currentStock <= 0) {
                                    showToast(`⚠️ Warning: "${product.name}" is out of stock. You can still dispatch, but stock will go negative.`, 'warning');
                                  }
                                  addOrIncrement(
                                    product.name,
                                    Number(product.price),
                                    product.hsn_code,
                                    product.gst_rate
                                  );
                                }
                              }}
                              className={`group cursor-pointer hover:bg-slate-50/70 transition-colors ${
                                qty > 0 ? 'bg-[#0050e8]/5 hover:bg-[#0050e8]/8' : ''
                              }`}
                            >
                              {/* Favorite Star */}
                              <td className="py-4 px-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleToggleFavorite(product, e)}
                                  className={`transition-colors hover:scale-110 ${
                                    product.is_favorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                                  }`}
                                >
                                  {product.is_favorite ? (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  )}
                                </button>
                              </td>

                              {/* Item Name & Badges */}
                              <td className="py-4 px-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                                      {product.name}
                                    </span>
                                    {qty > 0 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#0050e8] text-white">
                                        {qty} Added
                                      </span>
                                    )}
                                    {isLowStock && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                                        Low Stock
                                      </span>
                                    )}
                                    {isOutOfStock && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wide">
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {shop.gst_registered && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
                                        {getItemGstRate(shop.shop_type, Number(product.price), product.hsn_code, product.gst_rate ?? 0)}% GST
                                      </span>
                                    )}
                                    {product.hsn_code && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                        HSN: {product.hsn_code}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-4 px-4 text-slate-500 font-semibold">
                                {product.category || 'Others'}
                              </td>

                              {/* Sale Price */}
                              <td className="py-4 px-4 text-right">
                                {editingProductId === product.id ? (
                                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[11px] font-bold text-slate-500">₹</span>
                                    <input
                                      type="number"
                                      value={tempPrice}
                                      onChange={(e) => setTempPrice(e.target.value)}
                                      className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none"
                                      autoFocus
                                    />
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const priceVal = parseFloat(tempPrice);
                                        if (!isNaN(priceVal) && priceVal > 0) {
                                          await handlePriceUpdate(product, priceVal);
                                        }
                                        setEditingProductId(null);
                                      }}
                                      className="px-2 py-0.5 bg-[#0050e8] text-white rounded text-[10px] font-bold hover:bg-[#0050e8]/90"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="font-extrabold text-slate-900 tabular-nums hover:text-[#0050e8] transition-colors"
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingProductId(product.id);
                                      setTempPrice(String(product.price));
                                    }}
                                    title="Double click to edit price"
                                  >
                                    ₹{Number(product.price).toLocaleString('en-IN')}
                                  </div>
                                )}
                              </td>

                              {/* Stock Qty */}
                              <td className="py-4 px-4 text-right">
                                {shop.inventory_enabled && product.track_inventory ? (
                                  <div className="inline-flex justify-end">
                                    {isOutOfStock ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                        0 Left
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        {currentStock} Left
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                        {currentStock} Left
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-semibold">—</span>
                                )}
                              </td>
                            </tr>
                            {(shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && expandedProductId === product.id && (
                              <tr className="bg-slate-50/40">
                                <td colSpan={5} className="p-4 border-t border-slate-200">
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Available Variants</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {variants.filter(v => v.product_id === product.id).map(variant => {
                                        const varQtyInCart = items.find(i => i.variant_id === variant.id)?.quantity ?? 0;
                                        return (
                                          <div
                                            key={variant.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (shop.inventory_enabled && (variant.stock_qty || 0) <= 0) {
                                                showToast(`⚠️ Warning: "${product.name} (${variant.size} / ${variant.color})" is out of stock.`, 'warning');
                                              }
                                              addOrIncrement(
                                                `${product.name} (${variant.size} / ${variant.color})`,
                                                Number(product.price),
                                                product.hsn_code,
                                                product.gst_rate,
                                                variant.id
                                              );
                                            }}
                                            className={`p-3 rounded-xl border transition-all flex justify-between items-center bg-white cursor-pointer ${
                                              varQtyInCart > 0 
                                                ? 'border-[#0050e8] bg-[#0050e8]/5 shadow-3xs'
                                                : 'border-slate-200 hover:border-[#0050e8]/45'
                                            }`}
                                          >
                                            <div className="text-left">
                                              <p className="text-xs font-bold text-slate-800 uppercase">
                                                Size: {variant.size} | Color: {variant.color}
                                              </p>
                                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                                SKU: <span className="font-mono text-slate-500 text-[10px]">{variant.sku}</span> | Stock: {variant.stock_qty}
                                              </p>
                                            </div>
                                            
                                            {varQtyInCart > 0 ? (
                                              <div className="flex items-center bg-[#0050e8]/10 rounded-lg overflow-hidden border border-[#0050e8]/20" onClick={e => e.stopPropagation()}>
                                                <button
                                                  type="button"
                                                  onClick={() => updateQty(`${product.name} (${variant.size} / ${variant.color})`, varQtyInCart - 1, variant.id)}
                                                  className="px-2 py-0.5 text-[#0050e8] hover:bg-[#0050e8]/10 text-xs font-black min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                                                >
                                                  −
                                                </button>
                                                <span className="px-1.5 text-xs font-black text-slate-800 tabular-nums">
                                                  {varQtyInCart}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => updateQty(`${product.name} (${variant.size} / ${variant.color})`, varQtyInCart + 1, variant.id)}
                                                  className="px-2 py-0.5 text-[#0050e8] hover:bg-[#0050e8]/10 text-xs font-black min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-[10px] font-bold text-[#0050e8] uppercase bg-[#0050e8]/5 px-2.5 py-1 rounded-md border border-[#0050e8]/10">
                                                + Add
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Products List */}
                <div className="md:hidden flex flex-col gap-3">
                  {visibleProducts.map((product) => {
                    const qty = getItemQty(product.name);
                    const currentStock = getProductStock(product);
                    const isOutOfStock = shop.inventory_enabled && product.track_inventory && currentStock <= 0;
                    const isLowStock = shop.inventory_enabled && product.track_inventory && !isOutOfStock && currentStock <= (product.low_stock_threshold || 5);

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          const prodVars = variants.filter(v => v.product_id === product.id);
                          if ((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && prodVars.length > 0) {
                            setExpandedProductId(prev => prev === product.id ? null : product.id);
                          }
                        }}
                        className={`bg-white border rounded-2xl p-4 shadow-2xs transition-all relative flex flex-col gap-3 text-left ${
                          qty > 0 ? 'border-[#0050e8] bg-[#0050e8]/5' : 'border-slate-150'
                        }`}
                      >
                        {/* Favorite Star & Product Name */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(product, e)}
                              className={`transition-colors hover:scale-110 shrink-0 ${
                                product.is_favorite ? 'text-amber-500' : 'text-slate-300'
                              }`}
                            >
                              {product.is_favorite ? (
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              )}
                            </button>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-850 uppercase tracking-wide text-xs">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                {product.category || 'Others'}
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-850 block tabular-nums">
                              ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">
                              Sale Price
                            </span>
                          </div>
                        </div>

                        {/* Badges / Tax details */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {shop.gst_registered && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
                              {getItemGstRate(shop.shop_type, Number(product.price), product.hsn_code, product.gst_rate ?? 0)}% GST
                            </span>
                          )}
                          {product.hsn_code && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                              HSN: {product.hsn_code}
                            </span>
                          )}
                          {shop.inventory_enabled && product.track_inventory && (
                            <>
                              {isOutOfStock ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                                  0 Left
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-850 border border-amber-100 uppercase">
                                  {currentStock} Left
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 uppercase">
                                  {currentStock} Left
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Expanded Variants Accordion for Mobile */}
                        {(shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && expandedProductId === product.id && (
                          <div className="border-t border-slate-100 pt-3 mt-1 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Select Variant</h4>
                            <div className="flex flex-col gap-2">
                              {variants.filter(v => v.product_id === product.id).map(variant => {
                                const varQtyInCart = items.find(i => i.variant_id === variant.id)?.quantity ?? 0;
                                return (
                                  <div
                                    key={variant.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (shop.inventory_enabled && (variant.stock_qty || 0) <= 0) {
                                        showToast(`⚠️ Warning: "${product.name} (${variant.size} / ${variant.color})" is out of stock.`, 'warning');
                                      }
                                      addOrIncrement(
                                        `${product.name} (${variant.size} / ${variant.color})`,
                                        Number(product.price),
                                        product.hsn_code,
                                        product.gst_rate,
                                        variant.id
                                      );
                                    }}
                                    className={`p-2.5 rounded-xl border flex justify-between items-center transition-all bg-slate-50 cursor-pointer ${
                                      varQtyInCart > 0 
                                        ? 'border-[#0050e8] bg-[#0050e8]/5 shadow-3xs'
                                        : 'border-slate-200 hover:border-[#0050e8]/45'
                                    }`}
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-slate-800 uppercase">
                                        Size: {variant.size} | Color: {variant.color}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                        Stock: {variant.stock_qty} | SKU: <span className="font-mono">{variant.sku}</span>
                                      </p>
                                    </div>
                                    
                                    {varQtyInCart > 0 ? (
                                      <div className="flex items-center bg-[#0050e8]/10 rounded-lg overflow-hidden border border-[#0050e8]/20" onClick={e => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => updateQty(`${product.name} (${variant.size} / ${variant.color})`, varQtyInCart - 1, variant.id)}
                                          className="px-2 py-0.5 text-[#0050e8] hover:bg-[#0050e8]/10 text-xs font-black min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                                        >
                                          −
                                        </button>
                                        <span className="px-1.5 text-xs font-black text-slate-800 tabular-nums">
                                          {varQtyInCart}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateQty(`${product.name} (${variant.size} / ${variant.color})`, varQtyInCart + 1, variant.id)}
                                          className="px-2 py-0.5 text-[#0050e8] hover:bg-[#0050e8]/10 text-xs font-black min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-[#0050e8] uppercase bg-[#0050e8]/5 px-2.5 py-1 rounded-md border border-[#0050e8]/10">
                                        + Add
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action Row */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[10px] text-slate-400 font-semibold italic">
                            {qty > 0 ? `${qty} in cart` : ((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && variants.filter(v => v.product_id === product.id).length > 0) ? 'Choose Option' : 'Tap to add'}
                          </div>

                          {((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && variants.filter(v => v.product_id === product.id).length > 0) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedProductId(prev => prev === product.id ? null : product.id);
                              }}
                              className="bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer min-h-[32px] flex items-center justify-center"
                            >
                              {expandedProductId === product.id ? 'Close' : 'Choose Option'}
                            </button>
                          ) : qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (shop.inventory_enabled && product.track_inventory && currentStock <= 0) {
                                  showToast(`⚠️ Warning: "${product.name}" is out of stock. You can still dispatch, but stock will go negative.`, 'warning');
                                }
                                addOrIncrement(product.name, Number(product.price), product.hsn_code, product.gst_rate);
                              }}
                              className="bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-3xs cursor-pointer min-h-[32px] flex items-center justify-center"
                            >
                              + Add
                            </button>
                          ) : (
                            <div className="flex items-center bg-[#0050e8]/10 rounded-lg overflow-hidden border border-[#0050e8]/20">
                              <button
                                type="button"
                                onClick={() => updateQty(product.name, qty - 1)}
                                className="px-2.5 py-1 text-[#0050e8] hover:bg-[#0050e8]/10 text-sm font-black transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                              >
                                −
                              </button>
                              <span className="px-2 text-xs font-black text-slate-800 tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (shop.inventory_enabled && product.track_inventory && currentStock <= qty) {
                                    showToast(`⚠️ Warning: Stock is only ${currentStock}. You are dispatching more than stock.`, 'warning');
                                  }
                                  updateQty(product.name, qty + 1);
                                }}
                                className="px-2.5 py-1 text-[#0050e8] hover:bg-[#0050e8]/10 text-sm font-black transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl p-6">
                <span className="text-2xl block mb-2">🔍</span>
                <p className="text-sm font-semibold text-slate-800 mb-1">No products found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or selected category filter.</p>
              </div>
            )}

            {/* Custom Item */}
            <section>
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
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomPrice(val);
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed) && shop.shop_type === 'footwear') {
                                setCustomGst(String(getFootwearGstRate(parsed, customHsn)));
                              }
                            }}
                          />
                        </div>
                      </div>
                      {shop.gst_registered && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              placeholder="HSN Code (optional)"
                              value={customHsn}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomHsn(val);
                                const parsed = parseFloat(customPrice);
                                if (!isNaN(parsed) && shop.shop_type === 'footwear') {
                                  setCustomGst(String(getFootwearGstRate(parsed, val)));
                                }
                              }}
                            />
                          </div>
                          <div className="w-28">
                            <select
                              value={customGst}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (shop.shop_type === 'footwear') {
                                  showToast('Footwear GST is price-slab based under HSN 6401-6405', 'warning');
                                }
                                setCustomGst(val);
                              }}
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
          </div>

          {/* RIGHT COLUMN: Invoice Builder Panel */}
          <div className={`lg:col-span-6 xl:col-span-5 space-y-6 ${mobileActiveTab === 'checkout' ? 'block' : 'hidden lg:block'}`}>
            {/* Customer Details Form */}
            <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4 shadow-2xs">
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
                  <p className="text-xs text-[#0050e8] font-semibold mt-1.5">
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
            </section>

            {/* Invoice Items */}
            <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 shadow-2xs">
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                Invoice Items
              </h2>
              {items.length > 0 ? (
                <div className="bg-white rounded-xl border border-[#e5e7eb] px-4 py-2">
                  <AnimatePresence>
                    {items.map((item) => (
                      <LineItem
                        key={item.name}
                        item={item}
                        onQtyChange={(qty) =>
                          updateQty(item.name, qty, item.variant_id)
                        }
                        onPriceChange={(price) =>
                          updatePrice(item.name, price, item.variant_id)
                        }
                        gstRegistered={shop.gst_registered}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-500">No items added yet</p>
                  <p className="text-[10px] mt-1 text-slate-400">Select items from the catalog on the left</p>
                </div>
              )}
            </section>

            {/* Tax Breakdown Summary (only if gst_registered) */}
            {shop.gst_registered && items.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-2 text-sm shadow-2xs">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-2 flex items-center justify-between flex-wrap gap-2">
                  <span>Tax Summary</span>
                  {shop.shop_type === 'footwear' && (
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md normal-case">
                      ℹ️ GST slab auto-detected based on MRP per pair
                    </span>
                  )}
                </h2>
                <div className="flex justify-between text-[#6b7280]">
                  <span>Subtotal (Base Value)</span>
                  <span className="tabular-nums">₹{calculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>CGST</span>
                  <span className="tabular-nums">₹{calculations.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>SGST</span>
                  <span className="tabular-nums">₹{calculations.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#111827] border-t border-[#f3f4f6] pt-2 mt-1">
                  <span>Total (GST Inclusive)</span>
                  <span className="tabular-nums">₹{calculations.total.toFixed(2)}</span>
                </div>
              </section>
            )}

            {/* Payment Details Form */}
            <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4 shadow-2xs">
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
                        ? 'bg-[#0050e8] text-white shadow-sm'
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
                                  ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
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

            {/* Desktop Action Box (hidden on mobile, uses sticky footer instead) */}
            <div className="hidden lg:block bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">Total Amount</p>
                  <p className="text-2xl font-black text-[#111827] mt-1 tabular-nums">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(!initialDraft || initialDraft.status === 'draft') && (
                    <button
                      type="button"
                      onClick={() => handleSubmit('draft')}
                      disabled={!isValid || loading}
                      className="px-4 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      Save as Draft
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSubmit('saved')}
                    disabled={!isValid || loading}
                    className="px-4 py-2.5 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    {initialDraft && (initialDraft.status === 'saved' || initialDraft.status === 'sent') ? 'Save Changes' : 'Save Invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('sent')}
                    disabled={!isValid || loading}
                    className="px-5 py-2.5 bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    {initialDraft?.status === 'sent' ? 'Save & Resend' : 'Save & Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/90 backdrop-blur-lg border-t border-[#e5e7eb] z-30 lg:hidden">
        <div className="w-full px-4 md:px-8 py-3 flex flex-col gap-2">
          {mobileActiveTab === 'catalog' ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-[#6b7280] font-bold uppercase">Total Qty</p>
                <p className="text-sm font-extrabold text-[#111827] tabular-nums">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} Items
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileActiveTab('checkout')}
                disabled={items.length === 0}
                className="flex-1 py-3 bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Next: Enter Details
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6b7280] font-bold uppercase">Total</p>
                <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`grid ${(!initialDraft || initialDraft.status === 'draft') ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                {(!initialDraft || initialDraft.status === 'draft') && (
                  <button
                    type="button"
                    onClick={() => handleSubmit('draft')}
                    disabled={!isValid || loading}
                    className="py-3 px-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSubmit('saved')}
                  disabled={!isValid || loading}
                  className="py-3 px-1 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('sent')}
                  disabled={!isValid || loading}
                  className="py-3 px-1 bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {initialDraft?.status === 'sent' ? 'Resend' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        keepOpenOnScan={true}
        items={items}
        onUpdateQty={updateQty}
        totalPrice={calculations.total}
      />
    </div>
  );
}
