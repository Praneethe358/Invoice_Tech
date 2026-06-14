'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop } from '@/lib/types';

interface DashboardClientProps {
  shop: Shop;
  invoices: Invoice[];
  stats: {
    totalInvoices: number;
    thisMonth: number;
    failedInvoices: number;
    totalCustomers: number;
  };
}

export default function DashboardClient({
  shop,
  invoices: initialInvoices,
  stats,
}: DashboardClientProps) {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialInvoices.length === 20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch invoices on search or filter change
  const fetchInvoices = useCallback(async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);
    
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (debouncedSearch) {
      query = query.or(`invoice_number.ilike.%${debouncedSearch}%,customer_phone.ilike.%${debouncedSearch}%`);
    }

    const from = loadMore ? invoices.length : 0;
    const to = from + 19; // 20 items (0-19)
    query = query.range(from, to);

    const { data } = await query;
    const newInvoices = (data ?? []) as Invoice[];

    if (loadMore) {
      setInvoices(prev => [...prev, ...newInvoices]);
      setLoadingMore(false);
    } else {
      setInvoices(newInvoices);
    }

    setHasMore(newInvoices.length === 20);
  }, [debouncedSearch, statusFilter, shop.id, invoices.length, supabase]);

  useEffect(() => {
    // We don't fetch on initial mount unless search or filter changed,
    // because initialInvoices are already loaded.
    // Wait, if search/filter changes, fetch from scratch.
    // If it's empty, and we are not initial, fetch.
    fetchInvoices(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const statCards = [
    {
      key: 'total',
      label: 'Total Invoices',
      value: stats.totalInvoices,
      iconBg: 'stat-gradient-2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      key: 'month',
      label: 'This Month',
      value: stats.thisMonth,
      iconBg: 'stat-gradient-3',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      key: 'failed',
      label: 'Failed',
      value: stats.failedInvoices,
      iconBg: stats.failedInvoices > 0 ? 'bg-red-500' : 'bg-gray-400',
      isFailed: stats.failedInvoices > 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      key: 'customers',
      label: 'Customers',
      value: stats.totalCustomers,
      iconBg: 'stat-gradient-1',
      href: '/customers',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg mx-auto px-4 pb-24">
        {/* Header with greeting */}
        <div className="premium-header-gradient rounded-b-3xl -mx-4 px-6 pt-6 pb-20 -mt-0.5 shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[#d1ebd9] text-xs font-semibold">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
              </p>
              <h1 className="text-xl font-extrabold text-white mt-1">
                {shop.name}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stat cards — overlapping the header */}
        <div className="grid grid-cols-4 gap-2 -mt-14 mb-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              onClick={() => card.href && (window.location.href = card.href)}
              className={`glass-card-light rounded-2xl p-3.5 text-center relative ${card.href ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mx-auto mb-2`}>
                {card.icon}
              </div>
              <p className={`text-lg font-extrabold tabular-nums leading-tight ${card.isFailed ? 'text-red-600' : 'text-[#1a1d26]'}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-[#9ca3af] font-medium mt-1 uppercase tracking-wide">
                {card.label}
              </p>
              {card.isFailed && (
                <button 
                  onClick={() => setStatusFilter('failed')}
                  className="text-[9px] font-bold text-red-600 uppercase tracking-wide absolute bottom-1 right-0 left-0"
                >
                  Fix now →
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by invoice or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl border border-[#e5e7eb] py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c] focus:ring-1 focus:ring-[#1a6b3c] transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 text-[#9ca3af]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="flex gap-2">
            {(['all', 'sent', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-[#1a6b3c] text-white shadow-sm'
                    : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.a
            href="/invoice/new"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-light rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a6b3c]/10 flex items-center justify-center text-[#1a6b3c]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26]">New Invoice</p>
              <p className="text-[10px] text-[#9ca3af]">Create & send</p>
            </div>
          </motion.a>
          <motion.a
            href="/settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card-light rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26]">Catalog</p>
              <p className="text-[10px] text-[#9ca3af]">Manage items</p>
            </div>
          </motion.a>
        </div>

        {/* Recent Invoices */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#1a1d26]">
            Recent Invoices
          </h2>
          {invoices.length > 0 && (
            <span className="text-xs font-medium text-[#1a6b3c]">
              View all →
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title={searchQuery || statusFilter !== 'all' ? "No matching invoices" : "No invoices yet"}
            description={searchQuery || statusFilter !== 'all' ? "Try adjusting your search or filters." : "Create your first invoice and send it to your customer on WhatsApp."}
            actionLabel={searchQuery || statusFilter !== 'all' ? "Clear Filters" : "Create Invoice"}
            onAction={() => {
              if (searchQuery || statusFilter !== 'all') {
                setSearchQuery('');
                setStatusFilter('all');
              } else {
                window.location.href = '/invoice/new';
              }
            }}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {invoices.map((invoice, i) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                index={i}
              />
            ))}
            
            {hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => fetchInvoices(true)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-[#e5e7eb] text-[#4b5563] text-sm font-bold rounded-xl hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </PageTransition>
    </div>
  );
}
