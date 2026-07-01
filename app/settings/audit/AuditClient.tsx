'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { AuditLog } from '@/lib/types';

const ACTION_ICONS: Record<string, string> = {
  'invoice.created': '📄',
  'invoice.sent': '✅',
  'invoice.send_failed': '❌',
  'invoice.deleted': '🗑️',
  'payment.recorded': '💰',
  'payment.deleted': '🗑️',
  'product.created': '📦',
  'product.edited': '✏️',
  'product.deleted': '🗑️',
  'product.price_edited': '💲',
  'product.favorited': '⭐',
  'product.unfavorited': '⭐',
  'customer.created': '👤',
  'customer.name_edited': '✏️',
  'customer.tag_changed': '🏷️',
  'customer.deleted': '🗑️',
  'purchase.created': '🧾',
  'purchase.edited': '✏️',
  'purchase.deleted': '🗑️',
  'inventory.restocked': '📦',
  'inventory.adjusted': '📦',
  'shop.profile_updated': '🏪',
  'shop.logo_uploaded': '🖼️',
  'shop.gst_updated': '📋',
  'staff.invited': '👤',
  'staff.role_changed': '🔄',
  'staff.deactivated': '🚫',
  'staff.joined': '🎉',
  'cdn.credit_note_issued': '📝',
  'cdn.debit_note_issued': '📝',
};

const ROLE_BORDER_COLORS: Record<string, string> = {
  owner: 'border-l-green-500',
  admin: 'border-l-blue-500',
  billing_staff: 'border-l-blue-300',
  view_only: 'border-l-gray-300',
};

const ENTITY_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'payment', label: 'Payments' },
  { key: 'product', label: 'Products' },
  { key: 'customer', label: 'Customers' },
  { key: 'purchase', label: 'Purchases' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'staff', label: 'Staff' },
  { key: 'shop', label: 'Settings' },
];

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function AuditClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityType, setEntityType] = useState('all');
  const [actorId, setActorId] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actors, setActors] = useState<{ actor_user_id: string; actor_name: string; actor_role: string }[]>([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (entityType !== 'all') params.set('entity_type', entityType);
    if (actorId !== 'all') params.set('actor_id', actorId);
    if (search) params.set('search', search);

    // Date range
    const now = new Date();
    if (dateFilter === 'today') {
      params.set('start_date', now.toISOString().split('T')[0]);
      params.set('end_date', now.toISOString().split('T')[0]);
    } else if (dateFilter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
      params.set('start_date', weekStart.toISOString().split('T')[0]);
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      params.set('start_date', monthStart.toISOString().split('T')[0]);
    } else if (dateFilter === 'custom') {
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
    }

    try {
      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        if (data.actors) setActors(data.actors);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, entityType, actorId, search, dateFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatAction = (action: string) => {
    return action.replace(/\./g, ' ').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Desktop Header */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-[10px] text-[#6b7280] font-medium mt-0.5">Every action taken in your account</p>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="mb-6 md:hidden">
          <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">Audit Trail</h1>
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#e5e7eb] p-4 mb-6 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Date Range */}
            <div className="flex gap-1 bg-[#f9fafb] border border-[#e5e7eb] p-1 rounded-none overflow-x-auto scrollbar-none">
              {([
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'custom', label: 'Custom' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setDateFilter(item.key); setPage(1); }}
                  className={`px-2.5 py-1.5 rounded-none text-[9px] font-extrabold capitalize transition-all whitespace-nowrap ${
                    dateFilter === item.key
                      ? 'bg-[#0050e8] text-white shadow-xs'
                      : 'text-[#4b5563] hover:text-[#111827]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Entity Type */}
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2 px-3 text-[10px] font-bold text-[#4b5563] focus:outline-none focus:border-[#0050e8]"
            >
              {ENTITY_TYPES.map((et) => (
                <option key={et.key} value={et.key}>{et.label}</option>
              ))}
            </select>

            {/* Actor */}
            <select
              value={actorId}
              onChange={(e) => { setActorId(e.target.value); setPage(1); }}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2 px-3 text-[10px] font-bold text-[#4b5563] focus:outline-none focus:border-[#0050e8]"
            >
              <option value="all">All Actors</option>
              {actors.map((a) => (
                <option key={a.actor_user_id} value={a.actor_user_id}>{a.actor_name}</option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2 px-3 text-[10px] font-semibold text-[#111827] focus:outline-none focus:border-[#0050e8]"
            />
          </div>

          {/* Custom Date */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-[#e5e7eb]">
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2 px-3 text-xs font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none py-2 px-3 text-xs font-semibold focus:outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12 bg-white border border-[#e5e7eb]">
            <span className="text-xs font-bold text-gray-500">Loading audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="No activity recorded yet"
            description="Actions will appear here as they are performed."
          />
        ) : (
          <div className="space-y-1.5">
            {logs.map((log, i) => {
              const borderColor = ROLE_BORDER_COLORS[log.actor_role] || 'border-l-gray-300';
              const icon = ACTION_ICONS[log.action] || '📋';
              const isExpanded = expandedId === log.id;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className={`bg-white border border-[#e5e7eb] border-l-4 ${borderColor} cursor-pointer hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="px-4 py-3 flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{log.actor_name}</p>
                        <span className="text-[9px] text-gray-400 font-medium shrink-0" suppressHydrationWarning>{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {formatAction(log.action)}
                        {log.entity_label && <span className="font-bold text-gray-800"> {log.entity_label}</span>}
                      </p>
                      {log.details && !isExpanded && (
                        <p className="text-[9px] text-gray-400 mt-0.5 truncate">
                          {Object.entries(log.details).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && log.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-3 pt-0 border-t border-dashed border-gray-100"
                    >
                      <div className="bg-[#f9fafb] border border-[#e5e7eb] p-3 mt-2">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 py-1 border-b border-gray-100 last:border-0">
                            <span className="text-[9px] font-bold text-gray-500 uppercase w-28 shrink-0">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-gray-800 font-medium break-all">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-[#e5e7eb] text-xs font-bold rounded-none disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-[#e5e7eb] text-xs font-bold rounded-none disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
