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

  const stats = useMemo(() => {
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

    let outwardTaxable = 0;
    let cgstCollected = 0;
    let sgstCollected = 0;
    let b2bSalesCount = 0;
    let b2csSalesCount = 0;

    periodInvoices.forEach((inv) => {
      cgstCollected += Number(inv.total_cgst || 0);
      sgstCollected += Number(inv.total_sgst || 0);
      outwardTaxable += Number(inv.subtotal || inv.total - (inv.total_cgst || 0) - (inv.total_sgst || 0));
      if (inv.customer_gstin) b2bSalesCount++;
      else b2csSalesCount++;
    });

    let inwardTaxable = 0;
    let cgstPaid = 0;
    let sgstPaid = 0;

    periodPurchases.forEach((p) => {
      inwardTaxable += Number(p.subtotal || 0);
      if (p.itc_eligible) {
        cgstPaid += Number(p.total_cgst || 0);
        sgstPaid += Number(p.total_sgst || 0);
      }
    });

    let notesAdjustedCgst = 0;
    let notesAdjustedSgst = 0;

    periodNotes.forEach((n) => {
      const factor = n.note_type === 'credit' ? -1 : 1;
      notesAdjustedCgst += Number(n.total_cgst || 0) * factor;
      notesAdjustedSgst += Number(n.total_sgst || 0) * factor;
    });

    const netCgstLiability = cgstCollected + notesAdjustedCgst - cgstPaid;
    const netSgstLiability = sgstCollected + notesAdjustedSgst - sgstPaid;

    return {
      outwardTaxable,
      cgstCollected,
      sgstCollected,
      inwardTaxable,
      cgstPaid,
      sgstPaid,
      notesAdjustedCgst,
      notesAdjustedSgst,
      netCgstLiability,
      netSgstLiability,
      invoicesCount: periodInvoices.length,
      b2bSalesCount,
      b2csSalesCount,
      purchasesCount: periodPurchases.length,
      notesCount: periodNotes.length,
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
          <div className="bg-white rounded-none border border-[#e5e7eb] p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-none flex items-center justify-center mx-auto border border-amber-250">
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
        {/* Header matching dashboard profile logo format */}
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
                GST Compliance Hub · Tamil Nadu State Code: 33 · GSTIN: <span className="font-mono font-bold">{shop.gstin}</span>
              </p>
            </div>
          </div>

          {/* Period selector */}
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

        {/* Vyapar Grid Style Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wide">Output GST (Collected)</span>
            <p className="text-xl font-extrabold text-[#16a34a] mt-2">
              ₹{Number(stats.cgstCollected + stats.sgstCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#1d4ed8] uppercase tracking-wide">Input GST (ITC Claimed)</span>
            <p className="text-xl font-extrabold text-[#2563eb] mt-2">
              ₹{Number(stats.cgstPaid + stats.sgstPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wide">CDN Adjustments</span>
            <p className="text-xl font-extrabold text-[#d97706] mt-2">
              ₹{Number(stats.notesAdjustedCgst + stats.notesAdjustedSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`p-4 flex flex-col justify-between min-h-[90px] rounded-none border ${stats.netCgstLiability + stats.netSgstLiability > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${stats.netCgstLiability + stats.netSgstLiability > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              Net Tax Payable / Credit
            </span>
            <p className={`text-xl font-extrabold mt-2 ${stats.netCgstLiability + stats.netSgstLiability > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ₹{Number(stats.netCgstLiability + stats.netSgstLiability).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Validator Pre-audit Summary */}
        {validationResult && (
          <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-xs mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <span>Filing Compliance Checklist</span>
                {validating && <span className="text-[10px] text-gray-400 lowercase italic">Auditing...</span>}
              </h2>
              {!validating && (
                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-none uppercase tracking-wide ${validationResult.isValid ? 'bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {validationResult.isValid ? 'Clean Check ✓' : 'Issues Detected'}
                </span>
              )}
            </div>

            {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
              <p className="text-xs text-emerald-600 font-semibold">
                GST portal checks passed. Invoices are ready for filing.
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

        {/* Tabular Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Outward Sales Summary */}
          <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-xs lg:col-span-2">
            <h3 className="text-xs font-bold text-[#1a1d26] uppercase tracking-wider mb-4 border-b border-[#f3f4f6] pb-2">
              Outward Inward Tax Worksheet
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                <thead>
                  <tr className="bg-[#f9fafb] text-[#111827] font-bold border-b border-[#e5e7eb]">
                    <th className="py-2.5 px-3">Transaction Head</th>
                    <th className="py-2.5 px-3 text-right">Base Amount</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  <tr>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      Outward Sales ({stats.invoicesCount} Bills)
                      <span className="block text-[9px] text-gray-400 font-medium font-mono">B2B: {stats.b2bSalesCount} · B2CS: {stats.b2csSalesCount}</span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">₹{stats.outwardTaxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{stats.cgstCollected.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{stats.sgstCollected.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      Inward Purchases ({stats.purchasesCount} Bills)
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">₹{stats.inwardTaxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-emerald-600 tabular-nums">₹{stats.cgstPaid.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-emerald-600 tabular-nums">₹{stats.sgstPaid.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      Credit & Debit Notes ({stats.notesCount} Notes)
                    </td>
                    <td className="py-3 px-3 text-right">—</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {stats.notesAdjustedCgst < 0 ? '-' : '+'}₹{Math.abs(stats.notesAdjustedCgst).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {stats.notesAdjustedSgst < 0 ? '-' : '+'}₹{Math.abs(stats.notesAdjustedSgst).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-[#fcfdfd] border-t border-[#e5e7eb] font-bold text-[#111827]">
                    <td className="py-3 px-3">Net Liabilities</td>
                    <td className="py-3 px-3 text-right">—</td>
                    <td className={`py-3 px-3 text-right tabular-nums ${stats.netCgstLiability > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      ₹{stats.netCgstLiability.toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 text-right tabular-nums ${stats.netSgstLiability > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      ₹{stats.netSgstLiability.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Exporters sidebar panel */}
          <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#1a1d26] uppercase tracking-wider mb-4 border-b border-[#f3f4f6] pb-2">
                Export Options
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">GSTR-1 JSON</h4>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Upload directly to the GSTN Common Portal to file monthly outward sales invoices.
                  </p>
                  <Button
                    onClick={handleExportGstr1}
                    disabled={validationResult ? !validationResult.isValid : false}
                    className="w-full mt-3 py-2 min-h-0 text-xs"
                  >
                    Download GSTR-1 File
                  </Button>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">GSTR-3B Summary</h4>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Export GSTR-3B summary values to compute final tax payments.
                  </p>
                  <Button
                    onClick={handleExportGstr3b}
                    className="w-full mt-3 py-2 min-h-0 text-xs"
                    variant="ghost"
                  >
                    Download GSTR-3B File
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-[9px] text-[#9ca3af] mt-4 font-semibold text-center italic">
              * Generates official GST Offline Utility JSON formats.
            </p>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
