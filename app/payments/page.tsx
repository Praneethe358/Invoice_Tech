import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Shop, Payment } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import PaymentsClient from './PaymentsClient';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  // Fetch payments with invoice details for display
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      invoices (
        invoice_number,
        customer_name
      )
    `)
    .eq('shop_id', shop.id)
    .order('paid_at', { ascending: false });

  return (
    <PaymentsClient
      shop={shop as Shop}
      payments={(payments ?? []) as any[]}
    />
  );
}
