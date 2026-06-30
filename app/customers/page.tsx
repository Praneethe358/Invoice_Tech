import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Customer, Shop } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import CustomersClient from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: totalCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id);

  return (
    <CustomersClient
      shop={shop as Shop}
      customers={(customers ?? []) as Customer[]}
      totalCount={totalCount ?? 0}
    />
  );
}
