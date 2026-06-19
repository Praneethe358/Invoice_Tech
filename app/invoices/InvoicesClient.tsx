'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import InvoiceCard from '@/components/InvoiceCard';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  initialInvoices: Invoice[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function InvoicesClient({ shop, initialInvoices }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Fetch filtered invoices from Supabase
  const fetchFilteredInvoices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    // Status filter
    if (statusFilter !== 'all') {
      if (['unpaid', 'partial', 'paid'].includes(statusFilter)) {
        query = query.eq('payment_status', statusFilter);
      } else if (statusFilter === 'failed') {
        query = query.or('status.eq.failed,delivery_status.eq.failed');
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    // Search query
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    // Date filters
    const now = new Date();
    if (dateFilter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', startOfToday);
    } else if (dateFilter === 'week') {
      // Start of week (Sunday or Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfWeek.toISOString());
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', startOfMonth);
    } else if (dateFilter === 'custom' && startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('created_at', start.toISOString());
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }
    }

    const { data, error } = await query;
    if (!error && data) {
      setInvoices(data as Invoice[]);
    }
    setLoading(false);
  }, [supabase, shop.id, search, statusFilter, dateFilter, startDate, endDate]);

  useEffect(() => {
    fetchFilteredInvoices();
  }, [search, statusFilter, dateFilter, startDate, endDate, fetchFilteredInvoices]);

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
                All Invoices
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium text-left">
                Manage and filter all sales records for {shop.name}
              </p>
            </div>
          </div>
          <div>
            <Link
              href="/invoice/new"
              className="bg-[#0050e8] hover:bg-[#0043c4] text-white px-5 py-2.5 text-xs font-bold rounded-none transition-colors inline-flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
            All Invoices
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Filter sales records by status & date range.
          </p>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white border border-[#e5e7eb] p-4 mb-6 shadow-xs space-y-4 rounded-2xl md:rounded-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search invoice number, phone, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl md:rounded-none py-2.5 pl-10 pr-4 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8] focus:ring-0"
              />
              <svg className="absolute left-3.5 top-3.5 text-[#9ca3af]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Date Range Selection */}
            <div className="flex gap-1 bg-[#f9fafb] border border-[#e5e7eb] p-1 rounded-xl md:rounded-none overflow-x-auto scrollbar-none">
              {([
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'custom', label: 'Custom' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDateFilter(item.key)}
                  className={`px-3 py-1.5 rounded-lg md:rounded-none text-[10px] font-extrabold capitalize transition-all whitespace-nowrap ${
                    dateFilter === item.key
                      ? 'bg-[#0050e8] text-white shadow-xs'
                      : 'text-[#4b5563] hover:text-[#111827]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl md:rounded-none py-2.5 px-3 text-xs font-semibold text-[#4b5563] focus:outline-none focus:border-[#0050e8] flex items-center justify-between cursor-pointer"
              >
                <span>
                  {(() => {
                    switch (statusFilter) {
                      case 'all': return 'All Payment & Delivery Statuses';
                      case 'draft': return 'Drafts Only';
                      case 'saved': return 'Saved (Awaiting Delivery)';
                      case 'sent': return 'Sent (WhatsApp Delivered)';
                      case 'failed': return 'Delivery Failed';
                      case 'paid': return 'Paid';
                      case 'partial': return 'Partially Paid';
                      case 'unpaid': return 'Unpaid Only';
                      default: return 'Select Status';
                    }
                  })()}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {dropdownOpen && (
                <>
                  {/* Backdrop to close dropdown on click outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-xl md:rounded-none shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                    {[
                      { value: 'all', label: 'All Payment & Delivery Statuses' },
                      { value: 'draft', label: 'Drafts Only' },
                      { value: 'saved', label: 'Saved (Awaiting Delivery)' },
                      { value: 'sent', label: 'Sent (WhatsApp Delivered)' },
                      { value: 'failed', label: 'Delivery Failed' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'partial', label: 'Partially Paid' },
                      { value: 'unpaid', label: 'Unpaid Only' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 flex items-center justify-between cursor-pointer ${
                          statusFilter === opt.value ? 'text-[#0050e8] bg-[#0050e8]/5' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                        {statusFilter === opt.value && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#0050e8]">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Date Inputs (only if custom date selected) */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-dashed border-[#e5e7eb]">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl md:rounded-none py-2 px-3 text-xs font-semibold text-[#111827] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl md:rounded-none py-2 px-3 text-xs font-semibold text-[#111827] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Invoice Feed */}
        {loading ? (
          <div className="text-center py-12 bg-white border border-[#e5e7eb]">
            <span className="text-xs font-bold text-gray-500">Updating invoices feed...</span>
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="No matching invoices found"
            description="Adjust your date, status, or search filters to locate the record."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFilter('all');
              setStartDate('');
              setEndDate('');
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
                            router.push(`/invoice/new?draftId=${invoice.id}`);
                          } else {
                            router.push(`/invoice/${invoice.id}`);
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
                                  router.push(`/invoice/new?draftId=${invoice.id}`);
                                } else {
                                  router.push(`/invoice/${invoice.id}`);
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
