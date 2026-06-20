'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700 border-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.05)]',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.05)]',
  expired: 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.05)]',
  cancelled: 'bg-slate-55 text-slate-500 border-slate-200',
};

interface SubShop {
  id: string; name: string; shop_type: string; phone: string | null;
  subscription_status: string; subscription_ends_at: string | null;
  trial_ends_at: string | null; created_at: string; days_left?: number;
}

export default function SubscriptionsClient() {
  const router = useRouter();
  const [data, setData] = useState<{
    summary: { active_subscriptions: number; mrr: number; trials_ending_soon: number; renewals_due: number };
    renewals_due: SubShop[];
    expired_this_month: SubShop[];
    trials_ending_soon: SubShop[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Activate panel
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [paymentRef, setPaymentRef] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleActivate = async (shopId: string) => {
    setActivateLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration, payment_reference: paymentRef }),
      });
      const d = await res.json();
      if (d.success) { showToast('Activated ✓'); setActivatingId(null); fetchData(); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Error'); }
    setActivateLoading(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold text-sm">Loading subscription datasets...</div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-bold text-sm">Failed to load subscription data</div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 border border-slate-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight">Subscription Management</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Renewals, trials, and billing summaries</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            l: 'Active Subscriptions',
            v: data.summary.active_subscriptions,
            i: (
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
            bg: 'border-t-emerald-500',
            pillBg: 'bg-emerald-50 border border-emerald-100'
          },
          {
            l: 'MRR',
            v: `₹${data.summary.mrr.toLocaleString('en-IN')}`,
            i: (
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ),
            bg: 'border-t-violet-500',
            pillBg: 'bg-violet-50 border border-violet-100'
          },
          {
            l: 'Trials Ending Soon',
            v: data.summary.trials_ending_soon,
            i: (
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            bg: 'border-t-amber-500',
            pillBg: 'bg-amber-50 border border-amber-100'
          },
          {
            l: 'Renewals Due',
            v: data.summary.renewals_due,
            i: (
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            ),
            bg: 'border-t-blue-500',
            pillBg: 'bg-blue-50 border border-blue-100'
          },
        ].map((c, i) => (
          <motion.div
            key={c.l}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -2 }}
            className={`bg-white border-t-4 border-x border-b border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 ${c.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.l}</span>
              <div className={`w-8 h-8 rounded-xl ${c.pillBg} flex items-center justify-center`}>
                {c.i}
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{c.v}</p>
          </motion.div>
        ))}
      </div>

      {/* Renewals Due Table */}
      {data.renewals_due.length > 0 && (
        <div className="bg-white border border-slate-250/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Renewals Due (Within 30 Days)
            </h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-5">Shop Name</th>
                <th className="py-3 px-5">Ends On</th>
                <th className="py-3 px-5">Days Left</th>
                <th className="py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.renewals_due.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => router.push(`/admin/shops/${shop.id}`)}>{shop.name}</td>
                  <td className="py-4 px-5 text-slate-500 font-semibold">{formatDate(shop.subscription_ends_at)}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      (shop.days_left || 0) <= 3 
                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.05)]' 
                        : (shop.days_left || 0) <= 7 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>{shop.days_left} days</span>
                  </td>
                  <td className="py-4 px-5">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all duration-300">Extend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trials Ending Soon */}
      {data.trials_ending_soon.length > 0 && (
        <div className="bg-white border border-slate-250/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Trials Ending This Week
            </h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-5">Shop Name</th>
                <th className="py-3 px-5">Trial Ends</th>
                <th className="py-3 px-5">Days Left</th>
                <th className="py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.trials_ending_soon.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => router.push(`/admin/shops/${shop.id}`)}>{shop.name}</td>
                  <td className="py-4 px-5 text-slate-500 font-semibold">{formatDate(shop.trial_ends_at)}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      (shop.days_left || 0) <= 3 
                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.05)]' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>{shop.days_left} days</span>
                  </td>
                  <td className="py-4 px-5">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all duration-300">Activate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expired */}
      {data.expired_this_month.length > 0 && (
        <div className="bg-white border border-slate-250/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Expired Shops
            </h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-5">Shop Name</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.expired_this_month.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">{shop.name}</td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[shop.subscription_status] || STATUS_COLORS.cancelled}`}>
                      {shop.subscription_status}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all duration-300">Reactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Activate Panel (shared) */}
      {activatingId && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-600"
        >
          <p className="text-xs font-bold text-slate-700 mb-3">Select duration:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { m: 1, l: '1 Month', p: '₹299' }, 
              { m: 3, l: '3 Months', p: '₹897' }, 
              { m: 6, l: '6 Months', p: '₹1,794' }, 
              { m: 12, l: '1 Year', p: '₹3,588' }
            ].map(o => (
              <button 
                key={o.m} 
                onClick={() => setDuration(o.m)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                  duration === o.m 
                    ? 'bg-blue-600 text-white border-transparent shadow-[0_4px_10px_rgba(37,99,235,0.2)]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {o.l} <span className="opacity-70 font-semibold">({o.p})</span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Reference</label>
              <input 
                type="text" 
                placeholder="UPI reference, notes etc." 
                value={paymentRef} 
                onChange={e => setPaymentRef(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" 
              />
            </div>
            <button 
              onClick={() => handleActivate(activatingId)} 
              disabled={activateLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white disabled:opacity-50 transition-all duration-300 shadow-md shadow-blue-500/10"
            >
              {activateLoading ? 'Processing...' : 'Confirm Activate'}
            </button>
            <button 
              onClick={() => { setActivatingId(null); setPaymentRef(''); }}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
