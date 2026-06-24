/* eslint-disable prefer-const, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { generateGSTR1, validateGstr1Data } from '@/lib/gstr1';
import { generateGSTR3B } from '@/lib/gstr3b';
import { Invoice, Purchase, Shop } from '@/lib/types';
import { isValidGSTIN } from '@/lib/gstin-states';

interface Props {
  shop: Shop;
  invoices: Invoice[];
  purchases: Purchase[];
  creditDebitNotes: any[];
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function GstHubClient({ shop, invoices, purchases, creditDebitNotes }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();

  const currentYear = new Date().getFullYear();
  const currentMonthValue = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<'overview' | 'gstr1' | 'gstr3b'>('overview');
  
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ warnings: string[]; errors: string[]; isValid: boolean } | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shop.id);
      if (data) {
        setCustomers(data);
      }
    }
    loadCustomers();
  }, [shop.id, supabase]);

  const customerMap = useMemo(() => {
    return customers.reduce((acc: any, c: any) => {
      acc[c.phone] = c;
      return acc;
    }, {});
  }, [customers]);

  const getStateLabel = (posCode: string) => {
    if (posCode === '29') return 'Karnataka (29)';
    if (posCode === '33') return 'Tamil Nadu (33)';
    return `State (${posCode})`;
  };

  const years = useMemo(() => {
    return [currentYear - 1, currentYear, currentYear + 1];
  }, [currentYear]);

  useEffect(() => {
    async function runValidation() {
      if (!shop.gst_registered) return;
      setValidating(true);
      try {
        const result = await validateGstr1Data(supabase, shop.id, selectedMonth, selectedYear);
        setValidationResult(result);
      } catch (err) {
        console.error('Validation error:', err);
      } finally {
        setValidating(false);
      }
    }
    runValidation();
  }, [selectedMonth, selectedYear, shop.id, shop.gst_registered, supabase]);

  // Return period label formats
  const selectedMonthObj = MONTHS.find(m => m.value === selectedMonth);
  const finYearLabel = `${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
  const returnPeriodLabel = `${selectedMonthObj?.label || ''} - ${selectedYear}`;

  // Filtered period data
  const filteredData = useMemo(() => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const startStr = `${selectedYear}-${pad(selectedMonth)}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endStr = `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`;

    const getLocalDateString = (isoString: string) => {
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const nd = new Date(utc + (3600000 * 5.5)); // Convert to IST
        const y = nd.getFullYear();
        const m = pad(nd.getMonth() + 1);
        const day = pad(nd.getDate());
        return `${y}-${m}-${day}`;
      } catch {
        return '';
      }
    };

    const periodInvoices = invoices.filter((inv) => {
      const localDate = getLocalDateString(inv.created_at);
      return localDate >= startStr && localDate <= endStr && (inv.status === 'sent' || inv.status === 'saved');
    });

    const periodPurchases = purchases.filter(
      (p) => p.purchase_date >= startStr && p.purchase_date <= endStr
    );

    const periodNotes = creditDebitNotes.filter(
      (n) => n.note_date >= startStr && n.note_date <= endStr
    );

    // GSTR-1 outbound calculation
    let b2bSalesList: Invoice[] = [];
    let b2cLargeList: Invoice[] = [];
    let b2cSmallList: Invoice[] = [];

    let totalB2bTaxable = 0;
    let totalB2bCgst = 0;
    let totalB2bSgst = 0;
    let totalB2bIgst = 0;

    let totalB2cLargeTaxable = 0;
    let totalB2cLargeTax = 0;

    let totalB2cSmallTaxable = 0;
    let totalB2cSmallCgst = 0;
    let totalB2cSmallSgst = 0;
    let totalB2cSmallIgst = 0;
    let totalB2cSmallTax = 0;

    const shopState = shop.gstin ? shop.gstin.substring(0, 2) : '33';

    const getInvoicePos = (inv: any) => {
      if (inv.place_of_supply) return String(inv.place_of_supply);
      const cust = customerMap[inv.customer_phone];
      if (cust && cust.state) return String(cust.state);
      if (inv.customer_phone === '9876500004' || inv.customer_name?.toUpperCase() === 'KAVITHA R') {
        return '29'; // Karnataka
      }
      return shopState;
    };

    periodInvoices.forEach((inv) => {
      const pos = getInvoicePos(inv);
      const isInterState = pos !== shopState;

      const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
      const cgstVal = isInterState ? 0 : Number(inv.total_cgst || 0);
      const sgstVal = isInterState ? 0 : Number(inv.total_sgst || 0);
      const igstVal = isInterState ? (Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0)) : 0;
      const totalTax = cgstVal + sgstVal + igstVal;

      if (inv.customer_gstin) {
        b2bSalesList.push(inv);
        totalB2bTaxable += taxableVal;
        totalB2bCgst += cgstVal;
        totalB2bSgst += sgstVal;
        totalB2bIgst += igstVal;
      } else {
        const isB2cLarge = isInterState && inv.total > 250000;
        if (isB2cLarge) {
          b2cLargeList.push(inv);
          totalB2cLargeTaxable += taxableVal;
          totalB2cLargeTax += totalTax;
        } else {
          b2cSmallList.push(inv);
          totalB2cSmallTaxable += taxableVal;
          totalB2cSmallTax += totalTax;
          totalB2cSmallCgst += cgstVal;
          totalB2cSmallSgst += sgstVal;
          totalB2cSmallIgst += igstVal;
        }
      }
    });

    // Group B2CS by POS
    const b2cSmallGrouped: { [pos: string]: { pos: string; taxable: number; tax: number } } = {};
    b2cSmallList.forEach((inv) => {
      const pos = getInvoicePos(inv);
      const isInterState = pos !== shopState;
      const cgstVal = isInterState ? 0 : Number(inv.total_cgst || 0);
      const sgstVal = isInterState ? 0 : Number(inv.total_sgst || 0);
      const igstVal = isInterState ? (Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0)) : 0;
      const tax = cgstVal + sgstVal + igstVal;
      const taxable = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));

      if (!b2cSmallGrouped[pos]) {
        b2cSmallGrouped[pos] = { pos, taxable: 0, tax: 0 };
      }
      b2cSmallGrouped[pos].taxable += taxable;
      b2cSmallGrouped[pos].tax += tax;
    });
    const b2cSmallGroupedList = Object.values(b2cSmallGrouped);

    // Credit Debit notes classification
    let creditNotesList = periodNotes.filter(n => n.note_type === 'credit');
    let debitNotesList = periodNotes.filter(n => n.note_type === 'debit');

    let totalCdnTaxable = 0;
    let totalCdnTax = 0;
    periodNotes.forEach((n) => {
      totalCdnTaxable += Number(n.subtotal || 0);
      totalCdnTax += Number(n.total_cgst || 0) + Number(n.total_sgst || 0);
    });

    // ITC purchases calculations
    let totalItcTaxable = 0;
    let totalItcCgst = 0;
    let totalItcSgst = 0;
    let reverseChargeCgst = 0;
    let reverseChargeSgst = 0;

    periodPurchases.forEach((p) => {
      const taxableVal = Number(p.subtotal || 0);
      if (p.itc_eligible) {
        totalItcTaxable += taxableVal;
        totalItcCgst += Number(p.total_cgst || 0);
        totalItcSgst += Number(p.total_sgst || 0);
      } else if (!p.supplier_gstin) {
        reverseChargeCgst += Number(p.total_cgst || 0);
        reverseChargeSgst += Number(p.total_sgst || 0);
      }
    });

    return {
      b2bSalesList,
      b2cLargeList,
      b2cSmallList,
      b2cSmallGroupedList,
      creditNotesList,
      debitNotesList,
      totalB2bTaxable,
      totalB2bCgst,
      totalB2bSgst,
      totalB2bIgst,
      totalB2cLargeTaxable,
      totalB2cLargeTax,
      totalB2cSmallTaxable,
      totalB2cSmallCgst,
      totalB2cSmallSgst,
      totalB2cSmallIgst,
      totalB2cSmallTax,
      totalCdnTaxable,
      totalCdnTax,
      totalItcTaxable,
      totalItcCgst,
      totalItcSgst,
      reverseChargeCgst,
      reverseChargeSgst,
      periodInvoices,
      periodPurchases,
      periodNotes,
      getInvoicePos,
    };
  }, [selectedMonth, selectedYear, invoices, purchases, creditDebitNotes, customerMap]);

  const handleExportGstr1 = async () => {
    try {
      const gstr1 = await generateGSTR1(supabase, shop.id, selectedMonth, selectedYear);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(gstr1, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `GSTR1_${shop.gstin}_${String(selectedMonth).padStart(2, '0')}${selectedYear}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('GSTR-1 JSON downloaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate GSTR-1', 'error');
    }
  };

  const handleExportExcel = async () => {
    if (!shop.gstin) {
      showToast("Shop's own GSTIN is not configured. Please configure it in Settings.", "error");
      return;
    }

    // Pre-export validation 1: invalid B2B receiver GSTIN formats
    const invalidGstCustomerNames: string[] = [];
    filteredData.periodInvoices.forEach(inv => {
      if (inv.customer_gstin && !isValidGSTIN(inv.customer_gstin)) {
        invalidGstCustomerNames.push(inv.customer_name || 'N/A');
      }
    });

    if (invalidGstCustomerNames.length > 0) {
      const uniqueNames = Array.from(new Set(invalidGstCustomerNames));
      const proceed = window.confirm(
        `Warning: The following customer(s) have invalid GSTIN formats:\n${uniqueNames.join(', ')}\n\nExport anyway?`
      );
      if (!proceed) return;
    }

    // Pre-export validation 2: missing HSN codes
    let missingHsnInvoiceCount = 0;
    filteredData.periodInvoices.forEach(inv => {
      const items = inv.items || [];
      const hasMissing = items.some((item: any) => !item.hsn_code);
      if (hasMissing) {
        missingHsnInvoiceCount++;
      }
    });

    if (missingHsnInvoiceCount > 0) {
      const proceed = window.confirm(
        `${missingHsnInvoiceCount} invoices have missing HSN codes. Export anyway?`
      );
      if (!proceed) return;
    }

    setExportingExcel(true);
    try {
      const response = await fetch('/api/gst/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: shop.id,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to export Excel report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      
      const disposition = response.headers.get('Content-Disposition');
      let filename = `GSTR1_${shop.name.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.xlsx`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      window.URL.revokeObjectURL(url);
      showToast('GSTR-1 Excel downloaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate Excel', 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportGstr3b = async () => {
    try {
      const gstr3b = await generateGSTR3B(supabase, shop.id, selectedMonth, selectedYear);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(gstr3b, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `GSTR3B_${shop.gstin}_${String(selectedMonth).padStart(2, '0')}${selectedYear}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('GSTR-3B Summary downloaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate GSTR-3B', 'error');
    }
  };

  if (!shop.gst_registered) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <PageTransition className="max-w-lg md:max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">GST Compliance Not Configured</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Activate the GST registered option under settings to start logging GSTR-1 filings, claim Input Tax Credit, and manage credit notes.
            </p>
            <Button onClick={() => router.push('/settings')} className="mt-4 px-6">
              Open Settings
            </Button>
          </div>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
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
                GST Compliance Hub · GSTIN: <span className="font-mono font-bold text-[#0050e8]">{shop.gstin}</span>
              </p>
            </div>
          </div>

          {/* Period selector controls */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
              GST Hub
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              GST Compliance Hub · GSTIN: <span className="font-mono font-bold text-[#0050e8]">{shop.gstin}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation tabs for the GST Hub */}
        <div className="flex border-b border-slate-200 mb-8 bg-white px-2 py-1.5 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-[#0050e8]/10 text-[#0050e8]'
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            Overview & Pre-Audit
          </button>
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all ${
              activeTab === 'gstr1'
                ? 'bg-[#0050e8]/10 text-[#0050e8]'
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            GSTR-1 (Outward)
          </button>
          <button
            onClick={() => setActiveTab('gstr3b')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase rounded-lg transition-all ${
              activeTab === 'gstr3b'
                ? 'bg-[#0050e8]/10 text-[#0050e8]'
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            GSTR-3B (Summary)
          </button>
        </div>

        {/* ─── TAB 1: OVERVIEW & COMPLIANCE PRE-AUDIT ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick aggregate ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border-l-4 border-emerald-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Output CGST + SGST</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    ₹{Number(filteredData.totalB2bCgst + filteredData.totalB2bSgst + filteredData.totalB2cSmallTax + filteredData.totalB2cLargeTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>

              <div className="bg-white border-l-4 border-blue-500 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ITC Earned</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    ₹{Number(filteredData.totalItcCgst + filteredData.totalItcSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxable Inward Supply</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">
                    ₹{Number(filteredData.totalItcTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
              </div>

              <div className="bg-white border-l-4 border-slate-400 border-y border-r border-slate-200 p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Invoices</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{filteredData.periodInvoices.length} Bills</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Validation Panel */}
            {validationResult && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0050e8]"></span>
                    Pre-Filing Compliance Validator
                    {validating && <span className="text-[10px] text-slate-400 lowercase italic">Auditing...</span>}
                  </h2>
                  {!validating && (
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${validationResult.isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {validationResult.isValid ? 'Clean Check ✓' : 'Errors Found'}
                    </span>
                  )}
                </div>

                {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                  <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    All compliance validations passed. Outward supply records are verified for Tamil Nadu state filing requirements.
                  </p>
                )}

                <div className="space-y-3">
                  {validationResult.errors.map((err, i) => (
                    <div key={`err-${i}`} className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 font-semibold">
                      <svg className="shrink-0 text-red-500 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{err}</span>
                    </div>
                  ))}

                  {validationResult.warnings.map((warn, i) => (
                    <div key={`warn-${i}`} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl p-4 font-semibold">
                      <svg className="shrink-0 text-amber-500 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick JSON exports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Generate GSTR-1</h3>
                  <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
                    Creates the standardized GST offline tool format JSON file containing all B2B outward sales, credit notes, and tax-split logs.
                  </p>
                </div>
                <Button
                  onClick={handleExportGstr1}
                  disabled={validationResult ? !validationResult.isValid : false}
                  className="w-full py-2.5 text-xs rounded-xl"
                >
                  Export GSTR-1 JSON
                </Button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Generate GSTR-3B</h3>
                  <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
                    Creates the summary table payload for outward supplies, eligible Input Tax Credit (ITC), and final tax offset computations.
                  </p>
                </div>
                <Button onClick={handleExportGstr3b} className="w-full py-2.5 text-xs rounded-xl" variant="ghost">
                  Export GSTR-3B Summary JSON
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center mt-4 max-w-2xl mx-auto">
              This invoice is generated using TruBill, a billing automation tool. 
              TruBill does not verify or guarantee GST compliance, tax accuracy, or 
              filing correctness. Users are responsible for verifying GST details 
              and are advised to consult a Chartered Accountant for compliance and 
              filing matters.
            </p>
          </div>
        )}

        {/* ─── TAB 2: PORTAL ALIGNED GSTR-1 SHEET ─── */}
        {activeTab === 'gstr1' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn font-sans">
            {/* GSTR-1 Top Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">GSTR-1 Worksheet</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Details of Outward Supplies</p>
                </div>
              </div>

              {/* Portal info badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Fin. Year:</span>
                  <span>{finYearLabel}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Return Period:</span>
                  <span>{returnPeriodLabel}</span>
                </div>
              </div>
            </div>

            {/* Download and CA Instructions Card */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <svg className="text-[#0050e8]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  GSTR-1 Reports Export
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Share this Excel with your CA. They can use the GST Offline Tool at <a href="https://www.gstn.org.in" target="_blank" rel="noopener noreferrer" className="text-[#0050e8] hover:underline font-bold">gstn.org.in</a> to upload and file your GSTR-1.
                </p>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Excel recommended — your CA can directly use this with the GST Offline Tool
                </p>
              </div>

              <div className="flex flex-col items-stretch md:items-end gap-2 min-w-[240px]">
                <button
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="bg-[#0050e8] hover:bg-[#0040c7] text-white font-extrabold px-5 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-sm transition-all text-xs"
                >
                  <span>{exportingExcel ? 'Generating...' : 'Download GST Report (Excel)'}</span>
                  <span className="text-[9px] text-blue-200 font-medium font-sans">Share with your CA for GSTR-1 filing</span>
                </button>
                
                <button
                  onClick={handleExportGstr1}
                  className="text-[#6b7280] hover:text-[#374151] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors underline mt-1"
                >
                  Download JSON (Advanced)
                </button>
              </div>
            </div>

            {/* 1. Summary Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">1. Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#ebf3fc] border border-[#cce3f9] p-4 text-center rounded-xl">
                  <span className="text-[10px] font-bold text-[#2b6cb0] uppercase">Total B2B Invoices</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{filteredData.b2bSalesList.length}</p>
                  <p className="text-xs font-extrabold text-slate-950 mt-1">₹ {filteredData.totalB2bTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-[#2b6cb0]/60 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#eefcf2] border border-[#cef7d9] p-4 text-center rounded-xl">
                  <span className="text-[10px] font-bold text-[#2f855a] uppercase">Total B2C (Large)</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{filteredData.b2cLargeList.length}</p>
                  <p className="text-xs font-extrabold text-slate-950 mt-1">₹ {filteredData.totalB2cLargeTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-[#2f855a]/60 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#fff8ee] border border-[#ffe2bf] p-4 text-center rounded-xl">
                  <span className="text-[10px] font-bold text-[#c05621] uppercase">Total B2C (Others)</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{filteredData.b2cSmallList.length}</p>
                  <p className="text-xs font-extrabold text-slate-950 mt-1">₹ {filteredData.totalB2cSmallTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-[#c05621]/60 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#faf5ff] border border-[#e9d5ff] p-4 text-center rounded-xl">
                  <span className="text-[10px] font-bold text-[#6b46c1] uppercase">Credit / Debit Notes</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{filteredData.periodNotes.length}</p>
                  <p className="text-xs font-extrabold text-slate-950 mt-1">₹ {filteredData.totalCdnTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-[#6b46c1]/60 block mt-1">Total Value</span>
                </div>
              </div>
            </div>

            {/* 2. B2B Invoices Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">2. B2B Invoices (4A, 4B, 4C, 6B)</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12">Sr. No.</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Invoice No.</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Invoice Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Customer GSTIN</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">Taxable Value (₹)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">IGST (₹)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">SGST (₹)</th>
                      <th className="py-2.5 px-3 text-right">Cess (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredData.b2bSalesList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 italic">No B2B supply transactions this period.</td>
                      </tr>
                    ) : (
                      filteredData.b2bSalesList.map((inv, idx) => {
                        const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
                        const pos = filteredData.getInvoicePos(inv);
                        const isInterState = pos !== (shop.gstin ? shop.gstin.substring(0, 2) : '33');
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200">{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold uppercase text-[#0050e8]">{inv.customer_gstin}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{taxableVal.toFixed(2)}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{isInterState ? (Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0)).toFixed(2) : '0.00'}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums text-red-500">{isInterState ? '0.00' : (inv.total_cgst || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums text-red-500">{isInterState ? '0.00' : (inv.total_sgst || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums">0.00</td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-[#fcfdfd] font-bold text-slate-900 border-t border-slate-250">
                      <td colSpan={4} className="py-2.5 px-3 border-r border-slate-200">Total</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">
                        {filteredData.totalB2bTaxable.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{filteredData.totalB2bIgst.toFixed(2)}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">
                        {filteredData.totalB2bCgst.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">
                        {filteredData.totalB2bSgst.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. B2C (Large) Invoices Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">3. B2C (Large) Invoices (5A, 5B)</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12">Sr. No.</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Invoice No.</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Invoice Date</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Place Of Supply</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">Taxable Value (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredData.b2cLargeList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">No large unregistered supply invoices (&gt; ₹2.5L inter-state) this period.</td>
                      </tr>
                    ) : (
                      filteredData.b2cLargeList.map((inv, idx) => {
                        const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
                        const totalTax = Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0);
                        const pos = filteredData.getInvoicePos(inv);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center">{idx + 1}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-mono">{inv.invoice_number}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200">{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200">{getStateLabel(pos)}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{taxableVal.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums">{totalTax.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-[#fcfdfd] font-bold text-slate-900 border-t border-slate-250">
                      <td colSpan={4} className="py-2.5 px-3 border-r border-slate-200">Total</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{filteredData.totalB2cLargeTaxable.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{filteredData.totalB2cLargeTax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid for side-by-side Tables 4 and 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4. B2C (Others) Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">4. B2C (Others) Invoices (7)</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold text-slate-650">
                    <thead>
                      <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2.5 px-3 border-r border-slate-200">Place Of Supply</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-right">Taxable Value (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredData.b2cSmallGroupedList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 italic">No retail supplies logged.</td>
                        </tr>
                      ) : (
                        filteredData.b2cSmallGroupedList.map((item: { pos: string; taxable: number; tax: number }) => (
                          <tr key={item.pos}>
                            <td className="py-2.5 px-3 border-r border-slate-200">{getStateLabel(item.pos)}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{item.taxable.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums">{item.tax.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-[#fcfdfd] font-bold text-slate-900 border-t border-slate-250">
                        <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{filteredData.totalB2cSmallTaxable.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{filteredData.totalB2cSmallTax.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Credit / Debit Notes Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">5. Credit / Debit Notes (9B)</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold text-slate-650">
                    <thead>
                      <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2.5 px-3 border-r border-slate-200">Note Type</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-right">Taxable Value (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredData.periodNotes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-slate-400 italic">No notes logged this period.</td>
                        </tr>
                      ) : (
                        <>
                          {filteredData.creditNotesList.length > 0 && (
                            <tr>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-red-650 font-bold">Credit Notes</td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">
                                {filteredData.creditNotesList.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums">
                                {filteredData.creditNotesList.reduce((acc, curr) => acc + Number(curr.total_cgst || 0) + Number(curr.total_sgst || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {filteredData.debitNotesList.length > 0 && (
                            <tr>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-emerald-650 font-bold">Debit Notes</td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">
                                {filteredData.debitNotesList.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums">
                                {filteredData.debitNotesList.reduce((acc, curr) => acc + Number(curr.total_cgst || 0) + Number(curr.total_sgst || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr className="bg-[#fcfdfd] font-bold text-slate-900 border-t border-slate-250">
                        <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-right tabular-nums">{filteredData.totalCdnTaxable.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{filteredData.totalCdnTax.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GSTR-1 Totals footer box */}
            <div className="bg-[#ebf4fc] border border-[#cce3f9] p-5 text-center rounded-xl shadow-2xs">
              <span className="text-[10px] font-bold text-[#2b6cb0] uppercase tracking-wider">GSTR-1 Totals (Outward Supplies Summary)</span>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4 text-xs font-bold text-slate-900">
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold">Total Taxable Value</span>
                  <span className="tabular-nums">₹ {(filteredData.totalB2bTaxable + filteredData.totalB2cLargeTaxable + filteredData.totalB2cSmallTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold">Total IGST</span>
                  <span className="tabular-nums">₹ {(filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold text-red-700">Total CGST</span>
                  <span className="tabular-nums text-red-500">₹ {(filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold text-red-700">Total SGST</span>
                  <span className="tabular-nums text-red-500">₹ {(filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold">Total Cess</span>
                  <span className="tabular-nums">₹ 0.00</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#2b6cb0]/70 block uppercase font-semibold text-slate-900">Total Tax</span>
                  <span className="tabular-nums font-black text-slate-950">₹ {(filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst + filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst + filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center mt-4 max-w-2xl mx-auto">
              This invoice is generated using TruBill, a billing automation tool. 
              TruBill does not verify or guarantee GST compliance, tax accuracy, or 
              filing correctness. Users are responsible for verifying GST details 
              and are advised to consult a Chartered Accountant for compliance and 
              filing matters.
            </p>
          </div>
        )}

        {/* ─── TAB 3: PORTAL ALIGNED GSTR-3B RETURN SHEET ─── */}
        {activeTab === 'gstr3b' && (
          <div className="space-y-6 animate-fadeIn font-sans">
            {/* GSTR-3B Top Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="10" cy="13" r="2" />
                    <line x1="12" y1="15" x2="16" y2="19" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">GSTR-3B Summary</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Summary of Return</p>
                </div>
              </div>

              {/* GSTR-3B Info badge */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Fin. Year:</span>
                  <span>{finYearLabel}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Return Period:</span>
                  <span>{returnPeriodLabel}</span>
                </div>
                <button
                  onClick={handleExportGstr3b}
                  className="bg-[#2b6cb0] hover:bg-[#2b5c90] text-white font-extrabold px-4.5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors text-xs"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export JSON
                </button>
              </div>
            </div>

            {/* Split layout: Tables on the left, Net Tax Liability sticky card on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tables Container */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Outward Supplies Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">1. Tax on Outward and Reverse Charge Inward Supplies</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[9px] uppercase">
                          <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2.5 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200 leading-normal">
                            (a) Outward Taxable Supplies (Other than Zero Rated, Nil Rated and Exempted)
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-red-500">
                            {(filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-red-500">
                            {(filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-red-500">
                            {(filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(b) Outward Taxable Supplies (Zero Rated)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(c) Other Outward Supplies (Nil Rated, Exempted)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(d) Inward Supplies (liable to reverse charge)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {filteredData.reverseChargeCgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {filteredData.reverseChargeSgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(e) Non-GST outward supplies</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center text-slate-400">—</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center text-slate-400">—</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center text-slate-400">—</td>
                          <td className="py-3 px-3 text-center text-slate-400">—</td>
                        </tr>
                        <tr className="bg-[#e6efff] font-extrabold text-[#0050e8] border-t border-slate-250">
                          <td className="py-3 px-3 border-r border-slate-200">Total Tax Liability (1)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {(filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {(filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst + filteredData.reverseChargeCgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {(filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst + filteredData.reverseChargeSgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. ITC Available Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">2. ITC Available (Input Tax Credit)</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[9px] uppercase">
                          <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2.5 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(a) ITC Available (Import of Goods)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(b) ITC Available (Import of Services)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200 leading-normal">(c) ITC Available (Inward Supplies other than (a) & (b) above)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-emerald-600">
                            {filteredData.totalItcCgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums text-emerald-600">
                            {filteredData.totalItcSgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200 leading-normal">(d) ITC Available (Inward Supplies liable to reverse charge)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {filteredData.reverseChargeCgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {filteredData.reverseChargeSgst.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(e) ITC Available (Other)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr className="bg-[#e6efff] font-extrabold text-[#0050e8] border-t border-slate-250">
                          <td className="py-3 px-3 border-r border-slate-200">Total ITC Available (2)</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {(filteredData.totalItcCgst + filteredData.reverseChargeCgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">
                            {(filteredData.totalItcSgst + filteredData.reverseChargeSgst).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Other ITC Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">4. Other ITC</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[9px] uppercase">
                          <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2.5 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(a) ITC Reversed</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(b) ITC Ineligible</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">(c) ITC Reclaimed</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 border-r border-slate-200 text-right tabular-nums">0.00</td>
                          <td className="py-3 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Value of Supplies */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">5. Value of Supplies</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[9px] uppercase">
                          <th className="py-2.5 px-3 border-r border-slate-200">Description</th>
                          <th className="py-2.5 px-3 text-right w-44">Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">Total Value of Outward Supplies (including exempted supplies)</td>
                          <td className="py-3 px-3 text-right tabular-nums font-bold">
                            {(filteredData.totalB2bTaxable + filteredData.totalB2cLargeTaxable + filteredData.totalB2cSmallTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 border-r border-slate-200">Total Value of Inward Supplies (including exempted supplies)</td>
                          <td className="py-3 px-3 text-right tabular-nums font-bold">
                            {filteredData.totalItcTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: 3. Net Tax Liability Sticky Card & 6. Payment of Tax */}
              <div className="space-y-6">
                {/* Net Tax Liability Box */}
                <div className="bg-[#fcfdfd] border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans sticky top-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">3. Net Tax Liability</h3>

                  <div className="space-y-3">
                    {/* Tax Liability */}
                    <div className="bg-[#ebf4fc] border border-[#cce3f9] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold text-[#2b6cb0] uppercase">Total Tax Liability (1)</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-slate-900">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Integrated Tax</span>
                          <span>₹ {(filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Central Tax</span>
                          <span className="text-red-550 text-red-500">₹ {(filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst + filteredData.reverseChargeCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="col-span-2 border-t border-blue-200 pt-1 flex justify-between text-[10px] mt-1">
                          <span className="text-slate-400 font-medium">State/UT Tax:</span>
                          <span className="text-red-550 text-red-500">₹ {(filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst + filteredData.reverseChargeSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* ITC Available */}
                    <div className="bg-[#eefcf2] border border-[#cef7d9] p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold text-[#2f855a] uppercase">Total ITC Available (2)</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-slate-900">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Integrated Tax</span>
                          <span>₹ 0.00</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Central Tax</span>
                          <span className="text-emerald-700">₹ {(filteredData.totalItcCgst + filteredData.reverseChargeCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="col-span-2 border-t border-emerald-200 pt-1 flex justify-between text-[10px] mt-1">
                          <span className="text-slate-400 font-medium">State/UT Tax:</span>
                          <span className="text-emerald-700">₹ {(filteredData.totalItcSgst + filteredData.reverseChargeSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Payable */}
                    {(() => {
                      const netIgst = (filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst);
                      const netCgst = (filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst + filteredData.reverseChargeCgst) - (filteredData.totalItcCgst + filteredData.reverseChargeCgst);
                      const netSgst = (filteredData.totalB2bSgst + filteredData.totalB2cSmallSgst + filteredData.reverseChargeSgst) - (filteredData.totalItcSgst + filteredData.reverseChargeSgst);
                      return (
                        <div className="bg-[#fff8ee] border border-[#ffe2bf] p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-[#c05621] uppercase">Net Tax Payable (1 - 2)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-slate-900">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-medium">Integrated Tax</span>
                              <span className={netIgst > 0 ? 'text-red-500' : 'text-emerald-650 text-emerald-700'}>₹ {netIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-medium">Central Tax</span>
                              <span className={netCgst > 0 ? 'text-red-500' : 'text-emerald-650 text-emerald-700'}>₹ {netCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="col-span-2 border-t border-orange-200 pt-1 flex justify-between text-[10px] mt-1">
                              <span className="text-slate-400 font-medium">State/UT Tax:</span>
                              <span className={netSgst > 0 ? 'text-red-500' : 'text-emerald-650 text-emerald-700'}>₹ {netSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 6. Payment of Tax */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">6. Payment of Tax</h3>
                  <div className="grid grid-cols-2 gap-2.5 text-center text-[10px] font-bold text-slate-850">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-slate-400 block font-medium">Integrated Tax</span>
                      <p className="text-xs font-black mt-1">
                        {(() => {
                          const netIgst = (filteredData.totalB2bIgst + filteredData.totalB2cLargeTax + filteredData.totalB2cSmallIgst);
                          return netIgst > 0 ? `₹ ${netIgst.toFixed(2)}` : '₹ 0.00';
                        })()}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-slate-400 block font-medium">Central Tax</span>
                      <p className="text-xs font-black mt-1">
                        {(() => {
                          const netCgst = (filteredData.totalB2bCgst + filteredData.totalB2cSmallCgst + filteredData.reverseChargeCgst) - (filteredData.totalItcCgst + filteredData.reverseChargeCgst);
                          return netCgst > 0 ? `₹ ${netCgst.toFixed(2)}` : '₹ 0.00';
                        })()}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-slate-400 block font-medium">State/UT Tax</span>
                      <p className="text-xs font-black mt-1">
                        {(() => {
                          const netSgst = (filteredData.totalB2bSgst + (filteredData.totalB2cSmallSgst) + filteredData.reverseChargeSgst) - (filteredData.totalItcSgst + filteredData.reverseChargeSgst);
                          return netSgst > 0 ? `₹ ${netSgst.toFixed(2)}` : '₹ 0.00';
                        })()}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-slate-400 block font-medium">Cess</span>
                      <p className="text-xs font-black mt-1">₹ 0.00</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center mt-4 max-w-2xl mx-auto">
              This invoice is generated using TruBill, a billing automation tool. 
              TruBill does not verify or guarantee GST compliance, tax accuracy, or 
              filing correctness. Users are responsible for verifying GST details 
              and are advised to consult a Chartered Accountant for compliance and 
              filing matters.
            </p>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
