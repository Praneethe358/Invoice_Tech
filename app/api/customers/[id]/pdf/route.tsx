import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';

// ─── Styles matching brand theme ──────────────────────────────
const GREEN = '#0050e8';
const DARK_GREEN = '#0d3c20';
const LIGHT_GREEN = '#e6efff';
const TEXT_DARK = '#1f2937';
const TEXT_MUTED = '#4b5563';
const BORDER_COLOR = '#e5e7eb';
const LIGHT_BG = '#f9fafb';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_DARK,
    lineHeight: 1.5,
  },
  topBar: {
    height: 6,
    backgroundColor: GREEN,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 25,
  },
  shopSection: {
    maxWidth: '60%',
  },
  shopName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: DARK_GREEN,
    marginBottom: 6,
  },
  shopAddress: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  logo: {
    maxHeight: 50,
    maxWidth: 100,
    marginBottom: 8,
    objectFit: 'contain',
  },
  titleSection: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateRange: {
    fontSize: 8,
    color: TEXT_MUTED,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: LIGHT_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 25,
  },
  infoCol: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 8,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  infoValueSub: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    alignItems: 'center',
  },
  colDate: { flex: 1.5 },
  colParticulars: { flex: 6.5 },
  colDebit: { flex: 2.0, textAlign: 'right' },
  colCredit: { flex: 2.0, textAlign: 'right' },

  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: LIGHT_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
  },
  summaryValue: {
    fontSize: 9,
    color: TEXT_DARK,
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: GREEN,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK_GREEN,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  notesSection: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
});

// ─── PDF Document Component ──────────────────────────────────
interface PDFProps {
  shopName: string;
  shopAddress: string;
  shopPhone: string | null;
  shopGstin: string | null;
  customerName: string;
  customerPhone: string;
  customerGstin: string | null;
  dateRange: string;
  entries: any[];
  summary: {
    total_purchases: number;
    total_paid: number;
    outstanding_amount: number;
    invoice_count: number;
  };
  logoBase64: string | null;
}

