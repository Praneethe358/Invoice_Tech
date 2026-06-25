/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Shop, Product } from '@/lib/types';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
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

  let initialVariants: any[] = [];
  if (products && products.length > 0 && (shop.shop_type === 'clothing' || shop.shop_type === 'footwear')) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', products.map((p) => p.id));
    initialVariants = variants || [];
  }

  return (
    <CatalogClient
      shop={shop as Shop}
      initialProducts={(products ?? []) as Product[]}
      initialVariants={initialVariants}
    />
  );
}
