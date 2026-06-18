'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Supplier, Purchase, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  initialSupplier: Supplier;
  purchases: Purchase[];
  totalPurchased: number;
  totalItcEligible: number;
}

type TabType = 'overview' | 'ledger' | 'purchases';
type DateFilterType = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

export default function SupplierDetailClient({
  shop,
  initialSupplier,
  purchases: initialPurchases,
  totalPurchased: initialTotal,
  totalItcEligible: initialItc,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [totalPurchased] = useState<number>(initialTotal);
  const [totalItcEligible] = useState<number>(initialItc);

  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Ledger Filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Edit fields
  const [name, setName] = useState(supplier.name);
  const [gstin, setGstin] = useState(supplier.gstin || '');
  const [phone, setPhone] = useState(supplier.phone || '');
  const [address, setAddress] = useState(supplier.address || '');
  const [updating, setUpdating] = useState(false);

  // Export loading state
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    if (gstin.trim() && gstin.trim().length !== 15) {
      showToast('GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
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
        throw new Error(err.error || 'Failed to update supplier');
      }

      const updated = await res.json();
      setSupplier(updated);
      showToast('Supplier updated successfully!', 'success');
      setShowEditModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete supplier');
      }

      showToast('Supplier deleted', 'success');
      router.push('/suppliers');
    } catch (err: any) {
      showToast(err.message, 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Helper: Date filter logic client-side
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (dateFilter === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilter === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateFilter === 'this_quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
    } else if (dateFilter === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateFilter === 'custom') {
      if (customStartDate) start = new Date(customStartDate);
      if (customEndDate) {
        const d = new Date(customEndDate);
        d.setHours(23, 59, 59, 999);
        end = d;
      }
    }

    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  // Running total calculation chronologically (oldest first)
  const chronologicalPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());
  }, [purchases]);

  const runningTotals = useMemo(() => {
    let running = 0;
    const totals: Record<string, number> = {};
    chronologicalPurchases.forEach((p) => {
      running += Number(p.total || 0);
      totals[p.id] = running;
    });
    return totals;
  }, [chronologicalPurchases]);

  // Filtered Purchases for Ledger Tab based on active filters
  const ledgerPurchases = useMemo(() => {
    return [...purchases]
      .filter((p) => {
        const pDate = new Date(p.purchase_date);
        if (dateRange.start && pDate < dateRange.start) return false;
        if (dateRange.end && pDate > dateRange.end) return false;
        return true;
      })
      .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()); // newest first
  }, [purchases, dateRange]);

  // Ledger totals
  const ledgerTotals = useMemo(() => {
    let totalPurchasedVal = 0;
    let totalItcVal = 0;
    ledgerPurchases.forEach((p) => {
      totalPurchasedVal += Number(p.total || 0);
      if (p.itc_eligible) {
        totalItcVal += Number(p.total_cgst || 0) + Number(p.total_sgst || 0);
      }
    });
    return {
      totalPurchased: totalPurchasedVal,
      totalItc: totalItcVal,
      count: ledgerPurchases.length,
    };
  }, [ledgerPurchases]);

  const handleExport = async (type: 'pdf' | 'excel') => {
    const isPdf = type === 'pdf';
    if (isPdf) setExportingPdf(true);
    else setExportingExcel(true);

    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('start_date', dateRange.start.toISOString().split('T')[0]);
      if (dateRange.end) params.append('end_date', dateRange.end.toISOString().split('T')[0]);

      const url = `/api/suppliers/${supplier.id}/ledger/${type}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to generate ${type.toUpperCase()}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `Supplier_Ledger_${supplier.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${isPdf ? 'pdf' : 'xlsx'}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      showToast(`Supplier ledger exported ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || `Export failed`, 'error');
    } finally {
      if (isPdf) setExportingPdf(false);
      else setExportingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

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
                Supplier ledger details & inward supply logs for {supplier.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/suppliers')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Suppliers
          </button>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
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
              <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
                Supplier Ledger
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Supplier ledger details & inward supply logs for {supplier.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/suppliers')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer self-start"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Suppliers
          </button>
        </div>

        {/* Vyapar style Tabs */}
        <div className="flex border-b border-slate-200 mb-6 bg-white p-2 rounded-xl border">
          {(['overview', 'ledger', 'purchases'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === tab
                  ? 'bg-[#0050e8] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB CONTENT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Supplier Header details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0050e8]/10 text-[#0050e8] flex items-center justify-center text-xl font-extrabold border border-[#0050e8]/20">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-905 uppercase leading-tight">
                      {supplier.name}
                    </h2>
                    <div className="mt-1.5">
                      {supplier.gstin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff] uppercase tracking-wider font-mono">
                          GSTIN: {supplier.gstin}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                          Unregistered B2C
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 rounded-xl py-2 px-4 border border-slate-200 font-bold text-xs transition-colors"
                  >
                    Edit Details
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                      <span className="text-xs font-extrabold text-red-750 mr-1">Delete supplier?</span>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-750 text-white rounded-lg py-1.5 px-3.5 font-bold text-xs shadow-xs transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="bg-white hover:bg-slate-50 text-slate-700 rounded-lg py-1.5 px-3.5 border border-slate-200 font-bold text-xs transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2 px-4 font-bold text-xs transition-colors"
                    >
                      Delete Supplier
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                {supplier.phone && (
                  <p className="text-xs font-bold">
                    Phone Number: <span className="text-slate-800 font-black ml-1">+91 {supplier.phone.slice(-10)}</span>
                  </p>
                )}
                {supplier.address && (
                  <p className="text-xs font-bold">
                    Billing Address: <span className="text-slate-800 font-extrabold ml-1">{supplier.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Balance Sheet Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-l-4 border-emerald-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Total Purchased Value</span>
                  <span className="text-2xl font-black text-slate-850 mt-1 block">
                    ₹{totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-650 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
              </div>

              <div className="bg-white border-l-4 border-blue-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Total Claimed ITC</span>
                  <span className="text-2xl font-black text-slate-850 mt-1 block">
                    ₹{totalItcEligible.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEDGER TAB CONTENT */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            {/* Header Summary block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-8">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Total Purchased</span>
                  <p className="text-base font-extrabold text-slate-850 mt-0.5">₹{ledgerTotals.totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Total ITC Earned</span>
                  <p className="text-base font-extrabold text-slate-850 mt-0.5">₹{ledgerTotals.totalItc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Total Purchases</span>
                  <p className="text-base font-extrabold text-slate-850 mt-0.5">{ledgerTotals.count} invoices</p>
                </div>
              </div>

              {/* PDF & Excel exports */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exportingPdf}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl py-2 px-4 text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {exportingPdf ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exportingExcel}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 font-bold rounded-xl py-2 px-4 text-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {exportingExcel ? 'Exporting...' : 'Export Excel'}
                </button>
              </div>
            </div>

            {/* Date filter Ribbon */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'this_month', label: 'This Month' },
                  { key: 'last_month', label: 'Last Month' },
                  { key: 'this_quarter', label: 'This Quarter' },
                  { key: 'this_year', label: 'This Year' },
                  { key: 'custom', label: 'Custom Range' },
                ] as { key: DateFilterType; label: string }[]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setDateFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      dateFilter === f.key
                        ? 'bg-[#0050e8]/10 text-[#0050e8] border-[#0050e8]'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {dateFilter === 'custom' && (
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0050e8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0050e8]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            {ledgerPurchases.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-semibold text-xs shadow-xs">
                No purchases recorded for this supplier yet.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 ml-4 space-y-6">
                {ledgerPurchases.map((p) => {
                  const runningTotal = runningTotals[p.id] || p.total;
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/purchases/${p.id}`)}
                      className="relative bg-white border-y border-r border-l-4 border-red-500 border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex justify-between items-center"
                    >
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-red-500 bg-white z-10" />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-805">
                            🔴 Purchase · #{p.purchase_invoice_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            · {new Date(p.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          ITC: ₹{Number(p.total_cgst).toFixed(2)} CGST + ₹{Number(p.total_sgst).toFixed(2)} SGST = ₹{(Number(p.total_cgst) + Number(p.total_sgst)).toFixed(2)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-slate-850">
                          ₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Bal: ₹{runningTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PURCHASES TAB CONTENT */}
        {activeTab === 'purchases' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">
              Purchase Invoice Ledger
            </h3>

            {purchases.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No purchases recorded for this supplier.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2.5 px-3">Purchase Date</th>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3 text-right">Base Value</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                      <th className="py-2.5 px-3 text-right">Total Outlay</th>
                      <th className="py-2.5 px-3 text-right">ITC Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((p) => {
                      const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-slate-900 font-bold">{dateStr}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">#{p.purchase_invoice_number}</td>
                          <td className="py-3 px-3 text-right tabular-nums">₹{Number(p.subtotal).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{Number(p.total_cgst).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{Number(p.total_sgst).toFixed(2)}</td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums">
                            ₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.itc_eligible ? 'bg-emerald-50 text-emerald-705 border border-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                              {p.itc_eligible ? 'Eligible' : 'No ITC'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => router.push(`/purchases/${p.id}`)}
                              className="bg-[#0050e8]/5 hover:bg-[#0050e8]/10 text-[#0050e8] font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors"
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
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowEditModal(false)}
            />

            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 relative shadow-xl z-10">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0050e8]"></span>
                  Edit Supplier
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TAMIL NADU FERTILIZERS"
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
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl py-3 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold rounded-xl py-3 text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
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
