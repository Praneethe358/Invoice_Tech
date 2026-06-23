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
      .select('name, address, phone, logo_url, gst_registered, gstin')
      .eq('id', typedInvoice.shop_id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
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
