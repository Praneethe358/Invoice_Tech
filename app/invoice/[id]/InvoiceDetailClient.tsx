'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop, PaymentStatus, Payment } from '@/lib/types';

interface Props {
  invoice: Invoice;
  shop: Shop;
}

export default function InvoiceDetailClient({ invoice, shop }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [inv, setInv] = useState<Invoice>(invoice);

  const [resending, setResending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Cooldown timer state
  const [cooldown, setCooldown] = useState(0);

  // Payments ledger states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPaid, setTotalPaid] = useState(inv.uses_payments_table ? 0 : Number(inv.amount_paid || 0));
  const [balanceDue, setBalanceDue] = useState(Number(inv.total) - (inv.uses_payments_table ? 0 : Number(inv.amount_paid || 0)));
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Form states for new payment recording
  const [showForm, setShowForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingPayment, setSavingPayment] = useState(false);

  // Watch cooldown
  useEffect(() => {
    const expiryStr = localStorage.getItem(`varavu_cooldown_${inv.id}`);
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }
  }, [inv.id]);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch(`/api/invoices/${inv.id}/payments`);
        if (res.ok) {
          const json = await res.json();
          setPayments(json.payments);
          setTotalPaid(json.total_paid);
          setBalanceDue(json.balance_due);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoadingPayments(false);
      }
    }
    fetchPayments();
  }, [inv.id, inv.uses_payments_table, inv.amount_paid]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem(`varavu_cooldown_${inv.id}`);
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown, inv.id]);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, {
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pdf`);
      if (!res.ok) throw new Error('Failed to download PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoice_number}_${shop.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    }
    setDownloading(false);
  };

  const handleRecordPayment = async () => {
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
          invoice_id: inv.id,
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

      const json = await res.json();

      setPayments((prev) => [json.payment, ...prev]);
      setTotalPaid(json.total_paid);
      setBalanceDue(json.balance_due);

      setInv((prev) => ({
        ...prev,
        payment_status: json.payment_status,
        uses_payments_table: true,
      }));

      // Reset form fields
      setPaymentAmount('');
      setPaymentNote('');
      setPaymentMethod('cash');
      setShowForm(false);

      showToast(`₹${amount} recorded ✓`, 'success');

      if (json.balance_due <= 0) {
        showToast('Invoice fully paid! 🎉', 'success');
      }

      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error recording payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete payment');
      }

      const json = await res.json();

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setTotalPaid(json.total_paid);
      setBalanceDue(json.balance_due);

      setInv((prev) => ({
        ...prev,
        payment_status: json.payment_status,
      }));

      setDeletingPaymentId(null);
      showToast('Payment record removed', 'success');
      router.refresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting payment', 'error');
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/remind`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send reminder');
      }
      showToast(`Reminder sent to ${inv.customer_phone} ✓`, 'success');

      // Set cooldown
      const expiry = Date.now() + 60000;
      localStorage.setItem(`varavu_cooldown_${inv.id}`, expiry.toString());
      setCooldown(60);

      // Locally increment reminders count
      setInv((prev) => ({
        ...prev,
        sent_reminders: (prev.sent_reminders || 0) + 1,
      }));
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reminder', 'error');
    } finally {
      setSendingReminder(false);
    }
  };

  const dateStr = new Date(inv.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const total = Number(inv.total);
  const amountPaid = totalPaid;
  const balance = balanceDue;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header / Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>

        {inv.status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3"
          >
            <svg className="text-red-500 mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-sm font-bold text-red-800">Delivery Failed</p>
              <p className="text-xs text-red-600 mt-1">This invoice failed to send on WhatsApp. Tap Resend to try again.</p>
            </div>
          </motion.div>
        )}

        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827] mb-1">
                {inv.invoice_number}
              </h1>
              <p className="text-sm text-[#6b7280]">{dateStr}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                ${inv.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : ''}
                ${inv.status === 'failed' ? 'bg-red-50 text-red-600' : ''}
                ${inv.status === 'created' ? 'bg-amber-50 text-amber-600' : ''}
              `}>
                {inv.status}
              </div>
              {inv.sent_reminders && inv.sent_reminders > 0 ? (
                <span className="text-[10px] text-amber-600 font-semibold">
                  🔔 {inv.sent_reminders} reminder{inv.sent_reminders !== 1 ? 's' : ''} sent
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Billed To
            </h2>
            {inv.customer_name && (
              <p className="text-base font-bold text-[#111827] mb-1">{inv.customer_name}</p>
            )}
            <p className="text-sm text-[#4b5563]">+91 {inv.customer_phone}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Items
            </h2>
            <div className="space-y-4">
              {inv.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-[#111827]">{item.name}</p>
                      {shop.gst_registered && item.gst_rate !== undefined && item.gst_rate > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]">
                          {item.gst_rate}% GST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {item.quantity} x ₹{item.price} {item.hsn_code ? `• HSN: ${item.hsn_code}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#111827] tabular-nums">
                    ₹{(item.line_total !== undefined ? item.line_total : item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-[#d1d5db]">
            {inv.uses_items_table && shop.gst_registered && (
              <div className="space-y-2 mb-4 text-sm border-b border-[#f3f4f6] pb-4">
                <div className="flex justify-between text-[#6b7280]">
                  <span>Subtotal (Base Value)</span>
                  <span className="tabular-nums">₹{Number(inv.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>CGST</span>
                  <span className="tabular-nums">₹{Number(inv.total_cgst || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b7280]">
                  <span>SGST</span>
                  <span className="tabular-nums">₹{Number(inv.total_sgst || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm font-medium text-[#6b7280]">Total Amount</p>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment Section */}
            <div className="pt-4 border-t border-[#f3f4f6]">
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                Payment Summary
              </h2>

              {/* Payment Summary Box */}
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl p-4 mb-4 space-y-2.5">
                <div className="flex justify-between items-center text-sm font-medium text-[#4b5563]">
                  <span>Invoice Total:</span>
                  <span className="text-[#111827] font-bold">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-[#4b5563]">
                  <span>Total Paid:</span>
                  <span className="text-emerald-600 font-bold">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-[#e5e7eb] pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#111827]">Balance Due:</span>
                  {balanceDue <= 0 ? (
                    <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Fully Paid ✓
                    </span>
                  ) : (
                    <span className="text-sm font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                      ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment History List */}
              {inv.uses_payments_table && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">
                    Payment History
                  </h3>
                  {loadingPayments ? (
                    <p className="text-xs text-[#9ca3af] italic">Loading transactions...</p>
                  ) : payments.length === 0 ? (
                    <p className="text-xs text-[#9ca3af] italic">No payment history recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {payments.map((p) => {
                          const isDeleting = deletingPaymentId === p.id;
                          return (
                            <motion.div
                              key={p.id}
                              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-[#111827]">
                                  ₹{Number(p.amount).toLocaleString('en-IN')} · <span className="capitalize text-[#4b5563] font-semibold">{p.payment_method}</span>
                                </p>
                                <p className="text-[#9ca3af] font-medium">
                                  {new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {p.note && ` · "${p.note}"`}
                                </p>
                              </div>

                              <div>
                                {isDeleting ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#9ca3af] font-semibold">Delete?</span>
                                    <button
                                      onClick={() => handleDeletePayment(p.id)}
                                      className="font-bold text-red-600 hover:text-red-800"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setDeletingPaymentId(null)}
                                      className="font-bold text-gray-500 hover:text-gray-700"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingPaymentId(p.id)}
                                    className="text-[10px] font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wide"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* Record Payment Form */}
              {balanceDue > 0 && (
                <div className="mt-4">
                  {!showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full bg-[#1a6b3c]/10 hover:bg-[#1a6b3c]/15 text-[#1a6b3c] text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Record Payment
                    </button>
                  ) : (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden border border-[#e5e7eb] rounded-2xl p-4 bg-white space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wide">Record Payment</h4>
                        <button
                          onClick={() => setShowForm(false)}
                          className="text-xs text-[#9ca3af] hover:text-[#111827] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Pay in Full button */}
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(balanceDue.toString())}
                        className="w-full bg-[#1a6b3c]/5 hover:bg-[#1a6b3c]/10 text-[#1a6b3c] text-xs font-extrabold py-2 rounded-lg border border-dashed border-[#1a6b3c]/20 transition-all"
                      >
                        Pay in Full (₹{balanceDue.toLocaleString('en-IN')})
                      </button>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                            Amount Received (₹)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            max={balanceDue}
                            min={0.01}
                            placeholder="Enter amount"
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
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
                                onClick={() => setPaymentMethod(method)}
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
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                            Payment Note (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. GPay reference number, collected cash"
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                          />
                        </div>

                        <Button
                          onClick={handleRecordPayment}
                          loading={savingPayment}
                          className="w-full mt-2"
                        >
                          Record Payment
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {inv.payment_status !== 'paid' && (
            <Button
              onClick={handleSendReminder}
              loading={sendingReminder}
              disabled={cooldown > 0}
              className="w-full bg-[#d97706] hover:bg-[#b45309] text-white flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {cooldown > 0 ? `Resend in ${cooldown}s...` : 'Send Payment Reminder'}
            </Button>
          )}

          <Button onClick={handleDownload} loading={downloading} variant="ghost" className="w-full bg-white border border-[#e5e7eb]">
            Download PDF
          </Button>

          <Button onClick={handleResend} loading={resending} variant="primary" className="w-full">
            {inv.status === 'failed' ? 'Resend Invoice' : 'Send Again'}
          </Button>
        </div>
      </PageTransition>
    </div>
  );
}
