import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

import { isRateLimited } from '@/lib/rate-limit';

export async function POST(
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
  const body = await request.json();
  const { confirm_shop_name, action } = body;

  const admin = createAdminClient();

  // Get shop
  const { data: shop, error: shopErr } = await admin
    .from('shops')
    .select('name, subscription_status, subscription_notes')
    .eq('id', id)
    .single();

  if (shopErr || !shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  // Require typing shop name to confirm destructive action
  if (!confirm_shop_name || confirm_shop_name.trim().toLowerCase() !== shop.name.trim().toLowerCase()) {
    return NextResponse.json(
      { error: 'Shop name does not match. Please type the exact shop name to confirm.' },
      { status: 400 }
    );
  }

  const now = new Date();
  const newStatus = action === 'cancel' ? 'cancelled' : 'expired';

  const notes = [
    shop.subscription_notes || '',
    `[${now.toISOString().slice(0, 10)}] ${newStatus === 'cancelled' ? 'Cancelled' : 'Expired manually'} by admin`,
  ]
    .filter(Boolean)
    .join('\n');

  const { error: updateErr } = await admin
    .from('shops')
    .update({
      subscription_status: newStatus,
      subscription_notes: notes,
    })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Subscription ${newStatus}`,
  });
}
