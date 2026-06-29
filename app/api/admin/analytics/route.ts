import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { isRateLimited } from '@/lib/rate-limit';

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

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const admin = createAdminClient();

  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();

  // All shops (including auth_user_id to filter out platform owner admin shop)
  const { data: allShops } = await admin
    .from('shops')
    .select('id, shop_type, subscription_status, gst_registered, created_at, auth_user_id');

  const adminShop = (allShops || []).find(s => s.auth_user_id === 'a24f626f-c941-4759-b9d4-6e4f3039555e');
  const adminShopId = adminShop?.id;

  const shops = (allShops || []).filter(s => s.auth_user_id !== 'a24f626f-c941-4759-b9d4-6e4f3039555e');

  // New shops this month
  const newShops = shops.filter(s =>
    s.created_at >= monthStart && s.created_at < monthEnd
  );

  // Churned (expired or cancelled) this month — check subscription_notes for timestamp
  const churned = shops.filter(s =>
    (s.subscription_status === 'expired' || s.subscription_status === 'cancelled')
  );

  // Active shops
  const activeShops = shops.filter(s => s.subscription_status === 'active');

  // Invoices this month (excluding admin shop invoices)
  let invoicesThisMonthQuery = admin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd);

  if (adminShopId) {
    invoicesThisMonthQuery = invoicesThisMonthQuery.neq('shop_id', adminShopId);
  }
  const { count: invoicesThisMonth } = await invoicesThisMonthQuery;

  // Total invoices platform-wide (excluding admin shop invoices)
  let totalInvoicesQuery = admin
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  if (adminShopId) {
    totalInvoicesQuery = totalInvoicesQuery.neq('shop_id', adminShopId);
  }
  const { count: totalInvoices } = await totalInvoicesQuery;

  // Average invoices per shop
  const avgPerShop = shops.length > 0
    ? Math.round((invoicesThisMonth || 0) / shops.length * 10) / 10
    : 0;

  // Most active shop this month (excluding admin shop)
  let mostActiveQuery = admin
    .from('invoices')
    .select('shop_id')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd);

  if (adminShopId) {
    mostActiveQuery = mostActiveQuery.neq('shop_id', adminShopId);
  }
  const { data: mostActiveData } = await mostActiveQuery;

  let mostActiveShop = { name: '—', count: 0 };
  if (mostActiveData && mostActiveData.length > 0) {
    const countMap: Record<string, number> = {};
    mostActiveData.forEach(i => {
      countMap[i.shop_id] = (countMap[i.shop_id] || 0) + 1;
    });
    const topId = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0];
    if (topId) {
      const { data: topShop } = await admin
        .from('shops')
        .select('name')
        .eq('id', topId[0])
        .single();
      mostActiveShop = { name: topShop?.name || '—', count: topId[1] };
    }
  }

  // Shop type breakdown
  const typeBreakdown: Record<string, number> = {};
  shops.forEach(s => {
    const type = s.shop_type || 'other';
    typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  // Growth chart — shops cumulative growth based on range query parameter
  const range = searchParams.get('range') || '1m';
  const growthData: { month: string; shops: number }[] = [];
  const now = new Date();

  if (range === '1m') {
    // Daily cumulative growth for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
      const cumulative = shops.filter(s => s.created_at < end).length;
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      growthData.push({ month: label, shops: cumulative });
    }
  } else if (range === '3m') {
    // Weekly cumulative growth for the last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000).toISOString();
      const cumulative = shops.filter(s => s.created_at < end).length;
      const dStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const label = dStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      growthData.push({ month: `Wk of ${label}`, shops: cumulative });
    }
  } else {
    // Monthly cumulative growth for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const cumulative = shops.filter(s => s.created_at < end).length;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      growthData.push({ month: label, shops: cumulative });
    }
  }

  // GST adoption
  const gstRegistered = shops.filter(s => s.gst_registered).length;

  return NextResponse.json({
    revenue: {
      active_shops: activeShops.length,
      mrr: activeShops.length * 349,
      new_shops: newShops.length,
      churned: churned.length,
      net_growth: newShops.length - churned.length,
    },
    usage: {
      invoices_this_month: invoicesThisMonth || 0,
      total_invoices: totalInvoices || 0,
      avg_per_shop: avgPerShop,
      most_active: mostActiveShop,
    },
    type_breakdown: typeBreakdown,
    growth_data: growthData,
    gst: {
      registered: gstRegistered,
      total: shops.length,
      percentage: shops.length > 0 ? Math.round((gstRegistered / shops.length) * 100) : 0,
    },
  });
}
