import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: shop } = await supabase.from('shops').select('*').eq('auth_user_id', user.id).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    // Call local server endpoint to fetch the reports JSON data directly
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    const res = await fetch(`${origin}/api/reports/data?month=${month}&year=${year}`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!res.ok) throw new Error('Failed to fetch report data');
    const reportData = await res.json();

    // Calculate dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Query active invoices with items for sheet 3 and sheet 4
    const { data: dbInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, created_at, customer_name, customer_phone, subtotal, total_gst, total, amount_paid, payment_status, delivery_status, status, uses_payments_table')
      .eq('shop_id', shop.id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .order('created_at', { ascending: true });

    const activeInvoices = (dbInvoices || []).filter(inv => ['saved', 'sent'].includes(inv.status));
    const activeInvoiceIds = activeInvoices.map(i => i.id);

    // Fetch payments for calculating correct paid/balance amounts
    let payments: any[] = [];
    if (activeInvoiceIds.length > 0) {
      const { data: dbPayments } = await supabase
        .from('payments')
        .select('*')
        .in('invoice_id', activeInvoiceIds);
      payments = dbPayments || [];
    }

    // Fetch invoice items for Sheet 3 & 4
    let invoiceItems: any[] = [];
    if (activeInvoiceIds.length > 0) {
      const { data: dbItems } = await supabase
        .from('invoice_items')
        .select('invoice_id, name, hsn_code, qty, price, line_total, cgst, sgst')
        .in('invoice_id', activeInvoiceIds);
      invoiceItems = dbItems || [];
    }

    // Fetch purchases for Sheet 5
    let purchases: any[] = [];
    if (shop.gst_registered) {
      const { data: dbPurchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('shop_id', shop.id)
        .gte('purchase_date', startDateStr.split('T')[0])
        .lte('purchase_date', endDateStr.split('T')[0])
        .order('purchase_date', { ascending: true });
      purchases = dbPurchases || [];
    }

    // Fetch Credit & Debit Notes for the current month
    let cdNotes: any[] = [];
    const { data: dbNotes } = await supabase
      .from('credit_debit_notes')
      .select('*')
      .eq('shop_id', shop.id)
      .gte('note_date', startDateStr.split('T')[0])
      .lte('note_date', endDateStr.split('T')[0]);
    cdNotes = dbNotes || [];

    const wb = XLSX.utils.book_new();

    // --- Sheet 1: Summary ---
    const summaryData: any[][] = [
      ['MONTHLY BUSINESS REPORT SUMMARY'],
      [],
      ['Shop Name', shop.name],
      ['Shop GSTIN', shop.gstin || 'N/A'],
      ['Period', `${MONTHS[month - 1]} ${year}`],
      ['Generated On', new Date().toLocaleDateString('en-IN')],
      [],
      ['1. SALES SUMMARY'],
      ['Total Invoices Sent', reportData.salesSummary.totalInvoicesSent],
      ['Total Billed', `₹${reportData.salesSummary.totalBilled.toFixed(2)}`],
      ['Total Collected', `₹${reportData.salesSummary.totalCollected.toFixed(2)}`],
      ['Outstanding Balance', `₹${reportData.salesSummary.outstanding.toFixed(2)}`],
      ['Collection Rate', `${reportData.salesSummary.collectionRate}%`],
    ];

    if (shop.gst_registered && reportData.gstSummary) {
      summaryData.push(
        [],
        ['2. GST SUMMARY'],
        ['Total Taxable Sales', `₹${reportData.gstSummary.totalTaxableSales.toFixed(2)}`],
        ['GST Output (Collected)', `₹${reportData.gstSummary.gstCollected.toFixed(2)}`],
        ['CGST Collected', `₹${reportData.gstSummary.cgstCollected.toFixed(2)}`],
        ['SGST Collected', `₹${reportData.gstSummary.sgstCollected.toFixed(2)}`],
        ['ITC Available', `₹${reportData.gstSummary.itcAvailable.toFixed(2)}`],
        ['Net GST Payable', `₹${reportData.gstSummary.netGstPayable.toFixed(2)}`]
      );
    }

    summaryData.push(
      [],
      ['3. COMPARISON WITH LAST MONTH'],
      ['Metric', 'This Month', 'Last Month', 'Change (%)'],
      ['Total Billed', `₹${reportData.comparison.billed.curr.toFixed(2)}`, `₹${reportData.comparison.billed.prev.toFixed(2)}`, `${reportData.comparison.billed.change.toFixed(1)}%`],
      ['Collected', `₹${reportData.comparison.collected.curr.toFixed(2)}`, `₹${reportData.comparison.collected.prev.toFixed(2)}`, `${reportData.comparison.collected.change.toFixed(1)}%`],
      ['Outstanding', `₹${reportData.comparison.outstanding.curr.toFixed(2)}`, `₹${reportData.comparison.outstanding.prev.toFixed(2)}`, `${reportData.comparison.outstanding.change.toFixed(1)}%`],
      ['Invoices Sent', reportData.comparison.sent.curr, reportData.comparison.sent.prev, `${reportData.comparison.sent.change.toFixed(1)}%`]
    );

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // --- Sheet 2: Daily Sales ---
    const dailyHeaders = ['Date', 'Day of Week', 'Invoices Sent', 'Total Billed', 'Total Collected', 'Outstanding'];
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalBilledSum = 0;
    let totalCollectedSum = 0;
    let totalOutstandingSum = 0;
    let totalInvoicesSum = 0;

    const dailyRows = Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      const dayDate = new Date(year, month - 1, day);
      const dayStr = dayDate.toLocaleDateString('en-IN', { weekday: 'long' });
      const dateLabel = `${String(day).padStart(2, '0')}-${MONTHS[month - 1].slice(0, 3)}-${year}`;

      const dayInvoices = activeInvoices.filter(inv => {
        const d = new Date(inv.created_at);
        return d.getDate() === day;
      });

      const dayNotes = cdNotes.filter(note => {
        const d = new Date(note.created_at);
        return d.getDate() === day;
      });
      const dayCredit = dayNotes.filter(n => n.note_type === 'credit').reduce((sum, n) => sum + Number(n.total || 0), 0);
      const dayDebit = dayNotes.filter(n => n.note_type === 'debit').reduce((sum, n) => sum + Number(n.total || 0), 0);

      const dayBilled = Math.max(0, dayInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0) + dayDebit - dayCredit);
      const dayPaid = Math.max(0, dayInvoices.reduce((sum, inv) => {
        if (inv.uses_payments_table) {
          const invPayments = payments.filter(p => p.invoice_id === inv.id);
          return sum + invPayments.reduce((s, p) => s + Number(p.amount), 0);
        }
        return sum + Number(inv.amount_paid || 0);
      }, 0) - dayCredit);
      const dayOutstanding = Math.max(0, dayBilled - dayPaid);

      totalBilledSum += dayBilled;
      totalCollectedSum += dayPaid;
      totalOutstandingSum += dayOutstanding;
      totalInvoicesSum += dayInvoices.length;

      return [
        dateLabel,
        dayStr,
        dayInvoices.length,
        dayBilled.toFixed(2),
        dayPaid.toFixed(2),
        dayOutstanding.toFixed(2)
      ];
    });

    dailyRows.push([
      'TOTAL',
      '',
      totalInvoicesSum,
      totalBilledSum.toFixed(2),
      totalCollectedSum.toFixed(2),
      totalOutstandingSum.toFixed(2)
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyRows]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Daily Sales');

    // --- Sheet 3: Invoice Details ---
    const invHeaders = [
      'Invoice No', 'Date', 'Customer', 'Phone', 'Items Count',
      'Subtotal (₹)', 'GST (₹)', 'Total (₹)', 'Paid (₹)', 'Balance (₹)',
      'Payment Status', 'Delivery Status'
    ];
    const invRows = activeInvoices.map(inv => {
      const itemsCount = invoiceItems.filter(item => item.invoice_id === inv.id).length;
      const paid = inv.uses_payments_table
        ? payments.filter(p => p.invoice_id === inv.id).reduce((sum, p) => sum + Number(p.amount), 0)
        : Number(inv.amount_paid || 0);
      const balance = Math.max(0, Number(inv.total) - paid);

      return [
        inv.invoice_number,
        new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        inv.customer_name || 'N/A',
        inv.customer_phone,
        itemsCount,
        Number(inv.subtotal || inv.total || 0).toFixed(2),
        Number(inv.total_gst || 0).toFixed(2),
        Number(inv.total).toFixed(2),
        paid.toFixed(2),
        balance.toFixed(2),
        inv.payment_status.toUpperCase(),
        (inv.delivery_status || 'PENDING').toUpperCase()
      ];
    });

    const ws3 = XLSX.utils.aoa_to_sheet([invHeaders, ...invRows]);
    ws3['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
      { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Invoice Details');

    // --- Sheet 4: Top Products ---
    const prodHeaders = ['Product', 'HSN', 'Qty Sold', 'Revenue (₹)', 'GST Collected (₹)'];
    const productMap: Record<string, { name: string; hsn: string; qty: number; revenue: number; gst: number }> = {};
    invoiceItems.forEach(item => {
      const name = item.name.toUpperCase();
      if (!productMap[name]) {
        productMap[name] = { name, hsn: item.hsn_code || 'N/A', qty: 0, revenue: 0, gst: 0 };
      }
      productMap[name].qty += Number(item.qty || 1);
      productMap[name].revenue += Number(item.line_total || item.price * item.qty);
      productMap[name].gst += (Number(item.cgst || 0) + Number(item.sgst || 0)) * Number(item.qty || 1);
    });

    const prodRows = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map(p => [
        p.name,
        p.hsn,
        p.qty,
        p.revenue.toFixed(2),
        p.gst.toFixed(2)
      ]);

    const ws4 = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
    ws4['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Top Products');

    // --- Sheet 5: Purchases & ITC (if registered) ---
    if (shop.gst_registered) {
      const purHeaders = [
        'Date', 'Supplier', 'Supplier Invoice', 'Taxable (₹)',
        'CGST (₹)', 'SGST (₹)', 'Total (₹)', 'ITC Eligible'
      ];
      const purRows = purchases.map(p => [
        new Date(p.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        p.supplier_name,
        p.purchase_invoice_number,
        Number(p.subtotal).toFixed(2),
        Number(p.total_cgst).toFixed(2),
        Number(p.total_sgst).toFixed(2),
        Number(p.total).toFixed(2),
        p.itc_eligible ? 'YES' : 'NO'
      ]);

      const ws5 = XLSX.utils.aoa_to_sheet([purHeaders, ...purRows]);
      ws5['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, ws5, 'Purchases & ITC');
    }

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const monthName = MONTHS[month - 1];
    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="TruBill_Report_${shop.name.replace(/\s+/g, '_')}_${monthName}${year}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('Report Excel generation API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate Excel' }, { status: 500 });
  }
}
