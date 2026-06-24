import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateInvoicePayload, ApiError } from '@/lib/types';
import { validatePhone, validateInvoiceItems } from '@/lib/validators';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { getClothingGstRate } from '@/lib/clothing/gst';
import { getFootwearGstRate } from '@/lib/footwear/gst';
import { syncCustomerOutstanding } from '@/lib/payments';

// PUT: Update a draft invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const ctx = await getCurrentUserContext(supabase);
    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    if (!hasPermission(ctx.role, 'invoice.create')) {
      return NextResponse.json(
        { error: 'Forbidden' } satisfies ApiError,
        { status: 403 }
      );
    }

    // Get shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, gst_registered, shop_type')
      .eq('id', ctx.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    // Get existing invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status, shop_id, invoice_number, customer_phone, customer_name, customer_gstin, total, payment_status, amount_paid')
      .eq('id', id)
      .eq('shop_id', ctx.shopId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found.' } satisfies ApiError,
        { status: 404 }
      );
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cancelled invoices cannot be modified.' } satisfies ApiError,
        { status: 400 }
      );
    }

    // Get existing items for comparison
    const { data: existingItems } = await supabase
      .from('invoice_items')
      .select('name, price, qty, gst_rate, variant_id')
      .eq('invoice_id', id);

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
        let gstRate = item.gst_rate || 0;
        if (shop.shop_type === 'clothing') {
          gstRate = getClothingGstRate(item.price);
        } else if (shop.shop_type === 'footwear') {
          gstRate = getFootwearGstRate(item.price, item.hsn_code);
        }
        const gstAmount = baseAmount * (gstRate / 100);
        cgst = Number((gstAmount / 2).toFixed(2));
        sgst = Number((gstAmount / 2).toFixed(2));
        lineTotal = Number((baseAmount + gstAmount).toFixed(2));
        totalCgst += cgst;
        totalSgst += sgst;
        totalGst += gstAmount;
        return {
          ...item,
          gst_rate: gstRate,
          cgst,
          sgst,
          line_total: lineTotal,
        };
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

    // If the invoice is already saved/sent, adjust inventory for item quantity changes
    if (invoice.status === 'saved' || invoice.status === 'sent') {
      const oldItemMap = new Map<string, number>();
      for (const item of existingItems || []) {
        const key = `${item.name}:${item.variant_id || ''}`;
        oldItemMap.set(key, item.qty);
      }

      const newItemMap = new Map<string, number>();
      for (const item of body.items) {
        const key = `${item.name}:${item.variant_id || ''}`;
        newItemMap.set(key, item.quantity);
      }

      const allKeys = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);

      for (const key of allKeys) {
        const oldQty = oldItemMap.get(key) || 0;
        const newQty = newItemMap.get(key) || 0;
        const diff = newQty - oldQty;

        if (diff === 0) continue;

        const [name, variantId] = key.split(':');

        const { data: prod } = await supabase
          .from('products')
          .select('id, stock_qty, track_inventory')
          .eq('shop_id', ctx.shopId)
          .eq('name', name)
          .maybeSingle();

        if (prod && prod.track_inventory) {
          if (variantId) {
            const { data: variant } = await supabase
              .from('product_variants')
              .select('stock_qty')
              .eq('id', variantId)
              .single();

            const currentVariantStock = variant?.stock_qty || 0;

            if (diff > 0 && currentVariantStock < diff) {
              return NextResponse.json(
                { error: `Insufficient stock for variant of ${name}. Stock available: ${currentVariantStock}.` } satisfies ApiError,
                { status: 400 }
              );
            }

            await supabase
              .from('product_variants')
              .update({ stock_qty: currentVariantStock - diff })
              .eq('id', variantId);

            await supabase.from('inventory_logs').insert({
              shop_id: ctx.shopId,
              product_id: prod.id,
              invoice_id: id,
              variant_id: variantId,
              change_qty: -diff,
              previous_qty: currentVariantStock,
              new_qty: currentVariantStock - diff,
              reason: 'invoice',
            });
          } else {
            const currentStock = prod.stock_qty || 0;

            if (diff > 0 && currentStock < diff) {
              return NextResponse.json(
                { error: `Insufficient stock for ${name}. Stock available: ${currentStock}.` } satisfies ApiError,
                { status: 400 }
              );
            }

            await supabase
              .from('products')
              .update({ stock_qty: currentStock - diff })
              .eq('id', prod.id);

            await supabase.from('inventory_logs').insert({
              shop_id: ctx.shopId,
              product_id: prod.id,
              invoice_id: id,
              change_qty: -diff,
              previous_qty: currentStock,
              new_qty: currentStock - diff,
              reason: 'invoice',
            });
          }
        }
      }
    }

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
        { error: 'Failed to update invoice.' } satisfies ApiError,
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
      variant_id: item.variant_id || null,
    }));

    const { error: itemsInsertError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsInsertError) {
      console.error('Insert new invoice items error:', itemsInsertError);
    }

    // Record audit log with changes
    const changes: Record<string, { old: any; new: any }> = {};

    if (invoice.customer_phone !== body.customer_phone) {
      changes.customer_phone = { old: invoice.customer_phone, new: body.customer_phone };
    }
    const newName = body.customer_name?.trim().toUpperCase() || null;
    if ((invoice.customer_name || null) !== newName) {
      changes.customer_name = { old: invoice.customer_name, new: newName };
    }
    const newGstin = body.customer_gstin?.trim().toUpperCase() || null;
    if ((invoice.customer_gstin || null) !== newGstin) {
      changes.customer_gstin = { old: invoice.customer_gstin, new: newGstin };
    }
    if (invoice.payment_status !== payment_status) {
      changes.payment_status = { old: invoice.payment_status, new: payment_status };
    }
    if (Number(invoice.total || 0) !== Number(total.toFixed(2))) {
      changes.total = { old: Number(invoice.total || 0), new: Number(total.toFixed(2)) };
    }
    if (Number(invoice.amount_paid || 0) !== Number(amount_paid.toFixed(2))) {
      changes.amount_paid = { old: Number(invoice.amount_paid || 0), new: Number(amount_paid.toFixed(2)) };
    }

    const oldItemsStr = (existingItems || [])
      .map(i => `${i.name} (${i.qty}x ₹${i.price})`)
      .sort()
      .join(', ');
    const newItemsStr = processedItems
      .map(i => `${i.name} (${i.quantity}x ₹${i.price})`)
      .sort()
      .join(', ');

    if (oldItemsStr !== newItemsStr) {
      changes.items = { old: oldItemsStr, new: newItemsStr };
    }

    logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'invoice.edited',
      entityType: 'invoice',
      entityId: id,
      entityLabel: invoice.invoice_number,
      details: {
        changes,
      },
    });

    // Write to invoice_audit_logs as well
    await supabase
      .from('invoice_audit_logs')
      .insert({
        invoice_id: id,
        shop_id: ctx.shopId,
        user_id: ctx.userId,
        action: 'saved',
      });

    // Sync customer outstanding balance
    await syncCustomerOutstanding(ctx.shopId, body.customer_phone);
    if (invoice.customer_phone !== body.customer_phone) {
      await syncCustomerOutstanding(ctx.shopId, invoice.customer_phone);
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

    const ctx = await getCurrentUserContext(supabase);
    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    if (!hasPermission(ctx.role, 'invoice.delete')) {
      return NextResponse.json(
        { error: 'Forbidden' } satisfies ApiError,
        { status: 403 }
      );
    }

    // Verify draft status before deleting
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, status, invoice_number')
      .eq('id', id)
      .eq('shop_id', ctx.shopId)
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

    logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'invoice.deleted',
      entityType: 'invoice',
      entityId: id,
      entityLabel: invoice.invoice_number,
      details: {
        status: invoice.status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/invoices/[id]:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
