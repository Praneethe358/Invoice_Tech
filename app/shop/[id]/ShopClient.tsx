'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock_qty: number;
  track_inventory: boolean;
}

interface Shop {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  gst_registered: boolean;
  gstin: string | null;
  inventory_enabled: boolean;
}

interface Props {
  shop: Shop;
  products: Product[];
}

export default function ShopClient({ shop, products }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        list.add(p.category.toUpperCase());
      }
    });
    return ['ALL', ...Array.from(list)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCategory = selectedCategory === 'ALL' ||
        (p.category && p.category.toUpperCase() === selectedCategory);

      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] pb-12 font-sans">
      {/* Public View Header Banner */}
      <div className="bg-[#0050e8] text-white text-xs font-bold py-3 px-4 text-center tracking-wide shadow-sm flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
        <span>📢 Public View Catalog</span>
        <span className="opacity-75 hidden sm:inline">|</span>
        <span>
          Logged out?{' '}
          <Link href="/login" className="underline hover:text-blue-100 font-extrabold">
            Login here to manage your business
          </Link>
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Shop Header block */}
        <div className="bg-white border border-[#e5e7eb] p-6 mb-6 shadow-xs text-center">
          {shop.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={shop.logo_url} 
              alt="Shop Logo" 
              className="max-h-[64px] object-contain mx-auto mb-3"
            />
          )}
          <h1 className="text-xl font-black text-gray-900 uppercase font-heading tracking-tight">
            {shop.name}
          </h1>
          {shop.phone && (
            <p className="text-[11px] text-gray-500 font-semibold mt-1">
              Call: +91 {shop.phone}
            </p>
          )}
          {shop.address && (
            <p className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-sm mx-auto">
              {shop.address}
            </p>
          )}
          {shop.gst_registered && shop.gstin && (
            <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
              GSTIN: {shop.gstin}
            </div>
          )}
        </div>

        {/* Search and Filter Panel */}
        <div className="bg-white border border-[#e5e7eb] p-5 mb-6 shadow-xs space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0050e8] transition-all"
            />
            <svg 
              className="absolute left-3.5 top-3.5 text-gray-400"
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Categories row */}
          {categories.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap uppercase tracking-wider transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#0050e8] text-white border-[#0050e8] shadow-sm'
                      : 'bg-white text-gray-600 border-[#e5e7eb] hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Catalog List */}
        <div className="bg-white border border-[#e5e7eb] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center bg-gray-55/30">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">
              Product Catalog ({filteredProducts.length})
            </h3>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 italic">
              No products found matching the search criteria.
            </div>
          ) : (
            <div className="divide-y divide-[#f3f4f6]">
              {filteredProducts.map((p) => {
                const stockEnabled = shop.inventory_enabled && p.track_inventory;
                const inStock = p.stock_qty > 0;
                
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.category && (
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 uppercase tracking-wider">
                            {p.category}
                          </span>
                        )}
                        {stockEnabled ? (
                          inStock ? (
                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                              IN STOCK ({p.stock_qty})
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5">
                              OUT OF STOCK
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] font-extrabold text-gray-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5">
                            AVAILABLE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900">
                        ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
            Powered by TruBill Invoice
          </p>
        </div>
      </div>
    </div>
  );
}
