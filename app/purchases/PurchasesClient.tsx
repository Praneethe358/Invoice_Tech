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
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header matched with profile logo format */}
        <div className="bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 -mt-6.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#1a6b3c]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1a6b3c] flex items-center justify-center text-white font-extrabold text-sm">
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Record inward supplies, track supplier bills, and manage Input Tax Credit (ITC)
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/purchases/new')}>
            + Record Purchase
          </Button>
        </div>

        {/* Vyapar style stats ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wide">Total Outward Outlay</span>
            <p className="text-xl font-extrabold text-[#16a34a] mt-2">
              ₹{stats.outlayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#1d4ed8] uppercase tracking-wide">Total ITC Earned</span>
            <p className="text-xl font-extrabold text-[#2563eb] mt-2">
              ₹{stats.gstClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wide">ITC Active Bills</span>
            <p className="text-xl font-extrabold text-[#d97706] mt-2">{stats.itcEligibleCount} Invoices</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">Total Purchase Invoices</span>
            <p className="text-xl font-extrabold text-gray-900 mt-2">{stats.billsCount}</p>
          </div>
        </div>

        {/* Filters and search container */}
        <div className="bg-white border border-[#e5e7eb] p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Search by invoice # or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e5e7eb] py-2 pl-9 pr-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
            />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex bg-gray-150 p-0.5 border border-gray-250">
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${filterPeriod === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterPeriod('this_month')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${filterPeriod === 'this_month' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                This Month
              </button>
              <button
                onClick={() => setFilterPeriod('last_month')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${filterPeriod === 'last_month' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
              >
                Last Month
              </button>
              <button
                onClick={() => setFilterPeriod('custom')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${filterPeriod === 'custom' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'}`}
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
                  className="bg-white border border-[#e5e7eb] px-2 py-1.5 text-[10px] font-bold text-[#111827]"
                />
                <span className="text-[10px] font-bold text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-[#e5e7eb] px-2 py-1.5 text-[10px] font-bold text-[#111827]"
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
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          />
        ) : (
          <div className="bg-white border border-[#e5e7eb] shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                <thead>
                  <tr className="bg-[#f9fafb] text-[#111827] font-bold border-b border-[#e5e7eb]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Subtotal (Base)</th>
                    <th className="py-3 px-4">Total GST</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">ITC Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredPurchases.map((p) => {
                    const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/55 transition-colors">
                        <td className="py-3.5 px-4 text-gray-900 font-bold">{dateStr}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{p.purchase_invoice_number}</td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900 uppercase truncate max-w-[200px]">{p.supplier_name}</td>
                        <td className="py-3.5 px-4 tabular-nums">₹{Number(p.subtotal).toFixed(2)}</td>
                        <td className="py-3.5 px-4 tabular-nums text-red-500">₹{Number(p.total_gst).toFixed(2)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900 tabular-nums">₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-4">
                          {p.itc_eligible ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd] uppercase">
                              Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              No ITC
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => router.push(`/purchases/${p.id}`)}
                            className="text-xs font-bold text-[#1a6b3c] hover:underline"
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
            <div className="md:hidden divide-y divide-[#f3f4f6]">
              {filteredPurchases.map((p) => {
                const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                });
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/purchases/${p.id}`)}
                    className="p-4 active:bg-gray-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{p.supplier_name}</span>
                        <span className="text-[10px] font-semibold text-gray-400 font-mono">#{p.purchase_invoice_number}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{dateStr} · Base Value: ₹{Number(p.subtotal).toFixed(2)}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-gray-900 tabular-nums">
                        ₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-block text-[8px] font-extrabold px-1.5 rounded mt-0.5 uppercase ${p.itc_eligible ? 'bg-[#e6f4ea] text-[#1a6b3c]' : 'bg-gray-150 text-gray-500'}`}>
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
