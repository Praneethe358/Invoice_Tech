import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserContext } from '@/lib/current-user';
import SupplierDetailClient from './SupplierDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
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

  // Fetch supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single();

  if (!supplier) {
    redirect('/suppliers');
  }

  // Fetch purchase history
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('supplier_id', id)
    .order('purchase_date', { ascending: false });

  // Calculate aggregates
  let totalPurchased = 0;
  let totalItcEligible = 0;

  (purchases || []).forEach((p: any) => {
    totalPurchased += parseFloat(p.total as any) || 0;
    if (p.itc_eligible) {
      totalItcEligible += parseFloat((p.total_cgst + p.total_sgst) as any) || 0;
    }
  });

  return (
    <SupplierDetailClient
      shop={shop}
      initialSupplier={supplier}
      purchases={purchases || []}
      totalPurchased={totalPurchased}
      totalItcEligible={totalItcEligible}
    />
  );
}
