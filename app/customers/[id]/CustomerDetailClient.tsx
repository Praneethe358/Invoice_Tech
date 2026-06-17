'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerTag, Invoice, Shop, Payment } from '@/lib/types';

interface Props {
  customer: Customer;
  shop: Shop;
  invoices: Invoice[];
}

export default function CustomerDetailClient({ customer: initial, shop, invoices }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(initial);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(initial.name);
  const [savingName, setSavingName] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // GSTIN states
  const [editingGstin, setEditingGstin] = useState(false);
  const [gstinValue, setGstinValue] = useState(initial.gstin || '');
  const [savingGstin, setSavingGstin] = useState(false);


  // Bulk sending state
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  // Tabs and Ledger State
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices'>('overview');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [ledgerPeriod, setLedgerPeriod] = useState<'all' | 'this_month' | 'last_month' | 'custom'>('all');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit] = useState(10);
  const [totalLedgerEntries, setTotalLedgerEntries] = useState(0);
  const [productSummary, setProductSummary] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState({
    total_purchases: 0,
    total_paid: 0,
    outstanding_amount: 0,
    invoice_count: 0,
    avg_invoice_value: 0
  });

  useEffect(() => {
    async function fetchLedger() {
      if (activeTab !== 'ledger') return;
      setLoadingLedger(true);
      try {
        let url = `/api/customers/${customer.id}/ledger?page=${ledgerPage}&limit=${ledgerLimit}&period=${ledgerPeriod}`;
        if (ledgerPeriod === 'custom') {
          if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
          if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setLedgerEntries(json.entries);
          setTotalLedgerEntries(json.total_count);
          setProductSummary(json.product_summary || []);
          setLedgerSummary({
            total_purchases: json.summary_cards.total_purchases,
            total_paid: json.summary_cards.total_paid,
            outstanding_amount: json.summary_cards.outstanding_amount,
            invoice_count: json.summary_cards.invoice_count,
            avg_invoice_value: json.summary_cards.avg_invoice_value,
          });
        }
      } catch (err) {
        console.error('Failed to load customer ledger:', err);
      } finally {
        setLoadingLedger(false);
      }
    }
    fetchLedger();
  }, [activeTab, customer.id, ledgerPeriod, ledgerStartDate, ledgerEndDate, ledgerPage, ledgerLimit]);

  const handleExportCSV = async () => {
    try {
      showToast('Preparing CSV statement...', 'success');
      let url = `/api/customers/${customer.id}/ledger?page=1&limit=10000&period=${ledgerPeriod}&log_export=true&export_type=csv`;
      if (ledgerPeriod === 'custom') {
        if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
        if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch ledger for CSV export');
      const data = await res.json();
      
      // Construct CSV content
      let csv = '\uFEFF'; // Excel UTF-8 BOM
      
      // Section 1: Title and Metadata
      csv += `"CUSTOMER LEDGER STATEMENT"\n`;
      csv += `"Customer Name:","${customer.name.replace(/"/g, '""')}"\n`;
      csv += `"Phone:","+91 ${customer.phone.slice(-10)}"\n`;
      csv += `"GSTIN:","${customer.gstin || 'None'}"\n`;
      csv += `"Period:","${ledgerPeriod.toUpperCase()}${ledgerPeriod === 'custom' ? ` (${ledgerStartDate} to ${ledgerEndDate})` : ''}"\n`;
      csv += `"Statement Date:","${new Date().toLocaleDateString('en-IN')}"\n\n`;
      
      // Section 2: Summary metrics
      csv += `"LEDGER OVERVIEW SUMMARY"\n`;
      csv += `"Total Billed (Sales)","Total Received (Paid)","Outstanding Balance","Total Invoices","Avg Invoice Value"\n`;
      csv += `"${data.summary_cards.total_purchases}","${data.summary_cards.total_paid}","${data.summary_cards.outstanding_amount}","${data.summary_cards.invoice_count}","${data.summary_cards.avg_invoice_value}"\n\n`;
      
      // Section 3: Ledger Transactions
      csv += `"TRANSACTION LEDGER"\n`;
      csv += `"Date","Particulars","Debit (Sales)","Credit (Paid)"\n`;
      
      data.entries.forEach((e: any) => {
        const dateStr = new Date(e.entry_date).toLocaleDateString('en-IN');
        csv += `"${dateStr}","${e.particulars.replace(/"/g, '""')}","${e.debit_amount || 0}","${e.credit_amount || 0}"\n`;
      });
      csv += `\n`;
      
      // Section 4: Product analytics
      csv += `"PRODUCT PURCHASE HISTORICAL SUMMARY"\n`;
      csv += `"Product Name","Quantity Purchased","Total Revenue Generated"\n`;
      data.product_summary.forEach((p: any) => {
        csv += `"${p.name.replace(/"/g, '""')}","${p.total_qty}","${p.total_revenue}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `${customer.name.replace(/\s+/g, '_')}_Statement_${ledgerPeriod}.csv`;
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV statement downloaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportPDF = () => {
    let url = `/api/customers/${customer.id}/pdf?period=${ledgerPeriod}`;
    if (ledgerPeriod === 'custom') {
      if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
      if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
    }
    window.open(url, '_blank');
    showToast('Generating PDF statement...', 'success');
  };


  const handleSaveName = async () => {
    const trimmed = nameValue.trim().toUpperCase();
    if (!trimmed || trimmed === customer.name.toUpperCase()) {
      setNameValue(customer.name.toUpperCase());
      setEditingName(false);
      return;
    }

    setSavingName(true);
    const { error } = await supabase
      .from('customers')
      .update({ name: trimmed })
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to update name', 'error');
      setNameValue(customer.name);
    } else {
      setCustomer(prev => ({ ...prev, name: trimmed }));
      setNameValue(trimmed);
      showToast('Name updated', 'success');
    }
    setSavingName(false);
    setEditingName(false);
  };

  const handleSaveGstin = async () => {
    const trimmed = gstinValue.trim().toUpperCase();
    if (trimmed === (customer.gstin || '')) {
      setEditingGstin(false);
      return;
    }

    if (trimmed && trimmed.length !== 15) {
      showToast('GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setSavingGstin(true);
    const { error } = await supabase
      .from('customers')
      .update({ gstin: trimmed || null })
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to update GSTIN', 'error');
      setGstinValue(customer.gstin || '');
    } else {
      setCustomer(prev => ({ ...prev, gstin: trimmed || null }));
      setGstinValue(trimmed);
      showToast('GSTIN updated', 'success');
    }
    setSavingGstin(false);
    setEditingGstin(false);
  };


  const handleToggleTag = async () => {
    const newTag: CustomerTag = customer.tag === 'vip' ? 'regular' : 'vip';
    const oldTag = customer.tag;

    // Optimistic update
    setCustomer(prev => ({ ...prev, tag: newTag }));
    setSavingTag(true);

    const { error } = await supabase
      .from('customers')
      .update({ tag: newTag })
      .eq('id', customer.id);

    if (error) {
      setCustomer(prev => ({ ...prev, tag: oldTag }));
      showToast('Failed to update tag', 'error');
    } else {
      showToast(`Marked as ${newTag.toUpperCase()}`, 'success');
    }
    setSavingTag(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to remove customer', 'error');
    } else {
      showToast('Customer removed', 'success');
      router.push('/customers');
    }
  };

  const handleSendBulkReminders = async () => {
    if (outstandingInvoices.length === 0) return;
    setBulkSending(true);
    let successCount = 0;

    for (let i = 0; i < outstandingInvoices.length; i++) {
      const inv = outstandingInvoices[i];
      setBulkProgress(`Sending ${i + 1} of ${outstandingInvoices.length}...`);

      try {
        const res = await fetch(`/api/invoices/${inv.id}/remind`, {
          method: 'POST',
        });
        if (res.ok) {
          successCount++;
        }
        // Wait 500ms between calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to send reminder for invoice ${inv.id}:`, err);
      }
    }

    showToast(`${successCount} reminder${successCount !== 1 ? 's' : ''} sent ✓`, 'success');
    setBulkSending(false);
    setBulkProgress('');
    router.refresh();
  };

  const lastInvoiceDate = invoices.length > 0
    ? new Date(invoices[0].created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Never';

  const statItems = [
    { label: 'Total Invoices', value: customer.total_invoices },
    { label: 'Total Spent', value: `₹${Number(customer.total_spent).toLocaleString('en-IN')}` },
    { label: 'Last Billed', value: lastInvoiceDate },
  ];

  const outstandingInvoices = invoices.filter(
    (inv) => inv.payment_status === 'unpaid' || inv.payment_status === 'partial'
  );

  const totalOutstanding = outstandingInvoices.reduce((sum: number, inv) => {
    const total = Number(inv.total);
    const amountPaid = Number(inv.amount_paid || 0);
    return sum + (total - amountPaid);
  }, 0);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Page Title Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors mr-1 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight font-heading uppercase">
                Customer Ledger
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                Account statements & Transaction logs for {customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/customers')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer self-start md:self-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Customers
          </button>
        </div>

        {/* Customer Header */}
        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309]'
                : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
            }`}>
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  disabled={savingName}
                  autoFocus
                  className="text-xl font-extrabold text-[#111827] bg-transparent border-b-2 border-[#1a6b3c] outline-none w-full pb-1"
                />
              ) : (
                <h1
                  onClick={() => {
                    setEditingName(true);
                    setTimeout(() => nameInputRef.current?.focus(), 50);
                  }}
                  className="text-xl font-extrabold text-[#111827] cursor-text hover:text-[#1a6b3c] transition-colors uppercase"
                  title="Click to edit"
                >
                  {customer.name}
                </h1>
              )}
              <p className="text-sm text-[#6b7280] mt-1">+91 {customer.phone.slice(-10)}</p>
              {editingGstin ? (
                <input
                  type="text"
                  value={gstinValue}
                  onChange={(e) => setGstinValue(e.target.value.toUpperCase())}
                  onBlur={handleSaveGstin}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGstin()}
                  disabled={savingGstin}
                  placeholder="ENTER GSTIN (15 CHARS)"
                  autoFocus
                  className="text-xs font-semibold text-[#111827] bg-transparent border-b-2 border-[#1a6b3c] outline-none pb-0.5 mt-1.5 w-full max-w-[200px]"
                />
              ) : (
                <p
                  onClick={() => setEditingGstin(true)}
                  className="text-xs font-semibold text-[#6b7280] mt-1.5 cursor-pointer hover:text-[#1a6b3c]"
                >
                  GSTIN: <span className="font-mono text-xs text-[#111827] underline decoration-dotted">{customer.gstin || 'None (Click to add)'}</span>
                </p>
              )}

            </div>
          </div>

          {/* Tag Toggle */}
          <button
            onClick={handleToggleTag}
            disabled={savingTag}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309] hover:bg-[#fde68a]'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            {savingTag ? 'Saving...' : customer.tag === 'vip' ? '★ VIP — Tap to make Regular' : 'Regular — Tap to make VIP ★'}
          </button>
        </div>
            {/* Tab Selection Row */}
        <div className="flex bg-white/60 backdrop-blur-sm border border-[#e5e7eb] p-1.5 rounded-2xl mb-6 gap-1">
          {(['overview', 'ledger', 'invoices'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#1a6b3c] text-white shadow-sm'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              {statItems.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.08 }}
                  className="glass-card-light rounded-2xl p-3.5 text-center"
                >
                  <p className="text-lg font-extrabold text-[#1a1d26] tabular-nums leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-[#9ca3af] font-medium mt-1 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Outstanding Summary Card */}
            <div>
              {totalOutstanding > 0 ? (
                <div className="bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                  <div className="bg-amber-50/50 border-b border-[#e5e7eb] p-5">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Outstanding Balance
                    </p>
                    <p className="text-2xl font-extrabold text-amber-600">
                      ₹{totalOutstanding.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      {outstandingInvoices.map((inv) => {
                        const due = Number(inv.total) - Number(inv.amount_paid || 0);
                        return (
                          <div
                            key={inv.id}
                            onClick={() => router.push(`/invoice/${inv.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1a1d26]">
                                {inv.invoice_number}
                              </span>
                              <span className="text-[10px] text-[#9ca3af]">
                                {new Date(inv.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-red-600">
                                ₹{due.toLocaleString('en-IN')} due
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSendBulkReminders}
                      disabled={bulkSending}
                      className="w-full mt-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#d97706] hover:bg-[#b45309] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {bulkSending ? bulkProgress : 'Send Reminder for All'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 text-center shadow-sm">
                  <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    All paid ✓ — No outstanding balance
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter and Action Header Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Date Range</label>
                    <select
                      value={ledgerPeriod}
                      onChange={(e) => {
                        setLedgerPeriod(e.target.value as any);
                        setLedgerPage(1); // reset to page 1
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1a6b3c]"
                    >
                      <option value="all">All Time</option>
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {ledgerPeriod === 'custom' && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                        <input
                          type="date"
                          value={ledgerStartDate}
                          onChange={(e) => {
                            setLedgerStartDate(e.target.value);
                            setLedgerPage(1);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
                        <input
                          type="date"
                          value={ledgerEndDate}
                          onChange={(e) => {
                            setLedgerEndDate(e.target.value);
                            setLedgerPage(1);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 font-bold rounded-xl py-2 px-3.5 text-xs transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 bg-[#1a6b3c] hover:bg-[#155630] text-white font-bold rounded-xl py-2 px-3.5 text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Print PDF Statement
                  </button>
                </div>
              </div>
            </div>

            {/* 5 Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Total Billed</span>
                <span className="text-base font-black text-slate-800 mt-1 block">
                  ₹{ledgerSummary.total_purchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Total Paid</span>
                <span className="text-base font-black text-emerald-650 mt-1 block">
                  ₹{ledgerSummary.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Outstanding</span>
                <span className="text-base font-black text-red-600 mt-1 block">
                  ₹{ledgerSummary.outstanding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Invoices</span>
                <span className="text-base font-black text-slate-800 mt-1 block">
                  {ledgerSummary.invoice_count}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 md:col-span-1">
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Avg Invoice</span>
                <span className="text-base font-black text-slate-800 mt-1 block">
                  ₹{ledgerSummary.avg_invoice_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Running Ledger Format Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a6b3c]"></span>
                Statement Transaction Log
              </h3>

              {loadingLedger ? (
                <div className="text-center py-16">
                  <p className="text-xs text-slate-400 italic animate-pulse">Loading transaction records...</p>
                </div>
              ) : ledgerEntries.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">No transactions match your search filter.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs font-semibold text-slate-600">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Particulars</th>
                          <th className="py-3 px-3 text-right">Debit (Sales)</th>
                          <th className="py-3 px-3 text-right">Credit (Paid)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledgerEntries.map((entry, idx) => {
                          const dateStr = new Date(entry.entry_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const isDebit = entry.entry_type === 'debit';
                          const entryId = entry.id || `row-${idx}`;
                          const isExpanded = !!expandedRows[entryId];
                          
                          return (
                            <Fragment key={entryId}>
                              <tr 
                                onClick={() => {
                                  if (entry.reference_type === 'invoice') {
                                    setExpandedRows(prev => ({ ...prev, [entryId]: !prev[entryId] }));
                                  }
                                }}
                                className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                              >
                                <td className="py-3 px-3 text-slate-900 font-bold">
                                  <div className="flex items-center gap-1">
                                    {entry.reference_type === 'invoice' && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                        <polyline points="9 18 15 12 9 6" />
                                      </svg>
                                    )}
                                    {dateStr}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{entry.particulars}</span>
                                    {entry.reference_type === 'invoice' && (
                                      <span className="text-[10px] text-slate-400 font-medium">Click to view items & payment details</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right text-red-500 tabular-nums">
                                  {Number(entry.debit_amount) > 0 ? `₹${Number(entry.debit_amount).toFixed(2)}` : '—'}
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-600 tabular-nums">
                                  {Number(entry.credit_amount) > 0 ? `₹${Number(entry.credit_amount).toFixed(2)}` : '—'}
                                </td>
                              </tr>
                              {isExpanded && entry.reference_type === 'invoice' && (
                                <tr className="bg-slate-50/70">
                                  <td colSpan={4} className="py-3 px-4 border-t border-slate-100">
                                    <div className="space-y-3 pl-4 border-l-2 border-[#1a6b3c] my-1">
                                      {/* Invoice Details row */}
                                      <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] bg-white border border-slate-150 rounded-xl p-3 shadow-3xs">
                                        <div>
                                          <span className="text-slate-400 block font-bold uppercase text-[9px]">Invoice Number</span>
                                          <span className="font-bold text-slate-800">{entry.invoice_number}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-bold uppercase text-[9px]">Total Amount</span>
                                          <span className="font-bold text-slate-800">₹{Number(entry.invoice_amount || entry.debit_amount).toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-bold uppercase text-[9px]">Amount Paid</span>
                                          <span className="font-bold text-emerald-650">₹{Number(entry.amount_paid || 0).toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-bold uppercase text-[9px]">Outstanding</span>
                                          <span className="font-bold text-red-650">
                                            ₹{(Number(entry.invoice_amount || entry.debit_amount) - Number(entry.amount_paid || 0)).toFixed(2)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-bold uppercase text-[9px]">Payment Status</span>
                                          <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                            entry.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            entry.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                            'bg-red-50 text-red-700 border border-red-100'
                                          }`}>
                                            {entry.payment_status}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => router.push(`/invoice/${entry.reference_id}`)}
                                          className="bg-[#1a6b3c]/10 hover:bg-[#1a6b3c]/20 text-[#1a6b3c] font-bold py-1 px-3 rounded-lg text-[10px]"
                                        >
                                          Go to Invoice Page
                                        </button>
                                      </div>

                                      {/* Invoice Items Sub-Table */}
                                      {entry.items && entry.items.length > 0 && (
                                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-3xs">
                                          <table className="w-full text-left text-[11px]">
                                            <thead>
                                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                                <th className="py-2 px-3">Product Description</th>
                                                <th className="py-2 px-3 text-center">Qty</th>
                                                <th className="py-2 px-3 text-right">Unit Price</th>
                                                <th className="py-2 px-3 text-right">Total Price</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {entry.items.map((item: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50/30">
                                                  <td className="py-2 px-3 text-slate-900 font-semibold uppercase">{item.name}</td>
                                                  <td className="py-2 px-3 text-center tabular-nums">{item.qty}</td>
                                                  <td className="py-2 px-3 text-right tabular-nums">₹{Number(item.price).toFixed(2)}</td>
                                                  <td className="py-2 px-3 text-right font-bold text-slate-800 tabular-nums">
                                                    ₹{Number(item.line_total || item.price * item.qty).toFixed(2)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalLedgerEntries > ledgerLimit && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                      <span>
                        Showing {(ledgerPage - 1) * ledgerLimit + 1} - {Math.min(ledgerPage * ledgerLimit, totalLedgerEntries)} of {totalLedgerEntries} transactions
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                          disabled={ledgerPage === 1}
                          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setLedgerPage((p) => p + 1)}
                          disabled={ledgerPage * ledgerLimit >= totalLedgerEntries}
                          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 py-1.5 px-3 rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Purchase History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-805 uppercase tracking-wide mb-4 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                </svg>
                Product Purchase Summary (Top Products)
              </h3>

              {productSummary.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No product purchases logged for this customer.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-center">Qty Purchased</th>
                          <th className="py-2.5 px-3 text-right">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productSummary.map((p, index) => (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-900 font-bold">{p.name}</td>
                            <td className="py-2.5 px-3 text-center tabular-nums">{p.total_qty}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-850 tabular-nums">
                              ₹{Number(p.total_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50/50 rounded-xl p-4 flex flex-col justify-center border border-slate-150">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Key Customer Insights</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">FAVORITE PRODUCT</span>
                        <span className="text-xs font-black text-[#1a6b3c]">{productSummary[0]?.name || '—'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">TOTAL PRODUCTS BOUGHT</span>
                          <span className="text-sm font-black text-slate-800">
                            {productSummary.reduce((sum, item) => sum + item.total_qty, 0)} Units
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">UNIQUE SKU COUNT</span>
                          <span className="text-sm font-black text-slate-800">
                            {productSummary.length} Products
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'invoices' && (
          <div className="animate-fadeIn">
            <h2 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-3 pl-2">Invoice History</h2>
            {invoices.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
                title="No invoices yet"
                description="Invoices sent to this customer will appear here."
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {invoices.map((invoice, i) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Customer */}
        <div className="pt-4 border-t border-[#e5e7eb]">
          {confirmDelete ? (
            <div className="flex items-center justify-between text-sm">
              <p className="text-[#111827] font-medium">
                This won&apos;t delete their invoices. Remove anyway?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-[#f3f4f6] text-[#4b5563] rounded-lg font-semibold text-xs hover:bg-[#e5e7eb]"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold text-xs hover:bg-red-100"
                >
                  Yes
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Remove customer
            </button>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
