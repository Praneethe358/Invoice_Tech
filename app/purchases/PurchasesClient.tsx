'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { Purchase, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  initialPurchases: Purchase[];
}

export default function PurchasesClient({ shop, initialPurchases }: Props) {
  const router = useRouter();

  const [purchases] = useState<Purchase[]>(initialPurchases);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPurchases = useMemo(() => {
    let result = purchases;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.purchase_invoice_number.toLowerCase().includes(q) ||
          p.supplier_name.toLowerCase().includes(q)
      );
    }

    // Period Filter
    const today = new Date();
    if (filterPeriod === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      result = result.filter((p) => p.purchase_date >= start && p.purchase_date <= end);
    } else if (filterPeriod === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      result = result.filter((p) => p.purchase_date >= start && p.purchase_date <= end);
    } else if (filterPeriod === 'custom' && startDate && endDate) {
      result = result.filter((p) => p.purchase_date >= startDate && p.purchase_date <= endDate);
    }

    return result;
  }, [purchases, filterPeriod, startDate, endDate, searchQuery]);

  // Aggregated Stats
  const stats = useMemo(() => {
    let outlayTotal = 0;
    let cgstClaimed = 0;
    let sgstClaimed = 0;
    let itcEligibleCount = 0;

    filteredPurchases.forEach((p) => {
      outlayTotal += Number(p.total);
      if (p.itc_eligible) {
        cgstClaimed += Number(p.total_cgst);
        sgstClaimed += Number(p.total_sgst);
        itcEligibleCount++;
      }
    });

    return {
      outlayTotal,
      gstClaimed: cgstClaimed + sgstClaimed,
      itcEligibleCount,
      billsCount: filteredPurchases.length,
    };
  }, [filteredPurchases]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Page Title Header */}
        {/* Header matched with profile logo format - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e2e8f0] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-sm items-center justify-between gap-4 mb-8 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#2e7d32] flex items-center justify-center overflow-hidden shadow-md">
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
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Purchases Database · Record inward supplies, track bills & manage Input Tax Credit (ITC)
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/purchases/new')}
            className="bg-[#1a6b3c] hover:bg-[#155630] text-white rounded-xl py-2.5 px-5 flex items-center gap-2.5 font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Purchase
          </button>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
              Purchases Log
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              Record inward supplies, track bills & manage Input Tax Credit (ITC).
            </p>
          </div>
          <button
            onClick={() => router.push('/purchases/new')}
            className="bg-[#1a6b3c] hover:bg-[#155630] text-white rounded-xl py-2.5 px-5 flex items-center gap-2.5 font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Purchase
          </button>
        </div>

        {/* Vyapar style stats ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-l-4 border-emerald-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outward Outlay</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                ₹{stats.outlayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-blue-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total ITC Earned</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                ₹{stats.gstClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-amber-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ITC Active Bills</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.itcEligibleCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-555 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>

          <div className="bg-white border-l-4 border-slate-400 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.billsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters and search container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Search by invoice # or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-805 focus:outline-none focus:bg-white focus:border-[#1a6b3c]"
            />
            <svg className="absolute left-3.5 top-2.5 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-950'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPeriod('this_month')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterPeriod === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-950'}`}
              >
                This Month
              </button>
              <button
                onClick={() => setFilterPeriod('last_month')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterPeriod === 'last_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-950'}`}
              >
                Last Month
              </button>
              <button
                onClick={() => setFilterPeriod('custom')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${filterPeriod === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-950'}`}
              >
                Custom
              </button>
            </div>

            {filterPeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-800"
                />
                <span className="text-[10px] font-bold text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabular purchase log */}
        {filteredPurchases.length === 0 ? (
          <EmptyState
            title="No purchases recorded"
            description="Log supplier purchase bills to claim Input Tax Credit (ITC) and automatically update your catalog stock inventory."
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-350 animate-pulse">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-650">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Invoice #</th>
                    <th className="py-3.5 px-5">Supplier Name</th>
                    <th className="py-3.5 px-5">Subtotal (Base)</th>
                    <th className="py-3.5 px-5">Total GST</th>
                    <th className="py-3.5 px-5">Total Value</th>
                    <th className="py-3.5 px-5">ITC Status</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((p) => {
                    const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 text-slate-800 font-bold">{dateStr}</td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900">{p.purchase_invoice_number}</td>
                        <td className="py-4 px-5 font-bold text-slate-800 uppercase tracking-wide truncate max-w-[200px]">{p.supplier_name}</td>
                        <td className="py-4 px-5 tabular-nums">₹{Number(p.subtotal).toFixed(2)}</td>
                        <td className="py-4 px-5 tabular-nums text-red-500">₹{Number(p.total_gst).toFixed(2)}</td>
                        <td className="py-4 px-5 font-extrabold text-slate-800 tabular-nums">₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-5">
                          {p.itc_eligible ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                              Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-wider">
                              No ITC
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => router.push(`/purchases/${p.id}`)}
                            className="bg-[#1a6b3c]/5 hover:bg-[#1a6b3c]/10 text-[#1a6b3c] font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors"
                          >
                            View
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
              {filteredPurchases.map((p) => {
                const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                });
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/purchases/${p.id}`)}
                    className="p-4 active:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 uppercase truncate max-w-[150px]">{p.supplier_name}</span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">#{p.purchase_invoice_number}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{dateStr} · Base Value: ₹{Number(p.subtotal).toFixed(2)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-800 tabular-nums">
                        ₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-block text-[8px] font-extrabold px-1.5 rounded mt-1.5 uppercase ${p.itc_eligible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-500'}`}>
                        {p.itc_eligible ? 'ITC Eligible' : 'No ITC'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
