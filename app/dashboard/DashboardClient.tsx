'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop } from '@/lib/types';
import { getSubscriptionAccess } from '@/lib/subscription';

interface DashboardClientProps {
  shop: Shop;
  invoices: Invoice[];
  stats: {
    totalInvoices: number;
    thisMonth: number;
    failedInvoices: number;
    totalCustomers: number;
    totalOutstanding: number;
  };
}

export default function DashboardClient({
  shop,
  invoices: initialInvoices,
  stats,
}: DashboardClientProps) {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'saved' | 'sent' | 'cancelled' | 'failed' | 'unpaid' | 'partial' | 'paid' | 'unpaid_partial'>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch invoices on search or filter change
  const fetchInvoices = useCallback(async () => {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(12);

    if (statusFilter !== 'all') {
      if (['unpaid', 'partial', 'paid'].includes(statusFilter)) {
        query = query.eq('payment_status', statusFilter);
      } else if (statusFilter === 'unpaid_partial') {
        query = query.in('payment_status', ['unpaid', 'partial']);
      } else if (statusFilter === 'failed') {
        query = query.or('status.eq.failed,delivery_status.eq.failed');
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    if (debouncedSearch) {
      query = query.or(`invoice_number.ilike.%${debouncedSearch}%,customer_phone.ilike.%${debouncedSearch}%`);
    }

    const { data } = await query;
    const newInvoices = (data ?? []) as Invoice[];

    setInvoices(newInvoices);
    setHasMore(false);
  }, [debouncedSearch, statusFilter, shop.id, supabase]);

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

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
            Billing & Invoices
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Good {mounted ? (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening') : 'day'}! Track outstanding balances, payments, and sales.
          </p>
        </div>

        {/* Conditional rendering for stats or blocked state */}
        {(() => {
          const subAccess = getSubscriptionAccess({
            subscription_status: shop.subscription_status || 'trial',
            trial_ends_at: shop.trial_ends_at || null,
            subscription_ends_at: shop.subscription_ends_at || null,
          });

          const trialEnds = shop.trial_ends_at ? new Date(shop.trial_ends_at) : null;
          const daysRemaining = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
          const progressPercent = Math.min(100, Math.max(0, (daysRemaining / 14) * 100)); // Percentage of trial remaining

          if (!subAccess.canSendInvoices) {
            return (
              <div className="bg-white border border-red-200 p-8 mb-6 rounded-none text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl">
                  🔒
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-black text-slate-900">Your Subscription Has Ended</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your TruBill trial or subscription has expired. Upgrading takes less than 2 minutes and unlocks unlimited WhatsApp invoicing, inventory tracking, GST compliance, and more.
                  </p>
                </div>
                <div className="pt-2">
                  <a href="/upgrade">
                    <button className="bg-[#0050e8] hover:bg-[#0043c4] text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-800/10 active:scale-[0.98] min-h-[44px]">
                      Upgrade to TruBill Pro (₹299/mo)
                    </button>
                  </a>
                </div>
              </div>
            );
          }

          return (
            <>
              {/* Stat cards row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                <div
                  onClick={() => setStatusFilter('unpaid_partial')}
                  className="bg-[#fffbeb] border border-[#fef3c7] p-4 flex flex-col justify-between min-h-[90px] rounded-2xl md:rounded-none cursor-pointer hover:shadow-xs transition-shadow"
                >
                  <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wide">Receivables (To Collect)</span>
                  <p className="text-xl font-extrabold text-[#d97706] mt-2">₹{Number(stats.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 flex flex-col justify-between min-h-[90px] rounded-2xl md:rounded-none">
                  <span className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wide">Payables (To Pay)</span>
                  <p className="text-xl font-extrabold text-gray-400 mt-2">₹0.00</p>
                </div>
                <div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 flex flex-col justify-between min-h-[90px] rounded-2xl md:rounded-none">
                  <span className="text-[10px] font-bold text-[#0050e8] uppercase tracking-wide">Sales (This Month)</span>
                  <p className="text-xl font-extrabold text-[#16a34a] mt-2">₹{Number(stats.thisMonth || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col justify-between min-h-[90px] rounded-2xl md:rounded-none">
                  <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">Total Bills</span>
                  <p className="text-xl font-extrabold text-gray-900 mt-2">{stats.totalInvoices}</p>
                </div>
                <div
                  onClick={() => setStatusFilter('failed')}
                  className={`p-4 flex flex-col justify-between min-h-[90px] rounded-2xl md:rounded-none border cursor-pointer hover:shadow-xs transition-shadow col-span-2 md:col-span-1 ${stats.failedInvoices > 0 ? 'bg-[#fdf2f2] border-[#fde8e8]' : 'bg-white border-[#e5e7eb]'}`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${stats.failedInvoices > 0 ? 'text-[#9b1c1c]' : 'text-gray-500'}`}>Failed Deliveries</span>
                  <p className={`text-xl font-extrabold mt-2 ${stats.failedInvoices > 0 ? 'text-[#e02424]' : 'text-gray-900'}`}>{stats.failedInvoices}</p>
                </div>
              </div>

              {/* Trial progress bar underneath stats cards */}
              {shop.subscription_status === 'trial' && trialEnds && daysRemaining > 0 && (
                <div className="bg-white border border-[#e5e7eb] p-4 mb-6 rounded-2xl md:rounded-none space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#0050e8]">Free Trial Progress</span>
                    <span className="font-semibold text-slate-500">{daysRemaining} days remaining of 14-day trial</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-[#0050e8] h-full rounded-full"
                    />
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Filtered by Outstanding Reset Banner */}
        {statusFilter === 'unpaid_partial' && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-none p-3.5 mb-5">
            <p className="text-xs font-semibold text-amber-800">
              Filtered: Unpaid & Partially Paid invoices
            </p>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-800"
            >
              Clear
            </button>
          </div>
        )}

        {statusFilter === 'failed' && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-none p-3.5 mb-5">
            <p className="text-xs font-semibold text-red-800">
              Filtered: Invoices with Failed WhatsApp delivery
            </p>
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs font-bold text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <a
            href="/invoice/new"
            className="hidden md:flex bg-[#0050e8] hover:bg-[#0043c4] text-white p-4 flex-col justify-between h-24 transition-colors shadow-sm rounded-2xl md:rounded-none border border-[#0050e8]"
          >
            <div className="w-8 h-8 rounded-xl md:rounded-none bg-white/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Create Invoice (Sale)</p>
              <p className="text-[9px] text-[#d1ebd9] mt-0.5">Add new customer bill</p>
            </div>
          </a>
          <a
            href="/catalog"
            className="bg-white hover:bg-gray-50 border border-[#e5e7eb] p-4 flex flex-col justify-between h-24 transition-colors shadow-sm rounded-2xl md:rounded-none"
          >
            <div className="w-8 h-8 rounded-xl md:rounded-none bg-[#0050e8]/10 flex items-center justify-center text-[#0050e8]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26] leading-tight">Product Catalog</p>
              <p className="text-[9px] text-[#9ca3af] mt-0.5">Manage items & stock</p>
            </div>
          </a>
          <a
            href="/customers"
            className="bg-white hover:bg-gray-50 border border-[#e5e7eb] p-4 flex flex-col justify-between h-24 transition-colors shadow-sm rounded-2xl md:rounded-none"
          >
            <div className="w-8 h-8 rounded-xl md:rounded-none bg-[#0050e8]/10 flex items-center justify-center text-[#0050e8]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26] leading-tight">Customers</p>
              <p className="text-[9px] text-[#9ca3af] mt-0.5">Ledgers & details</p>
            </div>
          </a>
          <a
            href="/payments"
            className="bg-white hover:bg-gray-50 border border-[#e5e7eb] p-4 flex flex-col justify-between h-24 transition-colors shadow-sm rounded-2xl md:rounded-none col-span-2 md:col-span-1"
          >
            <div className="w-8 h-8 rounded-xl md:rounded-none bg-[#0050e8]/10 flex items-center justify-center text-[#0050e8]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26] leading-tight">Transactions</p>
              <p className="text-[9px] text-[#9ca3af] mt-0.5">Payments history</p>
            </div>
          </a>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by invoice or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-2xl md:rounded-none border border-[#e5e7eb] py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 text-[#9ca3af]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {([
              { key: 'all', label: 'All Invoices' },
              { key: 'draft', label: 'Draft' },
              { key: 'saved', label: 'Saved' },
              { key: 'sent', label: 'Sent' },
              { key: 'cancelled', label: 'Cancelled' },
              { key: 'failed', label: 'Failed' },
              { key: 'unpaid', label: 'Unpaid' },
              { key: 'partial', label: 'Partial' },
              { key: 'paid', label: 'Paid' },
            ] as const).map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-4 py-1.5 rounded-xl md:rounded-none text-xs font-bold capitalize transition-all shrink-0 ${
                  statusFilter === item.key
                    ? 'bg-[#0050e8] text-white shadow-xs'
                    : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Invoices header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Recent Invoices (Last 12)
          </h2>
          <Link href="/invoices" className="text-xs font-bold text-[#0050e8] hover:underline flex items-center gap-1">
            <span>View All Invoices</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title={searchQuery || statusFilter !== 'all' ? "No matching invoices" : "No invoices yet"}
            description={searchQuery || statusFilter !== 'all' ? "Try adjusting your search or filters." : "Create your first invoice and send it to your customer on WhatsApp."}
            actionLabel={searchQuery || statusFilter !== 'all' ? "Clear Filters" : "Create Invoice"}
            onAction={() => {
              if (searchQuery || statusFilter !== 'all') {
                setSearchQuery('');
                setStatusFilter('all');
              } else {
                window.location.href = '/invoice/new';
              }
            }}
          />
        ) : (
          <div className="bg-transparent md:bg-white border-0 md:border border-[#e5e7eb] rounded-none md:overflow-hidden mb-6 md:shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Bill No / Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Delivery Status</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-right">Paid Amount</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Payment Status</th>
                    <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {invoices.map((invoice) => {
                    const balanceDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
                    const dateString = new Date(invoice.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                      const deliveryFailed = invoice.delivery_status === 'failed';
                      const isDraft = invoice.status === 'draft';
                      const isSaved = invoice.status === 'saved';
                      const isSent = invoice.status === 'sent';
                      const isCancelled = invoice.status === 'cancelled';
                      const isFailed = invoice.status === 'failed';

                      let badgeBg = 'bg-gray-50 text-gray-600';
                      let badgeDot = 'bg-gray-400';
                      let badgeLabel: string = invoice.status;

                      if (deliveryFailed || isFailed) {
                        badgeBg = 'bg-amber-50 text-amber-600';
                        badgeDot = 'bg-amber-500';
                        badgeLabel = 'Failed';
                      } else if (isDraft) {
                        badgeBg = 'bg-slate-100 text-slate-600';
                        badgeDot = 'bg-slate-400';
                        badgeLabel = 'Draft';
                      } else if (isSaved) {
                        badgeBg = 'bg-blue-50 text-blue-600';
                        badgeDot = 'bg-blue-500';
                        badgeLabel = 'Saved';
                      } else if (isSent) {
                        badgeBg = 'bg-emerald-50 text-emerald-600';
                        badgeDot = 'bg-emerald-500';
                        badgeLabel = 'Sent';
                      } else if (isCancelled) {
                        badgeBg = 'bg-red-50 text-red-600';
                        badgeDot = 'bg-red-500';
                        badgeLabel = 'Cancelled';
                      }

                      return (
                        <tr
                          key={invoice.id}
                          onClick={() => {
                            if (isDraft) {
                              window.location.href = `/invoice/new?draftId=${invoice.id}`;
                            } else {
                              window.location.href = `/invoice/${invoice.id}`;
                            }
                          }}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-gray-900 block text-xs">{invoice.invoice_number}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{dateString}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {invoice.customer_name && (
                              <span className="font-semibold text-gray-900 block text-xs uppercase">{invoice.customer_name}</span>
                            )}
                            <span className="text-[10px] text-gray-400 font-medium">+91 {invoice.customer_phone}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs font-semibold text-gray-900 tabular-nums">
                            ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs font-semibold text-emerald-600 tabular-nums">
                            ₹{Number(invoice.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3.5 px-4 text-right text-xs font-semibold tabular-nums ${balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isDraft || isCancelled ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : (
                              <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-none uppercase ${
                                invoice.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                                invoice.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {invoice.payment_status || 'unpaid'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => {
                                  if (isDraft) {
                                    window.location.href = `/invoice/new?draftId=${invoice.id}`;
                                  } else {
                                    window.location.href = `/invoice/${invoice.id}`;
                                  }
                                }}
                                className="text-xs font-bold text-[#0050e8] hover:underline"
                              >
                                {isDraft ? 'Edit' : 'Details'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3 bg-transparent">
              {invoices.map((invoice, i) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  index={i}
                />
              ))}
            </div>


          </div>
        )}
      </PageTransition>
    </div>
  );
}
