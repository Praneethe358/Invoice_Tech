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
      .select('id, invoice_prefix, next_invoice_number')
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

    // Calculate total
    const total = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Insert invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        shop_id: shop.id,
        invoice_number: invoiceNumber,
        customer_phone: body.customer_phone.trim(),
        items: body.items,
        total: Number(total.toFixed(2)),
        status: 'created',
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

    // Increment invoice number
    const { error: updateError } = await supabase
      .from('shops')
      .update({ next_invoice_number: shop.next_invoice_number + 1 })
      .eq('id', shop.id);

    if (updateError) {
      console.error('Invoice number update error:', updateError);
      // Non-critical — invoice was created successfully
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
