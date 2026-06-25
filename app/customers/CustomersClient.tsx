'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
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
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>(initial);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | CustomerTag>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === 20);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [tag, setTag] = useState<CustomerTag>('regular');
  const [priceTier, setPriceTier] = useState<'retail' | 'wholesale'>('retail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  // Open modals & setup forms
  const openAddModal = () => {
    setName('');
    setPhone('');
    setGstin('');
    setTag('regular');
    setPriceTier('retail');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setGstin(customer.gstin || '');
    setTag(customer.tag);
    setPriceTier(customer.price_tier || 'retail');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteConfirmOpen(true);
  };

  // Client-side validations
  const validateForm = () => {
    if (!name.trim()) {
      setFormError('Customer name is required.');
      return false;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    const last10Digits = cleanPhone.slice(-10);
    if (last10Digits.length !== 10 || !/^[6-9]\d{9}$/.test(last10Digits)) {
      setFormError('WhatsApp number must be exactly 10 digits and start with 6-9.');
      return false;
    }

    if (gstin.trim()) {
      const gstinUpper = gstin.trim().toUpperCase();
      if (gstinUpper.length !== 15) {
        setFormError('GSTIN must be exactly 15 characters.');
        return false;
      }
      const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
      if (!gstinRegex.test(gstinUpper)) {
        setFormError('Invalid GSTIN format (e.g. 33AABCS1429B1ZB).');
        return false;
      }
    }

    setFormError('');
    return true;
  };

  // API Submit calls
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          gstin: gstin.trim() || null,
          tag,
          price_tier: priceTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add customer.');
        showToast(data.error || 'Failed to add customer.', 'error');
      } else {
        showToast('Customer added successfully!', 'success');
        setIsAddModalOpen(false);
        fetchCustomers(false);
      }
    } catch (err) {
      setFormError('An unexpected error occurred.');
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          gstin: gstin.trim() || null,
          tag,
          price_tier: priceTier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update customer.');
        showToast(data.error || 'Failed to update customer.', 'error');
      } else {
        showToast('Customer updated successfully!', 'success');
        setIsEditModalOpen(false);
        fetchCustomers(false);
      }
    } catch (err) {
      setFormError('An unexpected error occurred.');
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete customer.', 'error');
      } else {
        showToast('Customer deleted successfully.', 'success');
        setIsDeleteConfirmOpen(false);
        fetchCustomers(false);
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Header with greeting - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0050e8]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#0050e8] flex items-center justify-center text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Customers Ledger Database · {totalCount} total customer{totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/customers/ledger')}
              className="flex items-center gap-1.5 bg-[#0050e8]/10 hover:bg-[#0050e8]/20 text-[#0050e8] font-bold py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Ledger Book
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
              Customer Ledger
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              Manage accounts, track balances, and view transaction history.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/customers/ledger')}
              className="flex items-center gap-1.5 bg-[#0050e8]/10 hover:bg-[#0050e8]/20 text-[#0050e8] font-bold py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer self-start"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Ledger Book
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-[#0050e8] hover:bg-[#0043c4] text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all cursor-pointer shadow-xs self-start"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white rounded-none border border-[#e5e7eb] py-3 pl-9 md:pl-10 pr-4 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#0050e8] focus:ring-0 transition-all"
          />
          <svg className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] w-3.5 h-3.5 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  ? 'bg-[#0050e8] text-white shadow-xs'
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
                          {customer.gstin && (
                            <span className="text-[9px] text-blue-600 font-semibold block uppercase">GSTIN: {customer.gstin}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-none uppercase ${
                              customer.tag === 'vip' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}>
                              {customer.tag}
                            </span>
                            {customer.price_tier && (
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                {customer.price_tier} pricing
                              </span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEditModal(customer)}
                              className="text-xs font-bold text-amber-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(customer)}
                              className="text-xs font-bold text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => router.push(`/customers/${customer.id}`)}
                              className="text-xs font-bold text-[#0050e8] hover:underline"
                            >
                              View Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-0 divide-y divide-[#f3f4f6]">
              {customers.map((customer) => (
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
                          : 'bg-[#0050e8]/10 text-[#0050e8]'
                      }`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 uppercase">{customer.name}</p>
                        <p className="text-xs text-gray-400 font-medium">+91 {customer.phone.slice(-10)}</p>
                        {customer.gstin && (
                          <span className="text-[9px] text-blue-600 font-bold block uppercase">GSTIN: {customer.gstin}</span>
                        )}
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
                  {/* Action buttons for mobile */}
                  <div className="flex justify-end gap-4 mt-2 pt-2 border-t border-dashed border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="text-xs font-bold text-amber-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(customer)}
                      className="text-xs font-bold text-red-600"
                    >
                      Delete
                    </button>
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

      {/* Add Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-none border border-red-200">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MEENA TRADERS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              WhatsApp Number (10 Digits)
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9842155678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 33AABCS1429B1ZB"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Customer Tag
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as CustomerTag)}
                className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Pricing Tier
              </label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value as 'retail' | 'wholesale')}
                className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0050e8] text-white text-xs font-bold rounded-none hover:bg-[#0043c4] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Details">
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-none border border-red-200">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              WhatsApp Number (10 Digits)
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              placeholder="None"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Customer Tag
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as CustomerTag)}
                className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Pricing Tier
              </label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value as 'retail' | 'wholesale')}
                className="w-full bg-gray-50 rounded-none border border-[#e5e7eb] p-2.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#0050e8] focus:bg-white transition-all"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0050e8] text-white text-xs font-bold rounded-none hover:bg-[#0043c4] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Delete Customer">
        <div className="space-y-4 pt-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-gray-900 uppercase">{selectedCustomer?.name}</span>?
            This action is permanent and cannot be undone. Note that their existing invoices will not be deleted.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-none hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-none hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Customer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
