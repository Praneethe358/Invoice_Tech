'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  payments: any[];
}

export default function PaymentsClient({ shop, payments: initialPayments }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [payments, setPayments] = useState(initialPayments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Mobile custom dropdown states
  const [mobileDateOpen, setMobileDateOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  const handleDelete = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete payment');
      }

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setDeletingId(null);
      showToast('Payment transaction deleted', 'success');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting payment', 'error');
    }
  };

  // Base list filtered by Search & Date (used for dynamic stats calculation)
  const dateAndSearchFiltered = useMemo(() => {
    let result = [...payments];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const custName = p.invoices?.customer_name || '';
        const phone = p.customer_phone || '';
        const invNum = p.invoices?.invoice_number || '';
        const note = p.note || '';
        return (
          custName.toLowerCase().includes(q) ||
          phone.includes(q) ||
          invNum.toLowerCase().includes(q) ||
          note.toLowerCase().includes(q)
        );
      });
    }

    // Date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      result = result.filter((p) => {
        const paidTime = new Date(p.paid_at).getTime();
        if (dateFilter === 'today') {
          return paidTime >= todayStart;
        }
        if (dateFilter === 'yesterday') {
          return paidTime >= yesterdayStart && paidTime < todayStart;
        }
        if (dateFilter === 'week') {
          return paidTime >= sevenDaysAgo;
        }
        if (dateFilter === 'month') {
          return paidTime >= startOfMonth;
        }
        return true;
      });
    }

    return result;
  }, [payments, search, dateFilter]);

  // Calculations
  const totalCollected = dateAndSearchFiltered.reduce((sum, p) => sum + Number(p.amount), 0);
  const upiCollected = dateAndSearchFiltered.filter(p => p.payment_method === 'upi').reduce((sum, p) => sum + Number(p.amount), 0);
  const cashCollected = dateAndSearchFiltered.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);

  // Fully Filtered & Sorted Payments List
  const filtered = useMemo(() => {
    let result = [...dateAndSearchFiltered];

    // Method filter
    if (methodFilter !== 'all') {
      result = result.filter((p) => p.payment_method === methodFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime();
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount) - Number(b.amount);
      }
      if (sortBy === 'name-asc') {
        const nameA = a.invoices?.customer_name || 'Walk-in Customer';
        const nameB = b.invoices?.customer_name || 'Walk-in Customer';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [dateAndSearchFiltered, methodFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
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
                Collections Ledger & History · {payments.length} transaction{payments.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight font-heading uppercase">
              Collections Feed
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Transaction history & ledger
            </p>
          </div>
          <div className="bg-[#0050e8]/10 text-[#0050e8] text-[10px] font-bold px-3 py-1.5 rounded-lg border border-[#0050e8]/20 shrink-0">
            {payments.length} txn{payments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Stats Row - Desktop Only */}
        <div className="hidden md:grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Collected</p>
            <p className="text-lg font-black text-emerald-600 mt-2">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">UPI Collected</p>
            <p className="text-lg font-black text-indigo-600 mt-2">₹{upiCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cash Collected</p>
            <p className="text-lg font-black text-amber-600 mt-2">₹{cashCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Mobile Stats Card */}
        <div className="block md:hidden bg-gradient-to-br from-[#0050e8] to-[#003cb8] rounded-2xl p-5 text-white shadow-md mb-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
            </svg>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">Total Collected</p>
            <p className="text-2xl font-black mt-1.5 tracking-tight font-heading">
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-300" />
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/70">UPI</p>
              </div>
              <p className="text-sm font-extrabold mt-0.5">
                ₹{upiCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-white/70">Cash</p>
              </div>
              <p className="text-sm font-extrabold mt-0.5">
                ₹{cashCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filters - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 mb-6 bg-white border border-[#e5e7eb] p-3 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search customer, phone, invoice, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-7 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-none text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8] focus:ring-0"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-1 border-r border-[#e5e7eb] pr-3">
            {(['all', 'cash', 'upi', 'bank_transfer', 'other'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setMethodFilter(method)}
                className={`px-3 py-1.5 rounded-none text-[10px] font-extrabold capitalize transition-all whitespace-nowrap border ${
                  methodFilter === method
                    ? 'bg-[#0050e8] border-[#0050e8] text-white shadow-xs'
                    : 'bg-white border-transparent text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Date Filter Select */}
          <div className="flex items-center gap-1.5 border-r border-[#e5e7eb] pr-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-[#e5e7eb] text-xs font-bold py-1.5 px-2.5 text-slate-700 focus:outline-none focus:border-[#0050e8] cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#e5e7eb] text-xs font-bold py-1.5 px-2.5 text-slate-700 focus:outline-none focus:border-[#0050e8] cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
              <option value="name-asc">Customer Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filters - Mobile Only */}
        <div className="flex md:hidden flex-col gap-3.5 mb-6">
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
              placeholder="Search by customer, phone, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-[#e5e7eb] rounded-xl text-xs font-bold focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all placeholder-slate-400 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Payment Method Pills Scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
            {(['all', 'cash', 'upi', 'bank_transfer', 'other'] as const).map((method) => {
              const isActive = methodFilter === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMethodFilter(method)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all whitespace-nowrap border cursor-pointer ${
                    isActive
                      ? 'bg-[#0050e8] text-white border-[#0050e8] shadow-xs'
                      : 'bg-white text-slate-500 border-[#e5e7eb] hover:bg-slate-50'
                  }`}
                >
                  {method === 'all' ? 'All Transactions' : method.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Mobile Selects: Date Filter & Sort By */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMobileDateOpen(!mobileDateOpen);
                  setMobileSortOpen(false);
                }}
                className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-[11px] font-extrabold flex items-center justify-between min-h-[40px] text-slate-650 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  📅 {dateFilter === 'all' && 'All Time'}
                  {dateFilter === 'today' && 'Today'}
                  {dateFilter === 'yesterday' && 'Yesterday'}
                  {dateFilter === 'week' && 'Last 7 Days'}
                  {dateFilter === 'month' && 'This Month'}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${mobileDateOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {mobileDateOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileDateOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 max-h-[220px] overflow-y-auto">
                    {[
                      { val: 'all', label: 'All Time' },
                      { val: 'today', label: 'Today' },
                      { val: 'yesterday', label: 'Yesterday' },
                      { val: 'week', label: 'Last 7 Days' },
                      { val: 'month', label: 'This Month' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setDateFilter(item.val);
                          setMobileDateOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${
                          dateFilter === item.val ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-650'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort By Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setMobileSortOpen(!mobileSortOpen);
                  setMobileDateOpen(false);
                }}
                className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2.5 text-[11px] font-extrabold flex items-center justify-between min-h-[40px] text-slate-650 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  ⇅ {sortBy === 'date-desc' && 'Newest First'}
                  {sortBy === 'date-asc' && 'Oldest First'}
                  {sortBy === 'amount-desc' && 'Amt: High to Low'}
                  {sortBy === 'amount-asc' && 'Amt: Low to High'}
                  {sortBy === 'name-asc' && 'Name: A to Z'}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${mobileSortOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {mobileSortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileSortOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-xl shadow-lg z-50 py-1 max-h-[220px] overflow-y-auto">
                    {[
                      { val: 'date-desc', label: 'Newest First' },
                      { val: 'date-asc', label: 'Oldest First' },
                      { val: 'amount-desc', label: 'Amount: High to Low' },
                      { val: 'amount-asc', label: 'Amount: Low to High' },
                      { val: 'name-asc', label: 'Customer Name (A-Z)' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setSortBy(item.val);
                          setMobileSortOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${
                          sortBy === item.val ? 'text-[#0050e8] bg-[#0050e8]/5 font-bold' : 'text-slate-655'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List of Payments */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="10" x2="12" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            }
            title="No collections recorded"
            description="Payments registered against invoices will appear in this feed."
          />
        ) : (
          <div className="bg-transparent md:bg-white md:border md:border-[#e5e7eb] md:rounded-none overflow-hidden mb-6 md:shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer Name / Phone</th>
                    <th className="py-3.5 px-4">Invoice No</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Note</th>
                    <th className="py-3.5 px-4 text-center">Paid At</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map((p) => {
                    const isDeleting = deletingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900 block text-xs uppercase">{p.invoices?.customer_name || 'Walk-in Customer'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">+91 {p.customer_phone.slice(-10)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => router.push(`/invoice/${p.invoice_id}`)}
                            className="text-xs font-bold text-[#0050e8] hover:underline"
                          >
                            {p.invoices?.invoice_number}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-none uppercase bg-gray-50 text-gray-600 border border-gray-200">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500 font-medium max-w-[200px] truncate">
                          {p.note ? `"${p.note}"` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[10px] text-gray-400 font-medium" suppressHydrationWarning>
                          {new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-semibold text-emerald-600 tabular-nums">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6">
                          {isDeleting ? (
                            <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold">
                              <span className="text-gray-400">Sure?</span>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="text-red-600 hover:text-red-850"
                              >
                                Yes
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(p.id)}
                              className="text-[10px] font-bold text-red-600 hover:underline transition-colors uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-3.5">
              {filtered.map((p) => {
                const isDeleting = deletingId === p.id;

                // Color and Icon for payment method
                let methodColorClass = 'bg-slate-100 text-slate-700 border-slate-200';
                let iconSvg = (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                );

                if (p.payment_method === 'cash') {
                  methodColorClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  iconSvg = (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                      <line x1="6" y1="12" x2="6.01" y2="12" />
                      <line x1="18" y1="12" x2="18.01" y2="12" />
                    </svg>
                  );
                } else if (p.payment_method === 'upi') {
                  methodColorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  iconSvg = (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  );
                } else if (p.payment_method === 'bank_transfer') {
                  methodColorClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  iconSvg = (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                    </svg>
                  );
                }

                return (
                  <div key={p.id} className="bg-white rounded-2xl p-4.5 border border-slate-150 shadow-xs flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 max-w-[70%]">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight block truncate">
                          {p.invoices?.customer_name || 'Walk-in Customer'}
                        </span>
                        {p.customer_phone && (
                          <span className="text-[10px] text-slate-400 font-bold block">
                            +91 {p.customer_phone.slice(-10)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600 block tabular-nums">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5" suppressHydrationWarning>
                          {new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        {/* Method badge */}
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-lg border uppercase tracking-wider ${methodColorClass}`}>
                          {iconSvg}
                          {p.payment_method?.replace('_', ' ')}
                        </span>
                        {/* Invoice Number Link */}
                        {p.invoices?.invoice_number && (
                          <button
                            key={p.invoice_id}
                            type="button"
                            onClick={() => router.push(`/invoice/${p.invoice_id}`)}
                            className="bg-[#0050e8]/5 text-[#0050e8] hover:bg-[#0050e8]/10 text-[9px] font-extrabold px-2 py-1 rounded-lg border border-[#0050e8]/10 transition-colors"
                          >
                            📄 {p.invoices?.invoice_number}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-200">
                            <span>Sure?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="text-red-700 hover:text-red-900 underline cursor-pointer"
                            >
                              Yes
                            </button>
                            <span className="text-red-300">|</span>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(p.id)}
                            className="text-[9px] font-extrabold text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider px-2.5 py-1 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {p.note && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10px] text-slate-500 font-medium leading-relaxed">
                        <span className="font-bold text-slate-400 block uppercase text-[8px] tracking-wider mb-0.5">Note</span>
                        "{p.note}"
                      </div>
                    )}
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
