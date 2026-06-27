import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { isRateLimited } from '@/lib/rate-limit';
import { autoExpireOutdatedSubscriptions } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { limited } = isRateLimited(`admin-limit:${ip}`, 100, 60000);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Auto-expire trials/subscriptions before fetching stats
  await autoExpireOutdatedSubscriptions();

  const admin = createAdminClient();

  // Get all shops with counts
  const { data: shops, error: shopsErr } = await admin
    .from('shops')
    .select('id, subscription_status, created_at, auth_user_id');

  if (shopsErr) {
    return NextResponse.json({ error: shopsErr.message }, { status: 500 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Exclude the platform owner's admin shop from money/subscription calculations
  const nonAdminShops = shops?.filter(s => s.auth_user_id !== 'a24f626f-c941-4759-b9d4-6e4f3039555e') || [];

  const total_shops = nonAdminShops.length;
  const active = nonAdminShops.filter(s => s.subscription_status === 'active').length || 0;
  const trial = nonAdminShops.filter(s => s.subscription_status === 'trial').length || 0;
  const expired = nonAdminShops.filter(s => s.subscription_status === 'expired').length || 0;
  const cancelled = nonAdminShops.filter(s => s.subscription_status === 'cancelled').length || 0;
  const new_this_month = nonAdminShops.filter(s => new Date(s.created_at) >= monthStart).length || 0;

  // Total invoices
  const { count: total_invoices } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  // Total manual full data exports in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: exports_count } = await admin
    .from('data_exports')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo);

  // MRR = active shops × 349
  const mrr = active * 349;

  return NextResponse.json({
    total_shops,
    active,
    trial,
    expired,
    cancelled,
    total_invoices: total_invoices || 0,
    mrr,
    new_this_month,
    exports_count: exports_count || 0,
  });
}
