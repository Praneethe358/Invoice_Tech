import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTextMessage } from '@/lib/whatsapp';
import { Invoice, Shop, ApiError } from '@/lib/types';
import { getInvoicePaid } from '@/lib/payments';
import { isRateLimited } from '@/lib/rate-limit';
import { getSubscriptionAccess, syncSubscriptionStatus } from '@/lib/subscription';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Rate limit check: 5 per 24 hours per invoice
    const limitKey = `remind:${id}`;
    const { limited } = isRateLimited(limitKey, 5, 24 * 60 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reminders. Maximum 5 reminders per 24 hours per invoice.' } satisfies ApiError,
        { status: 429 }
      );
    }

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' } satisfies ApiError,
        { status: 404 }
      );
    }

    const typedInvoice = invoice as Invoice;

    // Fetch shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name, subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', typedInvoice.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Sync subscription status in DB
    await syncSubscriptionStatus(shop.id, {
      subscription_status: shop.subscription_status || 'trial',
      trial_ends_at: shop.trial_ends_at || null,
      subscription_ends_at: shop.subscription_ends_at || null,
    });

    // Re-fetch or check locally
    const { data: updatedShop } = await supabase
      .from('shops')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', shop.id)
      .single();

    const subAccess = getSubscriptionAccess({
      subscription_status: updatedShop?.subscription_status || shop.subscription_status || 'trial',
      trial_ends_at: updatedShop?.trial_ends_at || shop.trial_ends_at || null,
      subscription_ends_at: updatedShop?.subscription_ends_at || shop.subscription_ends_at || null,
    });

    if (!subAccess.canSendInvoices) {
      return NextResponse.json(
        {
          error: 'subscription_required',
          details: 'Your subscription has ended. Please upgrade to continue.',
        } satisfies ApiError,
        { status: 403 }
      );
    }

    const typedShop = shop as Pick<Shop, 'name'>;

    const total = Number(typedInvoice.total);
    const amountPaid = typedInvoice.uses_payments_table
      ? await getInvoicePaid(id)
      : Number(typedInvoice.amount_paid || 0);
    const balanceDue = Math.max(0, total - amountPaid);
    const invoiceDate = new Date(typedInvoice.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    const trackingLink = `${origin}/status/${typedInvoice.public_token}`;

    let messageBody = '';

    if (typedInvoice.payment_status === 'partial') {
      messageBody = [
        'Hi! 👋',
        '',
        `This is a reminder from *${typedShop.name}*.`,
        '',
        `Invoice No: ${typedInvoice.invoice_number}`,
        `Total Amount: ₹${total.toLocaleString('en-IN')}`,
        `Amount Paid: ₹${amountPaid.toLocaleString('en-IN')}`,
        `Balance Due: ₹${balanceDue.toLocaleString('en-IN')}`,
        '',
        'Please settle the remaining balance at your earliest convenience.',
        '',
        `Track status & download PDF here: ${trackingLink}`,
        '',
        'Thank you! 🙏',
      ].join('\n');
    } else {
      // Default to unpaid format (or if it's unpaid)
      messageBody = [
        'Hi! 👋',
        '',
        `This is a reminder from *${typedShop.name}*.`,
        '',
        `Invoice No: ${typedInvoice.invoice_number}`,
        `Amount Due: ₹${total.toLocaleString('en-IN')}`,
        `Date: ${invoiceDate}`,
        '',
        'Please settle the payment at your earliest convenience.',
        '',
        `Track status & download PDF here: ${trackingLink}`,
        '',
        'Thank you! 🙏',
      ].join('\n');
    }

    // Send WhatsApp text message
    await sendTextMessage(typedInvoice.customer_phone, messageBody);

    // Increment sent_reminders on invoice
    const currentReminders = typedInvoice.sent_reminders || 0;
    await supabase
      .from('invoices')
      .update({ sent_reminders: currentReminders + 1 })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
    });
  } catch (err) {
    console.error('Send payment reminder error:', err);
    const message = err instanceof Error ? err.message : 'Failed to send payment reminder';
    return NextResponse.json(
      { error: message } satisfies ApiError,
      { status: 500 }
    );
  }
}
