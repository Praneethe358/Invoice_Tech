'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Supplier, Shop } from '@/lib/types';
import { getShopPlaceholders } from '@/lib/starter-catalogs';
import { createClient } from '@/lib/supabase/client';

interface Props {
  shop: Shop;
  initialSuppliers: Supplier[];
}

export default function SuppliersClient({ shop, initialSuppliers }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const placeholders = getShopPlaceholders(shop.shop_type);

  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Supplier Form state
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 25;

  const fetchSuppliers = useCallback(async (targetPage: number) => {
    setLoading(true);
    const from = (targetPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('suppliers')
      .select('id, shop_id, name, contact_person, phone, email, address, gstin, created_at', { count: 'exact' })
      .eq('shop_id', shop.id)
      .order('name', { ascending: true })
      .range(from, to);

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,gstin.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      // Fetch purchases only for these suppliers to aggregate data
      const supplierIds = data.map((s: any) => s.id);
      let purchases: any[] = [];
      if (supplierIds.length > 0) {
        const { data: purData } = await supabase
          .from('purchases')
          .select('supplier_id, total, purchase_date')
          .eq('shop_id', shop.id)
          .in('supplier_id', supplierIds);
        purchases = purData || [];
      }

      // Group purchases by supplier_id
      const statsMap: { [supplierId: string]: { total: number; lastDate: string | null } } = {};
      purchases.forEach((p) => {
        if (!p.supplier_id) return;
        if (!statsMap[p.supplier_id]) {
          statsMap[p.supplier_id] = { total: 0, lastDate: null };
        }
        statsMap[p.supplier_id].total += parseFloat(p.total as any) || 0;
        
        const dateStr = p.purchase_date;
        if (!statsMap[p.supplier_id].lastDate || dateStr > statsMap[p.supplier_id].lastDate!) {
          statsMap[p.supplier_id].lastDate = dateStr;
        }
      });

      const enriched = data.map((sup: any) => ({
        ...sup,
        total_purchases: statsMap[sup.id]?.total || 0,
        last_purchase_date: statsMap[sup.id]?.lastDate || null,
      }));

      setSuppliers(enriched as Supplier[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [supabase, shop.id, searchQuery]);

  // Reset page and fetch on filter change
  useEffect(() => {
    // Check if initial mount and server-side data is populated
    if (page === 1 && searchQuery === '' && initialSuppliers.length > 0) {
      supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .then(({ count }: { count: number | null }) => {
          setTotalCount(count ?? 0);
        });
      return;
    }
    setPage(1);
    fetchSuppliers(1);
  }, [searchQuery, fetchSuppliers, initialSuppliers]);

  // Fetch when page changes
  useEffect(() => {
    if (page > 1) {
      fetchSuppliers(page);
    }
  }, [page, fetchSuppliers]);

  // Aggregated Stats
  const stats = useMemo(() => {
    let totalPurchases = 0;
    let registeredCount = 0;
    let unregisteredCount = 0;

    suppliers.forEach((s) => {
      totalPurchases += Number(s.total_purchases || 0);
      if (s.gstin) registeredCount++;
      else unregisteredCount++;
    });

    return {
      totalPurchases,
      registeredCount,
      unregisteredCount,
      totalSuppliers: totalCount,
    };
  }, [suppliers, totalCount]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    if (gstin.trim() && gstin.trim().length !== 15) {
      showToast('Supplier GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
          phone: phone.trim() ? phone.trim() : null,
          address: address.trim() ? address.trim() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add supplier');
      }

      const newSupplier = await res.json();
      setSuppliers((prev) => [
        {
          ...newSupplier,
          total_purchases: 0,
          last_purchase_date: null,
        },
        ...prev,
      ]);
      
      showToast('Supplier added successfully!', 'success');
      setShowAddModal(false);
      setName('');
      setGstin('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar initialShop={shop} />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Header matched with profile logo format - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e2e8f0] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-sm items-center justify-between gap-4 mb-8 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0050e8] to-[#0058e8] flex items-center justify-center overflow-hidden shadow-md">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-white font-extrabold text-lg">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Suppliers Database · Track products supplier details & business logs
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0050e8] hover:bg-[#0043c4] text-white rounded-xl py-2.5 px-5 flex items-center gap-2.5 font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
              Suppliers Directory
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0050e8] hover:bg-[#0043c4] text-white rounded-xl py-2.5 px-5 flex items-center gap-2.5 font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer self-start"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* Vyapar style premium stats ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-l-4 border-blue-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Suppliers</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalSuppliers}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-emerald-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                ₹{stats.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">B2B Registered</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.registeredCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-slate-400 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unregistered B2C</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.unregisteredCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search bar row */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-xs">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by supplier name, GSTIN, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0050e8] focus:ring-1 focus:ring-[#0050e8]/20 transition-all"
            />
            <svg className="absolute left-3.5 top-3 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Suppliers tabular log */}
        {suppliers.length === 0 ? (
          <EmptyState
            title="No suppliers found"
            description="Add your fertilizer or goods suppliers to record purchases and track Input Tax Credit (ITC)."
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-350 animate-pulse">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-600">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Supplier Name</th>
                    <th className="py-3.5 px-5">GST Registration Status / GSTIN</th>
                    <th className="py-3.5 px-5">Phone Number</th>
                    <th className="py-3.5 px-5">Address</th>
                    <th className="py-3.5 px-5">Total Purchases Outlay</th>
                    <th className="py-3.5 px-5">Last Order Date</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((sup) => {
                    const dateStr = sup.last_purchase_date
                      ? new Date(sup.last_purchase_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No purchase';
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-800 uppercase tracking-wide">{sup.name}</td>
                        <td className="py-4 px-5">
                          {sup.gstin ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-mono tracking-wider shadow-2xs">
                              {sup.gstin}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold bg-slate-100 text-slate-555 border border-slate-200 uppercase tracking-wider">
                              Unregistered B2C
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-medium">{sup.phone ? `+91 ${sup.phone.slice(-10)}` : '—'}</td>
                        <td className="py-4 px-5 text-slate-400 truncate max-w-[200px] font-medium">{sup.address || '—'}</td>
                        <td className="py-4 px-5 font-extrabold text-slate-800 tabular-nums">
                          ₹{Number(sup.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-medium">{dateStr}</td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => router.push(`/suppliers/${sup.id}`)}
                            className="bg-[#0050e8]/5 hover:bg-[#0050e8]/10 text-[#0050e8] font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors"
                          >
                            Ledger →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  onClick={() => router.push(`/suppliers/${sup.id}`)}
                  className="p-4 active:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase truncate max-w-[180px]">{sup.name}</h4>
                    <span className="block text-[10px] text-slate-400 font-medium mt-1">
                      {sup.gstin ? `GSTIN: ${sup.gstin}` : 'Unregistered Supplier'}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-800 tabular-nums">
                      ₹{Number(sup.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-[#0050e8] font-bold block mt-1">Ledger →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalCount > pageSize && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  ← Previous
                </button>
                <span className="text-[11px] font-bold text-slate-500">
                  Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))} ({totalCount} items)
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * pageSize >= totalCount}
                  className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setShowAddModal(false)}
            />
            
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 relative shadow-xl z-10 transform scale-100 transition-all duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0050e8]"></span>
                  Add New Supplier
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddSupplier} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder={placeholders.supplierName}
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0050e8] focus:ring-1 focus:ring-[#0050e8]/20 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0050e8] focus:ring-1 focus:ring-[#0050e8]/20 transition-all font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0050e8] focus:ring-1 focus:ring-[#0050e8]/20 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Address (Optional)
                  </label>
                  <textarea
                    placeholder="Enter supplier address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0050e8] focus:ring-1 focus:ring-[#0050e8]/20 transition-all"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl py-3 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold rounded-xl py-3 text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Supplier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
