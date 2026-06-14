'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import Button from '@/components/Button';
import Input from '@/components/Input';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Shop, Product } from '@/lib/types';

interface Props {
  shop: Shop;
  initialProducts: Product[];
}

export default function SettingsClient({
  shop,
  initialProducts,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useToast();

  // ─── Shop Details ─────────────────────────────────────────
  const [shopName, setShopName] = useState(shop.name);
  const [shopAddress, setShopAddress] = useState(
    shop.address || ''
  );
  const [shopPhone, setShopPhone] = useState(shop.phone || '');
  const [savingShop, setSavingShop] = useState(false);

  const handleSaveShop = async (e: FormEvent) => {
    e.preventDefault();
    setSavingShop(true);

    const { error } = await supabase
      .from('shops')
      .update({
        name: shopName.trim(),
        address: shopAddress.trim() || null,
        phone: shopPhone.trim() || null,
      })
      .eq('id', shop.id);

    if (error) {
      showToast('Failed to update shop details', 'error');
    } else {
      showToast('Shop details updated', 'success');
      router.refresh();
    }
    setSavingShop(false);
  };

  // ─── Products ─────────────────────────────────────────────
  const [products, setProducts] = useState(initialProducts);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const handleAddProduct = async () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);

    if (!name) {
      showToast('Enter a product name', 'error');
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Enter a valid price', 'error');
      return;
    }

    setAddingProduct(true);
    const { data, error } = await supabase
      .from('products')
      .insert({ shop_id: shop.id, name, price })
      .select()
      .single();

    if (error) {
      showToast('Failed to add product', 'error');
    } else if (data) {
      setProducts((prev) => [...prev, data as Product]);
      setNewName('');
      setNewPrice('');
      showToast('Product added', 'success');
    }
    setAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Failed to delete product', 'error');
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product deleted', 'success');
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(String(product.price));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    const price = parseFloat(editPrice);

    if (!name || isNaN(price) || price <= 0) {
      showToast('Enter valid name and price', 'error');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ name, price })
      .eq('id', editingId);

    if (error) {
      showToast('Failed to update product', 'error');
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId ? { ...p, name, price } : p
        )
      );
      setEditingId(null);
      showToast('Product updated', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <Navbar />
      <PageTransition className="max-w-lg mx-auto px-4 py-6 pb-12">
        <h1 className="text-xl font-bold text-[#111827] mb-6">
          Settings
        </h1>

        {/* Shop Details */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Shop Details
          </h2>
          <form
            onSubmit={handleSaveShop}
            className="bg-white rounded-2xl border border-[#e5e7eb] p-4 space-y-4"
          >
            <Input
              label="Shop Name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
            <Input
              label="Address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
            />
            <Input
              label="Phone"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              type="tel"
            />
            <Button type="submit" loading={savingShop}>
              Save Changes
            </Button>
          </form>
        </section>

        {/* Product Catalog */}
        <section>
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
            Product Catalog
          </h2>

          {/* Add Product Form */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-4 mb-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Product name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="w-24">
                <Input
                  placeholder="Price"
                  type="number"
                  prefix="₹"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddProduct}
                loading={addingProduct}
                disabled={!newName || !newPrice}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Product List */}
          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description="Add your first item above. These products will appear in your invoice builder for quick selection."
            />
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-[#e5e7eb] p-4"
                  >
                    {editingId === product.id ? (
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <Input
                            value={editName}
                            onChange={(e) =>
                              setEditName(e.target.value)
                            }
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            prefix="₹"
                            value={editPrice}
                            onChange={(e) =>
                              setEditPrice(e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleSaveEdit}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#6b7280] tabular-nums">
                            ₹
                            {Number(product.price).toLocaleString(
                              'en-IN'
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(product)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[#f3f4f6] text-[#6b7280] transition-colors"
                            aria-label={`Edit ${product.name}`}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id)
                            }
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-red-50 text-[#dc2626] transition-colors"
                            aria-label={`Delete ${product.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </PageTransition>
    </div>
  );
}
