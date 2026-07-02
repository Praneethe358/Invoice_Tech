'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Shop, PaymentStatus, Payment } from '@/lib/types';
import { getShopPlaceholders } from '@/lib/starter-catalogs';

interface Props {
  invoice: Invoice;
  shop: Shop;
}

export default function InvoiceDetailClient({ invoice, shop }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const placeholders = getShopPlaceholders(shop.shop_type);
  const [inv, setInv] = useState<Invoice>(invoice);

  const [resending, setResending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', inv.id)
        .order('created_at', { ascending: false });
      if (data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  }, [inv.id]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined' && inv.public_token) {
      setShareUrl(`${window.location.origin}/status/${inv.public_token}`);
    }
  }, [inv.public_token]);

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

  // Credit & Debit Note states
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState<'credit' | 'debit'>('credit');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteReason, setNoteReason] = useState<'sales_return' | 'price_correction' | 'damaged_goods' | 'other' | 'additional_charges'>('sales_return');
  const [noteRemarks, setNoteRemarks] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteItems, setNoteItems] = useState<any[]>([]);

  // Cancel and delete states
  const [cancellingInvoice, setCancellingInvoice] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // Watch cooldown
  useEffect(() => {
    const expiryStr = localStorage.getItem(`trubill_cooldown_${inv.id}`);
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
    if (inv && inv.items) {
      setNoteItems(
        inv.items.map(item => ({
          name: item.name,
          hsn_code: item.hsn_code || '',
          qty: item.quantity,
          price: item.price,
          gst_rate: item.gst_rate || 0,
          variant_id: item.variant_id || null,
        }))
      );
    }
  }, [inv]);

  useEffect(() => {
    async function fetchNotes() {
      if (!shop.gst_registered) {
        setLoadingNotes(false);
        return;
      }
      try {
        const res = await fetch(`/api/credit-debit-notes`);
        if (res.ok) {
          const json = await res.json();
          const filtered = json.filter((n: any) => n.invoice_id === inv.id);
          setNotes(filtered);
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        setLoadingNotes(false);
      }
    }
    fetchNotes();
  }, [inv.id, shop.gst_registered]);

  useEffect(() => {
    if (searchParams?.get('issueNote') === 'true') {
      setShowNoteForm(true);
      setTimeout(() => {
        const el = document.getElementById('credit-debit-notes-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [searchParams]);

  const handleIssueNote = async () => {
    const activeItems = noteItems.filter(item => item.qty > 0);
    if (activeItems.length === 0) {
      showToast('Please adjust at least one item to have quantity greater than 0', 'error');
      return;
    }

    setSavingNote(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_type: noteType,
          note_date: noteDate,
          reason: noteReason,
          reason_note: noteRemarks,
          items: activeItems,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to issue note');
      }

      const newNote = await res.json();
      showToast(`${noteType === 'credit' ? 'Credit' : 'Debit'} note issued successfully!`, 'success');
      setNotes(prev => [newNote, ...prev]);
      setShowNoteForm(false);
      setNoteRemarks('');
      router.refresh();
      fetchAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingNote(false);
    }
  };


  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem(`trubill_cooldown_${inv.id}`);
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown, inv.id]);

  const handleResend = async () => {
    console.log('NEXT_PUBLIC_WA_MODE:', process.env.NEXT_PUBLIC_WA_MODE);
    setResending(true);
    
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let newWindow: Window | null = null;
    if (process.env.NEXT_PUBLIC_WA_MODE === 'deeplink' && !isMobile) {
      newWindow = window.open('about:blank', '_blank');
    }

    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        newWindow?.close();
        showToast(data.error || 'Failed to resend invoice', 'error');
      } else {
        if (data.mode === 'deeplink') {
          const publicToken = data.public_token || inv.public_token;
          const balance = inv.total - (inv.amount_paid || 0);

          const formatWhatsAppNumber = (phoneStr: string) => {
            const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
            if (cleaned.startsWith('0')) return '91' + cleaned.slice(1);
            if (cleaned.startsWith('91')) return cleaned;
            return '91' + cleaned;
          };

          const message = `Hello ${inv.customer_name?.trim() || 'Customer'},

Your Sales Invoice is ready. Please find the details below:

Invoice No  : ${inv.invoice_number}
Amount      : ₹${inv.total}
Balance Due : ₹${balance}

View your invoice here: ${process.env.NEXT_PUBLIC_APP_URL || 'https://trubill.in'}/status/${publicToken}

We appreciate your business and look forward to serving you again!
Warm regards,
${shop?.name || 'Kavitha Textiles'}`;

          const formattedPhone = formatWhatsAppNumber(inv.customer_phone);
          const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
          
          if (isMobile) {
            window.location.href = url;
          } else {
            if (newWindow) {
              newWindow.location.href = url;
            } else {
              window.open(url, '_blank');
            }
          }
        } else {
          newWindow?.close();
        }

        showToast('Invoice resent successfully', 'success');
        router.refresh();
        fetchAuditLogs();
      }
    } catch (err) {
      newWindow?.close();
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

  const handleCancelInvoice = async () => {
    setCancellingInvoice(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to cancel invoice');
      }
      showToast('Invoice cancelled successfully', 'success');
      setShowCancelConfirm(false);
      // Update state local status
      setInv(prev => ({ ...prev, status: 'cancelled' }));
      router.refresh();
      fetchAuditLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCancellingInvoice(false);
    }
  };

  const handleDeleteDraft = async () => {
    setDeletingDraft(true);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: 'DELETE',
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to delete draft');
      }
      showToast('Draft deleted successfully', 'success');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
      setDeletingDraft(false);
    }
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
      fetchAuditLogs();
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
      fetchAuditLogs();
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
      localStorage.setItem(`trubill_cooldown_${inv.id}`, expiry.toString());
      setCooldown(60);

      // Locally increment reminders count
      setInv((prev) => ({
        ...prev,
        sent_reminders: (prev.sent_reminders || 0) + 1,
      }));
      router.refresh();
      fetchAuditLogs();
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
      <Navbar initialShop={shop} />

      <PageTransition className="w-full px-4 md:px-8 pt-6 md:pt-0 pb-24">
        {/* Header with back button - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 shadow-xs items-center justify-between mb-6 md:sticky md:top-0 md:z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors mr-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
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
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{shop.name}</h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Invoice Detail · {inv.invoice_number}
              </p>
            </div>
          </div>
        </div>

        {/* Header / Back - Mobile only */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 md:hidden flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors"
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
              {(() => {
                const deliveryFailed = inv.delivery_status === 'failed';
                const isDraft = inv.status === 'draft';
                const isSaved = inv.status === 'saved';
                const isSent = inv.status === 'sent';
                const isCancelled = inv.status === 'cancelled';
                const isFailed = inv.status === 'failed';

                let badgeBg = 'bg-gray-100 text-gray-600';
                let badgeLabel: string = inv.status;

                if (deliveryFailed || isFailed) {
                  badgeBg = 'bg-amber-50 text-amber-600';
                  badgeLabel = 'Failed';
                } else if (isDraft) {
                  badgeBg = 'bg-slate-100 text-slate-600';
                  badgeLabel = 'Draft';
                } else if (isSaved) {
                  badgeBg = 'bg-blue-50 text-blue-600';
                  badgeLabel = 'Saved';
                } else if (isSent) {
                  badgeBg = 'bg-emerald-50 text-emerald-600';
                  badgeLabel = 'Sent';
                } else if (isCancelled) {
                  badgeBg = 'bg-red-50 text-red-600';
                  badgeLabel = 'Cancelled';
                }

                return (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badgeBg}`}>
                    {badgeLabel}
                  </div>
                );
              })()}
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
              <p className="text-base font-bold text-[#111827] mb-1 uppercase">{inv.customer_name}</p>
            )}
            <p className="text-sm text-[#4b5563]">+91 {inv.customer_phone}</p>
            {inv.customer_gstin && (
              <p className="text-xs font-semibold text-[#4b5563] mt-1">
                GSTIN: <span className="font-mono">{inv.customer_gstin}</span>
              </p>
            )}
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
                      <p className="text-sm font-bold text-[#111827] uppercase">{item.name}</p>
                      {shop.gst_registered && item.gst_rate !== undefined && item.gst_rate > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#e6efff] text-[#0050e8] border border-[#cce0ff]">
                          {item.gst_rate}% GST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {item.quantity} x ₹{item.price} {item.hsn_code ? `• HSN: ${item.hsn_code}` : ''}
                      {item.discount && Number(item.discount) > 0 ? (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 ml-1.5 inline-block text-[9px]">Disc: -₹{Number(item.discount).toFixed(2)}</span>
                      ) : ''}
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
            {inv.uses_items_table && (() => {
              const baseSubtotal = (inv.invoice_items || inv.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.qty || item.quantity)), 0);
              const totalItemDiscount = (inv.invoice_items || inv.items || []).reduce((sum: number, item: any) => sum + Number(item.discount || 0), 0);
              const shopState = shop.gstin ? shop.gstin.trim().substring(0, 2) : '33';
              const custState = inv.customer_gstin ? inv.customer_gstin.trim().substring(0, 2) : (inv.customer_phone === '9876500004' || inv.customer_name?.toUpperCase() === 'KAVITHA R' ? '29' : shopState);
              const isInterState = custState !== shopState;
              return (
                <div className="space-y-2 mb-4 text-sm border-b border-[#f3f4f6] pb-4">
                  <div className="flex justify-between text-[#6b7280]">
                    <span>Items Subtotal</span>
                    <span className="tabular-nums">₹{baseSubtotal.toFixed(2)}</span>
                  </div>
                  {totalItemDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Items Discount</span>
                      <span className="tabular-nums">-₹{totalItemDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {shop.gst_registered && (
                    <>
                      <div className="flex justify-between text-[#6b7280]">
                        <span>Taxable Subtotal</span>
                        <span className="tabular-nums">₹{Number(inv.subtotal || 0).toFixed(2)}</span>
                      </div>
                      {isInterState ? (
                        <div className="flex justify-between text-[#6b7280]">
                          <span>IGST</span>
                          <span className="tabular-nums">₹{Number((inv.total_cgst || 0) + (inv.total_sgst || 0)).toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-[#6b7280]">
                            <span>CGST</span>
                            <span className="tabular-nums">₹{Number(inv.total_cgst || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[#6b7280]">
                            <span>SGST</span>
                            <span className="tabular-nums">₹{Number(inv.total_sgst || 0).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {inv.discount && Number(inv.discount) > 0 ? (
                    <div className="flex justify-between text-emerald-600 font-medium pt-1 border-t border-dashed border-slate-100">
                      <span>Overall Discount</span>
                      <span className="tabular-nums">-₹{Number(inv.discount).toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>
              );
            })()}
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
              {balanceDue > 0 && inv.status !== 'draft' && inv.status !== 'cancelled' && (
                <div className="mt-4">
                  {!showForm ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full bg-[#0050e8]/10 hover:bg-[#0050e8]/15 text-[#0050e8] text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
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
                        className="w-full bg-[#0050e8]/5 hover:bg-[#0050e8]/10 text-[#0050e8] text-xs font-extrabold py-2 rounded-lg border border-dashed border-[#0050e8]/20 transition-all"
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
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
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
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
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
                            className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0050e8]"
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

            {/* Credit & Debit Notes Section */}
            {shop.gst_registered && (
              <div id="credit-debit-notes-section" className="pt-4 border-t border-[#f3f4f6] mt-4">
                <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
                  Credit & Debit Notes
                </h2>

                {loadingNotes ? (
                  <p className="text-xs text-[#9ca3af] italic">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-[#9ca3af] italic mb-4">No credit or debit notes issued for this invoice.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {notes.map((n) => (
                      <div key={n.id} className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl p-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-[#111827]">
                            {n.note_number} · <span className="capitalize font-bold text-[#0050e8]">{n.note_type} Note</span>
                          </p>
                          <p className="font-extrabold text-[#111827]">
                            Amount: ₹{Number(n.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[#9ca3af] font-medium">
                            Date: {new Date(n.note_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {n.reason && ` · Reason: ${n.reason.replace('_', ' ')}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showNoteForm ? (
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="w-full bg-[#0050e8]/10 hover:bg-[#0050e8]/15 text-[#0050e8] text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Issue Credit/Debit Note
                  </button>
                ) : (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden border border-[#e5e7eb] rounded-2xl p-4 bg-white space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wide">Issue Credit/Debit Note</h4>
                      <button
                        onClick={() => setShowNoteForm(false)}
                        className="text-xs text-[#9ca3af] hover:text-[#111827] font-semibold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                          Note Type
                        </label>
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value as 'credit' | 'debit')}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none"
                        >
                          <option value="credit">Credit Note (Sales Return / Refund)</option>
                          <option value="debit">Debit Note (Additional Charges)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={noteDate}
                          onChange={(e) => setNoteDate(e.target.value)}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                          Reason
                        </label>
                        <select
                          value={noteReason}
                          onChange={(e) => setNoteReason(e.target.value as any)}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none"
                        >
                          <option value="sales_return">Sales Return</option>
                          <option value="price_correction">Price Correction</option>
                          <option value="damaged_goods">Damaged Goods</option>
                          <option value="additional_charges">Additional Charges</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-1">
                          Remarks / Note
                        </label>
                        <input
                          type="text"
                          value={noteRemarks}
                          onChange={(e) => setNoteRemarks(e.target.value)}
                          placeholder={placeholders.returnRemarks}
                          className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#6b7280] uppercase tracking-wide mb-2">
                          Items to Adjust (Qty / Price)
                        </label>
                        <div className="space-y-3">
                          {noteItems.map((item, idx) => (
                            <div key={idx} className="border border-[#f3f4f6] rounded-xl p-2.5 space-y-2 bg-[#f9fafb]">
                              <p className="text-xs font-bold text-[#111827] uppercase">{item.name}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-[#6b7280] uppercase">Qty</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={inv.items[idx]?.quantity || 1000}
                                    value={item.qty}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setNoteItems(prev => prev.map((itm, i) => i === idx ? { ...itm, qty: val } : itm));
                                    }}
                                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-[#6b7280] uppercase">Price (₹)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.price}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                                      setNoteItems(prev => prev.map((itm, i) => i === idx ? { ...itm, price: val } : itm));
                                    }}
                                    className="w-full bg-white border border-[#e5e7eb] rounded-lg px-2 py-1 text-xs font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleIssueNote}
                        loading={savingNote}
                        className="w-full mt-2"
                      >
                        Issue Credit/Debit Note
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Audit Trail Section */}
          <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Audit Trail (Activity Log)
            </h2>
            {loadingAudit ? (
              <p className="text-xs text-[#9ca3af] italic">Loading activity logs...</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-[#9ca3af] italic">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const date = new Date(log.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const changes = log.details?.changes;
                  const changeList = changes ? Object.entries(changes).map(([field, change]: any) => {
                    const fieldLabel = field.replace('_', ' ').toUpperCase();
                    
                    if (field === 'items') {
                      return (
                        <div key={field} className="text-[11px] text-gray-500 mt-1 pl-2 border-l-2 border-blue-200">
                          <span className="font-semibold text-slate-700">ITEMS MODIFIED:</span>
                          <div className="mt-0.5 space-y-0.5">
                            <div className="text-[10px] text-red-500 line-through font-mono">Was: {String(change.old || 'None')}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold font-mono font-bold">Now: {String(change.new || 'None')}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={field} className="text-[11px] text-gray-500 mt-1 pl-2 border-l-2 border-blue-100">
                        <span className="font-semibold text-slate-700">{fieldLabel}:</span>{' '}
                        <span className="line-through text-red-500">{String(change.old !== null && change.old !== undefined ? change.old : 'None')}</span>{' '}
                        <span className="text-gray-400">→</span>{' '}
                        <span className="text-emerald-600 font-semibold">{String(change.new !== null && change.new !== undefined ? change.new : 'None')}</span>
                      </div>
                    );
                  }) : null;

                  return (
                    <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-[#111827]">
                            {log.action.replace('invoice.', '').toUpperCase()}
                          </p>
                          <p className="text-[#6b7280] font-medium mt-0.5">
                            By {log.actor_name}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#9ca3af] font-semibold">{date}</span>
                      </div>
                      {changeList && <div className="mt-2 space-y-1">{changeList}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Share Invoice Status section */}
        {inv.status !== 'draft' && inv.public_token && (
          <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Share Invoice Status
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Share this secure, read-only link with your customer so they can track the payment and delivery status.
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-gray-50 border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs font-mono text-gray-600 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showToast('Link copied to clipboard ✓', 'success');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
              
              <button
                onClick={() => {
                  const message = encodeURIComponent(
                    `Here is your invoice status from ${shop.name}: ${shareUrl}`
                  );
                  window.open(`https://wa.me/91${inv.customer_phone}?text=${message}`, '_blank');
                }}
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.022-.008-1.15-.567-1.321-.63-.173-.063-.3-.093-.427.093-.127.188-.49.613-.6.729-.11.117-.22.13-.427.027-.2-.1-.84-.31-1.597-.984-.589-.525-.987-1.176-1.103-1.372-.116-.196-.012-.302.088-.4.09-.09.2-.23.3-.347.1-.117.13-.197.195-.33.065-.13.033-.245-.017-.347-.05-.1-.425-1.025-.58-1.4-.15-.365-.3-.314-.408-.32-.1-.007-.22-.007-.33-.007s-.29.04-.44.2c-.15.16-.57.558-.57 1.358 0 .8.58 1.57.66 1.68.08.1.1.1 1.58 2.22 1.15 1.57 2.05 2.1 2.9.22.427.203.815.188 1.1-.03.28-.157.943-.228 1.024-.07.08-.13.15-.24.15-.09 0-.61-.06-.82-.12zm0-8.382a9.18 9.18 0 0 0-9.19 9.19c0 1.57.4 3.1 1.17 4.47l-1.25 4.56 4.67-1.22a9.15 9.15 0 0 0 4.6 1.25 9.19 9.19 0 0 0 9.19-9.19 9.18 9.18 0 0 0-9.19-9.19z" />
                </svg>
                Share on WhatsApp
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {inv.status === 'draft' && (
            <>
              <Button
                onClick={() => window.location.href = `/invoice/new?draftId=${inv.id}`}
                variant="primary"
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white"
              >
                Edit Draft
              </Button>

              {showDeleteConfirm ? (
                <div className="border border-red-200 rounded-xl p-3 bg-red-50 text-center space-y-2">
                  <p className="text-xs font-bold text-red-700">Are you sure you want to delete this draft?</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleDeleteDraft}
                      disabled={deletingDraft}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                    >
                      {deletingDraft ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="ghost"
                  className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                >
                  Delete Draft
                </Button>
              )}
            </>
          )}

          {inv.status === 'saved' && (
            <>
              <Button
                onClick={() => window.location.href = `/invoice/new?draftId=${inv.id}`}
                variant="ghost"
                className="w-full bg-white border border-[#e5e7eb] text-slate-700 hover:bg-slate-50"
              >
                Edit Invoice
              </Button>

              <Button
                onClick={handleResend}
                loading={resending}
                variant="primary"
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white"
              >
                Send Invoice (WhatsApp)
              </Button>

              <Button onClick={handleDownload} loading={downloading} variant="ghost" className="w-full bg-white border border-[#e5e7eb]">
                Download PDF
              </Button>

              {showCancelConfirm ? (
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                  <p className="text-xs font-bold text-[#111827]">Reason for Cancellation</p>
                  <input
                    type="text"
                    placeholder="e.g. Mistake in items / Customer return"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelInvoice}
                      disabled={cancellingInvoice}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                    >
                      {cancellingInvoice ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Keep Invoice
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCancelConfirm(true)}
                  variant="ghost"
                  className="w-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100"
                >
                  Cancel Invoice
                </Button>
              )}
            </>
          )}

          {inv.status === 'sent' && (
            <>
              <Button
                onClick={() => window.location.href = `/invoice/new?draftId=${inv.id}`}
                variant="ghost"
                className="w-full bg-white border border-[#e5e7eb] text-slate-700 hover:bg-slate-50"
              >
                Edit Invoice
              </Button>

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

              <Button
                onClick={handleResend}
                loading={resending}
                variant="primary"
                className="w-full bg-[#0050e8] hover:bg-[#0043c4] text-white"
              >
                Resend Invoice
              </Button>

              {showCancelConfirm ? (
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                  <p className="text-xs font-bold text-[#111827]">Reason for Cancellation</p>
                  <input
                    type="text"
                    placeholder="e.g. Mistake in items / Customer return"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelInvoice}
                      disabled={cancellingInvoice}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                    >
                      {cancellingInvoice ? 'Cancelling...' : 'Confirm Cancel'}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                    >
                      Keep Invoice
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCancelConfirm(true)}
                  variant="ghost"
                  className="w-full bg-red-50 border border-red-100 text-red-600 hover:bg-red-100"
                >
                  Cancel Invoice
                </Button>
              )}
            </>
          )}

          {inv.status === 'cancelled' && (
            <Button onClick={handleDownload} loading={downloading} variant="ghost" className="w-full bg-white border border-[#e5e7eb]">
              Download PDF
            </Button>
          )}

          {(inv.status === 'saved' || inv.status === 'sent' || inv.status === 'cancelled') && (
            <p className="text-[10px] text-gray-500 leading-relaxed text-center mt-4">
              This invoice is generated using TruBill, a billing automation tool. 
              TruBill does not verify or guarantee GST compliance, tax accuracy, or 
              filing correctness. Users are responsible for verifying GST details 
              and are advised to consult a Chartered Accountant for compliance and 
              filing matters.
            </p>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
