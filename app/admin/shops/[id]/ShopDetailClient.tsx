'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toTitleCase } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [volumeRange, setVolumeRange] = useState<'1m' | '3m' | '6m'>('1m');
  const [chartLoading, setChartLoading] = useState(false);

  // Activate panel
  const [showActivate, setShowActivate] = useState(false);
  const [duration, setDuration] = useState(1);
  const [paymentRef, setPaymentRef] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchVolume = async (r: '1m' | '3m' | '6m') => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}?range=${r}`);
      const data = await res.json();
      setMonthlyVolume(data.monthly_volume || []);
    } catch { /* ignore */ }
    setChartLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}?range=${volumeRange}`);
      const data = await res.json();
      setShop(data.shop);
      setStats(data.stats);
      setRecentInvoices(data.recent_invoices || []);
      setMonthlyVolume(data.monthly_volume || []);
      setPayments(data.payments || []);
      setAuditLogs(data.audit_logs || []);
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

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold text-sm">Loading shop information...</div>;
  if (!shop) return <div className="text-center py-20 text-slate-400 font-bold text-sm">Shop record not found</div>;

  const status = shop.subscription_status || 'trial';

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900 border border-slate-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 lg:sticky lg:top-[4rem] lg:z-35 lg:bg-[#f8fafc]/95 lg:backdrop-blur-sm lg:py-4 lg:border-b lg:border-slate-200/50 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-md shadow-blue-500/10">
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : shop.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">{toTitleCase(shop.name)}</h1>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xs font-bold text-slate-400">{SHOP_EMOJIS[shop.shop_type] || '🏪'} {shop.shop_type}</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[status] || STATUS_COLORS.cancelled}`}>{status}</span>
            </div>
          </div>
        </div>
        <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5">
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-[10.5rem] lg:z-20 space-y-6 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-2 scrollbar-none">
            {/* Shop Info */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
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
                  <div key={label} className="flex justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-400">{label}</span>
                    <span className="font-extrabold text-slate-800 text-right max-w-[60%] break-all">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Subscription Details</h2>
              <div className="space-y-3.5 text-xs mb-5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400">Status</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black border capitalize ${STATUS_COLORS[status] || STATUS_COLORS.cancelled}`}>{status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Trial Ends</span>
                  <span className="font-extrabold text-slate-800">{formatDate(shop.trial_ends_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Sub Started</span>
                  <span className="font-extrabold text-slate-800">{formatDate(shop.subscription_started_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Sub Ends</span>
                  <span className="font-extrabold text-slate-800">{formatDate(shop.subscription_ends_at)}</span>
                </div>
                {shop.subscription_notes && (
                  <div className="pt-2">
                    <span className="font-bold text-slate-400 block mb-1.5">Notes</span>
                    <pre className="text-[10px] text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl whitespace-pre-wrap font-sans leading-relaxed">{shop.subscription_notes}</pre>
                  </div>
                )}
              </div>
              <button onClick={() => setShowActivate(!showActivate)}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all duration-300">
                {status === 'active' ? 'Extend Subscription' : 'Activate Subscription'}
              </button>

              {showActivate && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 space-y-3.5 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { m: 1, l: '1 Month', p: '₹349' }, 
                      { m: 3, l: '3 Months', p: '₹1,047' }, 
                      { m: 6, l: '6 Months', p: '₹2,094' }, 
                      { m: 12, l: '1 Year', p: '₹4,188' }
                    ].map(o => (
                      <button key={o.m} onClick={() => setDuration(o.m)}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black border transition-all duration-300 ${
                          duration === o.m 
                            ? 'bg-blue-600 text-white border-transparent shadow-[0_4px_10px_rgba(37,99,235,0.2)]' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {o.l} <span className="opacity-70 font-semibold">({o.p})</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Reference</label>
                    <input type="text" placeholder="Transaction reference or notes" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
                  </div>
                  <button onClick={handleActivate} disabled={activateLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 text-white disabled:opacity-50 transition-all duration-300">
                    {activateLoading ? 'Processing...' : 'Confirm Activate'}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { l: 'Total Revenue', v: `₹${(stats.total_revenue ?? 0).toLocaleString('en-IN')}`, i: '💰', color: 'border-t-emerald-500' },
              { l: 'Invoices', v: stats.total_invoices ?? 0, i: '📄', color: 'border-t-blue-500' },
              { l: 'Customers', v: stats.total_customers ?? 0, i: '👥', color: 'border-t-emerald-500' },
              { l: 'Products', v: stats.total_products ?? 0, i: '📦', color: 'border-t-indigo-500' },
              { l: 'Purchases', v: stats.total_purchases ?? 0, i: '🧾', color: 'border-t-amber-500' },
              { l: 'Last Invoice', v: formatDate(stats.last_invoice_date as string | null), i: '📅', color: 'border-t-violet-500' },
              { l: 'Last Login', v: formatDate(stats.last_sign_in as string | null), i: '🔐', color: 'border-t-rose-500' },
            ].map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-white border-t-2 border-x border-b border-slate-200/85 rounded-2xl p-4 shadow-xs ${s.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.l}</span>
                  <span className="text-base">{s.i}</span>
                </div>
                <p className="text-base font-black text-slate-900 tracking-tight">{s.v}</p>
              </motion.div>
            ))}
          </div>

          {/* Invoice Volume Chart */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Invoice Volume {volumeRange === '1m' ? '(Last 30 Days)' : volumeRange === '3m' ? '(Last 12 Weeks)' : '(Last 6 Months)'}
              </h2>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                {(['1m', '3m', '6m'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setVolumeRange(r);
                      fetchVolume(r);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all duration-250 uppercase ${
                      volumeRange === r
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-52 relative">
              {chartLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                  Updating Chart...
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyVolume}>
                  <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 650 }} axisLine={false} tickLine={false} interval={volumeRange === '1m' ? 4 : 0} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 650 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 10,
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: 'rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={volumeRange === '1m' ? 6 : volumeRange === '3m' ? 14 : 20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Invoices</h2>
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">No invoices created yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-slate-800">{inv.invoice_number}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{inv.customer_name || inv.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-blue-600 tabular-nums">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{formatDate(inv.created_at as string)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments and Audit Trails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payments Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>💵 Recent Payments Received</span>
                <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-bold uppercase tracking-wider">Live Log</span>
              </h2>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-6 text-center">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 capitalize">
                          Via {p.payment_method} {p.note ? `• ${p.note}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-semibold">{formatDate(p.paid_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Logs Card */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>🛡️ Shop Audit Trails</span>
                <span className="text-[8px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-bold uppercase tracking-wider">Secure Access</span>
              </h2>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-6 text-center">No audit logs found for this shop</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {auditLogs.map((log, idx) => (
                    <div key={log.id || idx} className="py-2.5 border-b border-slate-100 last:border-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-800">{log.actor_name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-slate-600 mt-1 font-medium">
                        Action: <span className="font-bold text-slate-700">{log.action}</span> on <span className="font-bold text-slate-700">{log.entity_type}</span> ({log.entity_label || '—'})
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre className="mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-500 overflow-x-auto font-mono whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
