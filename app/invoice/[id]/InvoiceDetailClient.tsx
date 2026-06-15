'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop, PaymentStatus } from '@/lib/types';

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

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<PaymentStatus>(inv.payment_status || 'unpaid');
  const [formAmount, setFormAmount] = useState(inv.amount_paid?.toString() || '0');
  const [formNote, setFormNote] = useState(inv.payment_note || '');
  const [saving, setSaving] = useState(false);

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

  const handleSavePayment = async () => {
    setSaving(true);
    const oldInv = inv;

    let payment_status = formStatus;
    let amount_paid = 0;
    let paid_at = null;

    const totalVal = Number(inv.total);

    if (formStatus === 'paid') {
      amount_paid = totalVal;
      paid_at = new Date().toISOString();
    } else if (formStatus === 'partial') {
      amount_paid = Math.min(Number(formAmount) || 0, totalVal);
      if (amount_paid >= totalVal) {
        payment_status = 'paid';
        amount_paid = totalVal;
        paid_at = new Date().toISOString();
      }
    }

    const updatedInv = {
      ...inv,
      payment_status,
      amount_paid,
      payment_note: formNote.trim() || null,
      paid_at,
    };

    // Optimistic UI update
    setInv(updatedInv);
    setShowForm(false);

    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from('invoices')
        .update({
          payment_status,
          amount_paid,
          payment_note: formNote.trim() || null,
          paid_at,
        })
        .eq('id', inv.id);

      if (updateErr) throw updateErr;

      // Recalculate customer's total spent
      const { data: customerInvoices } = await supabase
        .from('invoices')
        .select('amount_paid')
        .eq('shop_id', inv.shop_id)
        .eq('customer_phone', inv.customer_phone);

      const totalSpent = (customerInvoices ?? []).reduce(
        (sum: number, item: any) => sum + Number(item.amount_paid || 0),
        0
      );

      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', inv.shop_id)
        .eq('phone', inv.customer_phone)
        .single();

      if (customerData) {
        await supabase
          .from('customers')
          .update({ total_spent: totalSpent })
          .eq('id', customerData.id);
      }

      showToast(`Payment marked as ${payment_status} ✓`, 'success');
      router.refresh();
    } catch (err) {
      console.error(err);
      showToast('Failed to save payment status', 'error');
      setInv(oldInv);
    } finally {
      setSaving(false);
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
  const amountPaid = Number(inv.amount_paid || 0);
  const balance = total - amountPaid;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />

      <PageTransition className="max-w-lg mx-auto px-4 py-6 pb-24">
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
                    <p className="text-sm font-bold text-[#111827]">{item.name}</p>
                    <p className="text-xs text-[#6b7280]">
                      {item.quantity} x ₹{item.price}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#111827] tabular-nums">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-[#d1d5db]">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm font-medium text-[#6b7280]">Total Amount</p>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                ₹{total.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Payment Section */}
            <div className="pt-4 border-t border-[#f3f4f6]">
              <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                Payment Details
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold text-white shadow-sm
                    ${inv.payment_status === 'paid' ? 'bg-[#16a34a]' : ''}
                    ${inv.payment_status === 'partial' ? 'bg-[#d97706]' : ''}
                    ${inv.payment_status === 'unpaid' ? 'bg-[#dc2626]' : ''}
                  `}>
                    {inv.payment_status === 'paid' && 'Paid'}
                    {inv.payment_status === 'partial' && 'Partially Paid'}
                    {inv.payment_status === 'unpaid' && 'Unpaid'}
                  </span>
                  <div className="text-right">
                    {inv.payment_status === 'paid' ? (
                      <p className="text-xs text-[#16a34a] font-bold">
                        Fully Paid ✓ {inv.paid_at ? `on ${new Date(inv.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-[#4b5563] font-semibold">
                        Paid: <span className="text-[#111827] font-bold">₹{amountPaid.toLocaleString('en-IN')}</span> | Balance: <span className="text-red-600 font-bold">₹{balance.toLocaleString('en-IN')}</span>
                      </p>
                    )}
                  </div>
                </div>

                {inv.payment_note && (
                  <p className="text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-2.5 text-[#4b5563] italic">
                    Note: {inv.payment_note}
                  </p>
                )}

                <button
                  onClick={() => setShowForm(!showForm)}
                  className="mt-1 text-xs font-bold text-[#1a6b3c] hover:text-[#155d33] transition-colors text-left"
                >
                  {showForm ? 'Close Form' : 'Update Payment'}
                </button>

                {/* Inline slide down form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#f3f4f6] pt-4 mt-2 space-y-4"
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wide mb-2">
                          Payment Status
                        </label>
                        <div className="grid grid-cols-3 gap-2 bg-[#f3f4f6] p-1 rounded-xl">
                          {(['unpaid', 'partial', 'paid'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setFormStatus(st);
                                if (st === 'paid') setFormAmount(total.toString());
                                if (st === 'unpaid') setFormAmount('0');
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                                formStatus === st
                                  ? st === 'paid' ? 'bg-[#16a34a] text-white shadow-sm'
                                    : st === 'partial' ? 'bg-[#d97706] text-white shadow-sm'
                                    : 'bg-[#dc2626] text-white shadow-sm'
                                  : 'text-[#4b5563] hover:text-[#111827]'
                              }`}
                            >
                              {st === 'partial' ? 'Partial' : st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {formStatus === 'partial' && (
                        <div>
                          <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">
                            Amount Received (₹)
                          </label>
                          <input
                            type="number"
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            max={total}
                            min={0}
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                          />
                        </div>
                      )}

                      {formStatus === 'paid' && (
                        <p className="text-xs text-[#16a34a] font-semibold">
                          Mark as fully paid on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (Amount: ₹{total.toLocaleString('en-IN')})
                        </p>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-[#4b5563] uppercase tracking-wide mb-1.5">
                          Payment Note
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Paid via GPay, cash collected"
                          value={formNote}
                          onChange={(e) => setFormNote(e.target.value)}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSavePayment}
                          loading={saving}
                          className="flex-1"
                          variant="primary"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setShowForm(false)}
                          className="px-4 bg-gray-100 text-[#4b5563] hover:bg-gray-200"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
