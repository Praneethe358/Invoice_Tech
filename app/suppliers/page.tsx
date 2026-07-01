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
    .select('id, name, logo_url, shop_type')
    .eq('id', context.shopId)
    .single();

  if (!shop) {
    redirect('/signup');
  }

  // Fetch initial suppliers list (limit 25)
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, shop_id, name, contact_person, phone, email, address, gstin, created_at')
    .eq('shop_id', shop.id)
    .order('name', { ascending: true })
    .limit(25);

  // Fetch purchases only for these suppliers to aggregate data
  const supplierIds = (suppliers || []).map((s: any) => s.id);
  let purchases: any[] = [];
  if (supplierIds.length > 0) {
    const { data: purData } = await supabase
      .from('purchases')
      .select('supplier_id, total, purchase_date')
      .eq('shop_id', shop.id)
      .in('supplier_id', supplierIds);
    purchases = purData || [];
  }

  // Group purchases by supplier_id
  const supplierStats: { [supplierId: string]: { total: number; lastDate: string | null } } = {};
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

  const enrichedSuppliers = (suppliers || []).map((sup: any) => ({
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
