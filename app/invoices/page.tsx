import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Invoice, Shop } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import InvoicesClient from './InvoicesClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  // Fetch shop
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  // Fetch initial invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(40);

  return (
    <InvoicesClient
      shop={shop as Shop}
      initialInvoices={(invoices ?? []) as Invoice[]}
    />
  );
}
