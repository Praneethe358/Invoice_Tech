import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Customer, Shop } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import LedgerPageClient from './LedgerPageClient';

export const dynamic = 'force-dynamic';

export default async function CustomerLedgerPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  // Fetch Shop Details
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  // 3. Fetch all customers for search/dropdown
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shop.id)
    .order('name', { ascending: true });

  return (
    <LedgerPageClient
      shop={shop as Shop}
      customers={(customers ?? []) as Customer[]}
    />
  );
}
