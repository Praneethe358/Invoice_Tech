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

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Page Title Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight font-heading uppercase">
            Payments Ledger
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Collections Log & Transaction History.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Collected</p>
            <p className="text-lg font-black text-emerald-600 mt-2">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">UPI Collected</p>
            <p className="text-lg font-black text-indigo-600 mt-2">₹{upiCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white border border-[#e5e7eb] rounded-none p-4 shadow-xs">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cash Collected</p>
            <p className="text-lg font-black text-amber-600 mt-2">₹{cashCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by customer, phone, invoice, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-[#e5e7eb] rounded-none px-4 py-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1a6b3c] focus:ring-0"
          />
          <div className="flex gap-1 bg-white border border-[#e5e7eb] p-1 rounded-none overflow-x-auto scrollbar-none">
            {(['all', 'cash', 'upi', 'bank_transfer', 'other'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-3 py-1.5 rounded-none text-[10px] font-extrabold capitalize transition-all whitespace-nowrap ${
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
          <div className="bg-white border border-[#e5e7eb] rounded-none overflow-hidden mb-6 shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer Name / Phone</th>
                    <th className="py-3.5 px-4">Invoice No</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Note</th>
                    <th className="py-3.5 px-4 text-center">Paid At</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map((p) => {
                    const isDeleting = deletingId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-900 block text-xs uppercase">{p.invoices?.customer_name || 'Walk-in Customer'}</span>
                          <span className="text-[10px] text-gray-400 font-medium">+91 {p.customer_phone.slice(-10)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => router.push(`/invoice/${p.invoice_id}`)}
                            className="text-xs font-bold text-[#1a6b3c] hover:underline"
                          >
                            {p.invoices?.invoice_number}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-none uppercase bg-gray-50 text-gray-600 border border-gray-200">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500 font-medium max-w-[200px] truncate">
                          {p.note ? `"${p.note}"` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[10px] text-gray-400 font-medium" suppressHydrationWarning>
                          {new Date(p.paid_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-semibold text-emerald-600 tabular-nums">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right pr-6">
                          {isDeleting ? (
                            <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold">
                              <span className="text-gray-400">Sure?</span>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="text-red-600 hover:text-red-850"
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
                              className="text-[10px] font-bold text-red-600 hover:underline transition-colors uppercase tracking-wider"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-[#f3f4f6]">
              {filtered.map((p) => {
                const isDeleting = deletingId === p.id;
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between active:bg-gray-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 uppercase">
                          {p.invoices?.customer_name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          · +91 {p.customer_phone.slice(-10)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
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
                        <p className="text-[11px] text-gray-400 italic">
                          "{p.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">
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
                            className="text-[10px] font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
