import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Customer, Invoice, Shop } from '@/lib/types';
import CustomerDetailClient from './CustomerDetailClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('name')
    .eq('id', id)
    .single();

  if (!customer) {
    return { title: 'Customer Ledger — TruBill' };
  }
  return {
    title: `${customer.name} — TruBill`,
  };
}

export default async function CustomerDetailPage({
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

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (!customer) redirect('/customers');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', customer.shop_id)
    .single();

  if (!shop || shop.auth_user_id !== user.id) {
    redirect('/customers');
  }

  // Fetch invoices for this customer
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('customer_phone', customer.phone)
    .order('created_at', { ascending: false });

  return (
    <CustomerDetailClient
      customer={customer as Customer}
      shop={shop as Shop}
      invoices={(invoices ?? []) as Invoice[]}
    />
  );
}
