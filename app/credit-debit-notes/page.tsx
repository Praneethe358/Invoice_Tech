import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { Shop } from '@/lib/types';
import CreditDebitNotesClient from './CreditDebitNotesClient';

export const dynamic = 'force-dynamic';

export default async function CreditDebitNotesPage() {
  const supabase = await createClient();
  const ctx = await getCurrentUserContext(supabase);

  if (!ctx) redirect('/login');

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', ctx.shopId)
    .single();

  if (!shop) redirect('/signup');

  // Fetch initial notes with related invoice number and line items
  const { data: notes } = await supabase
    .from('credit_debit_notes')
    .select('*, invoices(invoice_number), cdn_items(*)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false });

  return (
    <CreditDebitNotesClient
      shop={shop as Shop}
      initialNotes={(notes ?? []) as any[]}
    />
  );
}
