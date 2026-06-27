/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import InvoiceBuilderClient from './InvoiceBuilderClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ draftId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const draftId = params?.draftId;

  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) redirect('/login');

  // Fetch shop details for active context
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', context.shopId)
    .single();

  if (!shop) redirect('/signup');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });

  let initialVariants: any[] = [];
  if ((shop.shop_type === 'clothing' || shop.shop_type === 'footwear') && products && products.length > 0) {
    const { data: vars } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', products.map(p => p.id));
    initialVariants = vars ?? [];
  }

  let initialDraft = null;
  if (draftId) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', draftId)
      .eq('shop_id', shop.id)
      .single();
    if (invoice) {
      initialDraft = invoice;
    }
  }

  return (
    <InvoiceBuilderClient
      products={(products ?? []) as Product[]}
      initialVariants={initialVariants}
      shopId={shop.id}
      shop={shop as any}
      initialDraft={initialDraft}
      userRole={context.role}
      userId={context.userId}
      userName={context.name}
    />
  );
}
