import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GstHubClient from './GstHubClient';

export default async function GstHubPage() {
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

  // Fetch all invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  // Fetch all purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('shop_id', shop.id)
    .order('purchase_date', { ascending: false });

  // Fetch all credit/debit notes
  const { data: creditDebitNotes } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .eq('shop_id', shop.id)
    .order('note_date', { ascending: false });

  return (
    <GstHubClient
      shop={shop}
      invoices={invoices || []}
      purchases={purchases || []}
      creditDebitNotes={creditDebitNotes || []}
    />
  );
}
