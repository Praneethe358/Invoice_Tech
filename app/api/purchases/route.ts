import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import { getCurrentUserContext } from '@/lib/current-user';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'this_month' | 'last_month' | 'custom'
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');

    let query = supabase.from('purchases').select('*').eq('shop_id', shop.id);

    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (filter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (filter === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    } else if (filter === 'custom' && startParam && endParam) {
      startDate = startParam;
      endDate = endParam;
    }

    if (startDate && endDate) {
      query = query.gte('purchase_date', startDate).lte('purchase_date', endDate);
    }

    const { data: purchases, error: purchasesError } = await query.order('purchase_date', { ascending: false });

    if (purchasesError) {
      return NextResponse.json({ error: purchasesError.message }, { status: 500 });
    }

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const {
      supplier_id,
      supplier_name,
      supplier_gstin,
      purchase_invoice_number,
      purchase_date,
      notes,
      items, // Array of items
    } = body;

    const sanitizedSupplierName = sanitizeText(supplier_name, 100);
    const sanitizedSupplierGstin = sanitizeText(supplier_gstin, 15);
    const sanitizedInvoiceNumber = sanitizeText(purchase_invoice_number, 50);
    const sanitizedNotes = sanitizeText(notes, 500);

    if (!sanitizedSupplierName) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    if (!sanitizedInvoiceNumber) {
      return NextResponse.json({ error: 'Purchase invoice number is required' }, { status: 400 });
    }

    if (!purchase_date) {
      return NextResponse.json({ error: 'Purchase date is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
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
        name: sanitizeText(item.name, 100) || 'Item',
        hsn_code: sanitizeText(item.hsn_code, 15) || null,
        qty,
        unit: sanitizeText(item.unit, 20) || 'pcs',
        price,
        gst_rate: rate,
        cgst,
        sgst,
        igst: 0,
        line_total: lineTotal,
      };
    });

    const total = subtotal + totalGst;
    const itcEligible = shop.gst_registered && !!sanitizedSupplierGstin && sanitizedSupplierGstin.length === 15;

    // 1. Insert Purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        shop_id: shop.id,
        supplier_id: supplier_id || null,
        supplier_name: sanitizedSupplierName,
        supplier_gstin: sanitizedSupplierGstin ? sanitizedSupplierGstin.toUpperCase() : null,
        purchase_invoice_number: sanitizedInvoiceNumber,
        purchase_date,
        subtotal: Number(subtotal.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_igst: 0,
        total_gst: Number(totalGst.toFixed(2)),
        total: Number(total.toFixed(2)),
        itc_eligible: itcEligible,
        notes: sanitizedNotes || null,
      })
      .select()
      .single();

    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 500 });
    }

    // 2. Insert Items
    const itemsToInsert = processedItems.map((item) => ({
      purchase_id: purchase.id,
      ...item,
    }));

    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsToInsert);
    if (itemsError) {
      // Cleanup purchase if items insert fail
      await supabase.from('purchases').delete().eq('id', purchase.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 3. Update inventory if enabled
    if (shop.inventory_enabled) {
      for (const item of processedItems) {
        // Find product with matching name case-insensitive
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

          // Update stock qty
          await supabase
            .from('products')
            .update({ stock_qty: newStock })
            .eq('id', product.id);

          // Log transaction
          await supabase.from('inventory_logs').insert({
            shop_id: shop.id,
            product_id: product.id,
            change_qty: item.qty,
            previous_qty: oldStock,
            new_qty: newStock,
            reason: 'purchase',
          });
        }
      }
    }

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
