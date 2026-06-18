import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
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

  // All shops
  const { data: allShops } = await admin
    .from('shops')
    .select('id, shop_type, subscription_status, gst_registered, created_at');

  const shops = allShops || [];

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

  // Invoices this month
  const { count: invoicesThisMonth } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd);

  // Total invoices platform-wide
  const { count: totalInvoices } = await admin
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  // Average invoices per shop
  const avgPerShop = shops.length > 0
    ? Math.round((invoicesThisMonth || 0) / shops.length * 10) / 10
    : 0;

  // Most active shop this month
  const { data: mostActiveData } = await admin
    .from('invoices')
    .select('shop_id')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd);

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

  // Growth chart — shops over last 6 months (cumulative)
  const growthData: { month: string; shops: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const cumulative = shops.filter(s => s.created_at < end).length;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    growthData.push({ month: label, shops: cumulative });
  }

  // GST adoption
  const gstRegistered = shops.filter(s => s.gst_registered).length;

  return NextResponse.json({
    revenue: {
      active_shops: activeShops.length,
      mrr: activeShops.length * 299,
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
