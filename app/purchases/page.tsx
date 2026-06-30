import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserContext } from '@/lib/current-user';
import PurchasesClient from './PurchasesClient';

export default async function PurchasesPage() {
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

  // Fetch initial purchases list
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('shop_id', shop.id)
    .order('purchase_date', { ascending: false });

  return (
    <PurchasesClient
      shop={shop}
      initialPurchases={purchases || []}
    />
  );
}
