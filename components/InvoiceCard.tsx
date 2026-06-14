'use client';

import { motion } from 'framer-motion';
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

interface InvoiceCardProps {
  invoice: Invoice;
  index?: number;
}

export default function InvoiceCard({ invoice, index = 0 }: InvoiceCardProps) {
  const status = statusConfig(invoice.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: index * 0.03 }}
      className="glass-card-light rounded-2xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1a6b3c]/8 flex items-center justify-center text-[#1a6b3c]">
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
        <div className="text-right">
          <p className="text-base font-extrabold text-[#1a1d26] tabular-nums">
            ₹{Number(invoice.total).toLocaleString('en-IN')}
          </p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.text} ${status.bg} px-2 py-0.5 rounded-full`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
