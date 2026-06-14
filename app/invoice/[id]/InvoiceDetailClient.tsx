'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { Invoice, Shop } from '@/lib/types';

interface Props {
  invoice: Invoice;
  shop: Shop;
}

export default function InvoiceDetailClient({ invoice, shop }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleResend = async () => {
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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) throw new Error('Failed to download PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}_${shop.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    }
    setDownloading(false);
  };

  const dateStr = new Date(invoice.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

        {invoice.status === 'failed' && (
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
                {invoice.invoice_number}
              </h1>
              <p className="text-sm text-[#6b7280]">{dateStr}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${invoice.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : ''}
              ${invoice.status === 'failed' ? 'bg-red-50 text-red-600' : ''}
              ${invoice.status === 'created' ? 'bg-amber-50 text-amber-600' : ''}
            `}>
              {invoice.status}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Billed To
            </h2>
            {invoice.customer_name && (
              <p className="text-base font-bold text-[#111827] mb-1">{invoice.customer_name}</p>
            )}
            <p className="text-sm text-[#4b5563]">+91 {invoice.customer_phone}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Items
            </h2>
            <div className="space-y-4">
              {invoice.items.map((item, idx) => (
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
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-[#6b7280]">Total Amount</p>
              <p className="text-xl font-extrabold text-[#111827] tabular-nums">
                ₹{Number(invoice.total).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-[#6b7280]">Payment Status</p>
              <p className={`text-sm font-bold uppercase ${invoice.payment_status === 'unpaid' ? 'text-red-600' : 'text-emerald-600'}`}>
                {invoice.payment_status}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleDownload} loading={downloading} variant="ghost" className="w-full bg-white border border-[#e5e7eb]">
            Download PDF
          </Button>
          <Button onClick={handleResend} loading={resending} variant="primary" className="w-full">
            {invoice.status === 'failed' ? 'Resend Invoice' : 'Send Again'}
          </Button>
        </div>
      </PageTransition>
    </div>
  );
}
