import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/lib/types';
import InvoiceBuilderClient from './InvoiceBuilderClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ draftId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const draftId = params?.draftId;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch shop products
  const { data: shop } = await supabase
    .from('shops')
    .select('id, gst_registered, gstin, inventory_enabled, shop_type')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) redirect('/signup');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });

  let initialDraft = null;
  if (draftId) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', draftId)
      .eq('shop_id', shop.id)
      .single();
    if (invoice && invoice.status === 'draft') {
      initialDraft = invoice;
    }
  }

  return (
    <InvoiceBuilderClient
      products={(products ?? []) as Product[]}
      shopId={shop.id}
      shop={shop as { id: string; gst_registered: boolean; gstin: string | null; inventory_enabled: boolean; shop_type: string }}
      initialDraft={initialDraft}
    />
  );
}
