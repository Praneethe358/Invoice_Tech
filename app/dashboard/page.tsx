import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Invoice, Shop } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

  // Fetch recent invoices for the list
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(12);

  const typedShop = shop as Shop;
  const typedInvoices = (invoices ?? []) as Invoice[];

  // Fetch stats data (single lightweight query)
  const { data: allInvoicesData } = await supabase
    .from('invoices')
    .select('status, created_at, total, amount_paid, payment_status, delivery_status')
    .eq('shop_id', shop.id);

  let totalInvoices = 0;
  let thisMonth = 0;
  let failedInvoices = 0;
  let totalOutstanding = 0;

  if (allInvoicesData) {
    const activeInvoices = allInvoicesData.filter(
      (inv) => inv.status === 'saved' || inv.status === 'sent'
    );
    totalInvoices = activeInvoices.length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    allInvoicesData.forEach((inv) => {
      if (inv.status === 'failed' || inv.delivery_status === 'failed') {
        failedInvoices++;
      }
    });

    activeInvoices.forEach((inv) => {
      const invDate = new Date(inv.created_at);
      if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
        thisMonth += Number(inv.total || 0);
      }

      const paymentStatus = inv.payment_status || 'unpaid';
      if (paymentStatus === 'unpaid' || paymentStatus === 'partial') {
        const totalVal = Number(inv.total || 0);
        const paidVal = Number(inv.amount_paid || 0);
        totalOutstanding += (totalVal - paidVal);
      }
    });
  }

  // Fetch customer count
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shop.id);

  return (
    <DashboardClient
      shop={typedShop}
      invoices={typedInvoices}
      userName={context.name}
      stats={{
        totalInvoices,
        thisMonth,
        failedInvoices,
        totalCustomers: totalCustomers ?? 0,
        totalOutstanding,
      }}
    />
  );
}
