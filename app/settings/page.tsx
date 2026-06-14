import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Shop, Product } from '@/lib/types';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) redirect('/signup');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });

  return (
    <SettingsClient
      shop={shop as Shop}
      initialProducts={(products ?? []) as Product[]}
    />
  );
}
