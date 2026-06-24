import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { sendTextMessage } from '@/lib/whatsapp';

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
  const { duration_months, payment_reference } = body;

  if (!duration_months || ![1, 3, 6, 12].includes(duration_months)) {
    return NextResponse.json(
      { error: 'Invalid duration. Must be 1, 3, 6, or 12 months.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Get current shop
  const { data: shop, error: shopErr } = await admin
    .from('shops')
    .select('*')
    .eq('id', id)
    .single();

  if (shopErr || !shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  }

  const now = new Date();
  let newEndDate: Date;

  // If currently active, extend from current end date
  if (shop.subscription_status === 'active' && shop.subscription_ends_at) {
    const currentEnd = new Date(shop.subscription_ends_at);
    // If current end is in the future, extend from there; otherwise from now
    const baseDate = currentEnd > now ? currentEnd : now;
    newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + duration_months);
  } else {
    // New activation — start from now
    newEndDate = new Date(now);
    newEndDate.setMonth(newEndDate.getMonth() + duration_months);
  }

  const notes = [
    shop.subscription_notes || '',
    `[${now.toISOString().slice(0, 10)}] Activated ${duration_months}mo` +
      (payment_reference ? ` | Ref: ${payment_reference}` : ''),
  ]
    .filter(Boolean)
    .join('\n');

  // Update shop
  const { error: updateErr } = await admin
    .from('shops')
    .update({
      subscription_status: 'active',
      subscription_started_at: shop.subscription_status === 'active'
        ? shop.subscription_started_at
        : now.toISOString(),
      subscription_ends_at: newEndDate.toISOString(),
      trial_ends_at: null,
      subscription_notes: notes,
      whatsapp_invoices_sent: 0,
    })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Send WhatsApp notification
  if (shop.phone) {
    try {
      const formattedEnd = newEndDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const amount = duration_months * 349;
      const planName =
        duration_months === 1
          ? 'Monthly'
          : duration_months === 3
          ? '3 Months'
          : duration_months === 6
          ? '6 Months'
          : '1 Year';

      await sendTextMessage(
        shop.phone,
        `Hi ${shop.name}! 🎉\n\nYour TruBill Invoice subscription has been activated.\n\nPlan: ${planName} (₹${amount.toLocaleString('en-IN')})\nValid until: ${formattedEnd}\n\nYou can continue sending invoices without interruption.\n\nNeed help? WhatsApp us anytime.\n— Team TruBill 🙏`
      );
    } catch {
      // Don't fail activation if WhatsApp fails
      console.error('WhatsApp notification failed for shop:', id);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Subscription activated',
    subscription_ends_at: newEndDate.toISOString(),
  });
}
