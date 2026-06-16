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

  // Load items from database table if uses_items_table is true
  if (invoice.uses_items_table) {
    const { data: dbItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('created_at', { ascending: true });

    if (dbItems) {
      invoice.items = dbItems.map((item: any) => ({
        name: item.name,
        price: Number(item.price),
        quantity: item.qty,
        hsn_code: item.hsn_code,
        gst_rate: Number(item.gst_rate),
        cgst: Number(item.cgst),
        sgst: Number(item.sgst),
        line_total: Number(item.line_total),
      }));
    }
  }

  return (
    <InvoiceDetailClient
      invoice={invoice as Invoice}
      shop={shop as Shop}
    />
  );
}
