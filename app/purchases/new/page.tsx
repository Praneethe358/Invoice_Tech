import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewPurchaseClient from './NewPurchaseClient';

export default async function NewPurchasePage() {
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

  // Fetch suppliers list
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('shop_id', shop.id)
    .order('name', { ascending: true });

  // Fetch products list
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('name', { ascending: true });

  return (
    <NewPurchaseClient
      shop={shop}
      suppliers={suppliers || []}
      products={products || []}
    />
  );
}
