'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { Invoice } from '@/lib/types';

function maskPhone(phone: string): string {
  if (phone.length >= 4) return '****' + phone.slice(-4);
  return phone;
}

function statusConfig(status: string, deliveryStatus?: string | null) {
  if (deliveryStatus === 'failed') {
    return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Failed' };
  }
  switch (status) {
    case 'draft':
      return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Draft' };
    case 'saved':
      return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Saved' };
    case 'sent':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Sent' };
    case 'cancelled':
      return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Cancelled' };
    case 'failed':
      return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Failed' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: status };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function paymentStatusConfig(status: string) {
  switch (status) {
    case 'paid':
      return { bg: 'bg-[#16a34a] text-white', label: 'Paid' };
    case 'partial':
      return { bg: 'bg-[#d97706] text-white', label: 'Partial' };
    case 'unpaid':
    default:
      return { bg: 'bg-[#dc2626] text-white', label: 'Unpaid' };
  }
}

interface InvoiceCardProps {
  invoice: Invoice;
  index?: number;
}

export default function InvoiceCard({ invoice, index = 0 }: InvoiceCardProps) {
  const status = statusConfig(invoice.status, invoice.delivery_status);
  const payment = paymentStatusConfig(invoice.payment_status || 'unpaid');
  const router = useRouter();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  // Quick Payment state
  const balanceDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(balanceDue.toString());
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const handleRecordPayment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (amount > balanceDue + 0.01) {
      showToast(`Amount cannot exceed balance due ₹${balanceDue.toFixed(2)}`, 'error');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount,
          payment_method: paymentMethod,
          note: paymentNote.trim(),
          paid_at: paymentDate,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to record payment');
      }

      showToast(`₹${amount} payment recorded successfully`, 'success');
      setShowPaySheet(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error recording payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete draft', 'error');
      } else {
        showToast('Draft deleted successfully', 'success');
        router.refresh();
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    }
    setDeleting(false);
  };

  return (
    <motion.div
      onClick={() => {
        if (invoice.status === 'draft') {
          router.push(`/invoice/new?draftId=${invoice.id}`);
        } else {
          router.push(`/invoice/${invoice.id}`);
        }
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.03 }}
      className="bg-white border border-[#e5e7eb] rounded-2xl md:rounded-none p-4 hover:shadow-md transition-shadow cursor-pointer relative shadow-xs"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl md:rounded-none bg-[#0050e8]/8 flex items-center justify-center text-[#0050e8]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a1d26]">
              {invoice.invoice_number}
            </p>
            <p className="text-[11px] text-[#9ca3af]">
              {maskPhone(invoice.customer_phone)} · <span suppressHydrationWarning>{timeAgo(invoice.created_at)}</span>
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-base font-extrabold text-[#1a1d26] tabular-nums">
            ₹{Number(invoice.total).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.text} ${status.bg} px-2 py-0.5 rounded-full`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
              <span className={`inline-flex items-center text-[10px] font-bold ${payment.bg} px-2 py-0.5 rounded-full shadow-sm`}>
                {payment.label}
              </span>
            )}
            {invoice.status !== 'draft' && invoice.status !== 'cancelled' && invoice.payment_status !== 'paid' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaySheet(true);
                }}
                className="inline-flex items-center text-[10px] font-extrabold bg-[#0050e8]/10 hover:bg-[#0050e8]/20 text-[#0050e8] px-2 py-0.5 rounded-full transition-colors cursor-pointer border border-[#0050e8]/20"
              >
                + Pay
              </button>
            )}
            
            {/* Actions for draft status */}
            {invoice.status === 'draft' && (
              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/invoice/new?draftId=${invoice.id}`);
                  }}
                  className="inline-flex items-center text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full transition-colors cursor-pointer border border-blue-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center text-[10px] font-extrabold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-0.5 rounded-full transition-colors cursor-pointer border border-red-200"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaySheet && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowPaySheet(false);
            }}
            className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs z-50 flex items-end justify-center px-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl md:rounded-none p-6 pb-8 space-y-4 shadow-xl border border-[#e5e7eb] max-h-[90vh] overflow-y-auto mb-0"
            >
              <div className="w-12 h-1 bg-gray-250 rounded-full mx-auto mb-1" />
              <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-3">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-extrabold text-[#111827]">Quick Record Payment</h3>
                  <p className="text-[10px] text-[#9ca3af] font-medium">Invoice: {invoice.invoice_number}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaySheet(false);
                  }}
                  className="text-xs text-[#9ca3af] hover:text-[#111827] font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Pay in Full option */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentAmount(balanceDue.toString());
                }}
                className="w-full bg-[#0050e8]/5 hover:bg-[#0050e8]/10 text-[#0050e8] text-xs font-extrabold py-2 rounded-xl border border-dashed border-[#0050e8]/20 transition-all text-center"
              >
                Pay in Full (₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </button>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    max={balanceDue}
                    min={0.01}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                    Payment Method
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {(['cash', 'upi', 'bank_transfer', 'other'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentMethod(method);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize transition-all border ${
                          paymentMethod === method
                            ? 'bg-[#0050e8] text-white border-[#0050e8] shadow-sm'
                            : 'bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-gray-50'
                        }`}
                      >
                        {method.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                    Payment Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GPay reference number, cash collected"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={savingPayment}
                  className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
