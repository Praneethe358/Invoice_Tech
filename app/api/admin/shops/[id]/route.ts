import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { isRateLimited } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { limited } = isRateLimited(`admin-limit:${ip}`, 100, 60000);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { isAdmin } = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Get shop
  const { data: shop, error: shopErr } = await admin
    .from('shops')
    .select('*')
    .eq('id', id)
    .single();

  if (shopErr || !shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  // Get owner email
  let ownerEmail = '—';
  try {
    const { data: { user } } = await admin.auth.admin.getUserById(shop.auth_user_id);
    if (user) ownerEmail = user.email || '—';
  } catch { /* ignore */ }

  // Activity stats
  const { count: totalInvoices } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', id);

  const { count: totalCustomers } = await admin
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', id);

  const { count: totalProducts } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', id);

  const { count: totalPurchases } = await admin
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', id);

  // Total Revenue calculation
  const { data: revenueData } = await admin
    .from('invoices')
    .select('total')
    .eq('shop_id', id);
  const totalRevenue = (revenueData || []).reduce((sum, inv) => sum + Number(inv.total), 0);

  // Payments received by the shop
  const { data: payments } = await admin
    .from('payments')
    .select('id, amount, payment_method, note, paid_at, invoice_id')
    .eq('shop_id', id)
    .order('paid_at', { ascending: false })
    .limit(10);

  // Audit logs of the shop
  const { data: auditLogs } = await admin
    .from('audit_logs')
    .select('id, actor_name, actor_role, action, entity_type, entity_label, created_at, details')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })
    .limit(15);

  // Last invoice date
  const { data: lastInvoice } = await admin
    .from('invoices')
    .select('created_at')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Recent 5 invoices
  const { data: recentInvoices } = await admin
    .from('invoices')
    .select('id, invoice_number, customer_name, customer_phone, total, status, created_at')
    .eq('shop_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Invoice volume per month (last 6 months)
  const now = new Date();
  const monthlyVolume: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const { count } = await admin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', id)
      .gte('created_at', start)
      .lt('created_at', end);

    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthlyVolume.push({ month: label, count: count || 0 });
  }

  // Last login from auth
  let lastSignIn: string | null = null;
  try {
    const { data: { user } } = await admin.auth.admin.getUserById(shop.auth_user_id);
    if (user) lastSignIn = user.last_sign_in_at || null;
  } catch { /* ignore */ }

  return NextResponse.json({
    shop: { ...shop, owner_email: ownerEmail },
    stats: {
      total_invoices: totalInvoices || 0,
      total_customers: totalCustomers || 0,
      total_products: totalProducts || 0,
      total_purchases: totalPurchases || 0,
      last_invoice_date: lastInvoice?.created_at || null,
      last_sign_in: lastSignIn,
      total_revenue: totalRevenue,
    },
    recent_invoices: recentInvoices || [],
    monthly_volume: monthlyVolume,
    payments: payments || [],
    audit_logs: auditLogs || [],
  });
}
