'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  if (loading) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Loading...</div>;
  if (!shop) return <div className="text-center py-20 text-slate-400 font-semibold text-sm">Shop not found</div>;

  const status = shop.subscription_status || 'trial';

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#22875a] flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-md">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : shop.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">{shop.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-500">{SHOP_EMOJIS[shop.shop_type] || '🏪'} {shop.shop_type}</span>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${STATUS_COLORS[status]}`}>{status}</span>
            </div>
          </div>
        </div>
        <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-[#1a6b3c] transition-colors flex items-center gap-1">
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shop Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Shop Info</h2>
            <div className="space-y-3 text-xs">
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
                <div key={label} className="flex justify-between">
                  <span className="font-semibold text-slate-400">{label}</span>
                  <span className="font-bold text-slate-700 text-right max-w-[60%] break-all">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Subscription</h2>
            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize ${STATUS_COLORS[status]}`}>{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Trial Ends</span>
                <span className="font-bold text-slate-700">{formatDate(shop.trial_ends_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Sub Started</span>
                <span className="font-bold text-slate-700">{formatDate(shop.subscription_started_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Sub Ends</span>
                <span className="font-bold text-slate-700">{formatDate(shop.subscription_ends_at)}</span>
              </div>
              {shop.subscription_notes && (
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Notes</span>
                  <pre className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg whitespace-pre-wrap font-sans">{shop.subscription_notes}</pre>
                </div>
              )}
            </div>
            <button onClick={() => setShowActivate(!showActivate)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#1a6b3c] text-white hover:bg-[#155d33] transition-colors">
              {status === 'active' ? 'Extend Subscription' : 'Activate Subscription'}
            </button>

            {showActivate && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {[{ m: 1, l: '1 Month', p: '₹299' }, { m: 3, l: '3 Months', p: '₹897' }, { m: 6, l: '6 Months', p: '₹1,794' }, { m: 12, l: '1 Year', p: '₹3,588' }].map(o => (
                    <button key={o.m} onClick={() => setDuration(o.m)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border ${duration === o.m ? 'bg-[#1a6b3c] text-white border-[#1a6b3c]' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {o.l} <span className="opacity-70">{o.p}</span>
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Payment reference" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#1a6b3c]" />
                <button onClick={handleActivate} disabled={activateLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#1a6b3c] text-white disabled:opacity-50">
                  {activateLoading ? 'Processing...' : 'Confirm'}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { l: 'Invoices', v: stats.total_invoices ?? 0, i: '📄' },
              { l: 'Customers', v: stats.total_customers ?? 0, i: '👥' },
              { l: 'Products', v: stats.total_products ?? 0, i: '📦' },
              { l: 'Purchases', v: stats.total_purchases ?? 0, i: '🧾' },
              { l: 'Last Invoice', v: formatDate(stats.last_invoice_date as string | null), i: '📅' },
              { l: 'Last Login', v: formatDate(stats.last_sign_in as string | null), i: '🔐' },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.l}</span>
                  <span className="text-sm">{s.i}</span>
                </div>
                <p className="text-base font-black text-slate-900">{s.v}</p>
              </motion.div>
            ))}
          </div>

          {/* Invoice Volume Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Invoice Volume (Last 6 Months)</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyVolume}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#1a6b3c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Recent Invoices</h2>
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold py-4 text-center">No invoices yet</p>
            ) : (
              <div className="space-y-2.5">
                {recentInvoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{inv.invoice_number}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{inv.customer_name || inv.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900 tabular-nums">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{formatDate(inv.created_at as string)}</p>
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
