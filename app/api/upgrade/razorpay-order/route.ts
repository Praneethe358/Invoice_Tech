import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // 2. Fetch the shop
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // 3. Setup Razorpay keys
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mockkeysecret123';

    // 4. Create Razorpay order (₹349.00 = 34900 paise)
    const amount = 34900;
    const currency = 'INR';

    let orderData: any = null;

    if (keyId === 'rzp_test_mockkeyid123') {
      // Mock mode
      orderData = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount,
        currency,
        receipt: `receipt_${shop.id.substring(0, 8)}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      };
    } else {
      // Real mode - Call Razorpay API
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `receipt_${shop.id.substring(0, 8)}`,
          notes: {
            shop_id: shop.id,
            shop_name: shop.name,
          },
        }),
      });

      if (!rzpResponse.ok) {
        const errorText = await rzpResponse.text();
        console.error('Razorpay Order Creation Error:', errorText);
        return NextResponse.json({ error: 'Failed to create order with Razorpay API' }, { status: 500 });
      }

      orderData = await rzpResponse.json();
    }

    return NextResponse.json({
      success: true,
      key_id: keyId,
      order: orderData,
      shop: {
        id: shop.id,
        name: shop.name,
        email: user.email,
        phone: shop.phone || '',
      },
      is_mock: keyId === 'rzp_test_mockkeyid123',
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
