import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/whatsapp';
import { ApiError } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { ownerName, shopName, phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' } satisfies ApiError,
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;

    const message = [
      `Hi ${ownerName}! Welcome to TruBill Invoice. 🎉`,
      '',
      `Your 14-day free trial has been activated for *${shopName}*.`,
      'You can now start sending professional GST invoices directly to your customers on WhatsApp!',
      '',
      `Try creating your first invoice now: ${origin}/invoice/new`,
      '',
      'Need help or want to upgrade? Reply to this message anytime.',
      '— Team TruBill 🙏',
    ].join('\n');

    await sendTextMessage(phone, message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Welcome WhatsApp message failed:', err);
    // Return 200/success anyway so it doesn't block onboarding if WhatsApp service fails
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
