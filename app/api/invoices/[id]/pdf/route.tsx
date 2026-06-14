import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import { Invoice, Shop } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const typedInvoice = invoice as Invoice;

    // Fetch shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('name, address')
      .eq('id', typedInvoice.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const typedShop = shop as Pick<Shop, 'name' | 'address'>;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      shopName: typedShop.name,
      shopAddress: typedShop.address || '',
      invoiceNumber: typedInvoice.invoice_number,
      date: new Date(typedInvoice.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      items: typedInvoice.items,
      total: Number(typedInvoice.total),
      customerPhone: typedInvoice.customer_phone,
    });

    const filename = `${typedInvoice.invoice_number}_${typedShop.name.replace(/\s+/g, '_')}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
