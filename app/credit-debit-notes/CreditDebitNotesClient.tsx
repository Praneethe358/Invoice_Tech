'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { Shop } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Props {
  shop: Shop;
  initialNotes: any[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function CreditDebitNotesClient({ shop, initialNotes }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<any[]>(initialNotes);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // New Invoice selector states for note creation flow
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Fetch invoices for selector modal
  useEffect(() => {
    if (showIssueModal) {
      const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
          const { data, error } = await supabase
            .from('invoices')
            .select('id, invoice_number, created_at, customer_name, customer_phone, total')
            .eq('shop_id', shop.id)
            .neq('status', 'draft')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false });
          if (!error && data) {
            setInvoicesList(data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }
  }, [showIssueModal, supabase, shop.id]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return invoicesList;
    const term = invoiceSearch.toLowerCase().trim();
    return invoicesList.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.customer_phone.includes(term) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(term))
    );
  }, [invoicesList, invoiceSearch]);

  // Parse notes to compute totals dynamically
  const stats = useMemo(() => {
    let creditTotal = 0;
    let debitTotal = 0;
    let creditCount = 0;
    let debitCount = 0;

    notes.forEach((note) => {
      const amt = Number(note.total || 0);
      if (note.note_type === 'credit') {
        creditTotal += amt;
        creditCount++;
      } else if (note.note_type === 'debit') {
        debitTotal += amt;
        debitCount++;
      }
    });

    return {
      creditTotal,
      debitTotal,
      creditCount,
      debitCount,
      totalCount: notes.length,
      netAdjustment: debitTotal - creditTotal,
    };
  }, [notes]);

  const fetchFilteredNotes = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/credit-debit-notes`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();

      let filtered = [...data];

      // Type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter((n) => n.note_type === typeFilter);
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        filtered = filtered.filter(
          (n) =>
            n.note_number.toLowerCase().includes(query) ||
            (n.invoices?.invoice_number && n.invoices.invoice_number.toLowerCase().includes(query)) ||
            n.customer_phone.includes(query) ||
            (n.reason_note && n.reason_note.toLowerCase().includes(query))
        );
      }

      // Date filter
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        filtered = filtered.filter((n) => n.note_date === todayStr);
      } else if (dateFilter === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter((n) => {
          const noteDate = new Date(n.note_date);
          return noteDate >= startOfWeek;
        });
      } else if (dateFilter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter((n) => {
          const noteDate = new Date(n.note_date);
          return noteDate >= startOfMonth;
        });
      } else if (dateFilter === 'custom' && startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter((n) => {
          const noteDate = new Date(n.note_date);
          let match = noteDate >= start;
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            match = match && noteDate <= end;
          }
          return match;
        });
      }

      setNotes(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, dateFilter, startDate, endDate]);

  useEffect(() => {
    fetchFilteredNotes();
  }, [typeFilter, search, dateFilter, startDate, endDate, fetchFilteredNotes]);

  // Clean label helper for reasons
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'sales_return': return 'Sales Return';
      case 'price_correction': return 'Price Correction';
      case 'damaged_goods': return 'Damaged Goods';
      case 'additional_charges': return 'Additional Charges';
      case 'other': return 'Other Reason';
      default: return reason.replace('_', ' ');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar initialShop={shop} />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Top Header Section (Desktop only) */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#0050e8] flex items-center justify-center text-white font-extrabold text-xs">
                  CN
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Credit & Debit Notes
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium text-left">
                Manage sales returns, refunds, adjustments, and price corrections.
              </p>
            </div>
          </div>
          {shop.gst_registered && (
            <div>
              <button
                onClick={() => {
                  setInvoiceSearch('');
                  setShowIssueModal(true);
                }}
                className="bg-[#0050e8] hover:bg-[#0043c4] text-white px-5 py-2.5 text-xs font-bold rounded-none transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Issue Note
              </button>
            </div>
          )}
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
              Credit & Debit Notes
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              Issue and track credit/debit notes for GST compliance.
            </p>
          </div>
          {shop.gst_registered && (
            <button
              onClick={() => {
                setInvoiceSearch('');
                setShowIssueModal(true);
              }}
              className="bg-[#0050e8] hover:bg-[#0043c4] text-white p-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* NOT GST REGISTERED WARNING ONBOARDING */}
        {!shop.gst_registered ? (
          <div className="bg-white rounded-3xl border border-[#e5e7eb] p-8 shadow-sm text-center max-w-lg mx-auto mt-8">
            <div className="w-16 h-16 bg-[#0050e8]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0050e8]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">GST Registration Required</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Credit and Debit Notes are tax documents. Under GST rules, they are issued to record adjustments, return of goods, or price differences. Enable GST registration in settings to access this module.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="bg-[#0050e8] hover:bg-[#0043c4] text-white px-6 py-3 font-bold text-xs rounded-xl shadow-xs transition-all w-full md:w-auto"
            >
              Go to Settings
            </button>
          </div>
        ) : (
          <>
            {/* Stats Dashboard section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white p-4 border border-[#e5e7eb] rounded-2xl md:rounded-none shadow-xs">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Credit Notes</p>
                <h3 className="text-lg font-extrabold text-emerald-600 mt-1 tabular-nums">
                  ₹{stats.creditTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stats.creditCount} notes issued</p>
              </div>
              <div className="bg-white p-4 border border-[#e5e7eb] rounded-2xl md:rounded-none shadow-xs">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Debit Notes</p>
                <h3 className="text-lg font-extrabold text-indigo-600 mt-1 tabular-nums">
                  ₹{stats.debitTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stats.debitCount} notes issued</p>
              </div>
              <div className="bg-white p-4 border border-[#e5e7eb] rounded-2xl md:rounded-none shadow-xs">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Net Adjustments</p>
                <h3 className={`text-lg font-extrabold mt-1 tabular-nums ${stats.netAdjustment >= 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                  {stats.netAdjustment >= 0 ? '+' : ''}₹{stats.netAdjustment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Debit net adjustments</p>
              </div>
              <div className="bg-white p-4 border border-[#e5e7eb] rounded-2xl md:rounded-none shadow-xs">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider">Total Ledger</p>
                <h3 className="text-lg font-extrabold text-[#111827] mt-1 tabular-nums">
                  {stats.totalCount}
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Documents tracked</p>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-[#e5e7eb] p-4 mb-6 shadow-xs space-y-4 rounded-2xl md:rounded-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search note no., invoice, customer phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl md:rounded-none py-2.5 pl-9 md:pl-10 pr-4 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]"
                  />
                  <svg className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                {/* Note Type Filter */}
                <div className="flex gap-1 bg-[#f9fafb] border border-[#e5e7eb] p-1 rounded-xl md:rounded-none overflow-x-auto scrollbar-none">
                  {([
                    { key: 'all', label: 'All Type' },
                    { key: 'credit', label: 'Credit Notes' },
                    { key: 'debit', label: 'Debit Notes' },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setTypeFilter(item.key)}
                      className={`flex-1 px-3 py-1.5 rounded-lg md:rounded-none text-[10px] font-extrabold capitalize transition-all whitespace-nowrap ${
                        typeFilter === item.key
                          ? 'bg-[#0050e8] text-white shadow-xs'
                          : 'text-[#4b5563] hover:text-[#111827]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Date range filter selector */}
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
                      className={`flex-1 px-3 py-1.5 rounded-lg md:rounded-none text-[10px] font-extrabold capitalize transition-all whitespace-nowrap ${
                        dateFilter === item.key
                          ? 'bg-[#0050e8] text-white shadow-xs'
                          : 'text-[#4b5563] hover:text-[#111827]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date range inputs */}
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

            {/* List & Details View */}
            {loading ? (
              <div className="text-center py-12 bg-white border border-[#e5e7eb]">
                <span className="text-xs font-bold text-gray-500">Updating credit & debit notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="4" />
                    <line x1="8" y1="2" x2="8" y2="4" />
                    <line x1="3" y1="8" x2="21" y2="8" />
                  </svg>
                }
                title="No notes found"
                description="Issue credit or debit notes directly against any sales invoice details page."
                actionLabel="View Sales Invoices"
                onAction={() => router.push('/invoices')}
              />
            ) : (
              <div className="bg-transparent md:bg-white border-0 md:border border-[#e5e7eb] rounded-none md:overflow-hidden mb-6 md:shadow-xs">
                {/* Desktop view Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Note Number</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Original Invoice</th>
                        <th className="py-3.5 px-4">Customer Phone</th>
                        <th className="py-3.5 px-4">Reason</th>
                        <th className="py-3.5 px-4 text-right">Tax Value</th>
                        <th className="py-3.5 px-4 text-right pr-6">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {notes.map((note) => {
                        const isCredit = note.note_type === 'credit';
                        const dateString = new Date(note.note_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });

                        return (
                          <tr
                            key={note.id}
                            onClick={() => setSelectedNote(note)}
                            className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                              {note.note_number}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-gray-500">
                              {dateString}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                isCredit 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}>
                                {note.note_type} note
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                              {note.invoices?.invoice_number || 'N/A'}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-gray-500">
                              +91 {note.customer_phone}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-gray-800">
                              {getReasonLabel(note.reason)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs font-semibold text-gray-500 tabular-nums">
                              ₹{Number(note.total_gst || 0).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs font-black text-gray-900 tabular-nums pr-6">
                              ₹{Number(note.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list view */}
                <div className="md:hidden flex flex-col gap-3 bg-transparent">
                  {notes.map((note) => {
                    const isCredit = note.note_type === 'credit';
                    const dateString = new Date(note.note_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className="bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-heading font-black text-gray-900 text-sm block">
                              {note.note_number}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">{dateString}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                            isCredit 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {note.note_type} note
                          </span>
                        </div>

                        <div className="space-y-1.5 border-t border-[#f3f4f6] pt-3 text-xs mb-3">
                          <div className="flex justify-between text-gray-500 font-medium">
                            <span>Original Invoice:</span>
                            <span className="text-gray-950 font-semibold">{note.invoices?.invoice_number || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-gray-500 font-medium">
                            <span>Customer:</span>
                            <span className="text-gray-950 font-semibold">+91 {note.customer_phone}</span>
                          </div>
                          <div className="flex justify-between text-gray-500 font-medium">
                            <span>Reason:</span>
                            <span className="text-gray-900 font-bold">{getReasonLabel(note.reason)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-[#f3f4f6] pt-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                          <span className="text-sm font-black text-gray-950 tabular-nums">
                            ₹{Number(note.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </PageTransition>

      {/* DETAILED VIEW MODAL */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            {/* Modal backdrop to dismiss on click outside */}
            <div className="absolute inset-0" onClick={() => setSelectedNote(null)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#f3f4f6] flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    {selectedNote.note_number}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase ${
                      selectedNote.note_type === 'credit'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {selectedNote.note_type}
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Issued Date: {new Date(selectedNote.note_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Scrollable details content */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* References Box */}
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Billed To:</span>
                    <span className="text-gray-950 font-bold">+91 {selectedNote.customer_phone}</span>
                  </div>
                  {selectedNote.customer_gstin && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Customer GSTIN:</span>
                      <span className="text-gray-950 font-mono font-bold">{selectedNote.customer_gstin}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Original Invoice:</span>
                    <span className="text-gray-950 font-bold">{selectedNote.invoices?.invoice_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Reason for Issue:</span>
                    <span className="text-gray-950 font-bold">{getReasonLabel(selectedNote.reason)}</span>
                  </div>
                  {selectedNote.reason_note && (
                    <div className="border-t border-[#e5e7eb] pt-2 mt-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Remarks / Remarks</p>
                      <p className="text-gray-700 italic font-medium">"{selectedNote.reason_note}"</p>
                    </div>
                  )}
                </div>

                {/* Items Adjusted details */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Adjusted Line Items</h4>
                  {selectedNote.cdn_items && selectedNote.cdn_items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNote.cdn_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-[#f3f4f6] pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold text-gray-950 uppercase">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              Qty: {item.qty} · Rate: ₹{item.price} {item.hsn_code ? `· HSN: ${item.hsn_code}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-gray-950 tabular-nums">
                              ₹{Number(item.line_total).toFixed(2)}
                            </p>
                            {item.gst_rate > 0 && (
                              <p className="text-[9px] text-[#0050e8] font-bold bg-[#e6efff] px-1 rounded-sm inline-block">
                                {item.gst_rate}% GST
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No item details saved.</p>
                  )}
                </div>

                {/* Financial breakdown values */}
                <div className="pt-4 border-t border-dashed border-[#e5e7eb] space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal (Base value)</span>
                    <span className="tabular-nums font-bold">₹{Number(selectedNote.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedNote.total_cgst) > 0 && (
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>CGST</span>
                      <span className="tabular-nums font-bold">₹{Number(selectedNote.total_cgst).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedNote.total_sgst) > 0 && (
                    <div className="flex justify-between text-gray-500 font-medium">
                      <span>SGST</span>
                      <span className="tabular-nums font-bold">₹{Number(selectedNote.total_sgst).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#f3f4f6] pt-3 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-gray-900">Total Adjusted Amount</span>
                    <span className="font-black text-gray-950 tabular-nums text-base">
                      ₹{Number(selectedNote.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 bg-gray-50 border-t border-[#f3f4f6] flex gap-3">
                {selectedNote.invoice_id && (
                  <button
                    onClick={() => {
                      router.push(`/invoice/${selectedNote.invoice_id}`);
                      setSelectedNote(null);
                    }}
                    className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    View Original Invoice
                  </button>
                )}
                <button
                  onClick={() => setSelectedNote(null)}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border border-[#e5e7eb] py-2.5 font-bold text-xs rounded-xl transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ISSUE NOTE MODAL */}
      <AnimatePresence>
        {showIssueModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setShowIssueModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden z-10 max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#f3f4f6] flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Issue Note: Select Invoice
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Select the original invoice you want to adjust
                  </p>
                </div>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Modal search bar */}
              <div className="p-4 border-b border-[#f3f4f6] bg-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by invoice number or customer phone..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              {/* Invoices list */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[40vh]">
                {loadingInvoices ? (
                  <div className="text-center py-8">
                    <span className="text-xs font-bold text-gray-500">Loading sales invoices...</span>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-xs font-semibold text-gray-400">No matching invoices found.</span>
                  </div>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const dateStr = new Date(invoice.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    return (
                      <div
                        key={invoice.id}
                        onClick={() => {
                          setShowIssueModal(false);
                          router.push(`/invoice/${invoice.id}?issueNote=true`);
                        }}
                        className="p-3 border border-[#e5e7eb] rounded-xl hover:border-[#0050e8] hover:bg-[#0050e8]/5 transition-all cursor-pointer flex justify-between items-center group text-left"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-[#0050e8] transition-colors">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                            {dateStr} · +91 {invoice.customer_phone}
                          </p>
                          {invoice.customer_name && (
                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                              {invoice.customer_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-900 tabular-nums">
                            ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <span className="text-[9px] font-bold text-[#0050e8] opacity-0 group-hover:opacity-100 transition-opacity">
                            Select →
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-[#f3f4f6] text-center">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-[#e5e7eb] py-2 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
