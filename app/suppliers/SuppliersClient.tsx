'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast } from '@/components/Toast';
import { Supplier, Shop } from '@/lib/types';

interface Props {
  shop: Shop;
  initialSuppliers: Supplier[];
}

export default function SuppliersClient({ shop, initialSuppliers }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Supplier Form state
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.gstin && s.gstin.toLowerCase().includes(query)) ||
        (s.phone && s.phone.includes(query))
    );
  }, [searchQuery, suppliers]);

  // Aggregated Stats
  const stats = useMemo(() => {
    let totalPurchases = 0;
    let registeredCount = 0;
    let unregisteredCount = 0;

    suppliers.forEach((s) => {
      totalPurchases += Number(s.total_purchases || 0);
      if (s.gstin) registeredCount++;
      else unregisteredCount++;
    });

    return {
      totalPurchases,
      registeredCount,
      unregisteredCount,
      totalSuppliers: suppliers.length,
    };
  }, [suppliers]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Supplier name is required', 'error');
      return;
    }

    if (gstin.trim() && gstin.trim().length !== 15) {
      showToast('Supplier GSTIN must be exactly 15 characters', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
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
        throw new Error(err.error || 'Failed to add supplier');
      }

      const newSupplier = await res.json();
      setSuppliers((prev) => [
        {
          ...newSupplier,
          total_purchases: 0,
          last_purchase_date: null,
        },
        ...prev,
      ]);
      
      showToast('Supplier added successfully!', 'success');
      setShowAddModal(false);
      setName('');
      setGstin('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
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
                Suppliers Database · Manage product suppliers, GSTINs, and purchase aggregates
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            + Add Supplier
          </Button>
        </div>

        {/* Vyapar style stats ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#eff6ff] border border-[#dbeafe] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#1d4ed8] uppercase tracking-wide">Total Suppliers</span>
            <p className="text-xl font-extrabold text-[#2563eb] mt-2">{stats.totalSuppliers}</p>
          </div>

          <div className="bg-[#f0fdf4] border border-[#dcfce7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#15803d] uppercase tracking-wide">Total Outward Purchases</span>
            <p className="text-xl font-extrabold text-[#16a34a] mt-2">
              ₹{stats.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-[#fffbeb] border border-[#fef3c7] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#b45309] uppercase tracking-wide">B2B Registered</span>
            <p className="text-xl font-extrabold text-[#d97706] mt-2">{stats.registeredCount} Suppliers</p>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-4 flex flex-col justify-between min-h-[90px] rounded-none">
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">Unregistered B2C</span>
            <p className="text-xl font-extrabold text-gray-900 mt-2">{stats.unregisteredCount} Suppliers</p>
          </div>
        </div>

        {/* Search bar row */}
        <div className="bg-white border border-[#e5e7eb] p-4 mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by supplier name, GSTIN, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e5e7eb] py-2 pl-9 pr-3 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1a6b3c]"
            />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Suppliers tabular log */}
        {filteredSuppliers.length === 0 ? (
          <EmptyState
            title="No suppliers found"
            description="Add your fertilizer or goods suppliers to record purchases and track Input Tax Credit (ITC)."
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        ) : (
          <div className="bg-white border border-[#e5e7eb] shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-[#4b5563]">
                <thead>
                  <tr className="bg-[#f9fafb] text-[#111827] font-bold border-b border-[#e5e7eb]">
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Registration status / GSTIN</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Total Purchases outlay</th>
                    <th className="py-3 px-4">Last Order Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredSuppliers.map((sup) => {
                    const dateStr = sup.last_purchase_date
                      ? new Date(sup.last_purchase_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No purchase';
                    return (
                      <tr key={sup.id} className="hover:bg-gray-50/55 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-gray-900 uppercase">{sup.name}</td>
                        <td className="py-3.5 px-4">
                          {sup.gstin ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#e6f4ea] text-[#1a6b3c] border border-[#d1e7dd] uppercase font-mono">
                              {sup.gstin}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                              Unregistered B2C
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">{sup.phone ? `+91 ${sup.phone.slice(-10)}` : '—'}</td>
                        <td className="py-3.5 px-4 text-gray-400 truncate max-w-[200px]">{sup.address || '—'}</td>
                        <td className="py-3.5 px-4 font-extrabold text-gray-900 tabular-nums">
                          ₹{Number(sup.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">{dateStr}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => router.push(`/suppliers/${sup.id}`)}
                            className="text-xs font-bold text-[#1a6b3c] hover:underline"
                          >
                            Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="md:hidden divide-y divide-[#f3f4f6]">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  onClick={() => router.push(`/suppliers/${sup.id}`)}
                  className="p-4 active:bg-gray-50 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase truncate max-w-[180px]">{sup.name}</h4>
                    <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                      {sup.gstin ? `GSTIN: ${sup.gstin}` : 'Unregistered Supplier'}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-gray-900 tabular-nums">
                      ₹{Number(sup.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-[#1a6b3c] font-bold">Ledger →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-none border border-[#e5e7eb] max-w-md w-full p-6 space-y-4 relative shadow-xl">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Add Supplier</h2>
              
              <form onSubmit={handleAddSupplier} className="space-y-4">
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
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 border border-[#e5e7eb]"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    Save Supplier
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
