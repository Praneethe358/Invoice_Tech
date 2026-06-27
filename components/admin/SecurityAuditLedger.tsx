'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AuditLog {
  id: string;
  created_at: string;
  shops: { name: string } | null;
  details: {
    product_name: string;
    override_price: number;
    min_selling_price: number;
    cashier_name: string;
    cashier_role: string;
    authorized_by?: string | null;
  } | null;
}

export const SecurityAuditLedger = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [cashier, setCashier] = useState('');
  const [type, setType] = useState<'all' | 'authorized' | 'silent'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        cashier,
        type,
        page: String(page),
        limit: '10',
      });
      const res = await fetch(`/api/admin/audit-ledger?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, type]);

  // Debounced search / cashier change
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(delay);
  }, [search, cashier]);

  // Cumulative trend chart data (group by date and count)
  const getTrendData = () => {
    if (!logs || logs.length === 0) return [];
    // Sort logs ascending by date for cumulative calculations
    const sorted = [...logs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const countsByDate: Record<string, number> = {};
    sorted.forEach((log) => {
      const dateStr = new Date(log.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    let cumulative = 0;
    return Object.entries(countsByDate).map(([date, count]) => {
      cumulative += count;
      return { date, count: cumulative };
    });
  };

  const chartData = getTrendData();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">
          🛡️ Executive Security Audit Ledger
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
          Audit trail of cashier minimum selling price (MSP) overrides
        </p>
      </div>

      {/* High-level Cumulative Chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
            Cumulative Overrides Trend
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="overrideColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 9,
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: 'rgba(255, 255, 255, 0.95)',
                  }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Cumulative Overrides"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#overrideColor)"
                  dot={{ fill: '#f43f5e', r: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150/60">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Search Business / Product
          </label>
          <input
            type="text"
            placeholder="Type shop or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700 shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Filter Cashier
          </label>
          <input
            type="text"
            placeholder="Type cashier name..."
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700 shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            Override Type
          </label>
          <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            {(['all', 'authorized', 'silent'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setPage(1);
                }}
                className={`flex-1 text-[10px] font-black py-1 rounded-md transition-all cursor-pointer uppercase tracking-wider
                  ${type === t
                    ? 'bg-rose-50 text-rose-700 border border-rose-150/40 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Timestamp</th>
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Business</th>
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Product Variant</th>
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Cashier (Role)</th>
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Price Override</th>
              <th className="p-3 text-[9px] font-black uppercase tracking-widest">Authorized By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400 font-bold">
                  Loading ledger data...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400 font-bold">
                  No MSP overrides found matching current filters
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const diff = (log.details?.min_selling_price || 0) - (log.details?.override_price || 0);
                return (
                  <tr key={log.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-500">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3 font-bold text-slate-800">
                      {log.shops?.name || '—'}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {log.details?.product_name || '—'}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-700 block">
                        {log.details?.cashier_name || '—'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        {log.details?.cashier_role || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">
                          ₹{log.details?.override_price}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{log.details?.min_selling_price}
                        </span>
                      </div>
                      {diff > 0 && (
                        <span className="inline-block mt-0.5 text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          -₹{diff} Below MSP
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {log.details?.authorized_by ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                          ✔️ {log.details.authorized_by}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                          ⚠️ Silent
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Showing page {page} of {totalPages} ({total} overrides)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
