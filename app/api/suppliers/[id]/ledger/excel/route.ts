import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import { getCurrentUserContext } from '@/lib/current-user';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const context = await getCurrentUserContext(supabase);
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: shop } = await supabase.from('shops').select('*').eq('id', context.shopId).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const { data: supplier } = await supabase.from('suppliers').select('*').eq('id', id).eq('shop_id', shop.id).single();
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    let query = supabase.from('purchases').select('*').eq('supplier_id', id).order('purchase_date', { ascending: true });
    if (startDate) query = query.gte('purchase_date', startDate);
    if (endDate) query = query.lte('purchase_date', endDate);

    const { data: purchases } = await query;
    const rows = purchases || [];

    let subtotal = 0, cgst = 0, sgst = 0, totalPurchased = 0, totalItc = 0;
    rows.forEach(p => {
      subtotal += Number(p.subtotal); cgst += Number(p.total_cgst); sgst += Number(p.total_sgst);
      totalPurchased += Number(p.total);
      if (p.itc_eligible) totalItc += Number(p.total_cgst) + Number(p.total_sgst);
    });

    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // Sheet 1: Ledger Summary
    const summaryData = [
      ['SUPPLIER LEDGER SUMMARY'],
      [],
      ['Shop Name', shop.name],
      ['Shop GSTIN', shop.gstin || 'N/A'],
      ['Generated On', dateStr],
      [],
      ['Supplier Name', supplier.name],
      ['Supplier GSTIN', supplier.gstin || 'N/A'],
      ['Phone', supplier.phone || 'N/A'],
      ['Address', supplier.address || 'N/A'],
      [],
      ['SUMMARY'],
      ['Total Purchases', `₹${totalPurchased.toFixed(2)}`],
      ['Total ITC Earned', `₹${totalItc.toFixed(2)}`],
      ['Total Transactions', rows.length],
      ['Total Taxable Value', `₹${subtotal.toFixed(2)}`],
      ['Total CGST', `₹${cgst.toFixed(2)}`],
      ['Total SGST', `₹${sgst.toFixed(2)}`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Ledger Summary');

    // Sheet 2: Transactions
    const txHeaders = ['Sr No', 'Date', 'Purchase Invoice No', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'Total GST (₹)', 'Invoice Total (₹)', 'ITC Eligible'];
    const txRows = rows.map((p, i) => [
      i + 1,
      new Date(p.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      p.purchase_invoice_number,
      Number(p.subtotal).toFixed(2),
      Number(p.total_cgst).toFixed(2),
      Number(p.total_sgst).toFixed(2),
      (Number(p.total_cgst) + Number(p.total_sgst)).toFixed(2),
      Number(p.total).toFixed(2),
      p.itc_eligible ? 'Yes' : 'No',
    ]);
    txRows.push(['', '', 'TOTAL', subtotal.toFixed(2), cgst.toFixed(2), sgst.toFixed(2), (cgst + sgst).toFixed(2), totalPurchased.toFixed(2), `₹${totalItc.toFixed(2)}`]);

    const ws2 = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
    ws2['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Transactions');

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Supplier_Ledger_${supplier.name.replace(/\s+/g, '_')}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('Supplier ledger Excel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate Excel' }, { status: 500 });
  }
}
