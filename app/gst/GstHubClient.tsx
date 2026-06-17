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
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const periodInvoices = invoices.filter(
      (inv) => inv.created_at.split('T')[0] >= startStr && inv.created_at.split('T')[0] <= endStr && inv.status === 'sent'
    );

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

    let totalB2cLargeTaxable = 0;
    let totalB2cLargeTax = 0;

    let totalB2cSmallTaxable = 0;
    let totalB2cSmallTax = 0;

    periodInvoices.forEach((inv) => {
      const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
      const totalTax = Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0);

      if (inv.customer_gstin) {
        b2bSalesList.push(inv);
        totalB2bTaxable += taxableVal;
        totalB2bCgst += Number(inv.total_cgst || 0);
        totalB2bSgst += Number(inv.total_sgst || 0);
      } else {
        // Classify as B2CS or B2CL (Large: unregistered > ₹2.5L and inter-state)
        // Since shop is Tamil Nadu (33), all local sales are B2C Small.
        // If invoice is above 2.5L, we can simulate B2C Large for UI display purposes
        if (inv.total > 250000) {
          b2cLargeList.push(inv);
          totalB2cLargeTaxable += taxableVal;
          totalB2cLargeTax += totalTax;
        } else {
          b2cSmallList.push(inv);
          totalB2cSmallTaxable += taxableVal;
          totalB2cSmallTax += totalTax;
        }
      }
    });

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
        // reverse charge simulation or unregistered inward
        reverseChargeCgst += Number(p.total_cgst || 0);
        reverseChargeSgst += Number(p.total_sgst || 0);
      }
    });

    return {
      b2bSalesList,
      b2cLargeList,
      b2cSmallList,
      creditNotesList,
      debitNotesList,
      totalB2bTaxable,
      totalB2bCgst,
      totalB2bSgst,
      totalB2cLargeTaxable,
      totalB2cLargeTax,
      totalB2cSmallTaxable,
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
    };
  }, [selectedMonth, selectedYear, invoices, purchases, creditDebitNotes]);

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
      <div className="min-h-screen bg-[#f5f6fa]">
        <Navbar />
        <PageTransition className="max-w-lg md:max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white border border-[#e5e7eb] p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-250">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">GST Compliance Not Configured</h2>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
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
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Unified shop header */}
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
                GST Compliance Hub · State Code: 33 (TN) · GSTIN: <span className="font-mono font-bold">{shop.gstin}</span>
              </p>
            </div>
          </div>

          {/* Period selector controls */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
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
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none"
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
        <div className="flex border-b border-[#e5e7eb] mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2.5 text-xs font-extrabold uppercase border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-[#1a6b3c] text-[#1a6b3c]'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            Overview & Pre-Audit
          </button>
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`px-6 py-2.5 text-xs font-extrabold uppercase border-b-2 transition-all ${
              activeTab === 'gstr1'
                ? 'border-[#1a6b3c] text-[#1a6b3c]'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            GSTR-1 (Outward)
          </button>
          <button
            onClick={() => setActiveTab('gstr3b')}
            className={`px-6 py-2.5 text-xs font-extrabold uppercase border-b-2 transition-all ${
              activeTab === 'gstr3b'
                ? 'border-[#1a6b3c] text-[#1a6b3c]'
                : 'border-transparent text-gray-400 hover:text-gray-900'
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
              <div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
                <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wide">Output CGST + SGST</span>
                <p className="text-xl font-extrabold text-[#16a34a] mt-2">
                  ₹{Number(filteredData.totalB2bCgst + filteredData.totalB2bSgst + filteredData.totalB2cSmallTax + filteredData.totalB2cLargeTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
                <span className="text-[10px] font-bold text-[#1d4ed8] uppercase tracking-wide">ITC Earned</span>
                <p className="text-xl font-extrabold text-[#2563eb] mt-2">
                  ₹{Number(filteredData.totalItcCgst + filteredData.totalItcSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
                <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wide">Taxable Inward supply</span>
                <p className="text-xl font-extrabold text-[#d97706] mt-2">
                  ₹{Number(filteredData.totalItcTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">Net Monthly Invoices</span>
                <p className="text-xl font-extrabold text-gray-900 mt-2">
                  {filteredData.periodInvoices.length} Bills
                </p>
              </div>
            </div>

            {/* Validation Panel */}
            {validationResult && (
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                    <span>Pre-Filing Compliance Validator</span>
                    {validating && <span className="text-[10px] text-gray-400 lowercase italic">Validating...</span>}
                  </h2>
                  {!validating && (
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-none uppercase tracking-wide ${validationResult.isValid ? 'bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {validationResult.isValid ? 'Clean Check ✓' : 'Errors Found'}
                    </span>
                  )}
                </div>

                {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
                  <p className="text-xs text-emerald-600 font-semibold">
                    All compliance validations passed. Ready for monthly government upload.
                  </p>
                )}

                <div className="space-y-2.5">
                  {validationResult.errors.map((err, i) => (
                    <div key={`err-${i}`} className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded-none p-3 font-semibold">
                      <svg className="shrink-0 text-red-500 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{err}</span>
                    </div>
                  ))}

                  {validationResult.warnings.map((warn, i) => (
                    <div key={`warn-${i}`} className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-none p-3 font-semibold">
                      <svg className="shrink-0 text-amber-500 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
              <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Generate GSTR-1</h3>
                <p className="text-[10px] text-gray-450 mt-1 mb-4 leading-normal">
                  Creates the standardized GST offline tool format JSON file containing all B2B outward sales, credit notes, and tax-split logs.
                </p>
                <Button
                  onClick={handleExportGstr1}
                  disabled={validationResult ? !validationResult.isValid : false}
                  className="w-full py-2.5 text-xs"
                >
                  Export GSTR-1 JSON
                </Button>
              </div>

              <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Generate GSTR-3B</h3>
                <p className="text-[10px] text-gray-450 mt-1 mb-4 leading-normal">
                  Creates the summary table payload for outward supplies, eligible Input Tax Credit (ITC), and final tax offset computations.
                </p>
                <Button onClick={handleExportGstr3b} className="w-full py-2.5 text-xs" variant="ghost">
                  Export GSTR-3B Summary JSON
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PORTAL ALIGNED GSTR-1 SHEET ─── */}
        {activeTab === 'gstr1' && (
          <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-sm space-y-6 animate-fadeIn font-sans">
            {/* GSTR-1 Top Panel */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 leading-tight">GSTR-1 Worksheet</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Details of Outward Supplies</p>
                </div>
              </div>

              {/* Portal info badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700">
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Fin. Year:</span>
                  <span>{finYearLabel}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Return Period:</span>
                  <span>{returnPeriodLabel}</span>
                </div>
                <button
                  onClick={handleExportGstr1}
                  className="bg-[#2b6cb0] hover:bg-[#2b5c90] text-white font-extrabold px-4.5 py-1.5 flex items-center gap-2 shadow-xs transition-colors text-xs"
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

            {/* 1. Summary Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">1. Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#ebf3fc] border border-[#cce3f9] p-4 text-center rounded-lg">
                  <span className="text-[10px] font-bold text-[#2b6cb0] uppercase">Total B2B Invoices</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">{filteredData.b2bSalesList.length}</p>
                  <p className="text-xs font-extrabold text-gray-900 mt-1">₹ {filteredData.totalB2bTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#eefcf2] border border-[#cef7d9] p-4 text-center rounded-lg">
                  <span className="text-[10px] font-bold text-[#2f855a] uppercase">Total B2C (Large) Invoices</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">{filteredData.b2cLargeList.length}</p>
                  <p className="text-xs font-extrabold text-gray-900 mt-1">₹ {filteredData.totalB2cLargeTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#fff8ee] border border-[#ffe2bf] p-4 text-center rounded-lg">
                  <span className="text-[10px] font-bold text-[#c05621] uppercase">Total B2C (Others)</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">{filteredData.b2cSmallList.length}</p>
                  <p className="text-xs font-extrabold text-gray-900 mt-1">₹ {filteredData.totalB2cSmallTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Total Taxable Value</span>
                </div>

                <div className="bg-[#faf5ff] border border-[#e9d5ff] p-4 text-center rounded-lg">
                  <span className="text-[10px] font-bold text-[#6b46c1] uppercase">Total Credit / Debit Notes</span>
                  <p className="text-2xl font-black text-gray-900 mt-2">{filteredData.periodNotes.length}</p>
                  <p className="text-xs font-extrabold text-gray-900 mt-1">₹ {filteredData.totalCdnTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <span className="text-[9px] text-gray-400 block mt-1">Total Value</span>
                </div>
              </div>
            </div>

            {/* 2. B2B Invoices Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">2. B2B Invoices (4A, 4B, 4C, 6B)</h3>
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                  <thead>
                    <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[10px] uppercase">
                      <th className="py-2 px-3 border-r border-gray-200 text-center w-12">Sr. No.</th>
                      <th className="py-2 px-3 border-r border-gray-200">Invoice No.</th>
                      <th className="py-2 px-3 border-r border-gray-200">Invoice Date</th>
                      <th className="py-2 px-3 border-r border-gray-200">Customer GSTIN</th>
                      <th className="py-2 px-3 border-r border-gray-200 text-right">Taxable Value (₹)</th>
                      <th className="py-2 px-3 border-r border-gray-200 text-right">IGST (₹)</th>
                      <th className="py-2 px-3 border-r border-gray-200 text-right">CGST (₹)</th>
                      <th className="py-2 px-3 border-r border-gray-200 text-right">SGST (₹)</th>
                      <th className="py-2 px-3 text-right">Cess (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.b2bSalesList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-gray-400 italic">No B2B supply transactions this period.</td>
                      </tr>
                    ) : (
                      filteredData.b2bSalesList.map((inv, idx) => {
                        const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
                        return (
                          <tr key={inv.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 border-r border-gray-200 text-center">{idx + 1}</td>
                            <td className="py-2 px-3 border-r border-gray-200 font-mono">{inv.invoice_number}</td>
                            <td className="py-2 px-3 border-r border-gray-200">{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="py-2 px-3 border-r border-gray-200 font-mono font-bold uppercase">{inv.customer_gstin}</td>
                            <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{taxableVal.toFixed(2)}</td>
                            <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                            <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-red-500">{(inv.total_cgst || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-red-500">{(inv.total_sgst || 0).toFixed(2)}</td>
                            <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-[#f7fafc] font-bold text-gray-900 border-t border-gray-250">
                      <td colSpan={4} className="py-2 px-3 border-r border-gray-200">Total</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                        {filteredData.totalB2bTaxable.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                        {filteredData.totalB2bCgst.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                        {filteredData.totalB2bSgst.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. B2C (Large) Invoices Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">3. B2C (Large) Invoices (5A, 5B)</h3>
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                  <thead>
                    <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[10px] uppercase">
                      <th className="py-2 px-3 border-r border-gray-200 text-center w-12">Sr. No.</th>
                      <th className="py-2 px-3 border-r border-gray-200">Invoice No.</th>
                      <th className="py-2 px-3 border-r border-gray-200">Invoice Date</th>
                      <th className="py-2 px-3 border-r border-gray-200">Place Of Supply</th>
                      <th className="py-2 px-3 border-r border-gray-200 text-right">Taxable Value (₹)</th>
                      <th className="py-2 px-3 text-right">Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.b2cLargeList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400 italic">No large unregistered supply invoices (&gt; ₹2.5L inter-state) this period.</td>
                      </tr>
                    ) : (
                      filteredData.b2cLargeList.map((inv, idx) => {
                        const taxableVal = Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
                        const totalTax = Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0);
                        return (
                          <tr key={inv.id} className="hover:bg-gray-50/55">
                            <td className="py-2 px-3 border-r border-gray-200 text-center">{idx + 1}</td>
                            <td className="py-2 px-3 border-r border-gray-200 font-mono">{inv.invoice_number}</td>
                            <td className="py-2 px-3 border-r border-gray-200">{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="py-2 px-3 border-r border-gray-200">Tamil Nadu (33)</td>
                            <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{taxableVal.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{totalTax.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                    <tr className="bg-[#f7fafc] font-bold text-gray-900 border-t border-gray-250">
                      <td colSpan={4} className="py-2 px-3 border-r border-gray-200">Total</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{filteredData.totalB2cLargeTaxable.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{filteredData.totalB2cLargeTax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid for side-by-side Tables 4 and 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4. B2C (Others) Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">4. B2C (Others) Invoices (7)</h3>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                    <thead>
                      <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[10px] uppercase">
                        <th className="py-2 px-3 border-r border-gray-200">Place Of Supply</th>
                        <th className="py-2 px-3 border-r border-gray-200 text-right">Taxable Value (₹)</th>
                        <th className="py-2 px-3 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.b2cSmallList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-400 italic">No retail supplies logged.</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">Tamil Nadu (33)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{filteredData.totalB2cSmallTaxable.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{filteredData.totalB2cSmallTax.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="bg-[#f7fafc] font-bold text-gray-900 border-t border-gray-250">
                        <td className="py-2 px-3 border-r border-gray-200">Total</td>
                        <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{filteredData.totalB2cSmallTaxable.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{filteredData.totalB2cSmallTax.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Credit / Debit Notes Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">5. Credit / Debit Notes (9B)</h3>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                    <thead>
                      <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[10px] uppercase">
                        <th className="py-2 px-3 border-r border-gray-200">Note Type</th>
                        <th className="py-2 px-3 border-r border-gray-200 text-right">Taxable Value (₹)</th>
                        <th className="py-2 px-3 text-right">Total Tax (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.periodNotes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-gray-400 italic">No notes logged this period.</td>
                        </tr>
                      ) : (
                        <>
                          {filteredData.creditNotesList.length > 0 && (
                            <tr>
                              <td className="py-2 px-3 border-r border-gray-200 text-red-650 font-bold">Credit Notes</td>
                              <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                                {filteredData.creditNotesList.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                {filteredData.creditNotesList.reduce((acc, curr) => acc + Number(curr.total_cgst || 0) + Number(curr.total_sgst || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                          {filteredData.debitNotesList.length > 0 && (
                            <tr>
                              <td className="py-2 px-3 border-r border-gray-200 text-emerald-650 font-bold">Debit Notes</td>
                              <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                                {filteredData.debitNotesList.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                {filteredData.debitNotesList.reduce((acc, curr) => acc + Number(curr.total_cgst || 0) + Number(curr.total_sgst || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      <tr className="bg-[#f7fafc] font-bold text-gray-900 border-t border-gray-250">
                        <td className="py-2 px-3 border-r border-gray-200">Total</td>
                        <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">{filteredData.totalCdnTaxable.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{filteredData.totalCdnTax.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GSTR-1 Totals footer box */}
            <div className="bg-[#ebf4fc] border border-[#cce3f9] p-4 text-center">
              <span className="text-[10px] font-bold text-[#2b6cb0] uppercase">GSTR-1 Totals (Outward Supplies)</span>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3 text-xs font-bold text-gray-900">
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total Taxable Value</span>
                  <span className="tabular-nums">₹ {(filteredData.totalB2bTaxable + filteredData.totalB2cLargeTaxable + filteredData.totalB2cSmallTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total IGST</span>
                  <span className="tabular-nums">₹ 0.00</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total CGST</span>
                  <span className="tabular-nums text-red-500">₹ {(filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total SGST</span>
                  <span className="tabular-nums text-red-500">₹ {(filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total Cess</span>
                  <span className="tabular-nums">₹ 0.00</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block uppercase font-medium">Total Tax</span>
                  <span className="tabular-nums">₹ {(filteredData.totalB2bCgst + filteredData.totalB2bSgst + filteredData.totalB2cSmallTax + filteredData.totalB2cLargeTax).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: PORTAL ALIGNED GSTR-3B RETURN SHEET ─── */}
        {activeTab === 'gstr3b' && (
          <div className="space-y-6 animate-fadeIn font-sans">
            {/* GSTR-3B Top Panel */}
            <div className="bg-white border border-[#e5e7eb] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="10" cy="13" r="2" />
                    <line x1="12" y1="15" x2="16" y2="19" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 leading-tight">GSTR-3B Summary</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Summary of Return</p>
                </div>
              </div>

              {/* GSTR-3B Info badge */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700">
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Fin. Year:</span>
                  <span>{finYearLabel}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Return Period:</span>
                  <span>{returnPeriodLabel}</span>
                </div>
                <button
                  onClick={handleExportGstr3b}
                  className="bg-[#2b6cb0] hover:bg-[#2b5c90] text-white font-extrabold px-4.5 py-1.5 flex items-center gap-2 shadow-xs transition-colors text-xs"
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
                <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">1. Tax on Outward and Reverse Charge Inward Supplies</h3>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                      <thead>
                        <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[9px] uppercase">
                          <th className="py-2 px-3 border-r border-gray-200">Description</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200 leading-normal">
                            (a) Outward Taxable Supplies (Other than Zero Rated, Nil Rated and Exempted)
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-red-500">
                            {(filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2)).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-red-500">
                            {(filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2)).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(b) Outward Taxable Supplies (Zero Rated)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(c) Other Outward Supplies (Nil Rated, Exempted)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(d) Inward Supplies (liable to reverse charge)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {filteredData.reverseChargeCgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {filteredData.reverseChargeSgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(e) Non-GST outward supplies</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-center text-gray-400">—</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-center text-gray-400">—</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-center text-gray-400">—</td>
                          <td className="py-2 px-3 text-center text-gray-400">—</td>
                        </tr>
                        <tr className="bg-[#e6f4ea] font-extrabold text-[#1a6b3c] border-t border-gray-250">
                          <td className="py-2 px-3 border-r border-gray-200">Total Tax Liability (1)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {(filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeCgst).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {(filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeSgst).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. ITC Available Table */}
                <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">2. ITC Available (Input Tax Credit)</h3>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                      <thead>
                        <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[9px] uppercase">
                          <th className="py-2 px-3 border-r border-gray-200">Description</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(a) ITC Available (Import of Goods)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(b) ITC Available (Import of Services)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200 leading-normal">(c) ITC Available (Inward Supplies other than (a) & (b) above)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-emerald-600">
                            {filteredData.totalItcCgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums text-emerald-600">
                            {filteredData.totalItcSgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200 leading-normal">(d) ITC Available (Inward Supplies liable to reverse charge)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {filteredData.reverseChargeCgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {filteredData.reverseChargeSgst.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(e) ITC Available (Other)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr className="bg-[#e6f4ea] font-extrabold text-[#1a6b3c] border-t border-gray-250">
                          <td className="py-2 px-3 border-r border-gray-200">Total ITC Available (2)</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {(filteredData.totalItcCgst + filteredData.reverseChargeCgst).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">
                            {(filteredData.totalItcSgst + filteredData.reverseChargeSgst).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Other ITC Table */}
                <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">4. Other ITC</h3>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                      <thead>
                        <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[9px] uppercase">
                          <th className="py-2 px-3 border-r border-gray-200">Description</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Integrated Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">Central Tax (₹)</th>
                          <th className="py-2 px-3 border-r border-gray-200 text-right w-24">State/UT Tax (₹)</th>
                          <th className="py-2 px-3 text-right w-20">Cess (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(a) ITC Reversed</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(b) ITC Ineligible</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">(c) ITC Reclaimed</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 border-r border-gray-200 text-right tabular-nums">0.00</td>
                          <td className="py-2 px-3 text-right tabular-nums">0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Value of Supplies */}
                <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">5. Value of Supplies</h3>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                      <thead>
                        <tr className="bg-[#f7fafc] text-gray-800 font-bold border-b border-gray-200 text-[9px] uppercase">
                          <th className="py-2 px-3 border-r border-gray-200">Description</th>
                          <th className="py-2 px-3 text-right w-44">Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">Total Value of Outward Supplies (including exempted supplies)</td>
                          <td className="py-2 px-3 text-right tabular-nums font-bold">
                            {(filteredData.totalB2bTaxable + filteredData.totalB2cLargeTaxable + filteredData.totalB2cSmallTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 border-r border-gray-200">Total Value of Inward Supplies (including exempted supplies)</td>
                          <td className="py-2 px-3 text-right tabular-nums font-bold">
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
                <div className="bg-[#fcfdfd] border border-gray-200 rounded-lg p-5 shadow-xs space-y-4 font-sans sticky top-6">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-150 pb-2">3. Net Tax Liability</h3>

                  <div className="space-y-3">
                    {/* Tax Liability */}
                    <div className="bg-[#ebf4fc] border border-[#cce3f9] p-3">
                      <span className="text-[10px] font-bold text-[#2b6cb0] uppercase">Total Tax Liability (1)</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-gray-900">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-medium">Integrated Tax</span>
                          <span>₹ 0.00</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-medium">Central Tax</span>
                          <span className="text-red-500">₹ {(filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="col-span-2 border-t border-blue-200 pt-1 flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">State/UT Tax:</span>
                          <span className="text-red-500">₹ {(filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* ITC Available */}
                    <div className="bg-[#eefcf2] border border-[#cef7d9] p-3">
                      <span className="text-[10px] font-bold text-[#2f855a] uppercase">Total ITC Available (2)</span>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-gray-900">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-medium">Integrated Tax</span>
                          <span>₹ 0.00</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block font-medium">Central Tax</span>
                          <span className="text-emerald-600">₹ {(filteredData.totalItcCgst + filteredData.reverseChargeCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="col-span-2 border-t border-emerald-200 pt-1 flex justify-between text-[10px]">
                          <span className="text-gray-400 font-medium">State/UT Tax:</span>
                          <span className="text-emerald-600">₹ {(filteredData.totalItcSgst + filteredData.reverseChargeSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Payable */}
                    {(() => {
                      const netCgst = (filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeCgst) - (filteredData.totalItcCgst + filteredData.reverseChargeCgst);
                      const netSgst = (filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeSgst) - (filteredData.totalItcSgst + filteredData.reverseChargeSgst);
                      return (
                        <div className="bg-[#fff8ee] border border-[#ffe2bf] p-3">
                          <span className="text-[10px] font-bold text-[#c05621] uppercase">Net Tax Payable (1 - 2)</span>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-bold text-gray-900">
                            <div>
                              <span className="text-[9px] text-gray-400 block font-medium">Integrated Tax</span>
                              <span>₹ 0.00</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-400 block font-medium">Central Tax</span>
                              <span className={netCgst > 0 ? 'text-red-500' : 'text-emerald-600'}>₹ {netCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="col-span-2 border-t border-orange-200 pt-1 flex justify-between text-[10px]">
                              <span className="text-gray-400 font-medium">State/UT Tax:</span>
                              <span className={netSgst > 0 ? 'text-red-500' : 'text-emerald-600'}>₹ {netSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 6. Payment of Tax */}
                <div className="bg-white border border-[#e5e7eb] p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">6. Payment of Tax</h3>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-gray-800">
                    <div className="bg-[#f7fafc] border border-gray-200 p-2.5">
                      <span className="text-gray-400 block font-medium">Integrated Tax</span>
                      <p className="text-xs font-black mt-1">₹ 0.00</p>
                    </div>
                    <div className="bg-[#f7fafc] border border-gray-200 p-2.5">
                      <span className="text-gray-400 block font-medium">Central Tax</span>
                      <p className="text-xs font-black mt-1">
                        {(() => {
                          const netCgst = (filteredData.totalB2bCgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeCgst) - (filteredData.totalItcCgst + filteredData.reverseChargeCgst);
                          return netCgst > 0 ? `₹ ${netCgst.toFixed(2)}` : '₹ 0.00';
                        })()}
                      </p>
                    </div>
                    <div className="bg-[#f7fafc] border border-gray-200 p-2.5">
                      <span className="text-gray-400 block font-medium">State/UT Tax</span>
                      <p className="text-xs font-black mt-1">
                        {(() => {
                          const netSgst = (filteredData.totalB2bSgst + (filteredData.totalB2cSmallTax / 2) + (filteredData.totalB2cLargeTax / 2) + filteredData.reverseChargeSgst) - (filteredData.totalItcSgst + filteredData.reverseChargeSgst);
                          return netSgst > 0 ? `₹ ${netSgst.toFixed(2)}` : '₹ 0.00';
                        })()}
                      </p>
                    </div>
                    <div className="bg-[#f7fafc] border border-gray-200 p-2.5">
                      <span className="text-gray-400 block font-medium">Cess</span>
                      <p className="text-xs font-black mt-1">₹ 0.00</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
