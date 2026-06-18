'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toast';
import { Customer, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  customers: Customer[];
}

export default function LedgerPageClient({ shop, customers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ledger view states
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

  // Check URL query param "customerId" for pre-selection
  useEffect(() => {
    const custId = searchParams.get('customerId');
    if (custId && customers.some(c => c.id === custId)) {
      setSelectedCustomerId(custId);
    }
  }, [searchParams, customers]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Fetch ledger entries
  useEffect(() => {
    if (!selectedCustomerId) return;
    async function fetchLedger() {
      setLoadingLedger(true);
      try {
        let url = `/api/customers/${selectedCustomerId}/ledger?page=${ledgerPage}&limit=${ledgerLimit}&period=${ledgerPeriod}`;
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
        console.error('Failed to load ledger:', err);
      } finally {
        setLoadingLedger(false);
      }
    }
    fetchLedger();
  }, [selectedCustomerId, ledgerPeriod, ledgerStartDate, ledgerEndDate, ledgerPage, ledgerLimit]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleExportCSV = async () => {
    if (!selectedCustomer) return;
    try {
      showToast('Preparing CSV statement...', 'success');
      let url = `/api/customers/${selectedCustomer.id}/ledger?page=1&limit=10000&period=${ledgerPeriod}&log_export=true&export_type=csv`;
      if (ledgerPeriod === 'custom') {
        if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
        if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch ledger for CSV export');
      const data = await res.json();
      
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += `"CUSTOMER LEDGER STATEMENT"\n`;
      csv += `"Customer Name:","${selectedCustomer.name.replace(/"/g, '""')}"\n`;
      csv += `"Phone:","+91 ${selectedCustomer.phone.slice(-10)}"\n`;
      csv += `"GSTIN:","${selectedCustomer.gstin || 'None'}"\n`;
      csv += `"Period:","${ledgerPeriod.toUpperCase()}${ledgerPeriod === 'custom' ? ` (${ledgerStartDate} to ${ledgerEndDate})` : ''}"\n`;
      csv += `"Statement Date:","${new Date().toLocaleDateString('en-IN')}"\n\n`;
      
      csv += `"LEDGER OVERVIEW SUMMARY"\n`;
      csv += `"Total Billed (Sales)","Total Received (Paid)","Outstanding Balance","Total Invoices","Avg Invoice Value"\n`;
      csv += `"${data.summary_cards.total_purchases}","${data.summary_cards.total_paid}","${data.summary_cards.outstanding_amount}","${data.summary_cards.invoice_count}","${data.summary_cards.avg_invoice_value}"\n\n`;
      
      csv += `"TRANSACTION LEDGER"\n`;
      csv += `"Date","Particulars","Debit (Sales)","Credit (Paid)"\n`;
      
      data.entries.forEach((e: any) => {
        const dateStr = new Date(e.entry_date).toLocaleDateString('en-IN');
        csv += `"${dateStr}","${e.particulars.replace(/"/g, '""')}","${e.debit_amount || 0}","${e.credit_amount || 0}"\n`;
      });
      csv += `\n`;
      
      csv += `"PRODUCT PURCHASE HISTORICAL SUMMARY"\n`;
      csv += `"Product Name","Quantity Purchased","Total Revenue Generated"\n`;
      data.product_summary.forEach((p: any) => {
        csv += `"${p.name.replace(/"/g, '""')}","${p.total_qty}","${p.total_revenue}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `${selectedCustomer.name.replace(/\s+/g, '_')}_Statement_${ledgerPeriod}.csv`;
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
    if (!selectedCustomer) return;
    let url = `/api/customers/${selectedCustomer.id}/pdf?period=${ledgerPeriod}`;
    if (ledgerPeriod === 'custom') {
      if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
      if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
    }
    window.open(url, '_blank');
    showToast('Generating PDF statement...', 'success');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 py-6 pb-24">
        {/* Header */}
        <div className="bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 -mt-6.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Customer Ledger Book</h1>
            <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
              View running balances, reconcile accounts, and export customer statements.
            </p>
          </div>
          {selectedCustomerId && (
            <button
              onClick={() => {
                setSelectedCustomerId('');
                setLedgerEntries([]);
                setLedgerPage(1);
                setLedgerPeriod('all');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all self-start md:self-auto"
            >
              Change Customer
            </button>
          )}
        </div>

        {/* NOT Selected Customer State (Search list) */}
        {!selectedCustomerId ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white rounded-xl border border-[#e5e7eb] py-3.5 pl-11 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
              />
              <svg className="absolute left-4 top-4 text-[#9ca3af]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a Customer to open statement</h2>
              </div>

              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450 italic">No customers found matching search filter.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
                  {filteredCustomers.map((cust) => {
                    const balance = Number(cust.outstanding_balance || 0);
                    return (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block text-sm uppercase">{cust.name}</span>
                          <span className="text-xs text-slate-400 font-medium">+91 {cust.phone.slice(-10)}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold block ${balance > 0 ? 'text-red-650' : 'text-slate-400'}`}>
                            Outstanding: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          {cust.gstin && (
                            <span className="text-[10px] text-[#1a6b3c] font-bold block uppercase mt-0.5">
                              GSTIN: {cust.gstin}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Selected Customer Ledger View */
          <div className="space-y-6 animate-fadeIn">
            {/* Active Customer Profile Row */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1a6b3c]/10 text-[#1a6b3c] flex items-center justify-center text-lg font-black uppercase">
                  {selectedCustomer?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">{selectedCustomer?.name}</h2>
                  <p className="text-xs text-slate-400 font-bold">+91 {selectedCustomer?.phone.slice(-10)}</p>
                  {selectedCustomer?.gstin && (
                    <span className="inline-block text-[10px] font-black text-[#1a6b3c] uppercase bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                      GSTIN: {selectedCustomer.gstin}
                    </span>
                  )}
                </div>
              </div>
            </div>

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
                        setLedgerPage(1);
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
                                          <span className="font-bold text-red-600">
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
      </PageTransition>
    </div>
  );
}
