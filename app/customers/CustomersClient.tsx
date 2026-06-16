'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerTag, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  customers: Customer[];
  totalCount: number;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomersClient({ shop, customers: initial, totalCount }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initial);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | CustomerTag>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === 20);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = useCallback(async (loadMore = false) => {
    if (loadMore) setLoadingMore(true);

    let query = supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (tagFilter !== 'all') {
      query = query.eq('tag', tagFilter);
    }

    if (debouncedSearch) {
      query = query.or(`name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
    }

    const from = loadMore ? customers.length : 0;
    query = query.range(from, from + 19);

    const { data } = await query;
    const newCustomers = (data ?? []) as Customer[];

    if (loadMore) {
      setCustomers(prev => [...prev, ...newCustomers]);
      setLoadingMore(false);
    } else {
      setCustomers(newCustomers);
    }
    setHasMore(newCustomers.length === 20);
  }, [debouncedSearch, tagFilter, shop.id, customers.length, supabase]);

  useEffect(() => {
    fetchCustomers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, tagFilter]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#111827]">Customers</h1>
            <p className="text-xs text-[#6b7280] font-medium mt-0.5">
              {totalCount} customer{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-xl border border-[#e5e7eb] py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c] focus:ring-1 focus:ring-[#1a6b3c] transition-all"
          />
          <svg className="absolute left-3.5 top-3.5 text-[#9ca3af]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'vip', 'regular'] as const).map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                tagFilter === tag
                  ? 'bg-[#1a6b3c] text-white shadow-sm'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
              }`}
            >
              {tag === 'vip' ? 'VIP' : tag === 'all' ? 'All' : 'Regular'}
            </button>
          ))}
        </div>

        {/* Customer List */}
        {customers.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title={searchQuery || tagFilter !== 'all' ? 'No matching customers' : 'No customers yet'}
            description={
              searchQuery || tagFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Send your first invoice to start building your customer list automatically.'
            }
            actionLabel={searchQuery || tagFilter !== 'all' ? 'Clear Filters' : undefined}
            onAction={
              searchQuery || tagFilter !== 'all'
                ? () => { setSearchQuery(''); setTagFilter('all'); }
                : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence>
              {customers.map((customer, i) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="glass-card-light rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        customer.tag === 'vip'
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                      }`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">{customer.name}</p>
                        <p className="text-xs text-[#6b7280]">+91 {customer.phone.slice(-10)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      customer.tag === 'vip'
                        ? 'bg-[#fef3c7] text-[#b45309]'
                        : 'bg-[#f3f4f6] text-[#6b7280]'
                    }`}>
                      {customer.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#9ca3af] font-medium">
                    <span>{customer.total_invoices} invoice{customer.total_invoices !== 1 ? 's' : ''}</span>
                    <span>₹{Number(customer.total_spent).toLocaleString('en-IN')} total</span>
                    <span>Last: {timeAgo(customer.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => fetchCustomers(true)}
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
