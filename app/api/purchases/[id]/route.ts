import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const context = await getCurrentUserContext(supabase);

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', context.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ purchase, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const context = await getCurrentUserContext(supabase);

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, inventory_enabled')
      .eq('id', context.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Fetch purchase and items to revert stock if inventory enabled
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const { data: items } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', id);

    // Revert inventory stocks if enabled
    if (shop.inventory_enabled && items) {
      for (const item of items) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shop.id)
          .ilike('name', item.name)
          .limit(1);

        const product = products && products.length > 0 ? products[0] : null;
        if (product) {
          const oldStock = product.stock_qty || 0;
          const newStock = oldStock - item.qty;

          await supabase
            .from('products')
            .update({ stock_qty: newStock })
            .eq('id', product.id);

          await supabase.from('inventory_logs').insert({
            shop_id: shop.id,
            product_id: product.id,
            change_qty: -item.qty,
            previous_qty: oldStock,
            new_qty: newStock,
            reason: 'adjustment', // purchase deleted
          });
        }
      }
    }

    // Delete purchase items (cascades automatically via foreign key, but let's be explicit if needed)
    // Actually, SQL cascade delete is enabled in foreign key references.
    const { error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('shop_id', shop.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const context = await getCurrentUserContext(supabase);

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, inventory_enabled, gst_registered')
      .eq('id', context.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Fetch old purchase details
    const { data: oldPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (!oldPurchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    const { data: oldItems } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', id);

    const body = await request.json();
    const {
      supplier_id,
      supplier_name,
      supplier_gstin,
      purchase_invoice_number,
      purchase_date,
      notes,
      items,
    } = body;

    if (!supplier_name || !supplier_name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    if (!purchase_invoice_number || !purchase_invoice_number.trim()) {
      return NextResponse.json({ error: 'Purchase invoice number is required' }, { status: 400 });
    }

    if (!purchase_date) {
      return NextResponse.json({ error: 'Purchase date is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // 1. Revert old inventory stock first
    if (shop.inventory_enabled && oldItems) {
      for (const item of oldItems) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shop.id)
          .ilike('name', item.name)
          .limit(1);

        const product = products && products.length > 0 ? products[0] : null;
        if (product) {
          const oldStock = product.stock_qty || 0;
          const newStock = oldStock - item.qty;
          await supabase
            .from('products')
            .update({ stock_qty: newStock })
            .eq('id', product.id);
        }
      }
    }

    // Calculations
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    const processedItems = items.map((item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.gst_rate) || 0;

      const baseAmount = price * qty;
      subtotal += baseAmount;

      let cgst = 0;
      let sgst = 0;
      let lineTotal = baseAmount;

      if (shop.gst_registered) {
        const gstAmount = baseAmount * (rate / 100);
        cgst = Number((gstAmount / 2).toFixed(2));
        sgst = Number((gstAmount / 2).toFixed(2));
        lineTotal = Number((baseAmount + gstAmount).toFixed(2));
        totalCgst += cgst;
        totalSgst += sgst;
        totalGst += gstAmount;
      }

      return {
        name: item.name.trim(),
        hsn_code: item.hsn_code ? item.hsn_code.trim() : null,
        qty,
        unit: item.unit || 'pcs',
        price,
        gst_rate: rate,
        cgst,
        sgst,
        igst: 0,
        line_total: lineTotal,
      };
    });

    const total = subtotal + totalGst;
    const itcEligible = shop.gst_registered && !!supplier_gstin && supplier_gstin.trim().length === 15;

    // 2. Update Purchase
    const { data: updatedPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .update({
        supplier_id: supplier_id || null,
        supplier_name: supplier_name.trim(),
        supplier_gstin: supplier_gstin ? supplier_gstin.trim().toUpperCase() : null,
        purchase_invoice_number: purchase_invoice_number.trim(),
        purchase_date,
        subtotal: Number(subtotal.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_gst: Number(totalGst.toFixed(2)),
        total: Number(total.toFixed(2)),
        itc_eligible: itcEligible,
        notes: notes ? notes.trim() : null,
      })
      .eq('id', id)
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (purchaseError) {
      // If failed, restore old stock
      if (shop.inventory_enabled && oldItems) {
        for (const item of oldItems) {
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shop.id)
            .ilike('name', item.name)
            .limit(1);

          const product = products && products.length > 0 ? products[0] : null;
          if (product) {
            await supabase.from('products').update({ stock_qty: product.stock_qty + item.qty }).eq('id', product.id);
          }
        }
      }
      return NextResponse.json({ error: purchaseError.message }, { status: 500 });
    }

    // 3. Delete old items and insert new items
    await supabase.from('purchase_items').delete().eq('purchase_id', id);

    const itemsToInsert = processedItems.map((item) => ({
      purchase_id: id,
      ...item,
    }));

    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsToInsert);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 4. Update new inventory stocks
    if (shop.inventory_enabled) {
      for (const item of processedItems) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shop.id)
          .ilike('name', item.name)
          .limit(1);

        const product = products && products.length > 0 ? products[0] : null;
        if (product) {
          const oldStock = product.stock_qty || 0;
          const newStock = oldStock + item.qty;

          await supabase
            .from('products')
            .update({ stock_qty: newStock })
            .eq('id', product.id);

          await supabase.from('inventory_logs').insert({
            shop_id: shop.id,
            product_id: product.id,
            change_qty: item.qty,
            previous_qty: oldStock,
            new_qty: newStock,
            reason: 'restock', // update restock value
          });
        }
      }
    }

    return NextResponse.json(updatedPurchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
