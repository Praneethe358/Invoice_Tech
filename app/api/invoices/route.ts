import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateInvoicePayload, ApiError } from '@/lib/types';
import { validatePhone, validateInvoiceItems } from '@/lib/validators';
import { logAudit } from '@/lib/audit';
import { getCurrentUserContext } from '@/lib/current-user';

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

    const status = body.status || 'saved';

    // Call the postgres atomic transaction function
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_invoice_sec', {
      p_shop_id: shop.id,
      p_customer_phone: body.customer_phone.trim(),
      p_customer_name: body.customer_name?.trim().toUpperCase() || null,
      p_customer_gstin: body.customer_gstin?.trim().toUpperCase() || null,
      p_payment_status: payment_status,
      p_amount_paid: amount_paid,
      p_payment_method: body.payment_method || 'cash',
      p_payment_note: body.payment_note?.trim() || null,
      p_items: processedItems,
      p_subtotal: Number(subtotal.toFixed(2)),
      p_total_cgst: Number(totalCgst.toFixed(2)),
      p_total_sgst: Number(totalSgst.toFixed(2)),
      p_total_gst: Number(totalGst.toFixed(2)),
      p_total: Number(total.toFixed(2)),
      p_status: status,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('RPC create_invoice_sec error:', rpcError);
      if (rpcError.message.includes('INSUFFICIENT_STOCK')) {
        const prodName = rpcError.message.split('INSUFFICIENT_STOCK: ')[1] || 'Product';
        return NextResponse.json(
          { error: `Insufficient stock for ${prodName}. Negative stock not allowed.` } satisfies ApiError,
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: rpcError.message || 'Failed to create invoice.' } satisfies ApiError,
        { status: 500 }
      );
    }

    // Audit log (fire-and-forget)
    const ctx = await getCurrentUserContext(supabase);
    if (ctx) {
      logAudit({
        shopId: shop.id,
        actorUserId: ctx.userId,
        actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
        actorRole: ctx.role,
        action: 'invoice.created',
        entityType: 'invoice',
        entityId: rpcData.id,
        entityLabel: rpcData.invoice_number,
        details: {
          customer_phone: body.customer_phone,
          customer_name: body.customer_name || null,
          total: Number(total.toFixed(2)),
          items_count: body.items.length,
          payment_status,
          status,
        },
      });
    }

    return NextResponse.json({
      id: rpcData.id,
      invoice_number: rpcData.invoice_number,
    });
  } catch (err) {
    console.error('Unexpected error in POST /api/invoices:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
