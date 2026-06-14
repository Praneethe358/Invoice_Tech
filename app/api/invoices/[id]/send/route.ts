import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import {
  uploadMediaToWhatsApp,
  sendDocumentMessage,
} from '@/lib/whatsapp';
import { Invoice, Shop, ApiError } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
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
      .select('name, address')
      .eq('id', typedInvoice.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' } satisfies ApiError,
        { status: 404 }
      );
    }

    const typedShop = shop as Pick<Shop, 'name' | 'address'>;
    const dateStr = new Date(typedInvoice.created_at).toLocaleDateString(
      'en-IN',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    // Step 1: Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      shopName: typedShop.name,
      shopAddress: typedShop.address || '',
      invoiceNumber: typedInvoice.invoice_number,
      date: dateStr,
      items: typedInvoice.items,
      total: Number(typedInvoice.total),
    });

    const filename = `${typedInvoice.invoice_number}_${typedShop.name.replace(/\s+/g, '_')}.pdf`;

    // Step 2: Upload to WhatsApp
    const mediaId = await uploadMediaToWhatsApp(pdfBuffer, filename);

    // Step 3: Send document message
    const caption = [
      `Hi! Your invoice from ${typedShop.name} is ready.`,
      '',
      `Invoice No: ${typedInvoice.invoice_number}`,
      `Amount: ₹${Number(typedInvoice.total).toLocaleString('en-IN')}`,
      `Date: ${dateStr}`,
      '',
      'Thank you for your business! 🙏',
    ].join('\n');

    await sendDocumentMessage(
      typedInvoice.customer_phone,
      mediaId,
      filename,
      caption
    );

    // Step 4: Update status to sent
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
    });
  } catch (err) {
    console.error('Send invoice error:', err);

    // Update status to failed
    await supabase
      .from('invoices')
      .update({ status: 'failed' })
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
