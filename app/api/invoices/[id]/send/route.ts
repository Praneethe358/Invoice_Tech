import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvoicePDF } from '@/lib/pdf';
import {
  uploadMediaToWhatsApp,
  sendDocumentMessage,
} from '@/lib/whatsapp';
import { Invoice, Shop, ApiError } from '@/lib/types';
import { syncCustomerOutstanding } from '@/lib/payments';

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
      'Happy to serve you',
      `${typedShop.name.toUpperCase()}.`,
    ].join('\n');

    await sendDocumentMessage(
      typedInvoice.customer_phone,
      mediaId,
      filename,
      caption
    );

    // Step 4: Update status to sent and enable payments tracking
    await supabase
      .from('invoices')
      .update({ status: 'sent', uses_payments_table: true })
      .eq('id', id);

    // Step 4.5: Update product stats (recently used & inventory tracking)
    const warningProducts: string[] = [];
    if (invoiceItems && Array.isArray(invoiceItems)) {
      for (const item of invoiceItems) {
        // Find matching product
        const { data: dbProd } = await supabase
          .from('products')
          .select('id, stock_qty, track_inventory, use_count')
          .eq('shop_id', typedInvoice.shop_id)
          .eq('name', item.name)
          .maybeSingle();

        if (dbProd) {
          // Increment use_count and set last_used_at
          await supabase
            .from('products')
            .update({
              last_used_at: new Date().toISOString(),
              use_count: (dbProd.use_count || 0) + 1,
            })
            .eq('id', dbProd.id);

          // If track_inventory is enabled
          if (dbProd.track_inventory) {
            const qtyNeeded = Number(item.quantity || 1);
            const currentStock = Number(dbProd.stock_qty || 0);

            if (currentStock >= qtyNeeded) {
              const newQty = currentStock - qtyNeeded;
              await supabase
                .from('products')
                .update({ stock_qty: newQty })
                .eq('id', dbProd.id);

              await supabase
                .from('inventory_logs')
                .insert({
                  shop_id: typedInvoice.shop_id,
                  product_id: dbProd.id,
                  invoice_id: typedInvoice.id,
                  change_qty: -qtyNeeded,
                  previous_qty: currentStock,
                  new_qty: newQty,
                  reason: 'invoice'
                });
            } else {
              // Insufficient stock - warn and set stock to 0
              warningProducts.push(item.name);
              await supabase
                .from('products')
                .update({ stock_qty: 0 })
                .eq('id', dbProd.id);

              await supabase
                .from('inventory_logs')
                .insert({
                  shop_id: typedInvoice.shop_id,
                  product_id: dbProd.id,
                  invoice_id: typedInvoice.id,
                  change_qty: -qtyNeeded,
                  previous_qty: currentStock,
                  new_qty: 0,
                  reason: 'invoice'
                });
            }
          }
        }
      }
    }

    // Step 5: Auto-save/update customer record (silent — never affects response)
    try {
      const customerPhone = typedInvoice.customer_phone;

      // Recalculate customer's total spent and invoices count from database
      const { data: customerInvoices } = await supabase
        .from('invoices')
        .select('amount_paid')
        .eq('shop_id', typedInvoice.shop_id)
        .eq('customer_phone', customerPhone);

      const totalSpent = (customerInvoices ?? []).reduce(
        (sum: number, item: any) => sum + Number(item.amount_paid || 0),
        0
      );
      const totalInvoices = customerInvoices ? customerInvoices.length : 0;

      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', typedInvoice.shop_id)
        .eq('phone', customerPhone)
        .single();

      if (existing) {
        await supabase
          .from('customers')
          .update({
            total_invoices: totalInvoices,
            total_spent: totalSpent,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('customers')
          .insert({
            shop_id: typedInvoice.shop_id,
            phone: customerPhone,
            name: (typedInvoice.customer_name?.trim() || 'Customer').toUpperCase(),
            tag: 'regular',
            total_invoices: totalInvoices,
            total_spent: totalSpent,
          });
      }

      // Sync customer outstanding balance
      await syncCustomerOutstanding(typedInvoice.shop_id, customerPhone);
    } catch (customerErr) {
      console.error('Auto-save customer error (non-fatal):', customerErr);
    }

    if (warningProducts.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Invoice sent successfully',
        warning: 'low_stock',
        products: warningProducts,
      });
    }

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
