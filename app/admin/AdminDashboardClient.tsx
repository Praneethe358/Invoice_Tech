'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { toTitleCase } from '@/utils/format';

interface ShopRow {
  id: string;
  name: string;
  shop_type: string;
  gstin: string | null;
  phone: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  owner_email: string;
  invoice_count: number;
}

interface AnalyticsData {
  revenue: { active_shops: number; mrr: number; new_shops: number; churned: number; net_growth: number };
  usage: { invoices_this_month: number; total_invoices: number; avg_per_shop: number; most_active: { name: string; count: number } };
  type_breakdown: Record<string, number>;
  growth_data: { month: string; shops: number }[];
  gst: { registered: number; total: number; percentage: number };
}

interface Stats {
  total_shops: number;
  active: number;
  trial: number;
  expired: number;
  cancelled: number;
  total_invoices: number;
  mrr: number;
  new_this_month: number;
  exports_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700 border-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.05)]',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.05)]',
  expired: 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.05)]',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
};

const SHOP_EMOJIS: Record<string, string> = {
  fertilizer: '🌱', clothing: '👗', grocery: '🛒', hardware: '🔧',
  electronics: '📱', medical: '💊', stationery: '📝', bakery: '🍞',
  restaurant: '🍽️', other: '🏪',
};

