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

function statusConfig(status: string) {
  switch (status) {
    case 'sent':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Sent' };
    case 'failed':
      return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Failed' };
    case 'created':
      return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Created' };
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
  const status = statusConfig(invoice.status);
  const payment = paymentStatusConfig(invoice.payment_status || 'unpaid');
  const router = useRouter();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);

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

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setResending(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        showToast('Failed to resend invoice', 'error');
      } else {
        showToast('Invoice resent successfully', 'success');
        router.refresh();
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    }
    setResending(false);
  };

  return (
    <motion.div
      onClick={() => router.push(`/invoice/${invoice.id}`)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.03 }}
      className="bg-white border border-[#e5e7eb] rounded-none p-4 hover:shadow-md transition-shadow cursor-pointer relative"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-none bg-[#1a6b3c]/8 flex items-center justify-center text-[#1a6b3c]">
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
            {invoice.status === 'failed' && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="Resend Invoice"
              >
                {resending ? (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                )}
              </button>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.text} ${status.bg} px-2 py-0.5 rounded-full`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className={`inline-flex items-center text-[10px] font-bold ${payment.bg} px-2 py-0.5 rounded-full shadow-sm`}>
              {payment.label}
            </span>
            {invoice.payment_status !== 'paid' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPaySheet(true);
                }}
                className="inline-flex items-center text-[10px] font-extrabold bg-[#1a6b3c]/10 hover:bg-[#1a6b3c]/20 text-[#1a6b3c] px-2 py-0.5 rounded-full transition-colors cursor-pointer border border-[#1a6b3c]/20"
              >
                + Pay
              </button>
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
              className="w-full max-w-md bg-white rounded-none p-6 pb-8 space-y-4 shadow-xl border border-[#e5e7eb] max-h-[90vh] overflow-y-auto mb-0"
            >
              <div className="w-12 h-1 bg-gray-200 rounded-none mx-auto mb-1" />
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
                className="w-full bg-[#1a6b3c]/5 hover:bg-[#1a6b3c]/10 text-[#1a6b3c] text-xs font-extrabold py-2 rounded-xl border border-dashed border-[#1a6b3c]/20 transition-all text-center"
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
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
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
                            ? 'bg-[#1a6b3c] text-white border-[#1a6b3c] shadow-sm'
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
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
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
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={savingPayment}
                  className="w-full bg-[#1a6b3c] hover:bg-[#155d33] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
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
