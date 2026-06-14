'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerTag, Invoice, Shop } from '@/lib/types';

interface Props {
  customer: Customer;
  shop: Shop;
  invoices: Invoice[];
}

export default function CustomerDetailClient({ customer: initial, shop, invoices }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(initial);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(initial.name);
  const [savingName, setSavingName] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === customer.name) {
      setNameValue(customer.name);
      setEditingName(false);
      return;
    }

    setSavingName(true);
    const { error } = await supabase
      .from('customers')
      .update({ name: trimmed })
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to update name', 'error');
      setNameValue(customer.name);
    } else {
      setCustomer(prev => ({ ...prev, name: trimmed }));
      showToast('Name updated', 'success');
    }
    setSavingName(false);
    setEditingName(false);
  };

  const handleToggleTag = async () => {
    const newTag: CustomerTag = customer.tag === 'vip' ? 'regular' : 'vip';
    const oldTag = customer.tag;

    // Optimistic update
    setCustomer(prev => ({ ...prev, tag: newTag }));
    setSavingTag(true);

    const { error } = await supabase
      .from('customers')
      .update({ tag: newTag })
      .eq('id', customer.id);

    if (error) {
      setCustomer(prev => ({ ...prev, tag: oldTag }));
      showToast('Failed to update tag', 'error');
    } else {
      showToast(`Marked as ${newTag.toUpperCase()}`, 'success');
    }
    setSavingTag(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to remove customer', 'error');
    } else {
      showToast('Customer removed', 'success');
      router.push('/customers');
    }
  };

  const lastInvoiceDate = invoices.length > 0
    ? new Date(invoices[0].created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Never';

  const statItems = [
    { label: 'Total Invoices', value: customer.total_invoices },
    { label: 'Total Spent', value: `₹${Number(customer.total_spent).toLocaleString('en-IN')}` },
    { label: 'Last Billed', value: lastInvoiceDate },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Back button */}
        <button
          onClick={() => router.push('/customers')}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Customers
        </button>

        {/* Customer Header */}
        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309]'
                : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
            }`}>
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  disabled={savingName}
                  autoFocus
                  className="text-xl font-extrabold text-[#111827] bg-transparent border-b-2 border-[#1a6b3c] outline-none w-full pb-1"
                />
              ) : (
                <h1
                  onClick={() => {
                    setEditingName(true);
                    setTimeout(() => nameInputRef.current?.focus(), 50);
                  }}
                  className="text-xl font-extrabold text-[#111827] cursor-text hover:text-[#1a6b3c] transition-colors"
                  title="Click to edit"
                >
                  {customer.name}
                </h1>
              )}
              <p className="text-sm text-[#6b7280] mt-1">+91 {customer.phone.slice(-10)}</p>
            </div>
          </div>

          {/* Tag Toggle */}
          <button
            onClick={handleToggleTag}
            disabled={savingTag}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309] hover:bg-[#fde68a]'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            {savingTag ? 'Saving...' : customer.tag === 'vip' ? '★ VIP — Tap to make Regular' : 'Regular — Tap to make VIP ★'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.08 }}
              className="glass-card-light rounded-2xl p-3.5 text-center"
            >
              <p className="text-lg font-extrabold text-[#1a1d26] tabular-nums leading-tight">
                {stat.value}
              </p>
              <p className="text-[10px] text-[#9ca3af] font-medium mt-1 uppercase tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Invoice History */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-[#1a1d26] mb-3">Invoice History</h2>
          {invoices.length === 0 ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
              title="No invoices yet"
              description="Invoices sent to this customer will appear here."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {invoices.map((invoice, i) => (
                <InvoiceCard key={invoice.id} invoice={invoice} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Delete Customer */}
        <div className="pt-4 border-t border-[#e5e7eb]">
          {confirmDelete ? (
            <div className="flex items-center justify-between text-sm">
              <p className="text-[#111827] font-medium">
                This won&apos;t delete their invoices. Remove anyway?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-[#f3f4f6] text-[#4b5563] rounded-lg font-semibold text-xs hover:bg-[#e5e7eb]"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold text-xs hover:bg-red-100"
                >
                  Yes
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Remove customer
            </button>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
