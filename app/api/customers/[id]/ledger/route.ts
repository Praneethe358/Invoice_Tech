import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = (page - 1) * limit;

  const period = searchParams.get('period') || 'all'; // all, this_month, last_month, custom
  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');
  const logExport = searchParams.get('log_export') === 'true';
  const exportType = searchParams.get('export_type') || 'csv';

  try {
    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch customer details and verify shop ownership
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*, shops(auth_user_id, name, gstin, phone, address)')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify ownership
    const shopOwnerId = (customer.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to customer data' }, { status: 403 });
    }

    const shop = customer.shops as any;

    // Calculate dates based on period
    let startDate: string | null = null;
    let endDate: string | null = null;

    const now = new Date();
    if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
    } else if (period === 'custom') {
      if (startDateParam) startDate = new Date(startDateParam).toISOString();
      if (endDateParam) {
        const d = new Date(endDateParam);
        d.setHours(23, 59, 59, 999);
        endDate = d.toISOString();
      }
    }

    // 3. Query invoices directly (each invoice is a single ledger entry with debit = invoice total, credit = amount paid)
    let invoiceQuery = supabase
      .from('invoices')
      .select('id, invoice_number, total, amount_paid, status, created_at, uses_payments_table')
      .eq('shop_id', customer.shop_id)
      .eq('customer_phone', customer.phone);

    if (startDate) {
      invoiceQuery = invoiceQuery.gte('created_at', startDate);
    }
    if (endDate) {
      invoiceQuery = invoiceQuery.lte('created_at', endDate);
    }

    const { data: dbInvoices, error: invError } = await invoiceQuery.order('created_at', { ascending: false });

    if (invError) {
      return NextResponse.json({ error: invError.message }, { status: 500 });
    }

    const fallbackUsed = false;
    const invoices = dbInvoices || [];
    const queryInvoiceIds = invoices.map(i => i.id);

    // Fetch payments for these invoices
    let allPayments: any[] = [];
    if (queryInvoiceIds.length > 0) {
      const { data: dbPayments } = await supabase
        .from('payments')
        .select('*')
        .in('invoice_id', queryInvoiceIds);
      allPayments = dbPayments || [];
    }

    // Map invoices directly to ledger entries
    const allEntries = invoices.map((inv) => {
      let amountPaidForInv = 0;
      if (inv.uses_payments_table) {
        const invPayments = allPayments.filter(p => p.invoice_id === inv.id);
        amountPaidForInv = invPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      } else {
        amountPaidForInv = Number(inv.amount_paid || 0);
      }

      const totalBilled = Number(inv.total);

      return {
        id: inv.id,
        entry_type: 'debit',
        entry_date: inv.created_at,
        reference_id: inv.id,
        reference_type: 'invoice',
        invoice_number: inv.invoice_number,
        particulars: `Invoice ${inv.invoice_number}`,
        debit_amount: totalBilled,
        credit_amount: amountPaidForInv,
        invoice_amount: totalBilled,
        amount_paid: amountPaidForInv,
        payment_status: inv.status,
        running_balance: 0,
        items: [] as any[],
      };
    });

    let totalCount = allEntries.length;
    let entries = allEntries.slice(offset, offset + limit);

    // Fetch items for the paginated page entries
    const invoiceIdsInPage = entries.map((e) => e.reference_id);
    if (invoiceIdsInPage.length > 0) {
      const { data: pageItems } = await supabase
        .from('invoice_items')
        .select('invoice_id, name, price, qty, line_total')
        .in('invoice_id', invoiceIdsInPage);

      entries.forEach((entry) => {
        entry.items = pageItems?.filter((item) => item.invoice_id === entry.reference_id) || [];
      });
    }

    // 5. Gather Summary Metrics (Total Purchases, Total Paid, Outstanding, Invoice Count, Avg Invoice Value)
    // Run queries across all customer invoices
    const { data: customerInvoices } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, payment_status, created_at, uses_payments_table, uses_items_table')
      .eq('shop_id', customer.shop_id)
      .eq('customer_phone', customer.phone);

    const invoiceIds = customerInvoices?.map((inv) => inv.id) || [];
    let customerPayments: any[] = [];
    if (invoiceIds.length > 0) {
      const { data: dbPay } = await supabase
        .from('payments')
        .select('amount')
        .in('invoice_id', invoiceIds);
      customerPayments = dbPay || [];
    }

    let totalBilled = 0;
    let totalPaid = 0;
    let invoiceCount = customerInvoices?.length || 0;

    customerInvoices?.forEach((inv) => {
      totalBilled += Number(inv.total);
      if (!inv.uses_payments_table) {
        totalPaid += Number(inv.amount_paid);
      }
    });

    customerPayments.forEach((p) => {
      totalPaid += Number(p.amount);
    });

    const outstandingAmount = Math.max(0, totalBilled - totalPaid);
    const avgInvoiceValue = invoiceCount > 0 ? totalBilled / invoiceCount : 0;

    // 6. Aggregate Product Purchase History
    let productSummary: any[] = [];
    if (invoiceIds.length > 0) {
      // Query items table
      const { data: lineItems } = await supabase
        .from('invoice_items')
        .select('name, price, qty, line_total')
        .in('invoice_id', invoiceIds);

      // Also support legacy JSON items in invoices if items table is not populated
      const legacyItems: any[] = [];
      customerInvoices?.forEach((inv) => {
        if (!inv.uses_items_table) {
          // fetch full invoice to get items JSON
          // (optional fallback to prevent zero product history on legacy invoices)
        }
      });

      const productMap: Record<string, { total_qty: number; total_revenue: number; count: number }> = {};

      lineItems?.forEach((item) => {
        const name = item.name.toUpperCase();
        if (!productMap[name]) {
          productMap[name] = { total_qty: 0, total_revenue: 0, count: 0 };
        }
        productMap[name].total_qty += Number(item.qty || 1);
        productMap[name].total_revenue += Number(item.line_total || item.price * item.qty);
        productMap[name].count += 1;
      });

      productSummary = Object.keys(productMap).map((name) => ({
        name,
        total_qty: productMap[name].total_qty,
        total_revenue: productMap[name].total_revenue,
        count: productMap[name].count,
      }));

      // Sort by total revenue descending
      productSummary.sort((a, b) => b.total_revenue - a.total_revenue);
    }

    // 7. Log Statement Export in DB if requested
    if (logExport) {
      await supabase.from('customer_statement_exports').insert({
        shop_id: customer.shop_id,
        customer_id: customer.id,
        export_type: exportType,
        date_range_start: startDate,
        date_range_end: endDate,
        records_count: totalCount,
        outstanding_amount: outstandingAmount,
      });
    }

    return NextResponse.json({
      success: true,
      fallback_used: fallbackUsed,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        gstin: customer.gstin,
        outstanding_balance: customer.outstanding_balance,
      },
      shop: {
        name: shop.name,
        gstin: shop.gstin,
        phone: shop.phone,
        address: shop.address,
      },
      summary_cards: {
        total_purchases: Number(totalBilled.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        outstanding_amount: Number(outstandingAmount.toFixed(2)),
        invoice_count: invoiceCount,
        avg_invoice_value: Number(avgInvoiceValue.toFixed(2)),
      },
      entries,
      total_count: totalCount,
      product_summary: productSummary.slice(0, 10), // return top 10 products
    });
  } catch (err) {
    console.error('Customer ledger API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve customer ledger' },
      { status: 500 }
    );
  }
}
