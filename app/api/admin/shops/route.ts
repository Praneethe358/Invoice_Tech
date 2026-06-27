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

  // Auto-expire trials/subscriptions before fetching shops list
  await autoExpireOutdatedSubscriptions();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from('shops')
    .select('*', { count: 'exact' });

  // Status filter
  if (status !== 'all') {
    query = query.eq('subscription_status', status);
  }

  // Search by shop name
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Sort
  const ascending = order === 'asc';
  query = query.order(sort, { ascending });

  // Paginate
  query = query.range(offset, offset + limit - 1);

  const { data: shops, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get owner emails via auth.users (service role)
  const ownerEmails: Record<string, string> = {};
  if (shops && shops.length > 0) {
    const userIds = [...new Set(shops.map(s => s.auth_user_id))];
    for (const uid of userIds) {
      try {
        const { data: { user } } = await admin.auth.admin.getUserById(uid);
        if (user) {
          ownerEmails[uid] = user.email || '—';
        }
      } catch {
        ownerEmails[uid] = '—';
      }
    }
  }

  // Get invoice counts per shop
  const invoiceCounts: Record<string, number> = {};
  if (shops && shops.length > 0) {
    const shopIds = shops.map(s => s.id);
    const { data: invoiceData } = await admin
      .from('invoices')
      .select('shop_id')
      .in('shop_id', shopIds);

    if (invoiceData) {
      for (const inv of invoiceData) {
        invoiceCounts[inv.shop_id] = (invoiceCounts[inv.shop_id] || 0) + 1;
      }
    }
  }

  // Build response
  const shopsWithMeta = (shops || []).map(shop => ({
    ...shop,
    owner_email: ownerEmails[shop.auth_user_id] || '—',
    invoice_count: invoiceCounts[shop.id] || 0,
  }));

  return NextResponse.json({
    shops: shopsWithMeta,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
