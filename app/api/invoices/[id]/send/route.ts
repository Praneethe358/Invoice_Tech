import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import {
  uploadMediaToWhatsApp,
  sendDocumentMessage,
} from '@/lib/whatsapp';
import { Invoice, Shop, ApiError } from '@/lib/types';
import { syncCustomerOutstanding } from '@/lib/payments';
import { isRateLimited } from '@/lib/rate-limit';

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
      .select('name, address, phone, logo_url, gst_registered, gstin')
      .eq('id', typedInvoice.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' } satisfies ApiError,
        { status: 404 }
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
      shopPhone: typedShop.phone,
      logoBase64,
      gstRegistered: typedShop.gst_registered,
      gstin: typedShop.gstin,
    });

    const filename = `${typedInvoice.invoice_number}_${typedShop.name.replace(/\s+/g, '_')}.pdf`;

    // Step 2: Upload to WhatsApp
    const mediaId = await uploadMediaToWhatsApp(pdfBuffer, filename);

    // Step 3: Send document message
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

    await sendDocumentMessage(
      typedInvoice.customer_phone,
      mediaId,
      filename,
      caption
    );

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
