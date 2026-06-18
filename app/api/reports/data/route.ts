import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Calculate dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Previous month dates
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);
    const prevStartDateStr = prevStartDate.toISOString();
    const prevEndDateStr = prevEndDate.toISOString();

    // 1. Current Month Invoices (excluding draft & failed for sales totals, but count failed for daily color coding)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, payment_status, created_at, status, subtotal, total_gst, total_cgst, total_sgst, customer_name, customer_phone, uses_payments_table')
      .eq('shop_id', shop.id)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const activeInvoices = (invoices || []).filter(inv => ['saved', 'sent'].includes(inv.status));
    const failedInvoices = (invoices || []).filter(inv => inv.status === 'failed');

    // Payments current month
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_method, invoice_id')
      .eq('shop_id', shop.id)
      .gte('paid_at', startDateStr)
      .lte('paid_at', endDateStr);

    // Active Invoice IDs
    const activeInvoiceIds = activeInvoices.map(i => i.id);

    // 2. Previous Month Invoices
    const { data: prevInvoices } = await supabase
      .from('invoices')
      .select('total, amount_paid, status, uses_payments_table')
      .eq('shop_id', shop.id)
      .gte('created_at', prevStartDateStr)
      .lte('created_at', prevEndDateStr);

    const prevActiveInvoices = (prevInvoices || []).filter(inv => ['saved', 'sent'].includes(inv.status));

    // Previous month payments
    const { data: prevPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('shop_id', shop.id)
      .gte('paid_at', prevStartDateStr)
      .lte('paid_at', prevEndDateStr);

    // --- Section 1: Sales Summary ---
    const totalInvoicesSent = activeInvoices.length;
    const totalBilled = activeInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    // Total collected includes payments received this month or amount_paid for active invoices this month
    const totalCollected = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) +
      activeInvoices.filter(inv => !inv.uses_payments_table).reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    const outstanding = Math.max(0, totalBilled - totalCollected);
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    // --- Section 8: Comparison ---
    const prevInvoicesCount = prevActiveInvoices.length;
    const prevBilled = prevActiveInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const prevCollected = (prevPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0) +
      prevActiveInvoices.filter(inv => !inv.uses_payments_table).reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
    const prevOutstanding = Math.max(0, prevBilled - prevCollected);

    const getChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const comparison = {
      billed: { curr: totalBilled, prev: prevBilled, change: getChange(totalBilled, prevBilled) },
      collected: { curr: totalCollected, prev: prevCollected, change: getChange(totalCollected, prevCollected) },
      outstanding: { curr: outstanding, prev: prevOutstanding, change: getChange(outstanding, prevOutstanding) },
      sent: { curr: totalInvoicesSent, prev: prevInvoicesCount, change: getChange(totalInvoicesSent, prevInvoicesCount) },
    };

    // --- Section 2: GST Summary & Section 7: Purchases Summary ---
    let gstSummary = null;
    let purchasesSummary = null;

    if (shop.gst_registered) {
      const totalTaxableSales = activeInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || inv.total || 0), 0);
      const gstCollected = activeInvoices.reduce((sum, inv) => sum + Number(inv.total_gst || 0), 0);
      const cgstCollected = activeInvoices.reduce((sum, inv) => sum + Number(inv.total_cgst || 0), 0);
      const sgstCollected = activeInvoices.reduce((sum, inv) => sum + Number(inv.total_sgst || 0), 0);

      // Purchases for the current month
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('shop_id', shop.id)
        .gte('purchase_date', startDateStr.split('T')[0])
        .lte('purchase_date', endDateStr.split('T')[0]);

      const itcPurchases = (purchases || []).filter(p => p.itc_eligible);
      const totalItcAvailable = itcPurchases.reduce((sum, p) => sum + Number(p.total_cgst + p.total_sgst || 0), 0);
      const netGstPayable = Math.max(0, gstCollected - totalItcAvailable);

      gstSummary = {
        totalTaxableSales,
        gstCollected,
        cgstCollected,
        sgstCollected,
        itcAvailable: totalItcAvailable,
        netGstPayable,
      };

      // Purchases details
      const totalPurchasesAmount = (purchases || []).reduce((sum, p) => sum + Number(p.total || 0), 0);
      const supplierMap: Record<string, { name: string; purchases: number; itc: number }> = {};
      (purchases || []).forEach(p => {
        const key = p.supplier_id || p.supplier_name;
        if (!supplierMap[key]) {
          supplierMap[key] = { name: p.supplier_name, purchases: 0, itc: 0 };
        }
        supplierMap[key].purchases += Number(p.total || 0);
        if (p.itc_eligible) {
          supplierMap[key].itc += Number(p.total_cgst + p.total_sgst || 0);
        }
      });

      const topSuppliers = Object.values(supplierMap)
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 3);

      purchasesSummary = {
        totalPurchases: totalPurchasesAmount,
        topSuppliers,
        totalItcEarned: totalItcAvailable,
      };
    }

    // --- Section 3: Top Products by Revenue ---
    let topProducts: any[] = [];
    if (activeInvoiceIds.length > 0) {
      const { data: lineItems } = await supabase
        .from('invoice_items')
        .select('name, price, qty, line_total')
        .in('invoice_id', activeInvoiceIds);

      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      (lineItems || []).forEach(item => {
        const name = item.name.toUpperCase();
        if (!productMap[name]) {
          productMap[name] = { name, qty: 0, revenue: 0 };
        }
        productMap[name].qty += Number(item.qty || 1);
        productMap[name].revenue += Number(item.line_total || item.price * item.qty);
      });

      const totalRevenue = Object.values(productMap).reduce((sum, p) => sum + p.revenue, 0);
      topProducts = Object.values(productMap)
        .map(p => ({
          ...p,
          percentage: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }

    // --- Section 4: Top Customers by Revenue ---
    const customerMap: Record<string, { name: string; phone: string; invoices: number; billed: number; paid: number; outstanding: number }> = {};
    activeInvoices.forEach(inv => {
      const phone = inv.customer_phone;
      const name = inv.customer_name || phone;
      if (!customerMap[phone]) {
        customerMap[phone] = { name, phone, invoices: 0, billed: 0, paid: 0, outstanding: 0 };
      }
      customerMap[phone].invoices += 1;
      customerMap[phone].billed += Number(inv.total || 0);
      if (!inv.uses_payments_table) {
        customerMap[phone].paid += Number(inv.amount_paid || 0);
      }
    });

    // Add payments received this month to customers
    if (payments && payments.length > 0) {
      payments.forEach(p => {
        // find invoice customer phone
        const inv = activeInvoices.find(i => i.id === p.invoice_id);
        if (inv) {
          const phone = inv.customer_phone;
          if (customerMap[phone]) {
            customerMap[phone].paid += Number(p.amount || 0);
          }
        }
      });
    }

    // Calculate outstanding
    Object.values(customerMap).forEach(c => {
      c.outstanding = Math.max(0, c.billed - c.paid);
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 5);

    // --- Section 5: Daily Sales Chart ---
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailySales: any[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      // check active invoices on this day
      const dayInvoices = activeInvoices.filter(inv => {
        const d = new Date(inv.created_at);
        return d.getDate() === day;
      });
      const dayFailed = failedInvoices.filter(inv => {
        const d = new Date(inv.created_at);
        return d.getDate() === day;
      });

      const totalBilledDay = dayInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

      dailySales.push({
        day,
        dateLabel: `${dayStr}/${String(month).padStart(2, '0')}`,
        total: totalBilledDay,
        count: dayInvoices.length,
        hasFailed: dayFailed.length > 0,
      });
    }

    const paymentMethods: Record<string, number> = { Cash: 0, UPI: 0, 'Bank Transfer': 0, Other: 0 };
    (payments || []).forEach(p => {
      const method = (p.payment_method || 'other').toLowerCase();
      if (method === 'cash') {
        paymentMethods['Cash'] += Number(p.amount || 0);
      } else if (method === 'upi') {
        paymentMethods['UPI'] += Number(p.amount || 0);
      } else if (method === 'bank transfer' || method === 'bank_transfer') {
        paymentMethods['Bank Transfer'] += Number(p.amount || 0);
      } else {
        paymentMethods['Other'] += Number(p.amount || 0);
      }
    });

    // Also include payments from active invoices this month that do not use the payments table
    activeInvoices.forEach(inv => {
      if (!inv.uses_payments_table && inv.amount_paid > 0) {
        // default to Cash or fallback
        paymentMethods['Cash'] += Number(inv.amount_paid);
      }
    });

    const totalMethodsVal = Object.values(paymentMethods).reduce((sum, val) => sum + val, 0);
    const paymentBreakdown = Object.keys(paymentMethods).map(method => ({
      name: method,
      value: paymentMethods[method],
      percentage: totalMethodsVal > 0 ? Number(((paymentMethods[method] / totalMethodsVal) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({
      success: true,
      shop: {
        name: shop.name,
        gstin: shop.gstin,
        gst_registered: shop.gst_registered,
      },
      salesSummary: {
        totalInvoicesSent,
        totalBilled,
        totalCollected,
        outstanding,
        collectionRate: Number(collectionRate.toFixed(1)),
      },
      gstSummary,
      topProducts,
      topCustomers,
      dailySales,
      paymentBreakdown,
      purchasesSummary,
      comparison,
    });
  } catch (err: any) {
    console.error('Reports data API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve reports data' }, { status: 500 });
  }
}
