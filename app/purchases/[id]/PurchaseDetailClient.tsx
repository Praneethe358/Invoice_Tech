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
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />

      <PageTransition className="max-w-lg md:max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24">
        {/* Header matched with profile logo format */}
        <div className="bg-white border border-[#e5e7eb] -mx-4 md:-mx-8 px-6 md:px-10 py-5 -mt-6.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#1a6b3c]/10 flex items-center justify-center overflow-hidden border border-[#e5e7eb]">
              {shop.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo_url} alt="Shop Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1a6b3c] flex items-center justify-center text-white font-extrabold text-sm">
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {shop.name}
              </h1>
              <p className="text-[#6b7280] text-[10px] mt-0.5 font-medium">
                Inward Purchase Invoice details · #{purchase.purchase_invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/purchases')}
            className="flex items-center gap-2 text-xs font-bold text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            ← Back to Purchases
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f3f4f6] pb-5">
            <div>
              <span className="text-[9px] text-[#1a6b3c] font-bold uppercase tracking-wider bg-[#e6f4ea] px-2.5 py-0.5 border border-[#d1e7dd] rounded-none font-mono">
                Inward Supply Log
              </span>
              <h2 className="text-2xl font-extrabold text-[#111827] mt-2 mb-1">
                Invoice #{purchase.purchase_invoice_number}
              </h2>
              <p className="text-xs text-[#6b7280] font-bold">Purchase Date: {dateStr}</p>
            </div>

            <div className="flex gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-650">Reverse transaction?</span>
                  <Button variant="danger" onClick={handleDelete} loading={deleting}>
                    Yes, Delete
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)} className="border border-gray-250">
                    No
                  </Button>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmDelete(true)} className="px-4">
                  Delete Purchase
                </Button>
              )}
            </div>
          </div>

          {/* Supplier details */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold text-[#4b5563]">
            <div>
              <span className="text-[9px] text-[#9ca3af] block uppercase tracking-wider mb-1">Supplier details</span>
              <p className="text-sm font-extrabold text-[#111827] uppercase">{purchase.supplier_name}</p>
              {purchase.supplier_gstin && (
                <p className="font-mono mt-1 text-xs text-[#1a6b3c]">GSTIN: {purchase.supplier_gstin}</p>
              )}
            </div>
            <div>
              <span className="text-[9px] text-[#9ca3af] block uppercase tracking-wider mb-1">Compliance & stock log</span>
              <p className="text-xs text-[#111827] mt-1">
                ITC eligible: {purchase.itc_eligible ? (
                  <span className="text-emerald-600 font-extrabold">YES</span>
                ) : (
                  <span className="text-gray-500 font-medium">NO</span>
                )}
              </p>
              <p className="text-xs text-[#111827] mt-1">
                Auto-updated inventory: {purchase.auto_update_stock ? (
                  <span className="text-emerald-600 font-extrabold">YES</span>
                ) : (
                  <span className="text-gray-500 font-medium">NO</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items details */}
        <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-sm mb-6">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide mb-4">
            Items Invoiced
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
              <thead>
                <tr className="bg-[#f9fafb] text-[#111827] font-bold border-b border-[#e5e7eb]">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Base Price</th>
                  {shop.gst_registered && (
                    <>
                      <th className="py-2.5 px-3 text-right">GST Rate</th>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {items.map((item, idx) => {
                  const itemTotal = Number(item.qty) * Number(item.price);
                  const itemGst = itemTotal * (item.gst_rate / 100);
                  const cgst = itemGst / 2;
                  const sgst = itemGst / 2;

                  return (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-3 font-extrabold text-gray-900 uppercase">{item.name}</td>
                      <td className="py-3 px-3 font-mono">{item.hsn_code || '—'}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{item.qty}</td>
                      <td className="py-3 px-3 text-right tabular-nums">₹{Number(item.price).toFixed(2)}</td>
                      {shop.gst_registered && (
                        <>
                          <td className="py-3 px-3 text-right tabular-nums">{item.gst_rate}%</td>
                          <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{cgst.toFixed(2)}</td>
                          <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{sgst.toFixed(2)}</td>
                        </>
                      )}
                      <td className="py-3 px-3 text-right font-extrabold text-gray-900 tabular-nums">
                        ₹{(itemTotal + itemGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aggregates block */}
          <div className="pt-6 mt-6 border-t border-dashed border-[#e5e7eb] flex flex-col items-end gap-3 text-xs font-semibold text-[#4b5563]">
            <div className="w-full md:max-w-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal (Base Value)</span>
                <span className="text-[#111827] tabular-nums">₹{Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              {shop.gst_registered && (
                <>
                  <div className="flex justify-between">
                    <span>CGST (Intra-state)</span>
                    <span className="text-[#111827] tabular-nums">₹{Number(purchase.total_cgst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (Intra-state)</span>
                    <span className="text-[#111827] tabular-nums">₹{Number(purchase.total_sgst).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-[#f3f4f6] pt-2 flex justify-between text-sm font-extrabold text-[#111827]">
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
