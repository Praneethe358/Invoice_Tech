'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import InvoiceCard from '@/components/InvoiceCard';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Customer, CustomerTag, Invoice, Shop, Payment } from '@/lib/types';

interface Props {
  customer: Customer;
  shop: Shop;
  invoices: Invoice[];
}

export default function CustomerDetailClient({ customer: initial, shop, invoices }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(initial);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(initial.name);
  const [savingName, setSavingName] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // GSTIN states
  const [editingGstin, setEditingGstin] = useState(false);
  const [gstinValue, setGstinValue] = useState(initial.gstin || '');
  const [savingGstin, setSavingGstin] = useState(false);


  // Bulk sending state
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  // Tabs and Ledger State
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'invoices'>('overview');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerStats, setLedgerStats] = useState({ total_billed: 0, total_paid: 0, outstanding: 0 });

  useEffect(() => {
    async function fetchLedger() {
      if (activeTab !== 'ledger') return;
      setLoadingLedger(true);
      try {
        const res = await fetch(`/api/customers/${customer.id}/ledger`);
        if (res.ok) {
          const json = await res.json();
          setLedgerEntries(json.entries);
          setLedgerStats({
            total_billed: json.total_billed,
            total_paid: json.total_paid,
            outstanding: json.outstanding,
          });
        }
      } catch (err) {
        console.error('Failed to load customer ledger:', err);
      } finally {
        setLoadingLedger(false);
      }
    }
    fetchLedger();
  }, [activeTab, customer.id]);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim().toUpperCase();
    if (!trimmed || trimmed === customer.name.toUpperCase()) {
      setNameValue(customer.name.toUpperCase());
      setEditingName(false);
      return;
    }

    setSavingName(true);
    const { error } = await supabase
      .from('customers')
      .update({ name: trimmed })
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to update name', 'error');
      setNameValue(customer.name);
    } else {
      setCustomer(prev => ({ ...prev, name: trimmed }));
      setNameValue(trimmed);
      showToast('Name updated', 'success');
    }
    setSavingName(false);
    setEditingName(false);
  };

  const handleSaveGstin = async () => {
    const trimmed = gstinValue.trim().toUpperCase();
    if (trimmed === (customer.gstin || '')) {
      setEditingGstin(false);
      return;
    }

    if (trimmed && trimmed.length !== 15) {
      showToast('GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setSavingGstin(true);
    const { error } = await supabase
      .from('customers')
      .update({ gstin: trimmed || null })
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to update GSTIN', 'error');
      setGstinValue(customer.gstin || '');
    } else {
      setCustomer(prev => ({ ...prev, gstin: trimmed || null }));
      setGstinValue(trimmed);
      showToast('GSTIN updated', 'success');
    }
    setSavingGstin(false);
    setEditingGstin(false);
  };


  const handleToggleTag = async () => {
    const newTag: CustomerTag = customer.tag === 'vip' ? 'regular' : 'vip';
    const oldTag = customer.tag;

    // Optimistic update
    setCustomer(prev => ({ ...prev, tag: newTag }));
    setSavingTag(true);

    const { error } = await supabase
      .from('customers')
      .update({ tag: newTag })
      .eq('id', customer.id);

    if (error) {
      setCustomer(prev => ({ ...prev, tag: oldTag }));
      showToast('Failed to update tag', 'error');
    } else {
      showToast(`Marked as ${newTag.toUpperCase()}`, 'success');
    }
    setSavingTag(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id);

    if (error) {
      showToast('Failed to remove customer', 'error');
    } else {
      showToast('Customer removed', 'success');
      router.push('/customers');
    }
  };

  const handleSendBulkReminders = async () => {
    if (outstandingInvoices.length === 0) return;
    setBulkSending(true);
    let successCount = 0;

    for (let i = 0; i < outstandingInvoices.length; i++) {
      const inv = outstandingInvoices[i];
      setBulkProgress(`Sending ${i + 1} of ${outstandingInvoices.length}...`);

      try {
        const res = await fetch(`/api/invoices/${inv.id}/remind`, {
          method: 'POST',
        });
        if (res.ok) {
          successCount++;
        }
        // Wait 500ms between calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to send reminder for invoice ${inv.id}:`, err);
      }
    }

    showToast(`${successCount} reminder${successCount !== 1 ? 's' : ''} sent ✓`, 'success');
    setBulkSending(false);
    setBulkProgress('');
    router.refresh();
  };

  const lastInvoiceDate = invoices.length > 0
    ? new Date(invoices[0].created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Never';

  const statItems = [
    { label: 'Total Invoices', value: customer.total_invoices },
    { label: 'Total Spent', value: `₹${Number(customer.total_spent).toLocaleString('en-IN')}` },
    { label: 'Last Billed', value: lastInvoiceDate },
  ];

  const outstandingInvoices = invoices.filter(
    (inv) => inv.payment_status === 'unpaid' || inv.payment_status === 'partial'
  );

  const totalOutstanding = outstandingInvoices.reduce((sum: number, inv) => {
    const total = Number(inv.total);
    const amountPaid = Number(inv.amount_paid || 0);
    return sum + (total - amountPaid);
  }, 0);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Back button */}
        <button
          onClick={() => router.push('/customers')}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6b7280] hover:text-[#111827] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Customers
        </button>

        {/* Customer Header */}
        <div className="bg-white rounded-3xl border border-[#e5e7eb] p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309]'
                : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
            }`}>
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  disabled={savingName}
                  autoFocus
                  className="text-xl font-extrabold text-[#111827] bg-transparent border-b-2 border-[#1a6b3c] outline-none w-full pb-1"
                />
              ) : (
                <h1
                  onClick={() => {
                    setEditingName(true);
                    setTimeout(() => nameInputRef.current?.focus(), 50);
                  }}
                  className="text-xl font-extrabold text-[#111827] cursor-text hover:text-[#1a6b3c] transition-colors uppercase"
                  title="Click to edit"
                >
                  {customer.name}
                </h1>
              )}
              <p className="text-sm text-[#6b7280] mt-1">+91 {customer.phone.slice(-10)}</p>
              {editingGstin ? (
                <input
                  type="text"
                  value={gstinValue}
                  onChange={(e) => setGstinValue(e.target.value.toUpperCase())}
                  onBlur={handleSaveGstin}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGstin()}
                  disabled={savingGstin}
                  placeholder="ENTER GSTIN (15 CHARS)"
                  autoFocus
                  className="text-xs font-semibold text-[#111827] bg-transparent border-b-2 border-[#1a6b3c] outline-none pb-0.5 mt-1.5 w-full max-w-[200px]"
                />
              ) : (
                <p
                  onClick={() => setEditingGstin(true)}
                  className="text-xs font-semibold text-[#6b7280] mt-1.5 cursor-pointer hover:text-[#1a6b3c]"
                >
                  GSTIN: <span className="font-mono text-xs text-[#111827] underline decoration-dotted">{customer.gstin || 'None (Click to add)'}</span>
                </p>
              )}

            </div>
          </div>

          {/* Tag Toggle */}
          <button
            onClick={handleToggleTag}
            disabled={savingTag}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              customer.tag === 'vip'
                ? 'bg-[#fef3c7] text-[#b45309] hover:bg-[#fde68a]'
                : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
            }`}
          >
            {savingTag ? 'Saving...' : customer.tag === 'vip' ? '★ VIP — Tap to make Regular' : 'Regular — Tap to make VIP ★'}
          </button>
        </div>
            {/* Tab Selection Row */}
        <div className="flex bg-white/60 backdrop-blur-sm border border-[#e5e7eb] p-1.5 rounded-2xl mb-6 gap-1">
          {(['overview', 'ledger', 'invoices'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[#1a6b3c] text-white shadow-sm'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              {statItems.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.08 }}
                  className="glass-card-light rounded-2xl p-3.5 text-center"
                >
                  <p className="text-lg font-extrabold text-[#1a1d26] tabular-nums leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-[#9ca3af] font-medium mt-1 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Outstanding Summary Card */}
            <div>
              {totalOutstanding > 0 ? (
                <div className="bg-white rounded-3xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                  <div className="bg-amber-50/50 border-b border-[#e5e7eb] p-5">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Outstanding Balance
                    </p>
                    <p className="text-2xl font-extrabold text-amber-600">
                      ₹{totalOutstanding.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      {outstandingInvoices.map((inv) => {
                        const due = Number(inv.total) - Number(inv.amount_paid || 0);
                        return (
                          <div
                            key={inv.id}
                            onClick={() => router.push(`/invoice/${inv.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#f9fafb] border border-[#e5e7eb] hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1a1d26]">
                                {inv.invoice_number}
                              </span>
                              <span className="text-[10px] text-[#9ca3af]">
                                {new Date(inv.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-red-600">
                                ₹{due.toLocaleString('en-IN')} due
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSendBulkReminders}
                      disabled={bulkSending}
                      className="w-full mt-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#d97706] hover:bg-[#b45309] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {bulkSending ? bulkProgress : 'Send Reminder for All'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 text-center shadow-sm">
                  <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    All paid ✓ — No outstanding balance
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2 pl-2">Customer Ledger Timeline</h2>
            {loadingLedger ? (
              <div className="text-center py-12">
                <p className="text-xs text-[#9ca3af] italic animate-pulse">Loading transaction records...</p>
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-8 bg-white border border-[#e5e7eb] rounded-3xl">
                <p className="text-xs text-[#9ca3af] italic">No transaction history found for this customer.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-[#e5e7eb] ml-4 space-y-6">
                {ledgerEntries.map((entry) => {
                  const isInvoice = entry.type === 'invoice';
                  return (
                    <div key={entry.id} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-4 border-[#f5f6fa] shadow-sm ${
                        isInvoice ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />

                      {/* Timeline Card */}
                      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#1a6b3c]/30 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                              isInvoice ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {isInvoice ? 'Invoice' : 'Payment'}
                            </span>
                            <span className="text-xs font-extrabold text-[#111827]">
                              {entry.invoice_number}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] font-medium">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {!isInvoice && entry.payment_method && ` · via ${entry.payment_method.toUpperCase()}`}
                            {entry.note && ` · "${entry.note}"`}
                          </p>
                          {isInvoice && (
                            <button
                              onClick={() => router.push(`/invoice/${entry.invoice_id}`)}
                              className="text-[10px] text-[#1a6b3c] hover:underline font-bold"
                            >
                              View Invoice →
                            </button>
                          )}
                        </div>

                        {/* Amounts */}
                        <div className="text-right space-y-0.5">
                          <p className={`text-sm font-extrabold tabular-nums ${
                            isInvoice ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {isInvoice ? '+' : '-'}₹{Number(entry.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-[#9ca3af] font-semibold">
                            Balance: <span className="text-[#4b5563] font-bold">₹{Number(entry.running_balance).toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="animate-fadeIn">
            <h2 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-3 pl-2">Invoice History</h2>
            {invoices.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#d1d5db]">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
                title="No invoices yet"
                description="Invoices sent to this customer will appear here."
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {invoices.map((invoice, i) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Customer */}
        <div className="pt-4 border-t border-[#e5e7eb]">
          {confirmDelete ? (
            <div className="flex items-center justify-between text-sm">
              <p className="text-[#111827] font-medium">
                This won&apos;t delete their invoices. Remove anyway?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-[#f3f4f6] text-[#4b5563] rounded-lg font-semibold text-xs hover:bg-[#e5e7eb]"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold text-xs hover:bg-red-100"
                >
                  Yes
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Remove customer
            </button>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
