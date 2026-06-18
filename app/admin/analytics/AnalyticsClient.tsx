'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  if (loading) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Loading...</div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Failed to load</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-black text-slate-900">Platform Analytics</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>{new Date(2026, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none">
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: 'Active Shops', v: data.revenue.active_shops },
          { l: 'MRR', v: `₹${data.revenue.mrr.toLocaleString('en-IN')}` },
          { l: 'New Shops', v: data.revenue.new_shops },
          { l: 'Churned', v: data.revenue.churned },
          { l: 'Net Growth', v: `${data.revenue.net_growth >= 0 ? '+' : ''}${data.revenue.net_growth}` },
        ].map((c, i) => (
          <motion.div key={c.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.l}</span>
            <p className="text-lg font-black text-slate-900 mt-1">{c.v}</p>
          </motion.div>
        ))}
      </div>

      {/* Usage Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Invoices This Month', v: data.usage.invoices_this_month.toLocaleString('en-IN') },
          { l: 'Total Invoices', v: data.usage.total_invoices.toLocaleString('en-IN') },
          { l: 'Avg per Shop', v: data.usage.avg_per_shop },
          { l: 'Most Active', v: `${data.usage.most_active.name} (${data.usage.most_active.count})` },
        ].map((c, i) => (
          <motion.div key={c.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 + 0.3 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.l}</span>
            <p className="text-sm font-black text-slate-900 mt-1 truncate">{c.v}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Shop Type Breakdown</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" fill="#1a6b3c" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Platform Growth (Last 6 Months)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.growth_data}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="shops" stroke="#1a6b3c" strokeWidth={2.5} dot={{ fill: '#1a6b3c', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GST Adoption */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">GST Adoption</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-black text-[#1a6b3c]">{data.gst.registered}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">GST Registered Shops</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{data.gst.total}</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Total Shops</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{data.gst.percentage}%</p>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Adoption Rate</p>
          </div>
        </div>
        <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className="bg-[#1a6b3c] h-full rounded-full transition-all" style={{ width: `${data.gst.percentage}%` }} />
        </div>
      </div>
    </div>
  );
}
