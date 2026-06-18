'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';
import { Purchase, Shop } from '@/lib/types';

interface PurchaseItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  hsn_code: string | null;
  gst_rate: number;
}

interface Props {
  shop: Shop;
  purchase: Purchase;
  items: PurchaseItem[];
}

export default function PurchaseDetailClient({ shop, purchase, items }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateStr = new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete purchase invoice');
      }

      showToast('Purchase invoice deleted. Inventory counts adjusted.', 'success');
      router.push('/purchases');
    } catch (err: any) {
      showToast(err.message, 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header matched with profile logo format - Desktop only */}
        <div className="hidden md:flex bg-white border border-[#e2e8f0] -mx-4 md:-mx-8 px-6 md:px-10 py-5 -mt-6.5 shadow-sm items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a6b3c] to-[#2e7d32] flex items-center justify-center overflow-hidden shadow-md">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-white font-extrabold text-lg">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Inward Purchase Invoice details · #{purchase.purchase_invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/purchases')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Purchases
          </button>
        </div>

        {/* Page Title Header - Mobile only */}
        <div className="mb-6 flex flex-col md:hidden justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors mr-1 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight font-heading uppercase">
                Purchase Invoice
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Inward Purchase Invoice details · #{purchase.purchase_invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/purchases')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Purchases
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd] uppercase tracking-wider font-mono">
                Inward Supply Log
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3 mb-1">
                Invoice #{purchase.purchase_invoice_number}
              </h2>
              <p className="text-xs text-slate-400 font-bold">Purchase Date: {dateStr}</p>
            </div>

            <div className="flex gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2 bg-red-50 p-2.5 rounded-xl border border-red-100">
                  <span className="text-xs font-extrabold text-red-700 mr-2">Reverse transaction?</span>
                  <button 
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg py-1.5 px-3.5 font-bold text-xs shadow-xs transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="bg-white hover:bg-slate-50 text-slate-700 rounded-lg py-1.5 px-3.5 border border-slate-200 font-bold text-xs transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-650 text-red-650 text-red-600 rounded-xl py-2 px-4 font-bold text-xs transition-colors"
                >
                  Delete Purchase
                </button>
              )}
            </div>
          </div>

          {/* Supplier details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-slate-600">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-1">Supplier details</span>
              <p className="text-sm font-extrabold text-slate-900 uppercase">{purchase.supplier_name}</p>
              {purchase.supplier_gstin && (
                <p className="font-mono mt-1 text-xs text-[#1a6b3c] font-bold">GSTIN: {purchase.supplier_gstin}</p>
              )}
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-1">Compliance & stock log</span>
              <p className="text-xs text-slate-900 mt-1.5 font-bold flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">ITC eligible:</span>
                {purchase.itc_eligible ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[10px]">YES</span>
                ) : (
                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium text-[10px]">NO</span>
                )}
              </p>
              <p className="text-xs text-slate-900 mt-1.5 font-bold flex items-center gap-1.5">
                <span className="text-slate-400 font-semibold">Auto-updated inventory:</span>
                {purchase.auto_update_stock ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-extrabold text-[10px]">YES</span>
                ) : (
                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium text-[10px]">NO</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">
            Items Invoiced
          </h3>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead>
                <tr className="bg-slate-50 text-slate-850 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">HSN Code</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Base Price</th>
                  {shop.gst_registered && (
                    <>
                      <th className="py-3 px-4 text-right">GST Rate</th>
                      <th className="py-3 px-4 text-right">CGST</th>
                      <th className="py-3 px-4 text-right">SGST</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const itemTotal = Number(item.qty) * Number(item.price);
                  const itemGst = itemTotal * (item.gst_rate / 100);
                  const cgst = itemGst / 2;
                  const sgst = itemGst / 2;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-800 uppercase">{item.name}</td>
                      <td className="py-3.5 px-4 font-mono">{item.hsn_code || '—'}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{item.qty}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">₹{Number(item.price).toFixed(2)}</td>
                      {shop.gst_registered && (
                        <>
                          <td className="py-3.5 px-4 text-right tabular-nums">{item.gst_rate}%</td>
                          <td className="py-3.5 px-4 text-right text-red-500 tabular-nums">₹{cgst.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-right text-red-500 tabular-nums">₹{sgst.toFixed(2)}</td>
                        </>
                      )}
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                        ₹{(itemTotal + itemGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aggregates block */}
          <div className="pt-6 mt-6 border-t border-dashed border-slate-200 flex flex-col items-end gap-3 text-xs font-semibold text-slate-600">
            <div className="w-full md:max-w-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (Base Value)</span>
                <span className="text-slate-800 tabular-nums">₹{Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              {shop.gst_registered && (
                <>
                  <div className="flex justify-between">
                    <span>CGST (Intra-state)</span>
                    <span className="text-slate-800 tabular-nums">₹{Number(purchase.total_cgst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (Intra-state)</span>
                    <span className="text-slate-800 tabular-nums">₹{Number(purchase.total_sgst).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
                <span>Total Value</span>
                <span className="tabular-nums">₹{Number(purchase.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
