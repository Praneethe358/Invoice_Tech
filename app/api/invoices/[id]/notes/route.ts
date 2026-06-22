import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { syncCustomerOutstanding } from '@/lib/payments';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: invoiceId } = await params;

    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', ctx.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Fetch original invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      note_type, // 'credit' | 'debit'
      note_date,
      reason,
      reason_note,
      items, // array of items being returned/adjusted
    } = body;

    if (!note_type || (note_type !== 'credit' && note_type !== 'debit')) {
      return NextResponse.json({ error: 'Valid note type (credit or debit) is required' }, { status: 400 });
    }

    if (!note_date) {
      return NextResponse.json({ error: 'Note date is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Generate unique note number
    let prefix = '';
    let counter = 1;

    if (note_type === 'credit') {
      prefix = shop.credit_note_prefix || 'CN';
      counter = shop.next_credit_note_number || 1;
    } else {
      prefix = shop.debit_note_prefix || 'DN';
      counter = shop.next_debit_note_number || 1;
    }

    const noteNumber = `${prefix}-${String(counter).padStart(3, '0')}`;

    // Compute totals
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;

    const processedItems = items.map((item: any) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty) || 1;
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
        price,
        gst_rate: rate,
        cgst,
        sgst,
        line_total: lineTotal,
      };
    });

    const total = subtotal + totalGst;

    // 1. Insert Note
    const { data: note, error: noteError } = await supabase
      .from('credit_debit_notes')
      .insert({
        shop_id: shop.id,
        invoice_id: invoiceId,
        note_type,
        note_number: noteNumber,
        note_date,
        customer_phone: invoice.customer_phone,
        customer_gstin: invoice.customer_gstin || null,
        reason,
        reason_note: reason_note ? reason_note.trim() : null,
        subtotal: Number(subtotal.toFixed(2)),
        total_cgst: Number(totalCgst.toFixed(2)),
        total_sgst: Number(totalSgst.toFixed(2)),
        total_gst: Number(totalGst.toFixed(2)),
        total: Number(total.toFixed(2)),
        status: 'created',
      })
      .select()
      .single();

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    // 2. Insert CDN items
    const cdnItemsToInsert = processedItems.map((item) => ({
      cdn_id: note.id,
      ...item,
    }));

    const { error: itemsError } = await supabase.from('cdn_items').insert(cdnItemsToInsert);
    if (itemsError) {
      await supabase.from('credit_debit_notes').delete().eq('id', note.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 3. Increment Counter in shop
    if (note_type === 'credit') {
      await supabase
        .from('shops')
        .update({ next_credit_note_number: counter + 1 })
        .eq('id', shop.id);
    } else {
      await supabase
        .from('shops')
        .update({ next_debit_note_number: counter + 1 })
        .eq('id', shop.id);
    }

    // 4. Recalculate customer ledger outstanding
    await syncCustomerOutstanding(shop.id, invoice.customer_phone);

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
