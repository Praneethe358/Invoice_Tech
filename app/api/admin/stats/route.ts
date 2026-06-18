import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

export async function GET() {
  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get all shops with counts
  const { data: shops, error: shopsErr } = await admin
    .from('shops')
    .select('id, subscription_status, created_at');

  if (shopsErr) {
    return NextResponse.json({ error: shopsErr.message }, { status: 500 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total_shops = shops?.length || 0;
  const active = shops?.filter(s => s.subscription_status === 'active').length || 0;
  const trial = shops?.filter(s => s.subscription_status === 'trial').length || 0;
  const expired = shops?.filter(s => s.subscription_status === 'expired').length || 0;
  const cancelled = shops?.filter(s => s.subscription_status === 'cancelled').length || 0;
  const new_this_month = shops?.filter(s => new Date(s.created_at) >= monthStart).length || 0;

  // Total invoices
  const { count: total_invoices } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  // MRR = active shops × 299
  const mrr = active * 299;

  return NextResponse.json({
    total_shops,
    active,
    trial,
    expired,
    cancelled,
    total_invoices: total_invoices || 0,
    mrr,
    new_this_month,
  });
}
