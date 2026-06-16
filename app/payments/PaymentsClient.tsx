'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  payments: any[];
}

export default function PaymentsClient({ shop, payments: initialPayments }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [payments, setPayments] = useState(initialPayments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Calculations
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const upiCollected = payments.filter(p => p.payment_method === 'upi').reduce((sum, p) => sum + Number(p.amount), 0);
  const cashCollected = payments.filter(p => p.payment_method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);

  const handleDelete = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete payment');
      }

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setDeletingId(null);
      showToast('Payment transaction deleted', 'success');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting payment', 'error');
    }
  };

  // Filtered Payments
  const filtered = payments.filter((p) => {
    const custName = p.invoices?.customer_name || '';
    const phone = p.customer_phone || '';
    const invNum = p.invoices?.invoice_number || '';
    const note = p.note || '';

    const matchesSearch =
      custName.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search) ||
      invNum.toLowerCase().includes(search.toLowerCase()) ||
      note.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-[#111827]">Collections Ledger</h1>
            <p className="text-xs text-[#6b7280]">Track and manage payments received from all clients</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#6b7280] font-semibold">Total Collected</p>
            <p className="text-lg font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#6b7280] font-semibold">UPI</p>
            <p className="text-lg font-black text-indigo-600 mt-1">₹{upiCollected.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#6b7280] font-semibold">Cash</p>
            <p className="text-lg font-black text-amber-600 mt-1">₹{cashCollected.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by customer, phone, invoice, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
          />
          <div className="flex gap-1 bg-white border border-[#e5e7eb] p-1 rounded-2xl">
            {(['all', 'cash', 'upi', 'bank_transfer', 'other'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold capitalize transition-all ${
                  methodFilter === method
                    ? 'bg-[#1a6b3c] text-white shadow-xs'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List of Payments */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="10" x2="12" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
              </svg>
            }
            title="No collections recorded"
            description="Payments registered against invoices will appear in this feed."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((p) => {
                const isDeleting = deletingId === p.id;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    exit={{ opacity: 0, y: -12 }}
                    className="bg-white border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-[#1a6b3c]/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111827]">
                          {p.invoices?.customer_name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] text-[#9ca3af]">
                          · +91 {p.customer_phone.slice(-10)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                        <span
                          onClick={() => router.push(`/invoice/${p.invoice_id}`)}
                          className="font-bold text-[#1a6b3c] hover:underline cursor-pointer"
                        >
                          {p.invoices?.invoice_number}
                        </span>
                        <span>·</span>
                        <span className="capitalize font-semibold">{p.payment_method}</span>
                        <span>·</span>
                        <span suppressHydrationWarning>
                          {new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {p.note && (
                        <p className="text-[11px] text-[#9ca3af] italic">
                          "{p.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="w-16 flex justify-end">
                        {isDeleting ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Yes
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(p.id)}
                            className="text-[10px] font-extrabold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
