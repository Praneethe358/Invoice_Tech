'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Supplier, Purchase, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  initialSupplier: Supplier;
  purchases: Purchase[];
  totalPurchased: number;
  totalItcEligible: number;
}

export default function SupplierDetailClient({
  shop,
  initialSupplier,
  purchases: initialPurchases,
  totalPurchased: initialTotal,
  totalItcEligible: initialItc,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [purchases] = useState<Purchase[]>(initialPurchases);
  const [totalPurchased] = useState<number>(initialTotal);
  const [totalItcEligible] = useState<number>(initialItc);

  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit fields
  const [name, setName] = useState(supplier.name);
  const [gstin, setGstin] = useState(supplier.gstin || '');
  const [phone, setPhone] = useState(supplier.phone || '');
  const [address, setAddress] = useState(supplier.address || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    if (gstin.trim() && gstin.trim().length !== 15) {
      showToast('GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
          phone: phone.trim() ? phone.trim() : null,
          address: address.trim() ? address.trim() : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update supplier');
      }

      const updated = await res.json();
      setSupplier(updated);
      showToast('Supplier updated successfully!', 'success');
      setShowEditModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete supplier');
      }

      showToast('Supplier deleted', 'success');
      router.push('/suppliers');
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
                Supplier Ledger & Transaction logs · {supplier.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/suppliers')}
            className="flex items-center gap-2 text-xs font-bold text-[#6b7280] hover:text-[#111827] transition-colors"
          >
            ← Back to Suppliers
          </button>
        </div>

        {/* Supplier Header details */}
        <div className="bg-white border border-[#e5e7eb] rounded-none p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f3f4f6] pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-[#1a6b3c]/10 text-[#1a6b3c] flex items-center justify-center text-xl font-extrabold border border-[#1a6b3c]/20">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#111827] uppercase leading-tight">
                  {supplier.name}
                </h2>
                <p className="text-xs text-[#6b7280] mt-1">
                  {supplier.gstin ? (
                    <span className="font-mono bg-[#e6f4ea] text-[#1a6b3c] px-2 py-0.5 border border-[#d1e7dd] text-[10px] font-bold uppercase">
                      GSTIN: {supplier.gstin}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 border border-gray-200 text-[10px] font-semibold">
                      Unregistered B2C
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowEditModal(true)} className="border border-[#e5e7eb] px-4">
                Edit Details
              </Button>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-600">Delete this supplier record?</span>
                  <Button variant="danger" onClick={handleDelete} loading={deleting}>
                    Yes, Delete
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)} className="border border-gray-255">
                    No
                  </Button>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirmDelete(true)} className="px-4">
                  Delete Supplier
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-[#4b5563]">
            {supplier.phone && (
              <p className="text-xs text-[#4b5563] font-bold">
                Phone Number: <span className="text-gray-900 font-extrabold">+91 {supplier.phone.slice(-10)}</span>
              </p>
            )}
            {supplier.address && (
              <p className="text-xs text-[#4b5563] font-bold">
                Billing Address: <span className="text-gray-900 font-extrabold">{supplier.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* Balance Sheet Highlights */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#f0fdf4] border border-[#dcfce7] p-5 rounded-none">
            <span className="text-[10px] text-[#15803d] block uppercase tracking-wider font-bold">Total Purchased Value</span>
            <span className="text-xl font-extrabold text-[#16a34a] mt-1.5 block">
              ₹{totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-[#eff6ff] border border-[#dbeafe] p-5 rounded-none">
            <span className="text-[10px] text-[#1d4ed8] block uppercase tracking-wider font-bold">Total Claimed ITC</span>
            <span className="text-xl font-extrabold text-[#2563eb] mt-1.5 block">
              ₹{totalItcEligible.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Purchases log log-table */}
        <div className="bg-white border border-[#e5e7eb] p-6 rounded-none shadow-sm">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wide mb-4">
            Purchase Invoice Ledger
          </h3>

          {purchases.length === 0 ? (
            <p className="text-xs text-[#9ca3af] italic">No purchases recorded for this supplier.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                <thead>
                  <tr className="bg-[#f9fafb] text-[#111827] font-bold border-b border-[#e5e7eb]">
                    <th className="py-2.5 px-3">Purchase Date</th>
                    <th className="py-2.5 px-3">Invoice Number</th>
                    <th className="py-2.5 px-3 text-right">Base Value</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Total Outlay</th>
                    <th className="py-2.5 px-3 text-right">ITC Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {purchases.map((p) => {
                    const dateStr = new Date(p.purchase_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-3 text-gray-900 font-bold">{dateStr}</td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">#{p.purchase_invoice_number}</td>
                        <td className="py-3 px-3 text-right tabular-nums">₹{Number(p.subtotal).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{Number(p.total_cgst).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-red-500 tabular-nums">₹{Number(p.total_sgst).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-gray-900 tabular-nums">
                          ₹{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${p.itc_eligible ? 'bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd]' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {p.itc_eligible ? 'Eligible' : 'No ITC'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => router.push(`/purchases/${p.id}`)}
                            className="text-[#1a6b3c] font-bold hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border border-[#e5e7eb] max-w-md w-full p-6 space-y-4 relative shadow-xl rounded-none">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Edit Supplier</h2>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  label="Supplier Name"
                  placeholder="e.g. TAMIL NADU FERTILIZERS"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  required
                />
                
                <Input
                  label="GSTIN (Optional)"
                  placeholder="15-character GSTIN"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                />
                
                <Input
                  label="Phone Number (Optional)"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">
                    Address (Optional)
                  </label>
                  <textarea
                    placeholder="Enter supplier address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-none px-3 py-2 text-xs font-medium text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 border border-[#e5e7eb]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={updating} className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </div>
  );
}