function CustomerStatementPDF({
  shopName,
  shopAddress,
  shopPhone,
  shopGstin,
  customerName,
  customerPhone,
  customerGstin,
  dateRange,
  entries,
  summary,
  logoBase64,
}: PDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.shopSection}>
            {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopAddress}>{shopAddress || 'Tamil Nadu, India'}</Text>
            {shopPhone && <Text style={styles.shopAddress}>{shopPhone}</Text>}
            {shopGstin && (
              <Text style={[styles.shopAddress, { fontFamily: 'Helvetica-Bold', color: GREEN, marginTop: 4 }]}>
                GSTIN: {shopGstin}
              </Text>
            )}
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Customer Statement</Text>
            <Text style={styles.dateRange}>{dateRange}</Text>
          </View>
        </View>

        {/* Information Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Statement For</Text>
            <Text style={styles.infoValue}>{customerName.toUpperCase()}</Text>
            <Text style={styles.infoValueSub}>+91 {customerPhone.slice(-10)}</Text>
            {customerGstin && (
              <Text style={[styles.infoValueSub, { fontFamily: 'Helvetica-Bold', color: GREEN }]}>
                GSTIN: {customerGstin}
              </Text>
            )}
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Ledger Summary</Text>
            <Text style={styles.infoValue}>Outstanding: ₹{summary.outstanding_amount.toFixed(2)}</Text>
            <Text style={styles.infoValueSub}>Total Billed: ₹{summary.total_purchases.toFixed(2)}</Text>
            <Text style={styles.infoValueSub}>Invoices: {summary.invoice_count}</Text>
          </View>
        </View>

        {/* Ledger Entries Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderText, styles.colParticulars]}>Particulars</Text>
            <Text style={[styles.tableHeaderText, styles.colDebit]}>Debit (Sales)</Text>
            <Text style={[styles.tableHeaderText, styles.colCredit]}>Credit (Paid)</Text>
          </View>

          {entries.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: TEXT_MUTED, fontStyle: 'italic' }}>
                No ledger transactions recorded.
              </Text>
            </View>
          ) : (
            entries.map((entry, i) => (
              <View key={entry.id || i} style={styles.tableRow} wrap={false}>
                <Text style={styles.colDate}>
                  {new Date(entry.entry_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit',
                  })}
                </Text>
                <Text style={styles.colParticulars}>{entry.particulars}</Text>
                <Text style={styles.colDebit}>
                  {Number(entry.debit_amount) > 0 ? `₹${Number(entry.debit_amount).toFixed(2)}` : '—'}
                </Text>
                <Text style={styles.colCredit}>
                  {Number(entry.credit_amount) > 0 ? `₹${Number(entry.credit_amount).toFixed(2)}` : '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Ledger Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Sales (Debit)</Text>
              <Text style={styles.summaryValue}>₹{summary.total_purchases.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Received (Credit)</Text>
              <Text style={styles.summaryValue}>₹{summary.total_paid.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Outstanding Balance</Text>
              <Text style={styles.totalValue}>₹{summary.outstanding_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes & Statement Terms</Text>
          <Text style={styles.notesContent}>
            1. This is an official computerized customer ledger statement generated by TruBill Invoice.{"\n"}
            2. Please review all transactions. If there are any discrepancies in rates, quantities, or payments, report them within 7 business days.
          </Text>
        </View>

        <Text style={styles.footer}>
          Generated Statement • Powered by TruBill Invoice
        </Text>
      </Page>
    </Document>
  );
}

// ─── API route handler ─────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all';
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

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
      .select('*, shops(auth_user_id, name, gstin, phone, address, logo_url)')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const shopOwnerId = (customer.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const shop = customer.shops as any;

    // Calculate date ranges
    let startDate: string | null = null;
    let endDate: string | null = null;
    let dateRangeStr = 'All Transactions';

    const now = new Date();
    if (period === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      dateRangeStr = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } else if (period === 'last_month') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = d.toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
dateRangeStr = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } else if (period === 'custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam).toISOString();
      const d = new Date(endDateParam);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
      dateRangeStr = `${new Date(startDateParam).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(endDateParam).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    let entries: any[] = [];
    // 3. Fetch all invoices matching the date range directly
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

    const { data: dbInvoices, error: invError } = await invoiceQuery.order('created_at', { ascending: true });

    if (invError) {
      return new Response('Error loading invoices', { status: 500 });
    }

    const invoices = dbInvoices || [];
    const invoiceIds = invoices.map(i => i.id);

    // Fetch payments for these invoices
    let allPayments: any[] = [];
    if (invoiceIds.length > 0) {
      const { data: dbPayments } = await supabase
        .from('payments')
        .select('*')
    }

    // 4. Calculate stats
    const { data: customerInvoices } = await supabase
      .from('invoices')
      .select('id, total, amount_paid, created_at, uses_payments_table')
      .eq('shop_id', customer.shop_id)
      .eq('customer_phone', customer.phone)
      .in('status', ['sent', 'paid']);

    const invIds = customerInvoices?.map((inv) => inv.id) || [];
    let payments: any[] = [];
    if (invIds.length > 0) {
      const { data: pData } = await supabase
        .from('payments')
        .select('amount')
        .in('invoice_id', invIds);
      payments = pData || [];
    }

    let totalBilled = 0;
    let totalPaid = 0;
    customerInvoices?.forEach((inv) => {
      totalBilled += Number(inv.total);
      if (!inv.uses_payments_table) {
        totalPaid += Number(inv.amount_paid);
      }
    });
    payments.forEach((p) => {
      totalPaid += Number(p.amount);
    });

    const summary = {
      total_purchases: totalBilled,
      total_paid: totalPaid,
      outstanding_amount: Math.max(0, totalBilled - totalPaid),
      invoice_count: customerInvoices?.length || 0,
    };

    // 5. Fetch and convert logo
    let logoBase64 = null;
    if (shop.logo_url) {
      try {
        const logoRes = await fetch(shop.logo_url);
        if (logoRes.ok) {
          const arrayBuffer = await logoRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = shop.logo_url.split('.').pop()?.split('?')[0] || 'png';
          logoBase64 = `data:image/${ext};base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        console.error('Failed to convert logo:', e);
      }
    }

    // 6. Generate PDF Buffer
    const pdfBuffer = await renderToBuffer(
      <CustomerStatementPDF
        shopName={shop.name}
        shopAddress={shop.address}
        shopPhone={shop.phone}
        shopGstin={shop.gstin}
        customerName={customer.name}
        customerPhone={customer.phone}
        customerGstin={customer.gstin}
        dateRange={dateRangeStr}
        entries={entries}
        summary={summary}
        logoBase64={logoBase64}
      />
    );

    // Log the PDF export event in the background
    await supabase.from('customer_statement_exports').insert({
      shop_id: customer.shop_id,
      customer_id: customer.id,
      export_type: 'pdf',
      date_range_start: startDate,
      date_range_end: endDate,
      records_count: entries.length,
      outstanding_amount: summary.outstanding_amount,
    });

    const filename = `${customer.name.replace(/\s+/g, '_')}_Statement.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF Statement API error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF statement' }, { status: 500 });
  }
}
