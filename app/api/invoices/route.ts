import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateInvoicePayload, ApiError } from '@/lib/types';
import { validatePhone, validateInvoiceItems } from '@/lib/validators';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Parse body
    const body = (await request.json()) as CreateInvoicePayload;

    // Validate
    const itemsError = validateInvoiceItems(body.items);
    if (itemsError) {
      return NextResponse.json(
        { error: itemsError } satisfies ApiError,
        { status: 400 }
      );
    }

    if (!validatePhone(body.customer_phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Enter a 10-digit Indian mobile number.' } satisfies ApiError,
        { status: 400 }
      );
    }

    // Get shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, invoice_prefix, next_invoice_number, gst_registered')
      .eq('auth_user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found. Please complete your profile.' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `${shop.invoice_prefix}-${String(shop.next_invoice_number).padStart(4, '0')}`;

    // Process items & calculate taxes
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    const processedItems = body.items.map((item) => {
      const baseAmount = item.price * item.quantity;
      subtotal += baseAmount;

      let cgst = 0;
      let sgst = 0;
      let lineTotal = baseAmount;

      if (shop.gst_registered) {
        const gstRate = item.gst_rate || 0;
        const gstAmount = baseAmount * (gstRate / 100);
        cgst = Number((gstAmount / 2).toFixed(2));
        sgst = Number((gstAmount / 2).toFixed(2));
        lineTotal = Number((baseAmount + gstAmount).toFixed(2));
        totalCgst += cgst;
        totalSgst += sgst;
        totalGst += gstAmount;
      }

      return {
        ...item,
        cgst,
        sgst,
        line_total: lineTotal,
      };
    });

    const total = subtotal + totalGst;
    const payment_status = body.payment_status || 'paid';
    
    if (payment_status === 'partial') {
      const amt = Number(body.amount_paid);
      if (isNaN(amt) || amt <= 0 || amt >= total) {
        return NextResponse.json(
          { error: 'Partial payment amount must be greater than 0 and less than the invoice total.' } satisfies ApiError,
          { status: 400 }
        );
      }
    }

    const amount_paid = payment_status === 'paid'
      ? Number(total.toFixed(2))
      : payment_status === 'partial'
      ? Number(body.amount_paid)
      : 0;

    const paid_at = payment_status === 'paid' ? new Date().toISOString() : null;
    const uses_payments_table = payment_status === 'paid' || payment_status === 'partial';

    // Insert invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        shop_id: shop.id,
        invoice_number: invoiceNumber,
        customer_phone: body.customer_phone.trim(),
        customer_name: body.customer_name?.trim().toUpperCase() || null,
        customer_gstin: body.customer_gstin?.trim().toUpperCase() || null,
        payment_status,
        amount_paid,
        paid_at,
        items: processedItems, // fallback copy
        total: Number(total.toFixed(2)),
        status: 'created',
        uses_items_table: true,
        uses_payments_table,
        subtotal: Number(subtotal.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_gst: Number(totalGst.toFixed(2)),
      })
      .select('id, invoice_number')
      .single();

    if (insertError) {
      console.error('Invoice insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invoice. Please try again.' } satisfies ApiError,
        { status: 500 }
      );
    }

    // Insert into payments table if paid or partial
    if (payment_status === 'paid' || payment_status === 'partial') {
      const { error: paymentInsertError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          shop_id: shop.id,
          customer_phone: body.customer_phone.trim(),
          amount: amount_paid,
          payment_method: body.payment_method || 'cash',
          note: body.payment_note?.trim() || (payment_status === 'paid' ? 'Paid on invoice creation' : 'Partial payment on invoice creation'),
          paid_at: paid_at || new Date().toISOString(),
        });

      if (paymentInsertError) {
        console.error('Payment record insert error on invoice creation:', paymentInsertError);
      }
    }

    // Insert line items into invoice_items table
    const itemsToInsert = processedItems.map((item) => ({
      invoice_id: invoice.id,
      name: item.name,
      hsn_code: item.hsn_code || null,
      price: item.price,
      qty: item.quantity,
      gst_rate: item.gst_rate || 0,
      cgst: item.cgst,
      sgst: item.sgst,
      line_total: item.line_total,
    }));

    const { error: itemsInsertError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsInsertError) {
      console.error('Invoice items insert error:', itemsInsertError);
    }

    // Increment invoice number
    const { error: updateError } = await supabase
      .from('shops')
      .update({ next_invoice_number: shop.next_invoice_number + 1 })
      .eq('id', shop.id);

    if (updateError) {
      console.error('Invoice number update error:', updateError);
    }

    return NextResponse.json({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
    });
  } catch (err) {
    console.error('Unexpected error in POST /api/invoices:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
