import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Invoice, Shop } from '@/lib/types';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch shop
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!shop) redirect('/signup');

  // Fetch recent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const typedShop = shop as Shop;
  const typedInvoices = (invoices ?? []) as Invoice[];

  // Stats
  const totalInvoices = typedInvoices.length;
  const today = new Date().toDateString();
  const sentToday = typedInvoices.filter(
    (inv) => new Date(inv.created_at).toDateString() === today
  ).length;
  const totalRevenue = typedInvoices.reduce(
    (sum, inv) => sum + Number(inv.total),
    0
  );

  return (
    <DashboardClient
      shop={typedShop}
      invoices={typedInvoices}
      stats={{ totalInvoices, sentToday, totalRevenue }}
    />
  );
}
