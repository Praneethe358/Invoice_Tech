'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Supplier, Product, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  suppliers: Supplier[];
  products: Product[];
}

interface PurchaseItemInput {
  name: string;
  qty: number;
  price: number;
  hsn_code: string;
  gst_rate: number;
}

export default function NewPurchaseClient({ shop, suppliers, products }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  // Basic invoice fields
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [itcEligible, setItcEligible] = useState(true);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Line items fields
  const [items, setItems] = useState<PurchaseItemInput[]>([
    { name: '', qty: 1, price: 0, hsn_code: '', gst_rate: 18 },
  ]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === supplierId);
  }, [supplierId, suppliers]);

  // Handle supplier change to toggle ITC eligibility
  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup && sup.gstin && shop.gst_registered) {
      setItcEligible(true);
    } else {
      setItcEligible(false);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { name: '', qty: 1, price: 0, hsn_code: '', gst_rate: 18 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };

        // If product name changes, check if we can autofill HSN and purchase/sale price
        if (field === 'name') {
          const prod = products.find((p) => p.name === value);
          if (prod) {
            updated.hsn_code = prod.hsn_code || '';
            updated.price = Number(prod.price);
          }
        }
        return updated;
      })
    );
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;
    let total = 0;

    items.forEach((item) => {
      const lineSubtotal = item.qty * item.price;
      const taxRate = item.gst_rate;
      const lineGst = lineSubtotal * (taxRate / 100);
      const lineCgst = lineGst / 2;
      const lineSgst = lineGst / 2;

      subtotal += lineSubtotal;
      totalCgst += lineCgst;
      totalSgst += lineSgst;
      totalGst += lineGst;
      total += lineSubtotal + lineGst;
    });

    return {
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      gst: totalGst,
      total,
    };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }

    if (!invoiceNumber.trim()) {
      showToast('Please enter the purchase invoice number', 'error');
      return;
    }

    // Validate items
    const invalidItem = items.find((item) => !item.name.trim() || item.qty <= 0 || item.price < 0);
    if (invalidItem) {
      showToast('Please verify item names, quantities, and rates', 'error');
      return;
    }

    // Validate HSN codes if shop is GST registered
    if (shop.gst_registered) {
      const missingHsn = items.find((item) => !item.hsn_code || item.hsn_code.trim().length < 4);
      if (missingHsn) {
        showToast('All items must have a valid HSN code (min 4 digits)', 'error');
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId,
          purchase_invoice_number: invoiceNumber.trim().toUpperCase(),
          purchase_date: purchaseDate,
          itc_eligible: itcEligible,
          auto_update_stock: autoUpdateStock,
          subtotal: calculations.subtotal,
          total_cgst: calculations.cgst,
          total_sgst: calculations.sgst,
          total_gst: calculations.gst,
          total: calculations.total,
          items: items.map((itm) => ({
            name: itm.name.trim().toUpperCase(),
            hsn_code: itm.hsn_code.trim(),
            qty: Number(itm.qty),
            price: Number(itm.price),
            gst_rate: Number(itm.gst_rate),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record purchase invoice');
      }

      showToast('Purchase invoice recorded successfully!', 'success');
      router.push('/purchases');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
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
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Record inward supplies · Fill invoice meta fields & item rows
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
                Record Purchase
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Record inward supplies · Fill invoice meta fields & item rows
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

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-6">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a6b3c]"></span>
            Record Supplier Invoice
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Supplier and Invoice Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#1a6b3c] focus:ring-1 focus:ring-[#1a6b3c]/20 transition-all"
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.gstin ? `(${sup.gstin})` : '(No GSTIN)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Purchase Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PUR-2026-0091"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1a6b3c] focus:ring-1 focus:ring-[#1a6b3c]/20 transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#1a6b3c] focus:ring-1 focus:ring-[#1a6b3c]/20 transition-all"
                  required
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-end gap-3.5 py-1.5">
                {shop.gst_registered && (
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={itcEligible}
                      onChange={(e) => setItcEligible(e.target.checked)}
                      className="rounded border-slate-200 text-[#1a6b3c] focus:ring-0 w-4.5 h-4.5 cursor-pointer"
                    />
                    Claim Input Tax Credit (ITC) for this invoice
                  </label>
                )}

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoUpdateStock}
                    onChange={(e) => setAutoUpdateStock(e.target.checked)}
                    className="rounded border-slate-200 text-[#1a6b3c] focus:ring-0 w-4.5 h-4.5 cursor-pointer"
                  />
                  Auto-update product inventory stock counts
                </label>
              </div>
            </div>

            {/* Line Items List */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Purchase Invoice Line Items
                </h3>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  className="bg-[#1a6b3c]/5 hover:bg-[#1a6b3c]/10 text-[#1a6b3c] font-bold text-[11px] px-3.5 py-1.5 rounded-lg border border-dashed border-[#1a6b3c]/20 transition-colors"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 relative space-y-4 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="absolute right-4 top-4 text-red-500 hover:text-red-700 text-[10px] font-bold uppercase"
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">
                          Product Name
                        </label>
                        <input
                          type="text"
                          list={`products-list-${index}`}
                          placeholder="e.g. UREA 50KG"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a6b3c]"
                          required
                        />
                        <datalist id={`products-list-${index}`}>
                          {products.map((p) => (
                            <option key={p.id} value={p.name} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">
                          HSN Code (Min 4 digits)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 3102"
                          value={item.hsn_code}
                          onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a6b3c] font-mono"
                          maxLength={8}
                          required={shop.gst_registered}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1a6b3c] text-center"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">
                            Rate (Base)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1a6b3c] text-right"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">
                            GST Rate
                          </label>
                          <select
                            value={item.gst_rate}
                            onChange={(e) => handleItemChange(index, 'gst_rate', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-805 focus:outline-none focus:border-[#1a6b3c]"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Submission */}
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full md:max-w-xs space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <span>Subtotal (Base Value):</span>
                  <span className="text-slate-800 tabular-nums">₹{calculations.subtotal.toFixed(2)}</span>
                </div>
                {shop.gst_registered && (
                  <>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>CGST (Intra-state):</span>
                      <span className="text-slate-800 tabular-nums">₹{calculations.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                      <span>SGST (Intra-state):</span>
                      <span className="text-slate-800 tabular-nums">₹{calculations.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900">Invoice Total:</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">₹{calculations.total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full md:w-auto bg-[#1a6b3c] hover:bg-[#155630] text-white font-extrabold rounded-xl py-3 px-10 text-xs shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save Purchase Invoice'}
              </button>
            </div>
          </form>
        </div>
      </PageTransition>
    </div>
  );
}
