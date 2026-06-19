'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toast';
import { Shop } from '@/lib/types';

interface ReportsClientProps {
  shop: Shop;
}

const MONTHS = [
  { val: 1, label: 'January' },
  { val: 2, label: 'February' },
  { val: 3, label: 'March' },
  { val: 4, label: 'April' },
  { val: 5, label: 'May' },
  { val: 6, label: 'June' },
  { val: 7, label: 'July' },
  { val: 8, label: 'August' },
  { val: 9, label: 'September' },
  { val: 10, label: 'October' },
  { val: 11, label: 'November' },
  { val: 12, label: 'December' },
];

export default function ReportsClient({ shop }: ReportsClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Compute Financial Year context
  const getFYContext = (m: number, y: number) => {
    if (m >= 4) {
      return `FY ${y}-${String(y + 1).slice(-2)}`;
    } else {
      return `FY ${y - 1}-${String(y).slice(-2)}`;
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/data?month=${month}&year=${year}`);
      if (!res.ok) throw new Error('Failed to load report data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      showToast(err.message || 'Error loading report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [month, year]);

  const handleExport = async (type: 'pdf' | 'excel') => {
    const isPdf = type === 'pdf';
    if (isPdf) setExportingPdf(true);
    else setExportingExcel(true);

    try {
      const res = await fetch(`/api/reports/${type}?month=${month}&year=${year}`);
      if (!res.ok) throw new Error(`Failed to generate report ${type.toUpperCase()}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `TruBill_Report_${shop.name.replace(/\s+/g, '_')}_${MONTHS.find(m => m.val === month)?.label}_${year}.${isPdf ? 'pdf' : 'xlsx'}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      showToast(`Report ${type.toUpperCase()} downloaded ✓`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      if (isPdf) setExportingPdf(false);
      else setExportingExcel(false);
    }
  };

  // Curated premium palette for payment methods: Blue (Cash), Emerald (UPI), Amber (Bank Transfer), Purple (Other)
  const COLORS = ['#0050e8', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border-b border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-8 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#0050e8] flex items-center justify-center text-white font-heading font-black text-sm">
                  {(shop.name || 'TB').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Business Reports & GST Compliance · Tamil Nadu IN
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider block">Logged In As</span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}!
            </p>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
            Business Reports
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">
            Monthly Business Summary
          </p>
        </div>

        {/* Header Ribbon for controls & title on desktop */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="hidden md:block">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-heading">
              Reports Overview
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
              <span>Monthly Business Summary</span>
              <span className="bg-[#0050e8]/10 text-[#0050e8] px-2 py-0.5 rounded-none text-[10px] font-bold">
                {getFYContext(month, year)}
              </span>
            </p>
          </div>

          {/* Sticky desktop / mobile friendly export buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportingPdf || loading}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-none py-2.5 px-4 text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {exportingPdf ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-red-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                'Export PDF'
              )}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exportingExcel || loading}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 font-bold rounded-none py-2.5 px-4 text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {exportingExcel ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-emerald-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                'Export Excel'
              )}
            </button>
          </div>
        </div>

        {/* Date Selector block */}
        <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-xs mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Select Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-[#e5e7eb] rounded-none px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0050e8]"
            >
              {MONTHS.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Select Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-[#e5e7eb] rounded-none px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0050e8]"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-[#e5e7eb] rounded-none p-6 h-28 animate-pulse" />
              ))}
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-none p-6 h-96 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1 — Sales Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices Sent</span>
                <p className="text-2xl font-black text-slate-900 mt-2">{data.salesSummary.totalInvoicesSent}</p>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed</span>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{data.salesSummary.totalBilled.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{data.salesSummary.totalCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
                <p className="text-2xl font-black text-red-600 mt-2">₹{data.salesSummary.outstanding.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-none p-5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collection Rate</span>
                <p className="text-2xl font-black text-[#0050e8] mt-2">{data.salesSummary.collectionRate}%</p>
              </div>
            </div>

            {/* SECTION 2 — GST Summary (only if gst_registered) */}
            {shop.gst_registered && data.gstSummary && (
              <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                  Section 2 — GST Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Taxable Sales</span>
                    <p className="text-sm font-black text-slate-900 mt-1">₹{data.gstSummary.totalTaxableSales.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">GST Collected (Output)</span>
                    <p className="text-sm font-black text-slate-900 mt-1">₹{data.gstSummary.gstCollected.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">CGST Collected</span>
                    <p className="text-xs font-semibold text-slate-650 mt-1.5">₹{data.gstSummary.cgstCollected.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">SGST Collected</span>
                    <p className="text-xs font-semibold text-slate-650 mt-1.5">₹{data.gstSummary.sgstCollected.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">ITC Available (Purchases)</span>
                    <p className="text-sm font-black text-blue-600 mt-1">₹{data.gstSummary.itcAvailable.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Net GST Payable</span>
                    <p className="text-sm font-black text-red-650 mt-1">₹{data.gstSummary.netGstPayable.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Double grid columns for 3 & 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION 3 — Top Products by Revenue */}
              <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                  Section 3 — Top Products by Revenue
                </h2>
                {data.topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center font-bold">No product sales this month</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-805 font-black uppercase text-[9px] border-b border-[#e5e7eb]">
                          <th className="py-2 px-2 text-center w-12">Rank</th>
                          <th className="py-2 px-2">Product Name</th>
                          <th className="py-2 px-2 text-right">Qty Sold</th>
                          <th className="py-2 px-2 text-right">Revenue</th>
                          <th className="py-2 px-2 text-center">% Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.topProducts.map((p: any, idx: number) => (
                          <tr key={p.name} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-2 text-slate-900 font-extrabold uppercase">{p.name}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{p.qty}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums font-extrabold text-slate-900">₹{p.revenue.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="inline-block px-1.5 py-0.5 rounded-none text-[9px] font-bold bg-slate-100 text-slate-650 border border-slate-200">
                                {p.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 4 — Top Customers by Revenue */}
              <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                  Section 4 — Top Customers by Revenue
                </h2>
                {data.topCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center font-bold">No customer transactions this month</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-805 font-black uppercase text-[9px] border-b border-[#e5e7eb]">
                          <th className="py-2 px-2 text-center w-12">Rank</th>
                          <th className="py-2 px-2">Customer</th>
                          <th className="py-2 px-2 text-center">Invoices</th>
                          <th className="py-2 px-2 text-right">Total Billed</th>
                          <th className="py-2 px-2 text-right">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.topCustomers.map((c: any, idx: number) => (
                          <tr key={c.phone} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-2">
                              <p className="text-slate-950 font-extrabold uppercase">{c.name}</p>
                              <p className="text-[9px] text-slate-405 mt-0.5">{c.phone}</p>
                            </td>
                            <td className="py-2.5 px-2 text-center tabular-nums">{c.invoices}</td>
                            <td className="py-2.5 px-2 text-right font-extrabold text-slate-900 tabular-nums">₹{c.billed.toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-2 text-right text-red-600 tabular-nums">₹{c.outstanding.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5 — Daily Sales Chart */}
            <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                Section 5 — Daily Sales Chart
              </h2>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0050e8" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0050e8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tickFormatter={(val) => {
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          return val % 5 === 0 || val === 1 ? String(val) : '';
                        }
                        return String(val);
                      }}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white border border-[#e5e7eb] p-2.5 rounded-none shadow-md text-xs font-semibold">
                              <p className="font-extrabold text-slate-800">{item.dateLabel}</p>
                              <p className="text-slate-500 mt-1">Invoices: {item.count}</p>
                              <p className="text-[#0050e8] font-bold">Total: ₹{Number(item.total).toLocaleString('en-IN')}</p>
                              {item.hasFailed && <p className="text-red-500 mt-0.5 text-[9px] font-black">⚠️ Contains Failed Invoices</p>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#0050e8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                      dot={({ cx, cy, payload }) => (
                        <circle
                          key={`dot-${payload.day}`}
                          cx={cx}
                          cy={cy}
                          r={payload.total > 0 ? 4 : 0}
                          fill={payload.hasFailed ? '#dc2626' : '#0050e8'}
                          stroke="white"
                          strokeWidth={1.5}
                        />
                      )}
                      activeDot={{ r: 6, fill: '#0050e8', stroke: 'white', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid for 6 & 7 */}
            <div className={shop.gst_registered ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "w-full"}>
              {/* SECTION 6 — Payment Method Breakdown */}
              <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                  Section 6 — Payment Method Breakdown
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-1/2 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.paymentBreakdown.filter((p: any) => p.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.paymentBreakdown
                            .filter((p: any) => p.value > 0)
                            .map((entry: any) => {
                              const origIdx = data.paymentBreakdown.findIndex((x: any) => x.name === entry.name);
                              return (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[origIdx !== -1 ? origIdx : 0]} />
                              );
                            })}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                          contentStyle={{ fontSize: 11, borderRadius: 0, border: '1px solid #e5e7eb' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-3">
                    {data.paymentBreakdown.map((item: any, idx: number) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-none border border-black/5"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="text-slate-650 font-bold">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-900 font-black">₹{item.value.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-slate-400 font-extrabold">{item.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 7 — Purchases Summary (only if gst_registered) */}
              {shop.gst_registered && data.purchasesSummary && (
                <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                    Section 7 — Purchases Summary
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
                      <p className="text-lg font-black text-slate-900 mt-1">₹{data.purchasesSummary.totalPurchases.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total ITC Claimed</span>
                      <p className="text-lg font-black text-[#0050e8] mt-1">₹{data.purchasesSummary.totalItcEarned.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-none overflow-hidden mt-4">
                    <table className="w-full text-left text-xs font-semibold text-slate-650">
                      <thead>
                        <tr className="bg-slate-50 text-slate-805 font-black uppercase text-[9px] border-b border-[#e5e7eb]">
                          <th className="py-2 px-3">Supplier Name</th>
                          <th className="py-2 px-3 text-right">Purchases</th>
                          <th className="py-2 px-3 text-right">ITC Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.purchasesSummary.topSuppliers.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400 italic">No purchases this month</td>
                          </tr>
                        ) : (
                          data.purchasesSummary.topSuppliers.map((s: any) => (
                            <tr key={s.name} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 text-slate-900 font-extrabold uppercase">{s.name}</td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">₹{s.purchases.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-700">₹{s.itc.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8 — Comparison with Last Month */}
            <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-105 pb-3 font-heading">
                Section 8 — Comparison with Last Month
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-650">
                  <thead>
                    <tr className="bg-slate-50 text-slate-805 font-black uppercase text-[9px] border-b border-[#e5e7eb]">
                      <th className="py-2 px-3">Metric</th>
                      <th className="py-2 px-3 text-right">This Month</th>
                      <th className="py-2 px-3 text-right">Last Month</th>
                      <th className="py-2 px-3 text-right">Change (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {[
                      { key: 'billed', label: 'Total Billed', isPrice: true, inverse: false },
                      { key: 'collected', label: 'Collected', isPrice: true, inverse: false },
                      { key: 'outstanding', label: 'Outstanding', isPrice: true, inverse: true },
                      { key: 'sent', label: 'Invoices Sent', isPrice: false, inverse: false },
                    ].map((row) => {
                      const item = data.comparison[row.key];
                      const changeVal = item.change;
                      const isIncrease = changeVal > 0;
                      const isNeutral = changeVal === 0;

                      let colorClass = 'text-slate-655';
                      if (!isNeutral) {
                        if (row.inverse) {
                          colorClass = isIncrease ? 'text-red-600' : 'text-emerald-700';
                        } else {
                          colorClass = isIncrease ? 'text-emerald-700' : 'text-red-600';
                        }
                      }

                      return (
                        <tr key={row.key} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-900">{row.label}</td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            {row.isPrice ? `₹${item.curr.toLocaleString('en-IN')}` : item.curr}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-slate-400">
                            {row.isPrice ? `₹${item.prev.toLocaleString('en-IN')}` : item.prev}
                          </td>
                          <td className={`py-3 px-3 text-right tabular-nums ${colorClass} font-extrabold flex items-center justify-end gap-1`}>
                            {!isNeutral && (
                              <span className="text-xs">
                                {isIncrease ? '↑' : '↓'}
                              </span>
                            )}
                            <span>{Math.abs(changeVal).toFixed(1)}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer with Tamil Nadu 🇮🇳 mention */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Made for Shopkeepers in Tamil Nadu 🇮🇳
        </div>
      </PageTransition>
    </div>
  );
}
