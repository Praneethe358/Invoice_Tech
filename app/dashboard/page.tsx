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

  // Fetch recent invoices for the list
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const typedShop = shop as Shop;
  const typedInvoices = (invoices ?? []) as Invoice[];

  // Fetch stats data (single lightweight query)
  const { data: allInvoicesData } = await supabase
    .from('invoices')
    .select('status, created_at')
    .eq('shop_id', shop.id);

  let totalInvoices = 0;
  let thisMonth = 0;
  let failedInvoices = 0;

  if (allInvoicesData) {
    totalInvoices = allInvoicesData.length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    allInvoicesData.forEach((inv) => {
      if (inv.status === 'failed') failedInvoices++;
      
      const invDate = new Date(inv.created_at);
      if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
        thisMonth++;
      }
    });
  }

  return (
    <DashboardClient
      shop={typedShop}
      invoices={typedInvoices}
      stats={{ totalInvoices, thisMonth, failedInvoices }}
    />
  );
}
