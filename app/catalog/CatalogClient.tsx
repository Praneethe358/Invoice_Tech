/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Shop, Product, ProductVariant } from '@/lib/types';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { playBeep, triggerHaptic } from '@/lib/sound';

interface Props {
  shop: Shop;
  initialProducts: Product[];
  initialVariants?: ProductVariant[];
}

export default function CatalogClient({
  shop,
  initialProducts,
  initialVariants = [],
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // State Management
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Modals state
  const [addingProduct, setAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantsProduct, setVariantsProduct] = useState<Product | null>(null);

  // Form states for Add/Edit Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodHsn, setProdHsn] = useState('');
  const [prodGst, setProdGst] = useState('0');
  const [prodDescription, setProdDescription] = useState('');
  const [showAddNewCategoryInline, setShowAddNewCategoryInline] = useState(false);
  const [newInlineCategoryName, setNewInlineCategoryName] = useState('');

  // Form states for Add Variant in Modal
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarSku, setNewVarSku] = useState('');
  const [newVarStockQty, setNewVarStockQty] = useState('0');
  const [newVarLowStockThreshold, setNewVarLowStockThreshold] = useState('5');

  // Inline stock adjustment state inside Variants Modal
  const [variantStockAddId, setVariantStockAddId] = useState<string | null>(null);
  const [variantStockAddQty, setVariantStockAddQty] = useState('10');

  // Category Tab state
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  // Variants selection state (for bulk actions)
  const [selectedVariantsCheckbox, setSelectedVariantsCheckbox] = useState<Record<string, boolean>>({});
  const [printCopies, setPrintCopies] = useState<Record<string, number>>({});

  // Scanner modal states
  const [isNewVarSkuScannerOpen, setIsNewVarSkuScannerOpen] = useState(false);

  // Initialize and derive custom categories
  useEffect(() => {
    const extra = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    const savedCategoriesStr = localStorage.getItem(`custom_categories_${shop.id}`);
    let saved: string[] = [];
    if (savedCategoriesStr) {
      try {
        saved = JSON.parse(savedCategoriesStr);
      } catch (e) {
        console.error(e);
      }
    }
    const merged = Array.from(new Set([...extra, ...saved]));
    setCustomCategories(merged);
    localStorage.setItem(`custom_categories_${shop.id}`, JSON.stringify(merged));
  }, [products, shop.id]);

  // Derived Categories lists
  const allCategories = useMemo(() => {
    return Array.from(new Set(customCategories.filter(Boolean)));
  }, [customCategories]);

  // Save/Update Category in local storage helper
  const updateCustomCategories = (updated: string[]) => {
    setCustomCategories(updated);
    localStorage.setItem(`custom_categories_${shop.id}`, JSON.stringify(updated));
  };

  // Star/Favorite toggle helper
  const handleToggleFavorite = async (product: Product) => {
    const nextVal = !product.is_favorite;
    
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_favorite: nextVal } : p))
    );

    const { error } = await supabase
      .from('products')
      .update({ is_favorite: nextVal })
      .eq('id', product.id);

    if (error) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_favorite: !nextVal } : p))
      );
      showToast('Failed to update favorite status', 'error');
    } else {
      showToast(nextVal ? 'Added to favorites' : 'Removed from favorites', 'success');
    }
  };

  // Add Product handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = prodName.trim().toUpperCase();
    const price = parseFloat(prodPrice);
    const hsn = prodHsn.trim();
    const gstRate = parseFloat(prodGst) || 0;
    const finalCategory = prodCategory.trim();

    if (!name) {
      showToast('Enter a product name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    const payload = {
      shop_id: shop.id,
      name,
      price,
      hsn_code: hsn || null,
      gst_rate: gstRate,
      category: finalCategory || null,
      track_inventory: true,
    };

    if (editingProduct) {
      // Update
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);

      if (error) {
        showToast('Failed to update product', 'error');
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
        );
        showToast('Product updated successfully', 'success');
        
        // Open variants manager modal for this updated product
        const updatedProd = { ...editingProduct, ...payload };
        setEditingProduct(null);
        setAddingProduct(false);
        setVariantsProduct(updatedProd);
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        showToast('Failed to create product', 'error');
      } else {
        setProducts((prev) => [...prev, data as Product]);
        showToast('Product created successfully', 'success');
        
        // Auto open Variants Manager Modal for the newly created product
        setAddingProduct(false);
        setProdName('');
        setProdPrice('');
        setProdHsn('');
        setProdGst('0');
        setProdDescription('');
        setProdCategory('');
        setVariantsProduct(data as Product);
      }
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All its variants will be removed.')) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Failed to delete product', 'error');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setVariants((prev) => prev.filter((v) => v.product_id !== id));
      showToast('Product deleted successfully', 'success');
    }
  };

  // Open Edit Product Modal
  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category || '');
    setProdPrice(String(product.price));
    setProdHsn(product.hsn_code || '');
    setProdGst(String(product.gst_rate || 0));
    setProdDescription((product as any).description || '');
    setAddingProduct(true);
  };

  // Inline Category Add Option helper
  const handleAddInlineCategory = () => {
    const cat = newInlineCategoryName.trim();
    if (!cat) return;
    if (!customCategories.includes(cat)) {
      updateCustomCategories([...customCategories, cat]);
    }
    setProdCategory(cat);
    setNewInlineCategoryName('');
    setShowAddNewCategoryInline(false);
  };

  // Add Variant Handler
  const handleAddVariant = async () => {
    if (!variantsProduct) return;
    const size = newVarSize.trim();
    const color = newVarColor.trim();
    if (!size || !color) {
      showToast('Size and Color are required', 'error');
      return;
    }

    const generatedSku = newVarSku.trim() || `${variantsProduct.name.replace(/\s+/g, '-')}-${size.toUpperCase()}-${color.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const stockVal = parseInt(newVarStockQty) || 0;
    const thresholdVal = parseInt(newVarLowStockThreshold) || 5;

    const payload = {
      product_id: variantsProduct.id,
      size,
      color,
      sku: generatedSku,
      stock_qty: stockVal,
      low_stock_threshold: thresholdVal,
      barcode: generatedSku,
      barcode_source: newVarSku.trim() ? 'scanned' : 'generated',
    };

    const { data, error } = await supabase
      .from('product_variants')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      showToast(`Failed to add variant: ${error?.message}`, 'error');
    } else {
      // Log initial stock if any
      if (stockVal > 0) {
        await supabase.from('inventory_logs').insert({
          shop_id: shop.id,
          product_id: variantsProduct.id,
          variant_id: data.id,
          change_qty: stockVal,
          previous_qty: 0,
          new_qty: stockVal,
          reason: 'restock',
        });
      }
      setVariants((prev) => [...prev, data as ProductVariant]);
      showToast('Variant added successfully', 'success');

      // Clear input fields
      setNewVarSize('');
      setNewVarColor('');
      setNewVarSku('');
      setNewVarStockQty('0');
      setNewVarLowStockThreshold('5');
    }
  };

  // Confirm inline variant stock addition
  const handleConfirmAddStock = async (variant: ProductVariant) => {
    const qty = parseInt(variantStockAddQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Enter a valid quantity', 'error');
      return;
    }

    const currentStock = variant.stock_qty || 0;
    const newQty = currentStock + qty;

    const { error } = await supabase
      .from('product_variants')
      .update({ stock_qty: newQty })
      .eq('id', variant.id);

    if (error) {
      showToast('Failed to adjust stock', 'error');
    } else {
      await supabase.from('inventory_logs').insert({
        shop_id: shop.id,
        product_id: variant.product_id,
        variant_id: variant.id,
        change_qty: qty,
        previous_qty: currentStock,
        new_qty: newQty,
        reason: 'restock',
      });

      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? { ...v, stock_qty: newQty } : v))
      );
      setVariantStockAddId(null);
      showToast(`Added ${qty} units to stock`, 'success');
    }
  };

  // Delete variant handler
  const handleDeleteVariant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Failed to delete variant', 'error');
    } else {
      setVariants((prev) => prev.filter((v) => v.id !== id));
      showToast('Variant deleted', 'success');
    }
  };

  // Bulk print labels for selected variants
  const handleBulkPrintLabels = () => {
    const selectedIds = Object.keys(selectedVariantsCheckbox).filter(id => selectedVariantsCheckbox[id]);
    if (selectedIds.length === 0) return;

    const copiesList = selectedIds.map((id) => printCopies[id] || 1);
    const url = `/api/catalog/labels/pdf?variant_ids=${selectedIds.join(',')}&copies=${copiesList.join(',')}`;
    window.open(url, '_blank');
  };

  // Bulk delete selected variants
  const handleBulkDeleteVariants = async () => {
    const selectedIds = Object.keys(selectedVariantsCheckbox).filter(id => selectedVariantsCheckbox[id]);
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected variants?`)) return;

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .in('id', selectedIds);

    if (error) {
      showToast('Failed to delete selected variants', 'error');
    } else {
      setVariants((prev) => prev.filter((v) => !selectedIds.includes(v.id)));
      setSelectedVariantsCheckbox({});
      showToast('Selected variants deleted successfully', 'success');
    }
  };

  // Category Tab actions: Add Category
  const handleAddCategory = () => {
    const cat = newCategoryInput.trim();
    if (!cat) return;
    if (customCategories.includes(cat)) {
      showToast('Category already exists', 'warning');
      return;
    }
    updateCustomCategories([...customCategories, cat]);
    setNewCategoryInput('');
    showToast('Category added', 'success');
  };

  // Category Tab actions: Rename Category
  const handleRenameCategory = async () => {
    const oldName = editingCategoryOldName;
    const newNameClean = editingCategoryNewName.trim();
    if (!oldName || !newNameClean) return;

    if (oldName === newNameClean) {
      setEditingCategoryOldName(null);
      return;
    }

    // Update in Database
    const { error } = await supabase
      .from('products')
      .update({ category: newNameClean })
      .eq('shop_id', shop.id)
      .eq('category', oldName);

    if (error) {
      showToast('Failed to update category products', 'error');
    } else {
      // Update local products state
      setProducts((prev) =>
        prev.map((p) => (p.category === oldName ? { ...p, category: newNameClean } : p))
      );
      
      // Update local storage categories
      const updated = customCategories.map((c) => (c === oldName ? newNameClean : c));
      updateCustomCategories(updated);
      
      setEditingCategoryOldName(null);
      showToast('Category renamed successfully', 'success');
    }
  };

  // Category Tab actions: Delete Category (reassigns to null / Uncategorized)
  const handleDeleteCategory = async (catToDelete: string) => {
    if (!confirm(`Are you sure you want to delete "${catToDelete}"? All its products will be reassigned to "Uncategorized".`)) return;

    // Update in Database
    const { error } = await supabase
      .from('products')
      .update({ category: null })
      .eq('shop_id', shop.id)
      .eq('category', catToDelete);

    if (error) {
      showToast('Failed to reassign products', 'error');
    } else {
      // Update local products state
      setProducts((prev) =>
        prev.map((p) => (p.category === catToDelete ? { ...p, category: null } : p))
      );

      // Remove from local custom categories
      const updated = customCategories.filter((c) => c !== catToDelete);
      updateCustomCategories(updated);
      showToast(`Category deleted and products reassigned`, 'success');
    }
  };

  // Computed Values per Product
  const computedProducts = useMemo(() => {
    return products.map((product) => {
      const prodVariants = variants.filter((v) => v.product_id === product.id);
      const totalVariantsCount = prodVariants.length;
      const totalStockSum = prodVariants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);

      // Stock Status:
      // - Out of stock: totalStockSum === 0
      // - Low stock: any variant stock_qty <= low_stock_threshold
      // - In stock: else
      let stockStatus: 'out' | 'low' | 'in' = 'in';
      if (totalStockSum === 0) {
        stockStatus = 'out';
      } else if (prodVariants.some((v) => (v.stock_qty || 0) <= (v.low_stock_threshold || 5))) {
        stockStatus = 'low';
      }

      return {
        ...product,
        totalVariants: totalVariantsCount,
        totalStock: totalStockSum,
        stockStatus,
      };
    });
  }, [products, variants]);

  // Filtered Products for display
  const searchedProducts = useMemo(() => {
    let list = computedProducts;
    
    if (selectedCategoryFilter !== 'All') {
      if (selectedCategoryFilter === 'Uncategorized') {
        list = list.filter((p) => !p.category);
      } else {
        list = list.filter((p) => p.category === selectedCategoryFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.hsn_code && p.hsn_code.toLowerCase().includes(q))
      );
    }

    return list;
  }, [computedProducts, selectedCategoryFilter, searchQuery]);

  // Sku Scanned inside add variant
  const handleNewVarSkuScanned = (code: string) => {
    setNewVarSku(code);
    playBeep('success');
    triggerHaptic();
  };

  // Generated SKU Preview helper
  const generatedSkuPreview = useMemo(() => {
    if (!variantsProduct) return '';
    const size = newVarSize.trim() || 'SIZE';
    const color = newVarColor.trim() || 'COLOR';
    return `${variantsProduct.name.replace(/\s+/g, '-')}-${size.toUpperCase()}-${color.toUpperCase()}-XXXX`;
  }, [newVarSize, newVarColor, variantsProduct]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
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

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
            Product Catalog
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Good {mounted ? (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') : 'day'}! Manage items, barcodes and categories.
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="max-w-7xl mx-auto pt-2">
          
          {/* Header Area & Action - Desktop/Tablet view */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="hidden md:block">
              <h2 className="text-lg font-bold text-[#111827]">Catalog Items</h2>
              <p className="text-xs text-slate-500">Manage your product models, categories, pricing, and variants for billing.</p>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="md:hidden">
                <h2 className="text-sm font-bold text-[#111827]">Catalog Items</h2>
              </div>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  setProdName('');
                  setProdPrice('');
                  setProdHsn('');
                  setProdGst('12');
                  setProdDescription('');
                  setProdCategory('');
                  setAddingProduct(true);
                }}
                variant="primary"
                className="shadow-xs font-semibold text-xs px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                + New Product
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Categories
            </button>
          </div>

          {activeTab === 'products' ? (
            /* PRODUCTS TAB */
            <>
              {products.length === 0 ? (
                /* Empty state */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs py-16">
                  <EmptyState
                    icon={
                      <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    }
                    title="No products yet"
                    description="Add your first product to start creating invoices"
                    actionLabel="+ Add Product"
                    onAction={() => setAddingProduct(true)}
                  />
                </div>
              ) : (
                /* Products list with Search and Filter */
                <div className="space-y-4">
                  
                  {/* Search and Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                    
                    {/* Search Field */}
                    <div className="relative w-full sm:max-w-md">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        placeholder="Search products by name, category, or HSN..."
                        className="pl-9 pr-4 py-2 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Category Filter Dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filter Category:</span>
                      <select
                        className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="Uncategorized">Uncategorized</option>
                      </select>
                    </div>

                  </div>

                  {/* Clean Products Data Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3.5 px-4 w-10 text-center">☆</th>
                            <th className="py-3.5 px-4">Product Name</th>
                            <th className="py-3.5 px-4">Category</th>
                            <th className="py-3.5 px-4 text-center">Total Variants</th>
                            <th className="py-3.5 px-4 text-right">Sale Price</th>
                            <th className="py-3.5 px-4 text-right">Total Stock</th>
                            <th className="py-3.5 px-4 text-center">Stock Status</th>
                            <th className="py-3.5 px-4 text-right w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedProducts.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                No products found matching your search.
                              </td>
                            </tr>
                          ) : (
                            searchedProducts.map((p, idx) => (
                              <tr
                                key={p.id}
                                className={`hover:bg-[#F9FAFB]/75 transition-colors ${
                                  idx % 2 === 1 ? 'bg-slate-50/30' : ''
                                }`}
                              >
                                {/* Favorite Star */}
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => handleToggleFavorite(p)}
                                    className={`transition-all hover:scale-110 cursor-pointer ${
                                      p.is_favorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'
                                    }`}
                                  >
                                    ★
                                  </button>
                                </td>

                                {/* Product Name */}
                                <td className="py-3 px-4 font-semibold text-[#111827]">
                                  <div>
                                    {p.name}
                                    {p.hsn_code && (
                                      <span className="block text-[9px] text-slate-400 font-normal">
                                        HSN: {p.hsn_code}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Category pill */}
                                <td className="py-3 px-4">
                                  {p.category ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                      {p.category}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 italic text-[10px]">Uncategorized</span>
                                  )}
                                </td>

                                {/* Total Variants */}
                                <td className="py-3 px-4 text-center font-medium text-slate-600">
                                  {p.totalVariants} variants
                                </td>

                                {/* Sale Price */}
                                <td className="py-3 px-4 text-right font-medium text-[#111827]">
                                  ₹{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Total Stock */}
                                <td className="py-3 px-4 text-right font-bold text-slate-700">
                                  {p.totalStock} units
                                </td>

                                {/* Stock Status Badge */}
                                <td className="py-3 px-4 text-center">
                                  {p.stockStatus === 'out' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      Out of Stock
                                    </span>
                                  ) : p.stockStatus === 'low' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      In Stock
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => setVariantsProduct(p)}
                                      title="Manage Variants"
                                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      {/* Layers icon */}
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                    </button>

                                    <button
                                      onClick={() => openEditProduct(p)}
                                      title="Edit Product"
                                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      {/* Pencil icon */}
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteProduct(p.id)}
                                      title="Delete Product"
                                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      {/* Trash icon */}
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </>
          ) : (
            /* CATEGORIES TAB */
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-3xl">
              <div className="mb-6">
                <h2 className="text-base font-bold text-[#111827]">Manage Categories</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Deleting a category reassigns its products to &quot;Uncategorized&quot;.
                </p>
              </div>

              {/* Add category form */}
              <div className="flex gap-2 mb-6 max-w-md">
                <Input
                  placeholder="e.g. Sandals, Sports Shoes"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="text-xs"
                />
                <Button
                  onClick={handleAddCategory}
                  variant="primary"
                  className="font-bold text-xs shrink-0 cursor-pointer"
                >
                  + Add Category
                </Button>
              </div>

              {/* Categories list */}
              {allCategories.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 text-slate-400 text-xs">
                  No categories yet. Add one above.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Category Name</th>
                        <th className="py-3 px-4 text-center">Product Count</th>
                        <th className="py-3 px-4 text-right w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allCategories.map((cat) => {
                        const prodCount = products.filter((p) => p.category === cat).length;
                        const isEditing = editingCategoryOldName === cat;

                        return (
                          <tr key={cat} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-700">
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="px-2 py-1 border rounded-md text-xs w-full max-w-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden bg-white"
                                  value={editingCategoryNewName}
                                  onChange={(e) => setEditingCategoryNewName(e.target.value)}
                                  autoFocus
                                />
                              ) : (
                                cat
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-600 font-medium">
                              {prodCount} products
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={handleRenameCategory}
                                    className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md text-[10px] hover:bg-emerald-700 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCategoryOldName(null)}
                                    className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] hover:bg-slate-200 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategoryOldName(cat);
                                      setEditingCategoryNewName(cat);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="text-rose-600 hover:text-rose-800 hover:underline font-bold cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ─── ADD / EDIT PRODUCT MODAL ───────────────────────── */}
        <AnimatePresence>
          {addingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/45 backdrop-blur-xs"
                onClick={() => setAddingProduct(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 overflow-hidden flex flex-col max-h-[90vh]"
              >
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <h3 className="text-base font-bold text-[#111827]">
                    {editingProduct ? 'Edit Product details' : 'Add New Product'}
                  </h3>
                  <button
                    onClick={() => setAddingProduct(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Form Scrollable */}
                <form onSubmit={handleSaveProduct} className="space-y-4 overflow-y-auto pr-1 flex-1">
                  
                  {/* Name field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Product Name *
                    </label>
                    <Input
                      placeholder="e.g. MEN'S SPORTS RUNNING SHOES"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    {showAddNewCategoryInline ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="New category name..."
                          value={newInlineCategoryName}
                          onChange={(e) => setNewInlineCategoryName(e.target.value)}
                          className="text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddInlineCategory}
                          className="bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddNewCategoryInline(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                        >
                          <option value="">-- Select Category (Optional) --</option>
                          {allCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddNewCategoryInline(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-bold whitespace-nowrap cursor-pointer"
                        >
                          + Add New
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pricing and GST rates */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Sale Price */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sale Price ₹ *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="text-xs font-semibold"
                        prefix="₹"
                      />
                    </div>

                    {/* GST Rate */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        GST Rate %
                      </label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        value={prodGst}
                        onChange={(e) => setProdGst(e.target.value)}
                      >
                        <option value="0">0% (Exempted)</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST</option>
                        <option value="28">28% GST</option>
                      </select>
                    </div>

                  </div>

                  {/* HSN Code with GST Tooltip */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      HSN Code
                      <span
                        title="Required for GST invoicing"
                        className="cursor-pointer text-[10px] text-blue-600 hover:text-blue-800 underline font-normal normal-case"
                      >
                        (Required for GST)
                      </span>
                    </label>
                    <Input
                      placeholder="e.g. 6403 (Footwear HSN)"
                      value={prodHsn}
                      onChange={(e) => setProdHsn(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter optional description, details or note..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                    />
                  </div>

                  {/* Save button */}
                  <div className="pt-4 border-t flex justify-end gap-2">
                    <Button
                      type="button"
                      onClick={() => setAddingProduct(false)}
                      variant="secondary"
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      {editingProduct ? 'Save Changes' : 'Save & Manage Variants'}
                    </Button>
                  </div>

                </form>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── MANAGE VARIANTS MODAL ──────────────────────────── */}
        <AnimatePresence>
          {variantsProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/45 backdrop-blur-xs"
                onClick={() => setVariantsProduct(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
              >
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#111827]">
                      Variants — {variantsProduct.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Total:{' '}
                      <span className="font-bold text-[#111827]">
                        {variants.filter((v) => v.product_id === variantsProduct.id).reduce((sum, v) => sum + (v.stock_qty || 0), 0)} units
                      </span>{' '}
                      across{' '}
                      <span className="font-bold text-[#111827]">
                        {variants.filter((v) => v.product_id === variantsProduct.id).length} variants
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setVariantsProduct(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Scrollable Content */}
                <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                  
                  {/* ADD NEW VARIANT section */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">
                      Add New Variant Option
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
                      
                      {/* Size */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Size *</label>
                        <input
                          type="text"
                          placeholder="e.g. 7, 8, 9, UK8"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newVarSize}
                          onChange={(e) => setNewVarSize(e.target.value)}
                        />
                      </div>

                      {/* Color */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Color *</label>
                        <input
                          type="text"
                          placeholder="e.g. Black, Brown"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newVarColor}
                          onChange={(e) => setNewVarColor(e.target.value)}
                        />
                      </div>

                      {/* SKU / Barcode */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                          SKU / Barcode
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Auto-generated if empty"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            value={newVarSku}
                            onChange={(e) => setNewVarSku(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setIsNewVarSkuScannerOpen(true)}
                            className="bg-slate-100 hover:bg-slate-200 border rounded-lg px-2 flex items-center justify-center cursor-pointer"
                            title="Scan Barcode"
                          >
                            📸
                          </button>
                        </div>
                      </div>

                      {/* Initial Stock */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Initial Stock</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newVarStockQty}
                          onChange={(e) => setNewVarStockQty(e.target.value)}
                        />
                      </div>

                      {/* Low Stock Alert */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Low Stock Alert</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          value={newVarLowStockThreshold}
                          onChange={(e) => setNewVarLowStockThreshold(e.target.value)}
                        />
                      </div>

                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 italic">
                        Preview SKU: {generatedSkuPreview}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-xs cursor-pointer text-xs"
                      >
                        + Add Variant
                      </button>
                    </div>

                  </div>

                  {/* BULK ACTIONS BAR */}
                  {Object.keys(selectedVariantsCheckbox).filter((k) => selectedVariantsCheckbox[k]).length > 0 && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200/80 rounded-xl p-3.5 shadow-2xs">
                      <span className="text-xs text-blue-700 font-bold">
                        {Object.keys(selectedVariantsCheckbox).filter((k) => selectedVariantsCheckbox[k]).length} variants selected
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkPrintLabels}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-3xs cursor-pointer"
                        >
                          🖨 Print Barcodes for Selected
                        </button>
                        <button
                          onClick={handleBulkDeleteVariants}
                          className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          🗑 Delete Selected
                        </button>
                      </div>
                    </div>
                  )}

                  {/* EXISTING VARIANTS Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                variants.filter((v) => v.product_id === variantsProduct.id).length > 0 &&
                                variants.filter((v) => v.product_id === variantsProduct.id).every((v) => selectedVariantsCheckbox[v.id])
                              }
                              onChange={(e) => {
                                const prodVars = variants.filter((v) => v.product_id === variantsProduct.id);
                                const nextState = { ...selectedVariantsCheckbox };
                                prodVars.forEach((v) => {
                                  nextState[v.id] = e.target.checked;
                                });
                                setSelectedVariantsCheckbox(nextState);
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Color</th>
                          <th className="py-2.5 px-3">SKU / Barcode</th>
                          <th className="py-2.5 px-3 text-right">Stock</th>
                          <th className="py-2.5 px-3 text-center">Low Stock Alert</th>
                          <th className="py-2.5 px-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variants.filter((v) => v.product_id === variantsProduct.id).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              No variants created for this product. Add one above.
                            </td>
                          </tr>
                        ) : (
                          variants
                            .filter((v) => v.product_id === variantsProduct.id)
                            .map((variant) => {
                              const isChecked = !!selectedVariantsCheckbox[variant.id];
                              const stock = variant.stock_qty || 0;
                              const th = variant.low_stock_threshold || 5;

                              // Color coding:
                              // - red if stock <= th
                              // - yellow if stock <= th * 2
                              // - green otherwise
                              let stockColorClass = 'text-emerald-700 bg-emerald-50 border border-emerald-100';
                              if (stock <= th) {
                                stockColorClass = 'text-rose-700 bg-rose-50 border border-rose-100';
                              } else if (stock <= th * 2) {
                                stockColorClass = 'text-amber-700 bg-amber-50 border border-amber-100';
                              }

                              return (
                                <tr key={variant.id} className="hover:bg-slate-50/50">
                                  {/* Checkbox */}
                                  <td className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        setSelectedVariantsCheckbox((prev) => ({
                                          ...prev,
                                          [variant.id]: e.target.checked,
                                        }));
                                      }}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>

                                  {/* Size */}
                                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                                    Size {variant.size}
                                  </td>

                                  {/* Color */}
                                  <td className="py-2.5 px-3 text-slate-600">
                                    {variant.color}
                                  </td>

                                  {/* SKU / Barcode */}
                                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                                    <div>{variant.sku}</div>
                                    
                                    {/* Print copies input per-row ONLY if checked (printing triggered) */}
                                    {isChecked && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[9px] text-blue-600 font-bold">Print Copies:</span>
                                        <input
                                          type="number"
                                          min="1"
                                          className="w-10 px-1 py-0.5 text-[10px] border border-blue-200 rounded text-center bg-blue-50/50"
                                          value={printCopies[variant.id] || 1}
                                          onChange={(e) => {
                                            const val = Math.max(1, parseInt(e.target.value) || 1);
                                            setPrintCopies(prev => ({ ...prev, [variant.id]: val }));
                                          }}
                                        />
                                      </div>
                                    )}
                                  </td>

                                  {/* Stock status & Inline Stock adjust */}
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${stockColorClass}`}>
                                        {stock} units
                                      </span>

                                      {/* Inline + Add Stock */}
                                      {variantStockAddId === variant.id ? (
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="number"
                                            className="w-12 px-1 py-0.5 text-xs border rounded-md text-center bg-white"
                                            value={variantStockAddQty}
                                            onChange={(e) => setVariantStockAddQty(e.target.value)}
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => handleConfirmAddStock(variant)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-bold"
                                          >
                                            OK
                                          </button>
                                          <button
                                            onClick={() => setVariantStockAddId(null)}
                                            className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setVariantStockAddId(variant.id);
                                            setVariantStockAddQty('10');
                                          }}
                                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                        >
                                          + Add
                                        </button>
                                      )}
                                    </div>
                                  </td>

                                  {/* Low Stock Alert threshold */}
                                  <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                                    {variant.low_stock_threshold || 5} units
                                  </td>

                                  {/* Delete Variant */}
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => handleDeleteVariant(variant.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Delete Variant"
                                    >
                                      {/* Simple Trash icon */}
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </td>

                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t flex justify-end">
                  <Button
                    onClick={() => setVariantsProduct(null)}
                    variant="secondary"
                    className="text-xs font-semibold px-4 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Barcode Scanner Modal for Variant SKU */}
        <BarcodeScannerModal
          isOpen={isNewVarSkuScannerOpen}
          onClose={() => setIsNewVarSkuScannerOpen(false)}
          onScan={(code) => {
            handleNewVarSkuScanned(code);
            setIsNewVarSkuScannerOpen(false);
          }}
        />

      </PageTransition>
    </div>
  );
}
