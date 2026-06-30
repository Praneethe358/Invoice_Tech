import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserContext } from '@/lib/current-user';
import SuppliersClient from './SuppliersClient';

export default async function SuppliersPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) {
    redirect('/login');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) {
    redirect('/signup');
  }

  // Fetch initial suppliers list
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('shop_id', shop.id)
    .order('name', { ascending: true });

  // Fetch all purchases to aggregate data
  const { data: purchases } = await supabase
    .from('purchases')
    .select('supplier_id, total, purchase_date')
    .eq('shop_id', shop.id);

  // Group purchases by supplier_id
  const supplierStats: { [supplierId: string]: { total: number; lastDate: string | null } } = {};
  if (purchases) {
    purchases.forEach((p) => {
      if (!p.supplier_id) return;
      if (!supplierStats[p.supplier_id]) {
        supplierStats[p.supplier_id] = { total: 0, lastDate: null };
      }
      supplierStats[p.supplier_id].total += parseFloat(p.total as any) || 0;
      
      const dateStr = p.purchase_date;
      if (!supplierStats[p.supplier_id].lastDate || dateStr > supplierStats[p.supplier_id].lastDate!) {
        supplierStats[p.supplier_id].lastDate = dateStr;
      }
    });
  }

  const enrichedSuppliers = (suppliers || []).map((sup) => ({
    ...sup,
    total_purchases: supplierStats[sup.id]?.total || 0,
    last_purchase_date: supplierStats[sup.id]?.lastDate || null,
  }));

  return (
    <SuppliersClient
      shop={shop}
      initialSuppliers={enrichedSuppliers}
    />
  );
}
