import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Invoice, Shop } from '@/lib/types';
import InvoiceDetailClient from './InvoiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (!invoice) redirect('/dashboard');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', invoice.shop_id)
    .single();

  if (!shop || shop.auth_user_id !== user.id) {
    redirect('/dashboard');
  }

  return (
    <InvoiceDetailClient
      invoice={invoice as Invoice}
      shop={shop as Shop}
    />
  );
}
