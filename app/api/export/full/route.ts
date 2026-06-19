import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { logAudit } from '@/lib/audit';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify auth and owner role
    const ctx = await getCurrentUserContext(supabase);
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.isOwner && ctx.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access only.' }, { status: 403 });
    }

    const shopId = ctx.shopId;

    // 2. Rate limit check: count today's exports
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayStr = startOfToday.toISOString();

    const { count, error: countError } = await supabase
      .from('data_exports')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('export_type', 'full')
      .gte('created_at', startOfTodayStr);

    if (countError) {
      console.error('Error counting data exports:', countError);
    }

    if (count !== null && count >= 3) {
      return NextResponse.json(
        { error: 'Daily limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    // 3. Fetch all datasets parallelized or sequential
    const [
      { data: shop },
      { data: products },
      { data: customers },
      { data: invoices },
      { data: invoiceItemsRaw },
      { data: payments },
      { data: purchases },
      { data: purchaseItemsRaw },
      { data: suppliers },
      { data: creditDebitNotes },
      { data: cdnItemsRaw },
      { data: staff },
      { data: auditLogs }
    ] = await Promise.all([
      supabase.from('shops').select('*').eq('id', shopId).single(),
      supabase.from('products').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*, staff:created_by_staff_id(email, role)').eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('invoice_items').select('*, invoices(shop_id, invoice_number)'),
      supabase.from('payments').select('*, invoices(invoice_number), staff:recorded_by_staff_id(email)').eq('shop_id', shopId).order('paid_at', { ascending: false }),
      supabase.from('purchases').select('*, staff:created_by_staff_id(email)').eq('shop_id', shopId).order('purchase_date', { ascending: false }),
      supabase.from('purchase_items').select('*, purchases(purchase_invoice_number, shop_id)'),
      supabase.from('suppliers').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('credit_debit_notes').select('*, invoices(invoice_number)').eq('shop_id', shopId).order('note_date', { ascending: false }),
      supabase.from('cdn_items').select('*, credit_debit_notes(note_number, shop_id)'),
      supabase.from('staff').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').eq('shop_id', shopId).gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false })
    ]);

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Filter sub-relations in JS to guarantee correctness
    const invoiceItems = (invoiceItemsRaw || []).filter(item => (item.invoices as any)?.shop_id === shopId);
    const purchaseItems = (purchaseItemsRaw || []).filter(item => (item.purchases as any)?.shop_id === shopId);
    const cdnItems = (cdnItemsRaw || []).filter(item => (item.credit_debit_notes as any)?.shop_id === shopId);

    // Helper to format Date
    const formatDt = (dStr: string | null | undefined) => {
      if (!dStr) return '';
      return new Date(dStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const formatTime = (dStr: string | null | undefined) => {
      if (!dStr) return '';
      return new Date(dStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const wb = XLSX.utils.book_new();

    // ─── SHEET 1: Shop Info ───
    const shopInfoData = [
      ['BUSINESS PROFILE INFORMATION'],
      [],
      ['Shop ID', shop.id],
      ['Shop Name', shop.name],
      ['Shop Type', shop.shop_type ? shop.shop_type.toUpperCase().replace('_', ' ') : 'N/A'],
      ['GSTIN', shop.gstin || 'UNREGISTERED'],
      ['GST Registered', shop.gst_registered ? 'YES' : 'NO'],
      ['Business Type', shop.business_type ? shop.business_type.toUpperCase() : 'N/A'],
      ['Phone', shop.phone || 'N/A'],
      ['Address', shop.address || 'N/A'],
      ['Invoice Prefix', shop.invoice_prefix || 'INV'],
      ['Next Invoice Number', shop.next_invoice_number],
      ['Inventory Enabled', shop.inventory_enabled ? 'YES' : 'NO'],
      ['Subscription Status', 'Active (Pro)'],
      ['Member Since', formatDt(shop.created_at)],
      ['Export Generated On', new Date().toLocaleString('en-IN')],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(shopInfoData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Shop Info');

    // ─── SHEET 2: Invoices ───
    const invoiceHeaders = [
      'Invoice No', 'Date', 'Customer Name', 'Customer Phone', 'Customer GSTIN',
      'Items (semicolon-separated)', 'Subtotal', 'CGST', 'SGST', 'Total GST', 'Total',
      'Payment Status', 'Amount Paid', 'Balance Due', 'Delivery Status', 'Created By', 'Created At'
    ];
    const invoiceRows = (invoices || []).map(inv => {
      const invItems = invoiceItems.filter(item => item.invoice_id === inv.id);
      const itemsList = invItems.map(item => `${item.name} (${item.qty} pcs)`).join('; ');
      const subtotal = Number(inv.subtotal || inv.total || 0);
      const cgst = Number(inv.total_cgst || 0);
      const sgst = Number(inv.total_sgst || 0);
      const totalGst = Number(inv.total_gst || 0);
      const total = Number(inv.total || 0);
      const paid = Number(inv.amount_paid || 0);
      const balance = Math.max(0, total - paid);
      const creator = inv.staff ? `${(inv.staff as any).email} (${(inv.staff as any).role})` : 'Owner';

      return [
        inv.invoice_number,
        formatDt(inv.created_at),
        inv.customer_name || 'WALK-IN',
        inv.customer_phone,
        inv.customer_gstin || '',
        itemsList,
        subtotal,
        cgst,
        sgst,
        totalGst,
        total,
        inv.payment_status ? inv.payment_status.toUpperCase() : 'UNPAID',
        paid,
        balance,
        (inv.delivery_status || 'pending').toUpperCase(),
        creator,
        formatDt(inv.created_at) + ' ' + formatTime(inv.created_at)
      ];
    });
    const ws2 = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
    ws2['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 18 },
      { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Invoices');

    // ─── SHEET 3: Invoice Items ───
    const itemHeaders = ['Invoice No', 'Item Name', 'HSN Code', 'Qty', 'Unit Price', 'GST Rate', 'CGST', 'SGST', 'Line Total'];
    const itemRows = invoiceItems.map(item => {
      const invNo = (item.invoices as any)?.invoice_number || '';
      return [
        invNo,
        item.name,
        item.hsn_code || '',
        Number(item.qty || 1),
        Number(item.price || 0),
        Number(item.gst_rate || 0),
        Number(item.cgst || 0),
        Number(item.sgst || 0),
        Number(item.line_total || 0)
      ];
    });
    const ws3 = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
    ws3['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Invoice Items');

    // ─── SHEET 4: Payments ───
    const paymentHeaders = ['Invoice No', 'Date', 'Amount', 'Method', 'Note', 'Recorded By'];
    const paymentRows = (payments || []).map(p => {
      const invNo = (p.invoices as any)?.invoice_number || '';
      const recorder = p.staff ? (p.staff as any).email : 'Owner';
      return [
        invNo,
        formatDt(p.paid_at),
        Number(p.amount || 0),
        p.payment_method ? p.payment_method.toUpperCase() : 'CASH',
        p.note || '',
        recorder
      ];
    });
    const ws4 = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
    ws4['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Payments');

    // ─── SHEET 5: Customers ───
    const customerHeaders = ['Name', 'Phone', 'GSTIN', 'Tag', 'Total Invoices', 'Total Spent', 'Outstanding Balance', 'Created At'];
    const customerRows = (customers || []).map(c => [
      c.name,
      c.phone,
      c.gstin || '',
      c.tag ? c.tag.toUpperCase() : 'REGULAR',
      Number(c.total_invoices || 0),
      Number(c.total_spent || 0),
      Number(c.outstanding_balance || 0),
      formatDt(c.created_at)
    ]);
    const ws5 = XLSX.utils.aoa_to_sheet([customerHeaders, ...customerRows]);
    ws5['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Customers');

    // ─── SHEET 6: Products Catalog ───
    const productHeaders = ['Name', 'Category', 'HSN Code', 'GST Rate', 'Price', 'Stock Qty', 'Track Inventory', 'Is Favorite', 'Use Count', 'Created At'];
    const productRows = (products || []).map(p => [
      p.name,
      p.category || 'GENERAL',
      p.hsn_code || '',
      Number(p.gst_rate || 0),
      Number(p.price || 0),
      Number(p.stock_qty || 0),
      p.track_inventory ? 'YES' : 'NO',
      p.is_favorite ? 'YES' : 'NO',
      Number(p.use_count || 0),
      formatDt(p.created_at)
    ]);
    const ws6 = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
    ws6['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws6, 'Products Catalog');

    // ─── SHEET 7: Purchases ───
    const purchaseHeaders = ['Purchase Invoice No', 'Supplier Invoice No', 'Date', 'Supplier Name', 'Supplier GSTIN', 'Subtotal', 'CGST', 'SGST', 'Total', 'ITC Eligible', 'Notes'];
    const purchaseRows = (purchases || []).map(p => [
      p.id.slice(0, 8).toUpperCase(), // Internal purchase ref
      p.purchase_invoice_number,
      formatDt(p.purchase_date),
      p.supplier_name,
      p.supplier_gstin || '',
      Number(p.subtotal || 0),
      Number(p.total_cgst || 0),
      Number(p.total_sgst || 0),
      Number(p.total || 0),
      p.itc_eligible ? 'YES' : 'NO',
      p.notes || ''
    ]);
    const ws7 = XLSX.utils.aoa_to_sheet([purchaseHeaders, ...purchaseRows]);
    ws7['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 18 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, ws7, 'Purchases');

    // ─── SHEET 8: Purchase Items ───
    const purItemHeaders = ['Purchase Invoice No', 'Item Name', 'HSN', 'Qty', 'Unit', 'Price', 'GST Rate', 'CGST', 'SGST', 'Line Total'];
    const purItemRows = purchaseItems.map(item => {
      const pinvNo = (item.purchases as any)?.purchase_invoice_number || '';
      return [
        pinvNo,
        item.name,
        item.hsn_code || '',
        Number(item.qty || 1),
        item.unit || 'pcs',
        Number(item.price || 0),
        Number(item.gst_rate || 0),
        Number(item.cgst || 0),
        Number(item.sgst || 0),
        Number(item.line_total || 0)
      ];
    });
    const ws8 = XLSX.utils.aoa_to_sheet([purItemHeaders, ...purItemRows]);
    ws8['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws8, 'Purchase Items');

    // ─── SHEET 9: Suppliers ───
    const supplierHeaders = ['Name', 'GSTIN', 'Phone', 'Address', 'Total Purchases', 'Created At'];
    const supplierRows = (suppliers || []).map(sup => {
      const supPurchs = (purchases || []).filter(p => p.supplier_id === sup.id);
      const totalSpent = supPurchs.reduce((sum, p) => sum + Number(p.total), 0);
      return [
        sup.name,
        sup.gstin || '',
        sup.phone || '',
        sup.address || '',
        totalSpent,
        formatDt(sup.created_at)
      ];
    });
    const ws9 = XLSX.utils.aoa_to_sheet([supplierHeaders, ...supplierRows]);
    ws9['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 30 }, { wch: 16 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws9, 'Suppliers');

    // ─── SHEET 10: Credit & Debit Notes ───
    const cdnHeaders = ['Note Number', 'Type', 'Date', 'Customer Phone', 'Customer GSTIN', 'Original Invoice No', 'Reason', 'Total', 'CGST', 'SGST', 'Status'];
    const cdnRows = (creditDebitNotes || []).map(n => {
      const origInv = n.invoices ? (n.invoices as any).invoice_number : 'N/A';
      return [
        n.note_number,
        n.note_type ? n.note_type.toUpperCase() : 'CREDIT',
        formatDt(n.note_date),
        n.customer_phone,
        n.customer_gstin || '',
        origInv,
        n.reason ? n.reason.toUpperCase().replace('_', ' ') : 'OTHER',
        Number(n.total || 0),
        Number(n.total_cgst || 0),
        Number(n.total_sgst || 0),
        n.status ? n.status.toUpperCase() : 'CREATED'
      ];
    });
    const ws10 = XLSX.utils.aoa_to_sheet([cdnHeaders, ...cdnRows]);
    ws10['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws10, 'Credit & Debit Notes');

    // ─── SHEET 11: Staff ───
    const staffHeaders = ['Name', 'Email', 'Role', 'Status', 'Joined At'];
    const staffRows = (staff || []).map(s => {
      const name = s.email.split('@')[0].toUpperCase();
      return [
        name,
        s.email,
        s.role.toUpperCase(),
        s.status.toUpperCase(),
        s.accepted_at ? formatDt(s.accepted_at) : 'PENDING ACCEPTANCE'
      ];
    });
    const ws11 = XLSX.utils.aoa_to_sheet([staffHeaders, ...staffRows]);
    ws11['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws11, 'Staff');

    // ─── SHEET 12: Audit Log ───
    const auditHeaders = ['Date', 'Time', 'Actor', 'Role', 'Action', 'Entity', 'Details'];
    const auditRows = (auditLogs || []).map(a => [
      formatDt(a.created_at),
      formatTime(a.created_at),
      a.actor_name,
      a.actor_role.toUpperCase(),
      a.action.toUpperCase(),
      a.entity_type.toUpperCase() + (a.entity_label ? ` (${a.entity_label})` : ''),
      JSON.stringify(a.details || {})
    ]);
    const ws12 = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditRows]);
    ws12['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws12, 'Audit Log');

    // 4. Generate Workbook Buffer
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 5. Insert into data_exports (rate limit + audit record)
    await supabase.from('data_exports').insert({
      shop_id: shopId,
      exported_by: ctx.userId,
      export_type: 'full'
    });

    logAudit({
      shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'data.export',
      entityType: 'shop',
      entityId: shopId,
      entityLabel: shop.name,
      details: { export_type: 'full' }
    });

    // 6. Return response
    const safeShopName = shop.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `TruBill_FullExport_${safeShopName}_${todayStr}.xlsx`;

    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (err: any) {
    console.error('Unexpected error in full export API:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
