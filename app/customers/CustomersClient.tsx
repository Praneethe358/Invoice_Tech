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

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Page Title Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight font-heading uppercase">
              Customer Ledger
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Manage accounts, track balances, and view transaction history.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/customers/ledger')}
            className="flex items-center gap-1.5 bg-[#1a6b3c]/10 hover:bg-[#1a6b3c]/20 text-[#1a6b3c] font-bold py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer self-start md:self-auto"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Ledger Book
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-none border border-[#e5e7eb] py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c] focus:ring-0 transition-all"
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
              className={`px-4 py-1.5 rounded-none text-xs font-bold capitalize transition-all ${
                tagFilter === tag
                  ? 'bg-[#1a6b3c] text-white shadow-xs'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f9fafb]'
              }`}
            >
              {tag === 'vip' ? 'VIP Only' : tag === 'all' ? 'All Customers' : 'Regular Only'}
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
            actionLabel={searchQuery || tagFilter !== 'all' ? 'Clear Filters' : 'Create First Invoice'}
            onAction={
              searchQuery || tagFilter !== 'all'
                ? () => { setSearchQuery(''); setTagFilter('all'); }
                : () => { router.push('/invoice/new'); }
            }
          />
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-none overflow-hidden mb-6 shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer Name / Phone</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-center">Total Invoices</th>
                    <th className="py-3.5 px-4 text-right">Total Spent</th>
                    <th className="py-3.5 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3.5 px-4 text-center">Last Active</th>
                    <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {customers.map((customer) => {
                    const balance = Number(customer.outstanding_balance || 0);
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => router.push(`/customers/${customer.id}`)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900 block text-xs uppercase">{customer.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">+91 {customer.phone.slice(-10)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-none uppercase ${
                            customer.tag === 'vip' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {customer.tag}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-gray-900">
                          {customer.total_invoices}
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-semibold text-gray-900 tabular-nums">
                          ₹{Number(customer.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3.5 px-4 text-right text-xs font-semibold tabular-nums ${balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[10px] text-gray-400 font-medium">
                          {timeAgo(customer.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/customers/${customer.id}`)}
                            className="text-xs font-bold text-[#1a6b3c] hover:underline"
                          >
                            View Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-0 divide-y divide-[#f3f4f6]">
              {customers.map((customer, i) => (
                <div
                  key={customer.id}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="bg-white p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-none flex items-center justify-center text-sm font-bold ${
                        customer.tag === 'vip'
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                      }`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 uppercase">{customer.name}</p>
                        <p className="text-xs text-gray-400 font-medium">+91 {customer.phone.slice(-10)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                        customer.tag === 'vip'
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {customer.tag}
                      </span>
                      {Number(customer.outstanding_balance || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-none text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          Due: ₹{Number(customer.outstanding_balance).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9ca3af] font-semibold pt-2 border-t border-[#f3f4f6]">
                    <div className="flex items-center gap-3">
                      <span>📂 {customer.total_invoices} invoice{customer.total_invoices !== 1 ? 's' : ''}</span>
                      <span>💰 ₹{Number(customer.total_spent).toLocaleString('en-IN')} spent</span>
                    </div>
                    <span>Last active: {timeAgo(customer.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="p-4 border-t border-[#e5e7eb] flex justify-center bg-gray-50/50">
                <button
                  onClick={() => fetchCustomers(true)}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-white border border-[#e5e7eb] text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Customers'}
                </button>
              </div>
            )}
          </div>
        )}
      </PageTransition>
    </div>
  );
}
