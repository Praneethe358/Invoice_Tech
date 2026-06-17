import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Customer, Shop } from '@/lib/types';
import LedgerPageClient from './LedgerPageClient';

export const dynamic = 'force-dynamic';

export default async function CustomerLedgerPage() {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 2. Fetch Shop Details
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
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
