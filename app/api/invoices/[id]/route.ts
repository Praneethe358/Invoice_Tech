import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateInvoicePayload, ApiError } from '@/lib/types';
import { validatePhone, validateInvoiceItems } from '@/lib/validators';

// PUT: Update a draft invoice
export async function PUT(
  request: NextRequest,
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
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    // Get shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, gst_registered')
      .eq('auth_user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Get existing invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status, shop_id')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be modified.' } satisfies ApiError,
        { status: 400 }
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
        { error: 'Invalid phone number.' } satisfies ApiError,
        { status: 400 }
      );
    }

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
          { error: 'Partial payment amount must be greater than 0 and less than total.' } satisfies ApiError,
          { status: 400 }
        );
      }
    }

    const amount_paid = payment_status === 'paid'
      ? Number(total.toFixed(2))
      : payment_status === 'partial'
      ? Number(body.amount_paid)
      : 0;

    // Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        customer_phone: body.customer_phone.trim(),
        customer_name: body.customer_name?.trim().toUpperCase() || null,
        customer_gstin: body.customer_gstin?.trim().toUpperCase() || null,
        payment_status,
        amount_paid,
        items: processedItems,
        total: Number(total.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_gst: Number(totalGst.toFixed(2)),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Invoice update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update draft invoice.' } satisfies ApiError,
        { status: 500 }
      );
    }

    // Recreate invoice items
    const { error: deleteItemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (deleteItemsError) {
      console.error('Delete old invoice items error:', deleteItemsError);
    }

    const itemsToInsert = processedItems.map((item) => ({
      invoice_id: id,
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
      console.error('Insert new invoice items error:', itemsInsertError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in PUT /api/invoices/[id]:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}

// DELETE: Delete a draft invoice
export async function DELETE(
  request: NextRequest,
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
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    // Get shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Verify draft status before deleting
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted.' } satisfies ApiError,
        { status: 400 }
      );
    }

    // Delete invoice
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Invoice delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete draft invoice.' } satisfies ApiError,
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/invoices/[id]:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
