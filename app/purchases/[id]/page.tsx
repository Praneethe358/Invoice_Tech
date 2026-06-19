import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PurchaseDetailClient from './PurchaseDetailClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: purchase } = await supabase
    .from('purchases')
    .select('purchase_invoice_number')
    .eq('id', id)
    .single();

  if (!purchase) {
    return { title: 'Purchase Management — TruBill' };
  }
  return {
    title: `${purchase.purchase_invoice_number} — TruBill`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PurchaseDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) {
    redirect('/settings');
  }

  // Fetch purchase details
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single();

  if (!purchase) {
    redirect('/purchases');
  }

  // Fetch purchase items
  const { data: items } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', id)
    .order('created_at', { ascending: true });

  return (
    <PurchaseDetailClient
      shop={shop}
      purchase={purchase}
      items={items || []}
    />
  );
}
