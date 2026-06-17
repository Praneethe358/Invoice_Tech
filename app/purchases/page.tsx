import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PurchasesClient from './PurchasesClient';

export default async function PurchasesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) {
    redirect('/settings');
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
