'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
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

  if (loading) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Loading...</div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Failed to load</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      <h1 className="text-lg font-black text-slate-900">Subscription Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Active Subscriptions', v: data.summary.active_subscriptions, i: '✅' },
          { l: 'MRR', v: `₹${data.summary.mrr.toLocaleString('en-IN')}`, i: '💰' },
          { l: 'Trials Ending Soon', v: data.summary.trials_ending_soon, i: '⏳' },
          { l: 'Renewals Due', v: data.summary.renewals_due, i: '🔄' },
        ].map((c, i) => (
          <motion.div key={c.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.l}</span>
              <span>{c.i}</span>
            </div>
            <p className="text-xl font-black text-slate-900">{c.v}</p>
          </motion.div>
        ))}
      </div>

      {/* Renewals Due Table */}
      {data.renewals_due.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-700">Renewals Due (Within 30 Days)</h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-4">Shop Name</th><th className="py-2.5 px-4">Ends On</th><th className="py-2.5 px-4">Days Left</th><th className="py-2.5 px-4">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.renewals_due.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-800 cursor-pointer hover:text-[#1a6b3c]" onClick={() => router.push(`/admin/shops/${shop.id}`)}>{shop.name}</td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{formatDate(shop.subscription_ends_at)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      (shop.days_left || 0) <= 3 ? 'bg-red-50 text-red-600' : (shop.days_left || 0) <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>{shop.days_left} days</span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">Extend</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trials Ending Soon */}
      {data.trials_ending_soon.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-700">Trials Ending This Week</h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-4">Shop Name</th><th className="py-2.5 px-4">Trial Ends</th><th className="py-2.5 px-4">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.trials_ending_soon.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-800">{shop.name}</td>
                  <td className="py-3 px-4 text-red-600 font-semibold">{formatDate(shop.trial_ends_at)}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#1a6b3c] text-white hover:bg-[#155d33]">Activate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expired */}
      {data.expired_this_month.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-700">Expired Shops</h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead><tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-4">Shop Name</th><th className="py-2.5 px-4">Status</th><th className="py-2.5 px-4">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.expired_this_month.map(shop => (
                <tr key={shop.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-800">{shop.name}</td>
                  <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${STATUS_COLORS[shop.subscription_status]}`}>{shop.subscription_status}</span></td>
                  <td className="py-3 px-4">
                    <button onClick={() => setActivatingId(activatingId === shop.id ? null : shop.id)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold bg-[#1a6b3c] text-white hover:bg-[#155d33]">Reactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Activate Panel (shared) */}
      {activatingId && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-md border-l-4 border-l-[#1a6b3c]">
          <p className="text-xs font-bold text-slate-800 mb-3">Select duration:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[{ m: 1, l: '1 Month', p: '₹299' }, { m: 3, l: '3 Months', p: '₹897' }, { m: 6, l: '6 Months', p: '₹1,794' }, { m: 12, l: '1 Year', p: '₹3,588' }].map(o => (
              <button key={o.m} onClick={() => setDuration(o.m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${duration === o.m ? 'bg-[#1a6b3c] text-white border-[#1a6b3c]' : 'bg-white text-slate-600 border-slate-200'}`}>{o.l} ({o.p})</button>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <input type="text" placeholder="Payment reference" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1a6b3c]" />
            <button onClick={() => handleActivate(activatingId)} disabled={activateLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1a6b3c] text-white disabled:opacity-50">{activateLoading ? 'Processing...' : 'Confirm'}</button>
            <button onClick={() => { setActivatingId(null); setPaymentRef(''); }}
              className="px-4 py-2 text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