const TABS = ['all', 'trial', 'active', 'expired', 'cancelled'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const shops = payload[0].value;
    const mrr = shops * 349;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-3.5 rounded-xl shadow-xl text-xs">
        <p className="font-extrabold text-slate-900 mb-1.5">{label}</p>
        <div className="space-y-1 font-bold">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Total Shops:</span>
            <span className="font-black text-slate-800 ml-auto">{shops}</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Estimated MRR:</span>
            <span className="font-black text-slate-800 ml-auto">₹{(mrr).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [growthRange, setGrowthRange] = useState<'1m' | '3m' | '6m'>('1m');
  const [growthLoading, setGrowthLoading] = useState(false);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [adminShop, setAdminShop] = useState<ShopRow | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Activate panel state
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [paymentRef, setPaymentRef] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);

  // Expire/Cancel modal state
  const [expireTarget, setExpireTarget] = useState<{ id: string; name: string; action: string } | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [expireLoading, setExpireLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGrowth = async (r: '1m' | '3m' | '6m') => {
    setGrowthLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      const data = await res.json();
      if (data.growth_data) {
        setAnalytics(prev => prev ? { ...prev, growth_data: data.growth_data } : null);
      }
    } catch { /* ignore */ }
    setGrowthLoading(false);
  };

  // Fetch stats and analytics
  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch(`/api/admin/analytics?range=${growthRange}`).then(r => r.json()).then(setAnalytics).catch(() => {});
  }, []);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, status: statusFilter, page: String(page), sort, order,
      });
      const res = await fetch(`/api/admin/shops?${params}`);
      const data = await res.json();
      setShops(data.shops || []);
      setAdminShop(data.adminShop || null);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, statusFilter, page, sort, order]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('asc'); }
  };

  const handleActivate = async (shopId: string) => {
    setActivateLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration, payment_reference: paymentRef }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Subscription activated ✓');
        setActivatingId(null);
        setPaymentRef('');
        setDuration(1);
        fetchShops();
        fetch('/api/admin/stats').then(r => r.json()).then(setStats);
        fetch(`/api/admin/analytics?range=${growthRange}`).then(r => r.json()).then(setAnalytics).catch(() => {});
      } else {
        showToast(data.error || 'Failed');
      }
    } catch { showToast('Network error'); }
    setActivateLoading(false);
  };

  const handleExpire = async () => {
    if (!expireTarget) return;
    setExpireLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${expireTarget.id}/expire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_shop_name: confirmName, action: expireTarget.action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Subscription ${expireTarget.action === 'cancel' ? 'cancelled' : 'expired'} ✓`);
        setExpireTarget(null);
        setConfirmName('');
        fetchShops();
        fetch('/api/admin/stats').then(r => r.json()).then(setStats);
        fetch(`/api/admin/analytics?range=${growthRange}`).then(r => r.json()).then(setAnalytics).catch(() => {});
      } else {
        showToast(data.error || 'Failed');
      }
    } catch { showToast('Network error'); }
    setExpireLoading(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const isDateUrgent = (d: string | null) => {
    if (!d) return false;
    return new Date(d) < new Date();
  };

  const isDateWarning = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  const typeChartData = analytics
    ? Object.entries(analytics.type_breakdown).map(([type, count]) => ({
        name: `${SHOP_EMOJIS[type] || '🏪'} ${type}`,
        count,
      }))
    : [];

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

  const statCards = stats ? [
    {
      label: 'Total Shops',
      value: stats.total_shops,
      icon: (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      bg: 'border-t-blue-500',
      pillBg: 'bg-blue-50 border border-blue-100',
      trend: stats.new_this_month > 0 ? `+${stats.new_this_month} new this month` : 'Steady growth'
    },
    {
      label: 'Active Subs',
      value: stats.active,
      icon: (
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      bg: 'border-t-emerald-500',
      pillBg: 'bg-emerald-50 border border-emerald-100',
      trend: stats.total_shops > 0 ? `${Math.round((stats.active / stats.total_shops) * 100)}% conversion` : '0% conversion'
    },
    {
      label: 'Trial Shops',
      value: stats.trial,
      icon: (
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      bg: 'border-t-amber-500',
      pillBg: 'bg-amber-50 border border-amber-100',
      trend: stats.total_shops > 0 ? `${Math.round((stats.trial / stats.total_shops) * 100)}% on trial` : '0% on trial'
    },
    {
      label: 'Expired',
      value: stats.expired,
      icon: (
        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      bg: 'border-t-rose-500',
      pillBg: 'bg-rose-50 border border-rose-100',
      trend: stats.total_shops > 0 ? `${Math.round((stats.expired / stats.total_shops) * 100)}% expired` : '0% expired'
    },
    {
      label: 'Total Invoices',
      value: stats.total_invoices.toLocaleString('en-IN'),
      icon: (
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      bg: 'border-t-indigo-500',
      pillBg: 'bg-indigo-50 border border-indigo-100',
      trend: 'Platform-wide usage'
    },
    {
      label: 'MRR',
      value: `₹${stats.mrr.toLocaleString('en-IN')}`,
      icon: (
        <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      bg: 'border-t-violet-500',
      pillBg: 'bg-violet-50 border border-violet-100',
      trend: '₹349/mo gate active'
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 border border-slate-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className={`bg-white border-t-4 border-x border-b border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
              <div className={`w-8 h-8 rounded-xl ${card.pillBg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{card.value}</p>
            {card.trend && (
              <p className="text-[9px] font-bold text-slate-500 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {card.trend}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Visual Insights Section */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue & Growth Trend */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📈</span> Shop Growth & Revenue Trend
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Cumulative shop registrations and monthly run-rate {growthRange === '1m' ? '(Last 30 Days)' : growthRange === '3m' ? '(Last 12 Weeks)' : '(Last 6 Months)'}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  {(['1m', '3m', '6m'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setGrowthRange(r);
                        fetchGrowth(r);
                      }}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all duration-250 uppercase ${
                        growthRange === r
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/10" /> Total Shops & Revenue Trend
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full relative">
              {growthLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                  Updating Chart...
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.growth_data}>
                  <defs>
                    <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} interval={growthRange === '1m' ? 4 : 0} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="shops" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShops)" dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Shop Type Share */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <span>🍰</span> Shop Category Share
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-6">Distribution by business category</p>
            </div>
            
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 10,
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{stats?.total_shops}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Shops</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-[9px] font-black text-slate-600">
              {typeChartData.slice(0, 4).map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{entry.name}</span>
                  <span className="text-slate-400 ml-auto tabular-nums">{entry.count}</span>
                </div>
              ))}
              {typeChartData.length > 4 && (
                <div className="flex items-center gap-1.5 text-slate-400 col-span-2 justify-center pt-2 border-t border-slate-100 font-bold">
                  + {typeChartData.length - 4} other categories
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Platform Health Section */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>🛡️</span> Platform Health
            </h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Manual Full Data Exports (Last 30 Days)
                </p>
                <p className="text-xs font-medium text-slate-600">
                  Total requests compiled and downloaded safely.
                </p>
              </div>
              <p className="text-3xl font-black text-slate-900 tabular-nums">
                {stats.exports_count || 0}
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Database Backup Status
                </p>
                <p className="text-xs font-medium text-slate-600">
                  Automated Supabase daily backups enabled.
                </p>
              </div>
              <span className="px-3 py-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                Successful
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap border transition-all duration-300 ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(37,99,235,0.2)]'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab} {tab !== 'all' && stats ? `(${stats[tab as keyof Stats] || 0})` : ''}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search shop name or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] placeholder-slate-400 transition-all duration-300"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {/* Admin Shop Special Section */}
      {adminShop && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-350/40 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-450/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-550/20 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
              👑
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-800">{toTitleCase(adminShop.name)}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white border border-amber-400 shadow-xs uppercase tracking-wider">
                  Platform Owner (Admin)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {SHOP_EMOJIS[adminShop.shop_type] || '🏪'} {adminShop.shop_type}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                Email: <span className="text-slate-700 font-black">{adminShop.owner_email}</span> | Shop ID: <span className="text-slate-500 font-mono select-all">{adminShop.id}</span>
              </p>
              <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold pt-1">
                <span>Invoices: <span className="text-slate-800 font-black">{adminShop.invoice_count}</span></span>
                <span>•</span>
                <span>Subscription: <span className="text-emerald-600 font-black uppercase">PERMANENT FREE ACCESS</span></span>
                <span>•</span>
                <span>Joined: <span className="text-slate-700 font-extrabold">{formatDate(adminShop.created_at)}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/admin/shops/${adminShop.id}`)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs transition-all duration-300"
            >
              View Developer Dashboard
            </button>
            <span className="px-3 py-2 rounded-xl text-[10px] font-black bg-amber-500/10 text-amber-700 border border-amber-300/30">
              Money Calc Bypassed
            </span>
          </div>
        </motion.div>
      )}

      {/* Shops Table */}
      <div className="hidden md:block bg-white border border-slate-250/80 rounded-2xl shadow-xs overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {[
                { key: 'name', label: 'Shop Name' },
                { key: 'shop_type', label: 'Type' },
                { key: 'owner_email', label: 'Owner Email' },
                { key: 'gstin', label: 'GSTIN' },
                { key: 'subscription_status', label: 'Status' },
                { key: 'subscription_ends_at', label: 'Trial/Sub Ends' },
                { key: 'invoice_count', label: 'Invoices' },
                { key: 'created_at', label: 'Joined' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="py-4 px-5 cursor-pointer hover:text-slate-700 select-none whitespace-nowrap transition-colors"
                >
                  {col.label}
                  {sort === col.key && <span className="ml-1 text-blue-600">{order === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              <th className="py-4 px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-bold">Loading shop accounts...</td></tr>
            ) : shops.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-bold">No shop accounts found</td></tr>
            ) : shops.map((shop, idx) => (
              <Fragment key={shop.id}>
                <tr
                  className={`hover:bg-slate-50/30 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/20' : ''} ${activatingId === shop.id ? 'border-l-4 border-l-blue-600' : ''}`}
                >
                  <td className="py-4 px-5">
                    <button onClick={() => router.push(`/admin/shops/${shop.id}`)} className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors text-left">
                      {toTitleCase(shop.name)}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-semibold whitespace-nowrap">
                    <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/50 mr-1.5">{SHOP_EMOJIS[shop.shop_type] || '🏪'}</span>
                    {shop.shop_type}
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-bold">{shop.owner_email}</td>
                  <td className="py-4 px-5 text-slate-500 font-mono text-[10px] tracking-wide">{shop.gstin || '—'}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[shop.subscription_status] || STATUS_COLORS.cancelled}`}>
                      {shop.subscription_status}
                    </span>
                  </td>
                  <td className={`py-4 px-5 font-black tabular-nums ${
                    isDateUrgent(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-rose-600' :
                    isDateWarning(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {formatDate(shop.subscription_ends_at || shop.trial_ends_at)}
                  </td>
                  <td className="py-4 px-5 text-slate-800 font-extrabold tabular-nums">{shop.invoice_count}</td>
                  <td className="py-4 px-5 text-slate-500 font-semibold tabular-nums">{formatDate(shop.created_at)}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5">
                      {shop.subscription_status !== 'active' ? (
                        <button
                          onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all duration-300"
                        >Activate</button>
                      ) : (
                        <button
                          onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all duration-300"
                        >Extend</button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/shops/${shop.id}`)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all duration-300"
                      >Details</button>
                      <div className="relative group">
                        <button className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-white text-slate-400 border border-slate-200 hover:bg-slate-50">⋯</button>
                        <div className="hidden group-hover:block absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[140px] py-1">
                          <button
                            onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'expire' })}
                            className="w-full text-left px-3.5 py-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                          >Expire Now</button>
                          <button
                            onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'cancel' })}
                            className="w-full text-left px-3.5 py-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                          >Cancel Subscription</button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Inline Activate Panel */}
                {activatingId === shop.id && (
                  <tr key={`activate-${shop.id}`}>
                    <td colSpan={9} className="p-0">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-l-4 border-l-blue-600 bg-slate-50/60 px-6 py-5"
                      >
                        <p className="text-xs font-bold text-slate-700 mb-4">
                          {shop.subscription_status === 'active' ? 'Extend' : 'Activate'} subscription for <span className="text-blue-600 font-extrabold">{shop.name}</span>
                        </p>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {[
                            { m: 1, label: '1 Month', price: '₹349' },
                            { m: 3, label: '3 Months', price: '₹1,047' },
                            { m: 6, label: '6 Months', price: '₹2,094' },
                            { m: 12, label: '1 Year', price: '₹4,188' },
                          ].map(opt => (
                            <button
                              key={opt.m}
                              onClick={() => setDuration(opt.m)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                                duration === opt.m
                                  ? 'bg-blue-600 text-white border-transparent shadow-[0_4px_10px_rgba(37,99,235,0.2)]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {opt.label} <span className="opacity-70 font-semibold">({opt.price})</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Reference (optional)</label>
                            <input
                              type="text"
                              placeholder="UPI transaction ID or note"
                              value={paymentRef}
                              onChange={e => setPaymentRef(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => handleActivate(shop.id)}
                            disabled={activateLoading}
                            className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all duration-300"
                          >
                            {activateLoading ? 'Processing...' : 'Confirm Activate'}
                          </button>
                          <button
                            onClick={() => { setActivatingId(null); setPaymentRef(''); setDuration(1); }}
                            className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                          >Cancel</button>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Shop Cards List */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">No shops found</div>
        ) : (
          shops.map((shop) => (
            <div key={shop.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <button onClick={() => router.push(`/admin/shops/${shop.id}`)} className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors text-left leading-tight">
                    {toTitleCase(shop.name)}
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{shop.owner_email}</p>
                </div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[shop.subscription_status] || STATUS_COLORS.cancelled}`}>
                  {shop.subscription_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                <div>
                  <span className="block text-[8px] font-black text-slate-455 uppercase tracking-widest">Type</span>
                  <span className="font-extrabold text-slate-700">{SHOP_EMOJIS[shop.shop_type] || '🏪'} {shop.shop_type}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-455 uppercase tracking-widest">Invoices</span>
                  <span className="font-extrabold text-slate-700">{shop.invoice_count}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-455 uppercase tracking-widest">Ends On</span>
                  <span className={`font-black ${
                    isDateUrgent(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-rose-600' :
                    isDateWarning(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-amber-600' : 'text-slate-600'
                  }`}>{formatDate(shop.subscription_ends_at || shop.trial_ends_at)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-455 uppercase tracking-widest">Joined</span>
                  <span className="font-bold text-slate-600">{formatDate(shop.created_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => router.push(`/admin/shops/${shop.id}`)}
                  className="flex-1 py-2 rounded-xl text-xs font-black bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all duration-300"
                >
                  View Details
                </button>
                {shop.subscription_status !== 'active' ? (
                  <button
                    onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all duration-300"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-blue-55 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all duration-300"
                  >
                    Extend
                  </button>
                )}
                <div className="relative group">
                  <button className="px-3 py-2 rounded-xl text-xs font-black bg-white text-slate-400 border border-slate-200 hover:bg-slate-50">⋯</button>
                  <div className="hidden group-hover:block absolute right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[140px] py-1">
                    <button
                      onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'expire' })}
                      className="w-full text-left px-3.5 py-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >Expire Now</button>
                    <button
                      onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'cancel' })}
                      className="w-full text-left px-3.5 py-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >Cancel Subscription</button>
                  </div>
                </div>
              </div>

              {activatingId === shop.id && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-2">
                  <p className="text-xs font-bold text-slate-700">
                    Select duration for <span className="text-blue-600 font-extrabold">{shop.name}</span>:
                  </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { m: 1, label: '1 Mo', price: '₹349' },
                        { m: 3, label: '3 Mo', price: '₹1,047' },
                        { m: 6, label: '6 Mo', price: '₹2,094' },
                        { m: 12, label: '1 Yr', price: '₹4,188' },
                      ].map(opt => (
                      <button
                        key={opt.m}
                        onClick={() => setDuration(opt.m)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                          duration === opt.m
                            ? 'bg-blue-600 text-white border-transparent'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt.label} ({opt.price})
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Reference/Note"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleActivate(shop.id)}
                      disabled={activateLoading}
                      className="flex-1 py-2 rounded-xl text-xs font-black bg-blue-600 text-white"
                    >
                      {activateLoading ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => { setActivatingId(null); setPaymentRef(''); setDuration(1); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-655"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} shops
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, page - 3), Math.min(totalPages, page + 2)
            ).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 ${
                  p === page ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Expire/Cancel Confirmation Modal */}
      {expireTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 mb-2 tracking-tight">
              {expireTarget.action === 'cancel' ? 'Cancel' : 'Expire'} Subscription
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              Type <span className="font-extrabold text-slate-800">&quot;{expireTarget.name}&quot;</span> to confirm this action.
            </p>
            <input
              type="text"
              placeholder="Type shop name..."
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2.5">
              <button
                onClick={handleExpire}
                disabled={confirmName.trim().toLowerCase() !== expireTarget.name.trim().toLowerCase() || expireLoading}
                className="flex-1 px-4 py-3 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 transition-all duration-300 shadow-md shadow-rose-600/10"
              >
                {expireLoading ? 'Processing...' : `Confirm ${expireTarget.action === 'cancel' ? 'Cancel' : 'Expire'}`}
              </button>
              <button
                onClick={() => { setExpireTarget(null); setConfirmName(''); }}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 bg-white transition-colors"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
