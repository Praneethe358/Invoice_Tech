'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell } from 'recharts';
import { toTitleCase } from '@/utils/format';
import { SecurityAuditLedger } from '@/components/admin/SecurityAuditLedger';

const SHOP_EMOJIS: Record<string, string> = {
  fertilizer: '🌱', clothing: '👗', grocery: '🛒', hardware: '🔧',
  electronics: '📱', medical: '💊', stationery: '📝', bakery: '🍞',
  restaurant: '🍽️', other: '🏪',
};

interface AnalyticsData {
  revenue: { active_shops: number; mrr: number; new_shops: number; churned: number; net_growth: number };
  usage: { invoices_this_month: number; total_invoices: number; avg_per_shop: number; most_active: { name: string; count: number } };
  type_breakdown: Record<string, number>;
  growth_data: { month: string; shops: number }[];
  gst: { registered: number; total: number; percentage: number };
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#14b8a6', // teal
];

export default function AnalyticsClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  const typeChartData = data
    ? Object.entries(data.type_breakdown).map(([type, count]) => ({
        name: `${SHOP_EMOJIS[type] || '🏪'} ${type}`,
        count,
      }))
    : [];

  if (loading) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Loading analytics...</div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Failed to load analytics data</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Platform Analytics</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Overview of business metrics & usage patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0050e8] text-slate-700 shadow-2xs">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{new Date(2026, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0050e8] text-slate-700 shadow-2xs">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Revenue Grid */}
      <div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Revenue & Growth metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              l: 'Active Shops',
              v: data.revenue.active_shops,
              desc: 'Subscribed users',
              icon: (
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ),
              border: 'border-t-emerald-500',
              pillBg: 'bg-emerald-50',
            },
            {
              l: 'MRR',
              v: `₹${data.revenue.mrr.toLocaleString('en-IN')}`,
              desc: 'Monthly Run Rate',
              icon: (
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              border: 'border-t-violet-500',
              pillBg: 'bg-violet-50',
            },
            {
              l: 'New Shops',
              v: data.revenue.new_shops,
              desc: 'Joined this month',
              icon: (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              ),
              border: 'border-t-blue-500',
              pillBg: 'bg-blue-50',
            },
            {
              l: 'Churned',
              v: data.revenue.churned,
              desc: 'Expired or cancelled',
              icon: (
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M19 12H5" />
                </svg>
              ),
              border: 'border-t-rose-500',
              pillBg: 'bg-rose-50',
            },
            {
              l: 'Net Growth',
              v: `${data.revenue.net_growth >= 0 ? '+' : ''}${data.revenue.net_growth}`,
              desc: 'New minus churned',
              icon: (
                <svg className={`w-4 h-4 ${data.revenue.net_growth >= 0 ? 'text-teal-600' : 'text-rose-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <polyline points={data.revenue.net_growth >= 0 ? "23 6 13.5 15.5 8.5 10.5 1 18" : "23 18 13.5 8.5 8.5 13.5 1 6"} />
                  <polyline points={data.revenue.net_growth >= 0 ? "17 6 23 6 23 12" : "17 18 23 18 23 12"} />
                </svg>
              ),
              border: data.revenue.net_growth >= 0 ? 'border-t-teal-500' : 'border-t-rose-500',
              pillBg: data.revenue.net_growth >= 0 ? 'bg-teal-50' : 'bg-rose-50',
            },
          ].map((c, i) => (
            <motion.div
              key={c.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className={`bg-white border-t-4 border-x border-b border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all duration-300 ${c.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.l}</span>
                <div className={`w-8 h-8 rounded-xl ${c.pillBg} flex items-center justify-center`}>
                  {c.icon}
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{c.v}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Usage Grid */}
      <div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activity & usage patterns</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              l: 'Invoices This Month',
              v: data.usage.invoices_this_month.toLocaleString('en-IN'),
              desc: 'Created in selected month',
              icon: (
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              ),
              border: 'border-t-indigo-500',
              pillBg: 'bg-indigo-50',
            },
            {
              l: 'Total Invoices',
              v: data.usage.total_invoices.toLocaleString('en-IN'),
              desc: 'Platform-wide total',
              icon: (
                <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              ),
              border: 'border-t-sky-500',
              pillBg: 'bg-sky-50',
            },
            {
              l: 'Avg Invoices / Shop',
              v: data.usage.avg_per_shop,
              desc: 'In selected month',
              icon: (
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
              border: 'border-t-amber-500',
              pillBg: 'bg-amber-50',
            },
            {
              l: 'Most Active Shop',
              v: toTitleCase(data.usage.most_active.name),
              desc: `${data.usage.most_active.count} invoices this month`,
              icon: (
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ),
              border: 'border-t-rose-500',
              pillBg: 'bg-rose-50',
            },
          ].map((c, i) => (
            <motion.div
              key={c.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 + 0.3 }}
              whileHover={{ y: -2 }}
              className={`bg-white border-t-4 border-x border-b border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all duration-300 ${c.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.l}</span>
                <div className={`w-8 h-8 rounded-xl ${c.pillBg} flex items-center justify-center`}>
                  {c.icon}
                </div>
              </div>
              <p className="text-base font-black text-slate-900 tracking-tight truncate">{c.v}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-2 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                {c.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Shop Type Breakdown</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Distribution of registered shops by category</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4364f7" />
                    <stop offset="100%" stopColor="#6fb1fc" />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    fontSize: 10,
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Platform Growth</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Cumulative shop registrations over the last 6 months</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growth_data}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Area type="monotone" dataKey="shops" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGrowth)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GST Adoption */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">GST Registered Shops</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Adoption rate of official GSTIN registration</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100">
            {data.gst.percentage}% Adoption
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-2xl font-black text-blue-600 tracking-tight">{data.gst.registered}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">GST Registered</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{data.gst.total}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Shops</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{data.gst.percentage}%</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Adoption Rate</p>
          </div>
        </div>
        <div className="px-6">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${data.gst.percentage}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1.5">
            <span>{data.gst.registered} registered</span>
            <span>{data.gst.percentage}%</span>
          </div>
        </div>
      </div>

      {/* Security Audit Ledger */}
      <SecurityAuditLedger />
    </div>
  );
}
