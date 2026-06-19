'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { SHOP_CONFIG } from '@/lib/shop-config';
import { ShopType } from '@/lib/starter-catalogs';

interface Props {
  shop: Shop;
  initialProducts: Product[];
}

export default function CatalogClient({
  shop,
  initialProducts,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  const config = SHOP_CONFIG[shop.shop_type as ShopType] || SHOP_CONFIG.other;
  const inventoryEnabledGlobal = shop.inventory_enabled;
  const gstRegistered = shop.gst_registered;

  // Categories state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [mobileShowAddForm, setMobileShowAddForm] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [mobileStockOpen, setMobileStockOpen] = useState(false);
  const [mobileGstOpen, setMobileGstOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  // Products
  const [products, setProducts] = useState(initialProducts);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newHsn, setNewHsn] = useState('');
  const [newGst, setNewGst] = useState('0');

  const [newCategory, setNewCategory] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  const [newTrackInventory, setNewTrackInventory] = useState(false);
  const [newStockQty, setNewStockQty] = useState('0');
  const [newLowStockThreshold, setNewLowStockThreshold] = useState('5');

  // Local categories sync
  useEffect(() => {
    const defaults = new Set(config.defaultCategories);
    const extra = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    const custom = extra.filter(c => !defaults.has(c));
    setCustomCategories(custom);
  }, [products, config]);

  const allCategories = useMemo(() => {
    return Array.from(new Set([...config.defaultCategories, ...customCategories]));
  }, [config.defaultCategories, customCategories]);

  const [addingProduct, setAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editHsn, setEditHsn] = useState('');
  const [editGst, setEditGst] = useState('0');
  const [editCategory, setEditCategory] = useState('');
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const [isEditAddingNewCategory, setIsEditAddingNewCategory] = useState(false);
  const [editGstOpen, setEditGstOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editTrackInventory, setEditTrackInventory] = useState(false);
  const [editLowStockThreshold, setEditLowStockThreshold] = useState('5');

  const [stockAdjustProductId, setStockAdjustProductId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState<'restock' | 'return' | 'adjustment'>('restock');

  // Search, filtering, and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.hsn_code && p.hsn_code.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategoryFilter !== 'All') {
      result = result.filter((p) => p.category === selectedCategoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low_stock') {
      result = result.filter(
        (p) =>
          p.track_inventory &&
          (p.stock_qty || 0) > 0 &&
          (p.stock_qty || 0) <= (p.low_stock_threshold || 5)
      );
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter((p) => p.track_inventory && (p.stock_qty || 0) <= 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'price-asc') {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === 'price-desc') {
        return Number(b.price) - Number(a.price);
      }
      if (sortBy === 'stock-asc') {
        const stockA = a.track_inventory ? a.stock_qty || 0 : Infinity;
        const stockB = b.track_inventory ? b.stock_qty || 0 : Infinity;
        return stockA - stockB;
      }
      if (sortBy === 'stock-desc') {
        const stockA = a.track_inventory ? a.stock_qty || 0 : -1;
        const stockB = b.track_inventory ? b.stock_qty || 0 : -1;
        return stockB - stockA;
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategoryFilter, sortBy, stockFilter]);

  const handleAddProduct = async () => {
    const name = newName.trim().toUpperCase();
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
    const initialStockVal = newTrackInventory ? parseInt(newStockQty) || 0 : 0;
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: shop.id,
        name,
        price,
        hsn_code: hsn || null,
        gst_rate: gstRate,
        category: newCategory || null,
        track_inventory: newTrackInventory,
        stock_qty: initialStockVal,
        low_stock_threshold: newTrackInventory ? parseInt(newLowStockThreshold) || 5 : 5,
      })
      .select()
      .single();

    if (error) {
      showToast('Failed to add product', 'error');
    } else if (data) {
      // If initial stock was tracking and > 0, log it
      if (newTrackInventory && initialStockVal > 0) {
        await supabase
          .from('inventory_logs')
          .insert({
            shop_id: shop.id,
            product_id: data.id,
            change_qty: initialStockVal,
            previous_qty: 0,
            new_qty: initialStockVal,
            reason: 'restock'
          });
      }

      setProducts((prev) => [...prev, data as Product]);
      setNewName('');
      setNewPrice('');
      setNewHsn('');
      setNewGst('0');
      setNewCategory('');
      setNewTrackInventory(false);
      setNewStockQty('0');
      setNewLowStockThreshold('5');
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
    setEditCategory(product.category || '');
    setEditTrackInventory(!!product.track_inventory);
    setEditLowStockThreshold(String(product.low_stock_threshold || '5'));
    setIsEditAddingNewCategory(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim().toUpperCase();
    const price = parseFloat(editPrice);
    const hsn = editHsn.trim();
    const gstRate = parseFloat(editGst) || 0;
    const category = editCategory || null;
    const trackInventory = editTrackInventory;
    const lowStockThreshold = parseInt(editLowStockThreshold) || 5;

    if (!name || isNaN(price) || price <= 0) {
      showToast('Enter valid name and price', 'error');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({
        name,
        price,
        hsn_code: hsn || null,
        gst_rate: gstRate,
        category,
        track_inventory: trackInventory,
        low_stock_threshold: lowStockThreshold
      })
      .eq('id', editingId);

    if (error) {
      showToast('Failed to update product', 'error');
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name,
                price,
                hsn_code: hsn || null,
                gst_rate: gstRate,
                category,
                track_inventory: trackInventory,
                low_stock_threshold: lowStockThreshold
              }
            : p
        )
      );
      setEditingId(null);
      showToast('Product updated', 'success');
    }
  };

  const handleAdjustStock = async (product: Product) => {
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity', 'error');
      return;
    }
    const currentStock = product.stock_qty || 0;
    const newQty = currentStock + qty;

    const { error } = await supabase
      .from('products')
      .update({ stock_qty: newQty })
      .eq('id', product.id);

    if (error) {
      showToast('Failed to update stock', 'error');
    } else {
      await supabase
        .from('inventory_logs')
        .insert({
          shop_id: shop.id,
          product_id: product.id,
          change_qty: qty,
          previous_qty: currentStock,
          new_qty: newQty,
          reason: adjustReason,
        });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock_qty: newQty } : p))
      );
      setStockAdjustProductId(null);
      showToast(`${qty} ${config.stockUnitShort || 'units'} added to stock`, 'success');
    }
  };

  const handleToggleFavorite = async (product: Product) => {
    const nextVal = !product.is_favorite;
    
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_favorite: nextVal } : p))
    );

    const { error } = await supabase
      .from('products')
      .update({ is_favorite: nextVal })
      .eq('id', product.id);

    if (error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_favorite: !nextVal } : p))
      );
      showToast('Failed to update favorite status', 'error');
    } else {
      showToast(nextVal ? `"${product.name}" added to Favorites` : `"${product.name}" removed from Favorites`, 'success');
    }
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const affected = products.filter((p) => p.category === categoryToDelete);
    
    if (affected.length > 0) {
      const { error } = await supabase
        .from('products')
        .update({ category: 'Others' })
        .eq('shop_id', shop.id)
        .eq('category', categoryToDelete);

      if (error) {
        showToast('Failed to reassign products', 'error');
        return;
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.category === categoryToDelete ? { ...p, category: 'Others' } : p))
    );

    setCustomCategories((prev) => prev.filter((c) => c !== categoryToDelete));
    showToast(`Category "${categoryToDelete}" deleted. Products reassigned to "Others".`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />
      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-12">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
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
                Product Catalog & Inventory · {products.length} item{products.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
                Product Catalog
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Manage items, track stock levels, and configure pricing.
              </p>
            </div>
            <div className="bg-[#0050e8]/10 text-[#0050e8] font-bold text-[10px] px-3 py-1.5 rounded-lg border border-[#0050e8]/20 shrink-0">
              {products.length} Item{products.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setMobileShowAddForm(!mobileShowAddForm)}
            className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer mt-1"
          >
            {mobileShowAddForm ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Close Add Form
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Product
              </>
            )}
          </button>
        </div>

        {/* Add Product Form - Mobile Only */}
        <div className="block md:hidden">
          <AnimatePresence>
            {mobileShowAddForm && (
              <motion.section
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm mt-1">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      New Product Details
                    </h3>
                    <button
                      onClick={() => setMobileShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕ Close
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                        Item Name
                      </label>
                      <Input
                        placeholder="e.g. Tomato Soup, Consulting Hour"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="rounded-xl min-h-[44px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                        Sale Price (₹)
                      </label>
                      <Input
                        placeholder="Price"
                        type="number"
                        prefix="₹"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="rounded-xl min-h-[44px]"
                      />
                    </div>

                    {gstRegistered && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                            HSN Code
                          </label>
                          <Input
                            placeholder="HSN (Optional)"
                            value={newHsn}
                            onChange={(e) => setNewHsn(e.target.value)}
                            className="rounded-xl min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-2">
                            GST Rate
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['0', '5', '12', '18', '28'].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setNewGst(rate)}
                                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  newGst === rate
                                    ? 'bg-[#0050e8] text-white border-[#0050e8] shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      {isAddingNewCategory ? (
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="Category name"
                              value={newCategoryInput}
                              onChange={(e) => setNewCategoryInput(e.target.value)}
                              className="rounded-xl min-h-[44px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoryInput.trim()) {
                                const val = newCategoryInput.trim();
                                setCustomCategories(prev => Array.from(new Set([...prev, val])));
                                setNewCategory(val);
                              }
                              setIsAddingNewCategory(false);
                            }}
                            className="px-3 py-2 bg-[#0050e8] text-white text-xs font-bold rounded-xl h-[44px] hover:bg-[#0043c4] transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewCategory(false)}
                            className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl h-[44px] hover:bg-gray-300 transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                            className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-3 text-xs font-semibold flex items-center justify-between min-h-[44px] text-slate-700 cursor-pointer"
                          >
                            <span>{newCategory || 'Select Category (optional)'}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileCategoryOpen ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          {mobileCategoryOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setMobileCategoryOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 max-h-[200px] overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => { setNewCategory(''); setMobileCategoryOpen(false); }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${!newCategory ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-600'}`}
                                >
                                  None (Select Category)
                                </button>
                                {allCategories.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => { setNewCategory(c); setMobileCategoryOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${newCategory === c ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-600'}`}
                                  >
                                    {c}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => { setIsAddingNewCategory(true); setNewCategoryInput(''); setMobileCategoryOpen(false); }}
                                  className="w-full text-left px-3.5 py-2.5 text-xs font-extrabold text-[#0050e8] hover:bg-[#0050e8]/5 border-t border-slate-100 cursor-pointer"
                                >
                                  + Add new category
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {inventoryEnabledGlobal && (
                      <div className="border-t border-slate-100 pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Track inventory / stock</span>
                          <input
                            type="checkbox"
                            checked={newTrackInventory}
                            onChange={(e) => setNewTrackInventory(e.target.checked)}
                            className="w-10 h-6 bg-gray-200 checked:bg-[#0050e8] rounded-full appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
                          />
                        </div>
                        {newTrackInventory && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                                Initial Stock
                              </label>
                              <Input
                                placeholder="Qty"
                                type="number"
                                value={newStockQty}
                                onChange={(e) => setNewStockQty(e.target.value)}
                                className="rounded-xl min-h-[44px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">
                                Low Stock Alert
                              </label>
                              <Input
                                placeholder="Alert at"
                                type="number"
                                value={newLowStockThreshold}
                                onChange={(e) => setNewLowStockThreshold(e.target.value)}
                                className="rounded-xl min-h-[44px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      await handleAddProduct();
                      setMobileShowAddForm(false);
                    }}
                    disabled={!newName || !newPrice}
                    className="w-full bg-[#0050e8] hover:bg-[#0043c4] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center h-[44px]"
                  >
                    {addingProduct ? 'Adding Product...' : 'Add Product'}
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Add Product Form - Desktop Only */}
        <section className="hidden md:block mb-8">
          <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
            Add Product to Catalog
          </h2>
          <div className="bg-white rounded-none border border-[#e5e7eb] p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                  Item Name
                </label>
                <Input
                  placeholder="Product name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="w-28">
                <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                  Sale Price
                </label>
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
                  <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                    HSN Code (optional)
                  </label>
                  <Input
                    placeholder="HSN Code (optional)"
                    value={newHsn}
                    onChange={(e) => setNewHsn(e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                    GST Rate
                  </label>
                  <select
                    value={newGst}
                    onChange={(e) => setNewGst(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none px-3 py-2.5 text-sm font-bold focus:outline-none min-h-[44px] focus:ring-0"
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

            {/* Category Dropdown */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                  Category
                </label>
                {isAddingNewCategory ? (
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter new category name"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryInput.trim()) {
                          const val = newCategoryInput.trim();
                          setCustomCategories(prev => Array.from(new Set([...prev, val])));
                          setNewCategory(val);
                        }
                        setIsAddingNewCategory(false);
                      }}
                      className="px-3 py-2 bg-[#0050e8] text-white text-xs font-bold rounded-none h-[44px] hover:bg-[#0043c4] transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(false)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-none h-[44px] hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsAddingNewCategory(true);
                        setNewCategoryInput('');
                      } else {
                        setNewCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none px-3 py-2.5 text-xs font-semibold focus:outline-none min-h-[44px] focus:ring-0"
                  >
                    <option value="">Select Category (optional)</option>
                    {allCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__new__">+ Add new category</option>
                  </select>
                )}
              </div>
            </div>

            {/* Inventory Tracking options */}
            {inventoryEnabledGlobal && (
              <div className="border-t border-[#f3f4f6] pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4b5563]">Track stock for this item</span>
                  <input
                    type="checkbox"
                    checked={newTrackInventory}
                    onChange={(e) => setNewTrackInventory(e.target.checked)}
                    className="w-10 h-6 bg-gray-200 checked:bg-[#0050e8] rounded-full appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
                  />
                </div>
                {newTrackInventory && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                        Initial Stock
                      </label>
                      <Input
                        placeholder="Initial Stock"
                        type="number"
                        value={newStockQty}
                        onChange={(e) => setNewStockQty(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#4b5563] uppercase tracking-wide mb-1">
                        Low Stock Alert Level
                      </label>
                      <Input
                        placeholder="Low Stock Alert Level"
                        type="number"
                        value={newLowStockThreshold}
                        onChange={(e) => setNewLowStockThreshold(e.target.value)}
                      />
                    </div>
                  </div>
                )}
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
        </section>

        {/* Product Limit Warning */}
        {products.length > 50 && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
            You have a large catalog — consider removing unused items to keep your invoice builder fast.
          </div>
        )}

        {/* Product Catalog List */}
        <section className="mb-8">
          <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
            Products
          </h2>

          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description="Add your first item above. These products will appear in your invoice builder for quick selection."
            />
          ) : (
            <div className="space-y-4">
              {/* Search, Filter & Sort Bar - Desktop Only */}
              <div className="hidden md:flex flex-col gap-3">
                {/* Search & Sort row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
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
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#e5e7eb] rounded-none text-sm font-bold focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all placeholder-gray-400 min-h-[44px]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white border border-[#e5e7eb] rounded-none px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all min-h-[44px]"
                    >
                      <option value="name-asc">Sort: A to Z</option>
                      <option value="name-desc">Sort: Z to A</option>
                      <option value="price-asc">Sort: Price Low to High</option>
                      <option value="price-desc">Sort: Price High to Low</option>
                      {inventoryEnabledGlobal && (
                        <>
                          <option value="stock-asc">Sort: Stock Low to High</option>
                          <option value="stock-desc">Sort: Stock High to Low</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Categories Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategoryFilter('All')}
                    className={`px-4 py-2 rounded-none text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategoryFilter === 'All'
                        ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {allCategories.map(cat => {
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-none text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {inventoryEnabledGlobal && (
                  <div className="flex gap-2 items-center flex-wrap mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock Status:</span>
                    <button
                      type="button"
                      onClick={() => setStockFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        stockFilter === 'all'
                           ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                           : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      All Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockFilter('low_stock')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        stockFilter === 'low_stock'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      ⚠️ Low Stock ({products.filter(p => p.track_inventory && (p.stock_qty || 0) > 0 && (p.stock_qty || 0) <= (p.low_stock_threshold || 5)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockFilter('out_of_stock')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        stockFilter === 'out_of_stock'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                    >
                      🚫 Out of Stock ({products.filter(p => p.track_inventory && (p.stock_qty || 0) <= 0).length})
                    </button>
                  </div>
                )}
              </div>

              {/* Search, Filter & Sort Bar - Mobile Only */}
              <div className="flex md:hidden flex-col gap-3.5">
                {/* Search Field */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name or HSN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all placeholder-slate-400 min-h-[44px]"
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

                {/* Sort & Stock Filters */}
                <div className="flex gap-2.5 w-full relative">
                  {/* Sort Custom Dropdown */}
                  <div className="flex-1 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileSortOpen(!mobileSortOpen);
                        setMobileStockOpen(false);
                      }}
                      className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-extrabold flex items-center justify-between min-h-[40px] text-slate-700 cursor-pointer"
                    >
                      <span>
                        {sortBy === 'name-asc' && 'Sort: A to Z'}
                        {sortBy === 'name-desc' && 'Sort: Z to A'}
                        {sortBy === 'price-asc' && 'Sort: Price Low-High'}
                        {sortBy === 'price-desc' && 'Sort: Price High-Low'}
                        {sortBy === 'stock-asc' && 'Sort: Stock Low-High'}
                        {sortBy === 'stock-desc' && 'Sort: Stock High-Low'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileSortOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    
                    {mobileSortOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMobileSortOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => { setSortBy('name-asc'); setMobileSortOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'name-asc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                          >
                            A to Z
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSortBy('name-desc'); setMobileSortOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'name-desc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                          >
                            Z to A
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSortBy('price-asc'); setMobileSortOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'price-asc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                          >
                            Price Low-High
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSortBy('price-desc'); setMobileSortOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'price-desc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                          >
                            Price High-Low
                          </button>
                          {inventoryEnabledGlobal && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setSortBy('stock-asc'); setMobileSortOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'stock-asc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                              >
                                Stock Low-High
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSortBy('stock-desc'); setMobileSortOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${sortBy === 'stock-desc' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                              >
                                Stock High-Low
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stock Filter Custom Dropdown */}
                  {inventoryEnabledGlobal && (
                    <div className="flex-1 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileStockOpen(!mobileStockOpen);
                          setMobileSortOpen(false);
                        }}
                        className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-extrabold flex items-center justify-between min-h-[40px] text-slate-700 cursor-pointer"
                      >
                        <span>
                          {stockFilter === 'all' && 'Stock: All'}
                          {stockFilter === 'low_stock' && 'Stock: Low'}
                          {stockFilter === 'out_of_stock' && 'Stock: Out'}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileStockOpen ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {mobileStockOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMobileStockOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => { setStockFilter('all'); setMobileStockOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${stockFilter === 'all' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-655'}`}
                            >
                              All Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => { setStockFilter('low_stock'); setMobileStockOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${stockFilter === 'low_stock' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-655'}`}
                            >
                              Low Stock
                            </button>
                            <button
                              type="button"
                              onClick={() => { setStockFilter('out_of_stock'); setMobileStockOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${stockFilter === 'out_of_stock' ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-655'}`}
                            >
                              Out of Stock
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories Tabs Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategoryFilter('All')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategoryFilter === 'All'
                        ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {allCategories.map(cat => {
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-none p-6">
                  <span className="text-2xl block mb-2">🔍</span>
                  <p className="text-sm font-semibold text-gray-800 mb-1">No matching products found</p>
                  <p className="text-xs text-gray-500">Try adjusting your search query or selected category filter.</p>
                </div>
              ) : (
                <>
                  {/* Desktop view wrapper */}
                  <div className="hidden md:block bg-white rounded-none border border-[#e5e7eb] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="py-3.5 px-4 w-10"></th>
                            <th className="py-3.5 px-4 font-semibold">Item Name</th>
                            <th className="py-3.5 px-4 font-semibold">Category</th>
                            <th className="py-3.5 px-4 text-right font-semibold">Sale Price</th>
                            {inventoryEnabledGlobal && (
                              <th className="py-3.5 px-4 text-center font-semibold">Stock Qty</th>
                            )}
                            <th className="py-3.5 px-4 text-right pr-6 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f3f4f6]">
                          {filteredProducts.map((product) => {
                            const isLowStock = inventoryEnabledGlobal && product.track_inventory && (product.stock_qty || 0) <= (product.low_stock_threshold || 5);
                            const isOutOfStock = inventoryEnabledGlobal && product.track_inventory && (product.stock_qty || 0) === 0;

                            return (
                               <tr 
                                 key={product.id} 
                                 className={`hover:bg-gray-50/50 transition-colors group ${
                                   isOutOfStock 
                                     ? 'bg-red-50/20' 
                                     : isLowStock 
                                     ? 'bg-amber-50/25' 
                                     : ''
                                 }`}
                               >
                                 <td className="py-3.5 px-4">
                                   <button
                                     onClick={() => handleToggleFavorite(product)}
                                     className={`transition-colors hover:scale-110 cursor-pointer ${
                                       product.is_favorite ? 'text-amber-500' : 'text-gray-300 hover:text-gray-400'
                                     }`}
                                   >
                                     <svg width="15" height="15" viewBox="0 0 24 24" fill={product.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                                       <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                     </svg>
                                   </button>
                                 </td>
                                 <td className="py-3.5 px-4">
                                   <div className="flex items-center gap-2">
                                     <div className="font-medium text-gray-800 text-sm uppercase tracking-wider">{product.name}</div>
                                     {isOutOfStock && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wider">
                                         Out of Stock
                                       </span>
                                     )}
                                     {!isOutOfStock && isLowStock && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider animate-pulse">
                                         Low Stock
                                       </span>
                                     )}
                                   </div>
                                   {gstRegistered && ((product.gst_rate !== undefined && product.gst_rate > 0) || product.hsn_code) && (
                                     <div className="flex gap-1.5 mt-1">
                                       {product.gst_rate !== undefined && product.gst_rate > 0 && (
                                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-[#0050e8] border border-green-100">
                                           {product.gst_rate}% GST
                                         </span>
                                       )}
                                       {product.hsn_code && (
                                         <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                           HSN: {product.hsn_code}
                                         </span>
                                       )}
                                     </div>
                                   )}
                                 </td>
                                 <td className="py-3.5 px-4 text-xs font-semibold text-gray-500">
                                   {product.category || 'Others'}
                                 </td>
                                 <td className="py-3.5 px-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                                   ₹{Number(product.price).toLocaleString('en-IN')}
                                 </td>
                                 {inventoryEnabledGlobal && (
                                   <td className="py-3.5 px-4">
                                     {product.track_inventory ? (
                                       <div className="flex justify-center">
                                         {isOutOfStock ? (
                                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                             0 Left
                                           </span>
                                         ) : isLowStock ? (
                                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-100">
                                             <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                             {product.stock_qty} Left
                                           </span>
                                         ) : (
                                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                             {product.stock_qty} In Stock
                                           </span>
                                         )}
                                       </div>
                                     ) : (
                                       <div className="text-center text-xs text-gray-400 font-medium">—</div>
                                     )}
                                   </td>
                                 )}
                                <td className="py-3.5 px-4 text-right pr-6">
                                  <div className="flex items-center justify-end gap-2">
                                    {inventoryEnabledGlobal && product.track_inventory && (
                                      <button
                                        onClick={() => {
                                          setStockAdjustProductId(product.id);
                                          setAdjustQty('');
                                          setAdjustReason('restock');
                                        }}
                                        className="px-2.5 py-1.5 bg-[#0050e8]/10 text-[#0050e8] hover:bg-[#0050e8]/15 text-[10px] font-bold rounded-lg cursor-pointer"
                                      >
                                        + Add Stock
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEdit(product)}
                                      className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(product.id)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden flex flex-col gap-3.5">
                    {filteredProducts.map((product) => {
                      const isLowStock = inventoryEnabledGlobal && product.track_inventory && (product.stock_qty || 0) <= (product.low_stock_threshold || 5);
                      const isOutOfStock = inventoryEnabledGlobal && product.track_inventory && (product.stock_qty || 0) === 0;

                      return (
                        <div 
                          key={product.id} 
                          className={`bg-white border rounded-2xl p-4 shadow-2xs transition-all relative flex flex-col gap-3 border-slate-150 ${
                            isOutOfStock 
                              ? 'border-rose-100 bg-rose-50/10' 
                              : isLowStock 
                              ? 'border-amber-100 bg-amber-50/10' 
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2 text-left">
                              <button
                                type="button"
                                onClick={() => handleToggleFavorite(product)}
                                className={`transition-colors hover:scale-110 shrink-0 ${
                                  product.is_favorite ? 'text-amber-500' : 'text-slate-350'
                                }`}
                              >
                                {product.is_favorite ? (
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
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
                            
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-850 block tabular-nums">
                                ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">
                                Sale Price
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {shop.gst_registered && product.gst_rate !== undefined && product.gst_rate > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
                                {product.gst_rate}% GST
                              </span>
                            )}
                            {product.hsn_code && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                HSN: {product.hsn_code}
                              </span>
                            )}
                            {inventoryEnabledGlobal && product.track_inventory && (
                              <>
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                                    0 Left
                                  </span>
                                ) : isLowStock ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-850 border border-amber-100 uppercase animate-pulse">
                                    {product.stock_qty} Left
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 uppercase">
                                    {product.stock_qty} Left
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                            <div>
                              {inventoryEnabledGlobal && product.track_inventory && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStockAdjustProductId(product.id);
                                    setAdjustQty('');
                                    setAdjustReason('restock');
                                  }}
                                  className="bg-[#0050e8]/10 hover:bg-[#0050e8]/20 text-[#0050e8] text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors cursor-pointer min-h-[32px] flex items-center justify-center"
                                >
                                  + Add Stock
                                </button>
                              )}
                            </div>
                            
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => startEdit(product)}
                                className="text-slate-450 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(product.id)}
                                className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Manage Categories Section - Desktop Only */}
        <section className="hidden md:block mb-8">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Manage Categories
          </h2>
          <div className="bg-white rounded-none border border-[#e5e7eb] p-4 space-y-4">
            <p className="text-[10px] text-[#6b7280]">
              Group your products into categories for quicker access during invoicing. Deleting a category will reassign its products to "Others".
            </p>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = newCategoryName.trim();
                  if (!val) {
                    showToast('Enter a category name', 'error');
                    return;
                  }
                  if (allCategories.includes(val)) {
                    showToast('Category already exists', 'error');
                    return;
                  }
                  setCustomCategories((prev) => Array.from(new Set([...prev, val])));
                  setNewCategoryName('');
                  showToast(`Category "${val}" added`, 'success');
                }}
                className="px-4 py-2 bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-bold rounded-xl transition-all h-[44px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Category</span>
              </button>
            </div>

            {/* Categories List */}
            <div className="divide-y divide-[#f3f4f6]">
              {allCategories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm font-semibold text-[#111827]">{cat}</span>
                      <span className="text-xs text-[#6b7280] ml-2">({count} {count === 1 ? 'product' : 'products'})</span>
                    </div>
                    {cat !== 'Others' && (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Manage Categories Section - Mobile Only */}
        <section className="block md:hidden mb-8">
          <h2 className="text-xs font-extrabold text-[#6b7280] uppercase tracking-wider mb-3 font-heading">
            Manage Categories
          </h2>
          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-sm">
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Group your products into categories for quicker access during invoicing. Deleting a category will reassign its products to "Others".
            </p>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="rounded-xl min-h-[44px]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = newCategoryName.trim();
                  if (!val) {
                    showToast('Enter a category name', 'error');
                    return;
                  }
                  if (allCategories.includes(val)) {
                    showToast('Category already exists', 'error');
                    return;
                  }
                  setCustomCategories((prev) => Array.from(new Set([...prev, val])));
                  setNewCategoryName('');
                  showToast(`Category "${val}" added`, 'success');
                }}
                className="px-4 py-2 bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-bold rounded-xl transition-all h-[44px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add</span>
              </button>
            </div>

            {/* Categories List */}
            <div className="divide-y divide-slate-100">
              {allCategories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{cat}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{count} {count === 1 ? 'product' : 'products'}</span>
                    </div>
                    {cat !== 'Others' && (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {/* Edit Product Modal */}
        <AnimatePresence>
          {editingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingId(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />
              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl p-6 shadow-xl max-w-md w-full border border-gray-100 z-10 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-black text-gray-900 font-heading">
                    Edit Product Details
                  </h3>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Product Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Price</label>
                    <Input
                      type="number"
                      prefix="₹"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>

                  {gstRegistered && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">HSN Code</label>
                        <Input
                          placeholder="HSN Code (optional)"
                          value={editHsn}
                          onChange={(e) => setEditHsn(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">GST Rate</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setEditGstOpen(!editGstOpen);
                              setEditCategoryOpen(false);
                            }}
                            className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm font-bold flex items-center justify-between min-h-[44px] text-slate-700 cursor-pointer"
                          >
                            <span>{editGst}% GST</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${editGstOpen ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          
                          {editGstOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setEditGstOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                                {['0', '5', '12', '18', '28'].map((rate) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => { setEditGst(rate); setEditGstOpen(false); }}
                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${editGst === rate ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-600'}`}
                                  >
                                    {rate}% GST
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
                    {isEditAddingNewCategory ? (
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter new category name"
                            value={editCategoryInput}
                            onChange={(e) => setEditCategoryInput(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (editCategoryInput.trim()) {
                              const val = editCategoryInput.trim();
                              setCustomCategories((prev) => Array.from(new Set([...prev, val])));
                              setEditCategory(val);
                            }
                            setIsEditAddingNewCategory(false);
                          }}
                          className="px-3 py-2 bg-[#0050e8] text-white text-xs font-bold rounded-xl h-[44px] hover:bg-[#0043c4] transition-colors cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditAddingNewCategory(false)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl h-[44px] hover:bg-gray-300 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setEditCategoryOpen(!editCategoryOpen);
                            setEditGstOpen(false);
                          }}
                          className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-3 text-xs font-semibold flex items-center justify-between min-h-[44px] text-slate-700 cursor-pointer"
                        >
                          <span>{editCategory || 'Select Category (optional)'}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${editCategoryOpen ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {editCategoryOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setEditCategoryOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 max-h-[200px] overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => { setEditCategory(''); setEditCategoryOpen(false); }}
                                className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${!editCategory ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'}`}
                              >
                                None (Select Category)
                              </button>
                              {allCategories.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => { setEditCategory(c); setEditCategoryOpen(false); }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${editCategory === c ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-655'}`}
                                >
                                  {c}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => { setIsEditAddingNewCategory(true); setEditCategoryInput(''); setEditCategoryOpen(false); }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-extrabold text-[#0050e8] hover:bg-[#0050e8]/5 border-t border-slate-100 cursor-pointer"
                              >
                                + Add new category
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {inventoryEnabledGlobal && (
                    <div className="border-t border-[#f3f4f6] pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#4b5563]">Track stock for this item</span>
                        <input
                          type="checkbox"
                          checked={editTrackInventory}
                          onChange={(e) => setEditTrackInventory(e.target.checked)}
                          className="w-10 h-6 bg-gray-200 checked:bg-[#0050e8] rounded-full appearance-none relative cursor-pointer transition-colors duration-200 focus:outline-none before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:translate-x-4 before:transition-all before:duration-200 border border-gray-300"
                        />
                      </div>
                      {editTrackInventory && (
                        <div className="w-full">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Low Stock Alert Level</label>
                          <Input
                            type="number"
                            value={editLowStockThreshold}
                            onChange={(e) => setEditLowStockThreshold(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Stock Modal */}
        <AnimatePresence>
          {stockAdjustProductId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setStockAdjustProductId(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />
              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full border border-gray-100 z-10 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-black text-gray-900 font-heading">
                    Add Stock
                  </h3>
                  <button
                    onClick={() => setStockAdjustProductId(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                {(() => {
                  const product = products.find(p => p.id === stockAdjustProductId);
                  if (!product) return null;
                  return (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Product</span>
                        <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">{product.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Quantity to Add</label>
                          <Input
                            placeholder="Qty to add"
                            type="number"
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Reason</label>
                          <select
                            value={adjustReason}
                            onChange={(e: any) => setAdjustReason(e.target.value)}
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#0050e8] focus:ring-2 focus:ring-[#0050e8]/20 min-h-[44px]"
                          >
                            <option value="restock">Restock</option>
                            <option value="return">Customer Return</option>
                            <option value="adjustment">Adjustment</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                        <Button
                          variant="secondary"
                          onClick={() => setStockAdjustProductId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleAdjustStock(product)}
                        >
                          Add Stock
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDeleteId(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />
              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white rounded-2xl p-5 shadow-xl max-w-xs w-full border border-gray-100 z-10 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-950 font-heading">Delete Product?</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Are you sure you want to delete this product? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(confirmDeleteId)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>
    </div>
  );
}
