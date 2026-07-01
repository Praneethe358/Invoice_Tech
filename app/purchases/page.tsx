import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUserContext } from '@/lib/current-user';
import PurchasesClient from './PurchasesClient';

export default async function PurchasesPage() {
  const supabase = await createClient();
  const context = await getCurrentUserContext(supabase);

  if (!context) {
    redirect('/login');
  }

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, logo_url, shop_type, gst_registered, inventory_enabled, subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent, is_frozen, frozen_reason, state, gstin, phone, address, created_at, auth_user_id')
    .eq('id', context.shopId)
    .single();

  if (!shop) {
    redirect('/signup');
  }

  // Fetch initial purchases list
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, shop_id, purchase_invoice_number, supplier_name, supplier_phone, purchase_date, subtotal, total_gst, total_cgst, total_sgst, total, itc_eligible, created_at')
    .eq('shop_id', shop.id)
    .order('purchase_date', { ascending: false })
    .limit(25);

  return (
    <PurchasesClient
      shop={shop}
      initialPurchases={purchases || []}
    />
  );
}
