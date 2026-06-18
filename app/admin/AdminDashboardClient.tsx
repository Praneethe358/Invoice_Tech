'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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

interface Stats {
  total_shops: number;
  active: number;
  trial: number;
  expired: number;
  cancelled: number;
  total_invoices: number;
  mrr: number;
  new_this_month: number;
}

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SHOP_EMOJIS: Record<string, string> = {
  fertilizer: '🌱', clothing: '👗', grocery: '🛒', hardware: '🔧',
  electronics: '📱', medical: '💊', stationery: '📝', bakery: '🍞',
  restaurant: '🍽️', other: '🏪',
};

const TABS = ['all', 'trial', 'active', 'expired', 'cancelled'];

export default function AdminDashboardClient() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
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

  // Fetch stats
  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => {});
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

  const statCards = stats ? [
    { label: 'Total Shops', value: stats.total_shops, icon: '🏪' },
    { label: 'Active Subs', value: stats.active, icon: '✅' },
    { label: 'Trial Shops', value: stats.trial, icon: '⏳' },
    { label: 'Expired', value: stats.expired, icon: '❌' },
    { label: 'Total Invoices', value: stats.total_invoices.toLocaleString('en-IN'), icon: '📄' },
    { label: 'MRR', value: `₹${stats.mrr.toLocaleString('en-IN')}`, icon: '💰' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <p className="text-xl font-black text-slate-900 tabular-nums">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap border transition-colors ${
                statusFilter === tab
                  ? 'bg-[#1a6b3c]/10 text-[#1a6b3c] border-[#1a6b3c]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
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
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1a6b3c] placeholder-slate-400"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className="py-3 px-4 cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                >
                  {col.label}
                  {sort === col.key && <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">Loading...</td></tr>
            ) : shops.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">No shops found</td></tr>
            ) : shops.map((shop, idx) => (
              <Fragment key={shop.id}>
                <tr
                  className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''} ${activatingId === shop.id ? 'border-l-4 border-l-[#1a6b3c]' : ''}`}
                >
                  <td className="py-3.5 px-4">
                    <button onClick={() => router.push(`/admin/shops/${shop.id}`)} className="font-bold text-slate-900 hover:text-[#1a6b3c] transition-colors text-left">
                      {shop.name}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {SHOP_EMOJIS[shop.shop_type] || '🏪'} {shop.shop_type}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{shop.owner_email}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">{shop.gstin || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${STATUS_COLORS[shop.subscription_status] || STATUS_COLORS.cancelled}`}>
                      {shop.subscription_status}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-semibold tabular-nums ${
                    isDateUrgent(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-red-600' :
                    isDateWarning(shop.subscription_ends_at || shop.trial_ends_at) ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {formatDate(shop.subscription_ends_at || shop.trial_ends_at)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-bold tabular-nums">{shop.invoice_count}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium tabular-nums">{formatDate(shop.created_at)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {shop.subscription_status !== 'active' ? (
                        <button
                          onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1a6b3c] text-white hover:bg-[#155d33] transition-colors"
                        >Activate</button>
                      ) : (
                        <button
                          onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >Extend</button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/shops/${shop.id}`)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >Details</button>
                      <div className="relative group">
                        <button className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-slate-200">⋯</button>
                        <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[140px] py-1">
                          <button
                            onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'expire' })}
                            className="w-full text-left px-3 py-2 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                          >Expire Now</button>
                          <button
                            onClick={() => setExpireTarget({ id: shop.id, name: shop.name, action: 'cancel' })}
                            className="w-full text-left px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
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
                        className="border-l-4 border-l-[#1a6b3c] bg-[#f8faf9] px-6 py-5"
                      >
                        <p className="text-xs font-bold text-slate-800 mb-4">
                          {shop.subscription_status === 'active' ? 'Extend' : 'Activate'} subscription for <span className="text-[#1a6b3c]">{shop.name}</span>
                        </p>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {[
                            { m: 1, label: '1 Month', price: '₹299' },
                            { m: 3, label: '3 Months', price: '₹897' },
                            { m: 6, label: '6 Months', price: '₹1,794' },
                            { m: 12, label: '1 Year', price: '₹3,588' },
                          ].map(opt => (
                            <button
                              key={opt.m}
                              onClick={() => setDuration(opt.m)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                                duration === opt.m
                                  ? 'bg-[#1a6b3c] text-white border-[#1a6b3c]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {opt.label} <span className="opacity-70">({opt.price})</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Payment Reference (optional)</label>
                            <input
                              type="text"
                              placeholder="UPI transaction ID or note"
                              value={paymentRef}
                              onChange={e => setPaymentRef(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1a6b3c]"
                            />
                          </div>
                          <button
                            onClick={() => handleActivate(shop.id)}
                            disabled={activateLoading}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a6b3c] text-white hover:bg-[#155d33] disabled:opacity-50 transition-colors"
                          >
                            {activateLoading ? 'Processing...' : 'Confirm Activate'}
                          </button>
                          <button
                            onClick={() => { setActivatingId(null); setPaymentRef(''); setDuration(1); }}
                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} shops
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, page - 3), Math.min(totalPages, page + 2)
            ).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold ${
                  p === page ? 'bg-[#1a6b3c] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* Expire/Cancel Confirmation Modal */}
      {expireTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 mb-2">
              {expireTarget.action === 'cancel' ? 'Cancel' : 'Expire'} Subscription
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Type <span className="font-bold text-slate-800">&quot;{expireTarget.name}&quot;</span> to confirm this action.
            </p>
            <input
              type="text"
              placeholder="Type shop name..."
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleExpire}
                disabled={confirmName.trim().toLowerCase() !== expireTarget.name.trim().toLowerCase() || expireLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {expireLoading ? 'Processing...' : `Confirm ${expireTarget.action === 'cancel' ? 'Cancel' : 'Expire'}`}
              </button>
              <button
                onClick={() => { setExpireTarget(null); setConfirmName(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
