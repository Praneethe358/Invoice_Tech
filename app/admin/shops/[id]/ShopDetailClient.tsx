'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  expired: 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
  cancelled: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
};

const SHOP_EMOJIS: Record<string, string> = {
  fertilizer: '🌱', clothing: '👗', grocery: '🛒', hardware: '🔧',
  electronics: '📱', medical: '💊', stationery: '📝', bakery: '🍞',
  restaurant: '🍽️', other: '🏪',
};

interface ShopDetail {
  id: string; name: string; shop_type: string; address: string | null;
  phone: string | null; gstin: string | null; logo_url?: string | null;
  gst_registered: boolean; inventory_enabled: boolean; onboarding_completed: boolean;
  created_at: string; subscription_status: string; trial_ends_at: string | null;
  subscription_ends_at: string | null; subscription_started_at: string | null;
  subscription_notes: string | null; owner_email: string;
}

export default function ShopDetailClient({ shopId }: { shopId: string }) {
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [stats, setStats] = useState<Record<string, number | string | null>>({});
  const [recentInvoices, setRecentInvoices] = useState<Array<Record<string, string | number>>>([]);
  const [monthlyVolume, setMonthlyVolume] = useState<Array<{ month: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Activate panel
  const [showActivate, setShowActivate] = useState(false);
  const [duration, setDuration] = useState(1);
  const [paymentRef, setPaymentRef] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}`);
      const data = await res.json();
      setShop(data.shop);
      setStats(data.stats);
      setRecentInvoices(data.recent_invoices || []);
      setMonthlyVolume(data.monthly_volume || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [shopId]);

  const handleActivate = async () => {
    setActivateLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: duration, payment_reference: paymentRef }),
      });
      const data = await res.json();
      if (data.success) { showToast('Subscription activated ✓'); setShowActivate(false); fetchData(); }
      else showToast(data.error || 'Failed');
    } catch { showToast('Network error'); }
    setActivateLoading(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold text-sm">Loading shop information...</div>;
  if (!shop) return <div className="text-center py-20 text-slate-500 font-bold text-sm">Shop record not found</div>;

  const status = shop.subscription_status || 'trial';

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 border border-slate-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl shadow-black/80">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-lg shadow-blue-500/10">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : shop.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-tight">{shop.name}</h1>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xs font-bold text-slate-400">{SHOP_EMOJIS[shop.shop_type] || '🏪'} {shop.shop_type}</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[status]}`}>{status}</span>
            </div>
          </div>
        </div>
        <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5">
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shop Info */}
          <div className="bg-[#0b132b]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Shop Info</h2>
            <div className="space-y-3.5 text-xs">
              {[
                ['Owner Email', shop.owner_email],
                ['Phone', shop.phone || '—'],
                ['Address', shop.address || '—'],
                ['GSTIN', shop.gstin || '—'],
                ['Shop Type', shop.shop_type],
                ['Inventory', shop.inventory_enabled ? 'Enabled' : 'Disabled'],
                ['GST Registered', shop.gst_registered ? 'Yes' : 'No'],
                ['Joined', formatDate(shop.created_at)],
                ['Onboarding', shop.onboarding_completed ? 'Completed' : 'Pending'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-slate-850/50 pb-2.5 last:border-0 last:pb-0">
                  <span className="font-bold text-slate-400">{label}</span>
                  <span className="font-extrabold text-slate-200 text-right max-w-[60%] break-all">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-[#0b132b]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Subscription Details</h2>
            <div className="space-y-3.5 text-xs mb-5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[status]}`}>{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Trial Ends</span>
                <span className="font-extrabold text-slate-200">{formatDate(shop.trial_ends_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Sub Started</span>
                <span className="font-extrabold text-slate-200">{formatDate(shop.subscription_started_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400">Sub Ends</span>
                <span className="font-extrabold text-slate-200">{formatDate(shop.subscription_ends_at)}</span>
              </div>
              {shop.subscription_notes && (
                <div className="pt-2">
                  <span className="font-bold text-slate-400 block mb-1.5">Notes</span>
                  <pre className="text-[10px] text-slate-300 bg-slate-950/60 border border-slate-850 p-3 rounded-xl whitespace-pre-wrap font-sans leading-relaxed">{shop.subscription_notes}</pre>
                </div>
              )}
            </div>
            <button onClick={() => setShowActivate(!showActivate)}
              className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/10 transition-all duration-300">
              {status === 'active' ? 'Extend Subscription' : 'Activate Subscription'}
            </button>

            {showActivate && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 space-y-3.5 border-t border-slate-800/80 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { m: 1, l: '1 Month', p: '₹299' }, 
                    { m: 3, l: '3 Months', p: '₹897' }, 
                    { m: 6, l: '6 Months', p: '₹1,794' }, 
                    { m: 12, l: '1 Year', p: '₹3,588' }
                  ].map(o => (
                    <button key={o.m} onClick={() => setDuration(o.m)}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-black border transition-all duration-300 ${
                        duration === o.m 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                          : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
                      }`}>
                      {o.l} <span className="opacity-70 font-semibold">({o.p})</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Reference</label>
                  <input type="text" placeholder="Transaction reference or notes" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
                <button onClick={handleActivate} disabled={activateLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 transition-all duration-300">
                  {activateLoading ? 'Processing...' : 'Confirm Activate'}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { l: 'Invoices', v: stats.total_invoices ?? 0, i: '📄', color: 'border-t-blue-500' },
              { l: 'Customers', v: stats.total_customers ?? 0, i: '👥', color: 'border-t-emerald-500' },
              { l: 'Products', v: stats.total_products ?? 0, i: '📦', color: 'border-t-indigo-500' },
              { l: 'Purchases', v: stats.total_purchases ?? 0, i: '🧾', color: 'border-t-amber-500' },
              { l: 'Last Invoice', v: formatDate(stats.last_invoice_date as string | null), i: '📅', color: 'border-t-violet-500' },
              { l: 'Last Login', v: formatDate(stats.last_sign_in as string | null), i: '🔐', color: 'border-t-rose-500' },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-[#0b132b]/60 backdrop-blur-md border-t-2 border-x border-b border-slate-800 rounded-2xl p-4 shadow-lg ${s.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.l}</span>
                  <span className="text-base">{s.i}</span>
                </div>
                <p className="text-base font-black text-white tracking-tight">{s.v}</p>
              </motion.div>
            ))}
          </div>

          {/* Invoice Volume Chart */}
          <div className="bg-[#0b132b]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Invoice Volume (Last 6 Months)</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyVolume}>
                  <defs>
                    <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 650 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b', fontWeight: 650 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 10,
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(15, 23, 42, 0.95)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barBlue)" radius={[6, 6, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-[#0b132b]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Invoices</h2>
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No invoices created yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-850 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-white">{inv.invoice_number}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{inv.customer_name || inv.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-blue-400 tabular-nums">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{formatDate(inv.created_at as string)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
