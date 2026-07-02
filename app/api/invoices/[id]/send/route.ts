import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendInvoiceTemplateMessage,
} from '@/lib/whatsapp';
import { Invoice, Shop, ApiError } from '@/lib/types';
import { syncCustomerOutstanding } from '@/lib/payments';
import { isRateLimited } from '@/lib/rate-limit';
import { getSubscriptionAccess, syncSubscriptionStatus } from '@/lib/subscription';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // Rate limit check: 10 per hour per invoice
    const limitKey = `send:${id}`;
    const { limited } = isRateLimited(limitKey, 10, 60 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: 'Too many send requests. Maximum 10 per hour per invoice.' } satisfies ApiError,
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
      .select('id, name, address, phone, logo_url, gst_registered, gstin, subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent')
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
      .select('subscription_status, trial_ends_at, subscription_ends_at, whatsapp_invoices_sent')
      .eq('id', shop.id)
      .single();

    const currentStatus = updatedShop?.subscription_status || shop.subscription_status || 'trial';
    const currentTrialEnds = updatedShop?.trial_ends_at || shop.trial_ends_at || null;
    const currentSubEnds = updatedShop?.subscription_ends_at || shop.subscription_ends_at || null;
    const currentSentCount = updatedShop?.whatsapp_invoices_sent ?? shop.whatsapp_invoices_sent ?? 0;

    const subAccess = getSubscriptionAccess({
      subscription_status: currentStatus,
      trial_ends_at: currentTrialEnds,
      subscription_ends_at: currentSubEnds,
    });

    if (currentStatus === 'trial' && currentSentCount >= 10) {
      return NextResponse.json(
        {
          error: "You've used your 10 free WhatsApp invoices. Upgrade to TruBill Pro at ₹349/month to continue.",
        } satisfies ApiError,
        { status: 403 }
      );
    }

    if (!subAccess.canSendInvoices) {
      return NextResponse.json(
        {
          error: 'subscription_required',
          details: 'Your subscription has ended. Please upgrade to continue.',
        } satisfies ApiError,
        { status: 403 }
      );
    }

    const typedShop = shop as Shop;

    // Fetch line items if uses_items_table is true
    let invoiceItems = typedInvoice.items;
    if (typedInvoice.uses_items_table) {
      const { data: dbItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', typedInvoice.id)
        .order('created_at', { ascending: true });

      if (dbItems) {
        invoiceItems = dbItems.map((item: any) => ({
          name: item.name,
          price: Number(item.price),
          quantity: item.qty,
          hsn_code: item.hsn_code,
          gst_rate: Number(item.gst_rate),
          cgst: Number(item.cgst),
          sgst: Number(item.sgst),
          line_total: Number(item.line_total),
          discount: Number(item.discount || 0),
        }));
      }
    }

    // Verify status is saved or sent or failed
    if (typedInvoice.status !== 'saved' && typedInvoice.status !== 'sent' && typedInvoice.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only saved invoices can be sent via WhatsApp.' } satisfies ApiError,
        { status: 400 }
      );
    }

    const total = Number(typedInvoice.total);
    const amountPaid = Number(typedInvoice.amount_paid || 0);
    const balanceDue = Math.max(0, total - amountPaid);
    const customerName = typedInvoice.customer_name ? typedInvoice.customer_name.trim() : 'Customer';

    const isDeeplinkMode = process.env.NEXT_PUBLIC_WA_MODE === 'deeplink';

    if (isDeeplinkMode) {
      // Step 2: Directly update status to sent, record timestamps and delivery status as sent_manual
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          sent_by: user.id,
          delivery_status: 'sent_manual'
        })
        .eq('id', id);

      // Record audit log
      await supabase
        .from('invoice_audit_logs')
        .insert({
          invoice_id: id,
          shop_id: typedInvoice.shop_id,
          user_id: user.id,
          action: 'sent'
        });

      return NextResponse.json({
        success: true,
        message: 'Invoice manual send recorded',
        mode: 'deeplink',
        public_token: typedInvoice.public_token,
      });
    }

    // Step 2: Send WhatsApp Template Notification
    await sendInvoiceTemplateMessage({
      customerPhone: typedInvoice.customer_phone,
      customerName: customerName,
      invoiceNumber: typedInvoice.invoice_number,
      invoiceAmount: total,
      balanceDue: balanceDue,
      invoiceId: typedInvoice.public_token,
      shopName: typedShop.name,
    });

    // Step 3: Update status to sent, record timestamps and delivery status
    await supabase
      .from('invoices')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        delivery_status: 'delivered'
      })
      .eq('id', id);

    // Increment whatsapp_invoices_sent counter
    await supabase
      .from('shops')
      .update({
        whatsapp_invoices_sent: currentSentCount + 1
      })
      .eq('id', shop.id);

    // Record audit log
    await supabase
      .from('invoice_audit_logs')
      .insert({
        invoice_id: id,
        shop_id: typedInvoice.shop_id,
        user_id: user.id,
        action: 'sent'
      });

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
    });
  } catch (err) {
    console.error('Send invoice error:', err);

    // Update delivery status to failed
    await supabase
      .from('invoices')
      .update({ 
        status: 'sent',
        delivery_status: 'failed' 
      })
      .eq('id', id);

    const message =
      err instanceof Error
        ? err.message
        : 'Failed to send invoice';

    return NextResponse.json(
      { error: message } satisfies ApiError,
      { status: 500 }
    );
  }
}
