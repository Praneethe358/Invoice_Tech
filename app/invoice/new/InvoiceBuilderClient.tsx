'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import CatalogCard from '@/components/CatalogCard';
import LineItem from '@/components/LineItem';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SuccessAnimation from '@/components/SuccessAnimation';
import { useToast } from '@/components/Toast';
import { Product, InvoiceItem, ApiError } from '@/lib/types';
import { validatePhone } from '@/lib/validators';

interface Props {
  products: Product[];
}

export default function InvoiceBuilderClient({ products }: Props) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  // ─── Item management ─────────────────────────────────────
  const addOrIncrement = useCallback(
    (name: string, price: number) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.name === name);
        if (existing) {
          return prev.map((i) =>
            i.name === name
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { name, price, quantity: 1 }];
      });
    },
    []
  );

  const updateQty = useCallback(
    (name: string, qty: number) => {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => i.name !== name));
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.name === name ? { ...i, quantity: qty } : i
          )
        );
      }
    },
    []
  );

  const getItemQty = (name: string): number => {
    return items.find((i) => i.name === name)?.quantity ?? 0;
  };

  // ─── Custom item ──────────────────────────────────────────
  const handleAddCustom = () => {
    const name = customName.trim();
    const price = parseFloat(customPrice);

    if (!name) {
      showToast('Enter an item name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    addOrIncrement(name, price);
    setCustomName('');
    setCustomPrice('');
    setShowCustom(false);
  };

  // ─── Phone validation ─────────────────────────────────────
  const handlePhoneBlur = () => {
    if (phone && !validatePhone(phone)) {
      setPhoneError('Enter a valid 10-digit mobile number');
    } else {
      setPhoneError('');
    }
  };

  // ─── Total ────────────────────────────────────────────────
  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  // ─── Send Invoice ─────────────────────────────────────────
  const canSend =
    items.length > 0 && validatePhone(phone) && !loading;

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);

    try {
      // Step 1: Create invoice
      const createRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer_phone: phone.trim(),
          customer_name: customerName.trim() || undefined,
          payment_status: paymentStatus,
        }),
      });

      if (!createRes.ok) {
        const err = (await createRes.json()) as ApiError;
        throw new Error(err.error);
      }

      const { id, invoice_number } = await createRes.json();

      // Step 2: Send via WhatsApp
      const sendRes = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
      });

      if (!sendRes.ok) {
        const err = (await sendRes.json()) as ApiError;
        throw new Error(err.error);
      }

      // Success!
      setSuccessInvoice(invoice_number);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send invoice';
      showToast(message, 'error');
      setLoading(false);
    }
  };

  // ─── Success state ────────────────────────────────────────
  if (successInvoice) {
    return <SuccessAnimation invoiceNumber={successInvoice} />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <PageTransition className="max-w-lg mx-auto px-4 py-6 pb-36">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] transition-colors text-[#6b7280]"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-[#111827]">
            New Invoice
          </h1>
        </div>

        {/* Catalog */}
        {products.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Tap to add
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <CatalogCard
                  key={product.id}
                  product={product}
                  quantity={getItemQty(product.name)}
                  onTap={() =>
                    addOrIncrement(
                      product.name,
                      Number(product.price)
                    )
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Custom Item */}
        <section className="mb-6">
          <AnimatePresence>
            {showCustom ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={customName}
                        onChange={(e) =>
                          setCustomName(e.target.value)
                        }
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        placeholder="Price"
                        type="number"
                        prefix="₹"
                        value={customPrice}
                        onChange={(e) =>
                          setCustomPrice(e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleAddCustom}
                      className="flex-1"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowCustom(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowCustom(true)}
              >
                + Add custom item
              </Button>
            )}
          </AnimatePresence>
        </section>

        {/* Line Items */}
        {items.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              Invoice Items
            </h2>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] px-4">
              <AnimatePresence>
                {items.map((item) => (
                  <LineItem
                    key={item.name}
                    item={item}
                    onQtyChange={(qty) =>
                      updateQty(item.name, qty)
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Customer Details Form */}
        <section className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4 mb-6">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            Customer details
          </h2>

          <Input
            label="Customer Name"
            placeholder="e.g. PRANEETH"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Input
            label="Customer WhatsApp Number"
            placeholder="9876543210"
            prefix="+91"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPhone(val);
              if (phoneError) setPhoneError('');
            }}
            onBlur={handlePhoneBlur}
            error={phoneError}
          />

          {/* Payment Status Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-[#4b5563] uppercase tracking-wide mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#f3f4f6] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-[#1a6b3c] text-white shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentStatus === 'unpaid'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                Unpaid
              </button>
            </div>
          </div>
        </section>
      </PageTransition>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[#e5e7eb] z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6b7280] font-medium">
              Total
            </p>
            <p className="text-2xl font-bold text-[#111827] tabular-nums">
              ₹{total.toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            loading={loading}
            className="px-8"
          >
            Send Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
