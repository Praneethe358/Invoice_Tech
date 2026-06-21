import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment signature details' }, { status: 400 });
    }

    // 3. Fetch the shop
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // 4. Verify signature
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret123';

    if (keyId !== 'rzp_test_mockkeyid123') {
      // Real mode verification
      if (!razorpay_signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid payment signature verification failed' }, { status: 400 });
      }
    }

    // 5. Update subscription duration
    const now = new Date();
    let newEndDate: Date;

    // If currently active, extend from current end date
    if (shop.subscription_status === 'active' && shop.subscription_ends_at) {
      const currentEnd = new Date(shop.subscription_ends_at);
      // If current end is in the future, extend from there; otherwise from now
      const baseDate = currentEnd > now ? currentEnd : now;
      newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1); // 1 month
    } else {
      // New activation — start from now
      newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    const notes = [
      shop.subscription_notes || '',
      `[${now.toISOString().slice(0, 10)}] Activated 1mo via Razorpay (Auto) | Ref: ${razorpay_payment_id}`,
    ]
      .filter(Boolean)
      .join('\n');

    // Use admin client to bypass any restrictions
    const admin = createAdminClient();
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
      })
      .eq('id', shop.id);

    if (updateErr) {
      console.error('DB Update Error:', updateErr);
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully upgraded!',
      subscription_ends_at: newEndDate.toISOString(),
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
