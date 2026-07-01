import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import {
  uploadMediaToWhatsApp,
  sendDocumentMessage,
  sendInvoiceTemplateMessage,
  WhatsAppTemplateNotApprovedError,
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

    // Fetch and convert logo
    let logoBase64 = null;
    if (typedShop.logo_url) {
      try {
        const logoRes = await fetch(typedShop.logo_url);
        if (logoRes.ok) {
          const arrayBuffer = await logoRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = typedShop.logo_url.split('.').pop()?.split('?')[0] || 'png';
          logoBase64 = `data:image/${ext};base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        console.error('Failed to load shop logo:', e);
      }
    }

    const balanceDue = typedInvoice.payment_status === 'unpaid' ? Number(typedInvoice.total) : 0;
    const customerName = typedInvoice.customer_name ? typedInvoice.customer_name.trim().toUpperCase() : '';

    // Step 1: Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      shopName: typedShop.name,
      shopAddress: typedShop.address || '',
      invoiceNumber: typedInvoice.invoice_number,
      date: new Date(typedInvoice.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      items: invoiceItems,
      total: Number(typedInvoice.total),
      customerPhone: typedInvoice.customer_phone,
      customerName: typedInvoice.customer_name,
      paymentStatus: typedInvoice.payment_status,
      amountPaid: Number(typedInvoice.amount_paid || 0),
      shopPhone: typedShop.phone,
      logoBase64,
      gstRegistered: typedShop.gst_registered,
      gstin: typedShop.gstin,
      customerGstin: typedInvoice.customer_gstin,
      discount: Number(typedInvoice.discount || 0),
    });

    const filename = `${typedInvoice.invoice_number}_${typedShop.name.replace(/\s+/g, '_')}.pdf`;

    // Step 2: Upload to WhatsApp
    const mediaId = await uploadMediaToWhatsApp(pdfBuffer, filename);

    // Step 3: Send template message with fallback to free-form document message
    const greetingName = customerName ? ` ${customerName}` : '';
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    const trackingLink = `${origin}/status/${typedInvoice.public_token}`;

    const caption = [
      `Hey${greetingName} ,`,
      '',
      'Thank you for your business',
      '',
      'Your Sales Invoice is ready! Check the details below',
      '',
      `Sales Invoice No: ${typedInvoice.invoice_number}`,
      `Invoice Amount: ₹${Number(typedInvoice.total).toFixed(1)}`,
      `Balance Due: ₹${balanceDue.toFixed(1)}`,
      '',
      `Track status & download PDF here: ${trackingLink}`,
      '',
      'Happy to serve you',
      `${typedShop.name.toUpperCase()}.`,
    ].join('\n');

    let waMessageId: string | null = null;
    let templateFailed = false;

    try {
      waMessageId = await sendInvoiceTemplateMessage({
        customerPhone: typedInvoice.customer_phone,
        customerName: typedInvoice.customer_name || 'Valued Customer',
        invoiceNumber: typedInvoice.invoice_number,
        invoiceAmount: Number(typedInvoice.total),
        balanceDue: balanceDue,
        invoiceId: typedInvoice.public_token,
        shopName: typedShop.name,
      });
    } catch (err: any) {
      if (
        err instanceof WhatsAppTemplateNotApprovedError ||
        (err instanceof Error && err.message.includes('Template not found or not approved yet'))
      ) {
        console.warn('Template not approved, falling back to session message');
        templateFailed = true;
      } else {
        throw err;
      }
    }

    if (templateFailed || !waMessageId) {
      await sendDocumentMessage(
        typedInvoice.customer_phone,
        mediaId,
        filename,
        caption
      );
    }

    // Step 4: Update status to sent, record timestamps and delivery status
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
