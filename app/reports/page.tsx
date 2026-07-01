import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) {
    redirect('/login');
  }

  // Only owner and admin can access Reports
  if (context.role !== 'owner' && context.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, logo_url, shop_type, gst_registered, inventory_enabled, subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent, is_frozen, frozen_reason, state, gstin, phone, address, created_at, auth_user_id')
    .eq('id', context.shopId)
    .single();

  if (!shop) {
    redirect('/signup');
  }

  return <ReportsClient shop={shop} userName={context.name} />;
}
