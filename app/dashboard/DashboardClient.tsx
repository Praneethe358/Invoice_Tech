'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { Invoice, Shop } from '@/lib/types';

interface DashboardClientProps {
  shop: Shop;
  invoices: Invoice[];
  stats: {
    totalInvoices: number;
    sentToday: number;
    totalRevenue: number;
  };
}

const statCards = [
  {
    key: 'revenue',
    label: 'Total Revenue',
    iconBg: 'stat-gradient-1',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    key: 'total',
    label: 'Total Invoices',
    iconBg: 'stat-gradient-2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    key: 'today',
    label: 'Sent Today',
    iconBg: 'stat-gradient-3',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
];

export default function DashboardClient({
  shop,
  invoices,
  stats,
}: DashboardClientProps) {
  const statValues: Record<string, string | number> = {
    revenue: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
    total: stats.totalInvoices,
    today: stats.sentToday,
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg mx-auto px-4 pb-24">
        {/* Header with greeting */}
        <div className="gradient-hero gradient-hero-mesh rounded-b-3xl -mx-4 px-6 pt-6 pb-20 -mt-0.5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-emerald-200/70 text-xs font-medium">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
              </p>
              <h1 className="text-xl font-bold text-white">
                {shop.name}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stat cards — overlapping the header */}
        <div className="grid grid-cols-3 gap-3 -mt-14 mb-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className="glass-card-light rounded-2xl p-3.5 text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mx-auto mb-2`}>
                {card.icon}
              </div>
              <p className="text-lg font-extrabold text-[#1a1d26] tabular-nums leading-tight">
                {statValues[card.key]}
              </p>
              <p className="text-[10px] text-[#9ca3af] font-medium mt-1 uppercase tracking-wide">
                {card.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.a
            href="/invoice/new"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-light rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a6b3c]/10 flex items-center justify-center text-[#1a6b3c]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26]">New Invoice</p>
              <p className="text-[10px] text-[#9ca3af]">Create & send</p>
            </div>
          </motion.a>
          <motion.a
            href="/settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card-light rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1d26]">Catalog</p>
              <p className="text-[10px] text-[#9ca3af]">Manage items</p>
            </div>
          </motion.a>
        </div>

        {/* Recent Invoices */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#1a1d26]">
            Recent Invoices
          </h2>
          {invoices.length > 0 && (
            <span className="text-xs font-medium text-[#1a6b3c]">
              View all →
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="No invoices yet"
            description="Create your first invoice and send it to your customer on WhatsApp."
            actionLabel="Create Invoice"
            onAction={() => {
              window.location.href = '/invoice/new';
            }}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {invoices.map((invoice, i) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                index={i}
              />
            ))}
          </div>
        )}
      </PageTransition>
    </div>
  );
}
