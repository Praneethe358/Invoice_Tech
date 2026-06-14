import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/lib/types';
import InvoiceBuilderClient from './InvoiceBuilderClient';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch shop products
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) redirect('/signup');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });

  return (
    <InvoiceBuilderClient
      products={(products ?? []) as Product[]}
      shopId={shop.id}
    />
  );
}
