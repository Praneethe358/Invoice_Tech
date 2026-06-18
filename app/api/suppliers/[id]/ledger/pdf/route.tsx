import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const GREEN = '#1a6b3c';
const LIGHT_GREEN = '#e6f4ea';
const TEXT_DARK = '#1f2937';
const TEXT_MUTED = '#4b5563';
const BORDER = '#e5e7eb';
const LIGHT_BG = '#f9fafb';

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: TEXT_DARK, lineHeight: 1.5 },
  topBar: { height: 6, backgroundColor: GREEN, position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 20 },
  shopName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 4 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN, textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 8, color: TEXT_MUTED, marginBottom: 2 },
  value: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT_DARK },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryBox: { flex: 1, backgroundColor: LIGHT_GREEN, padding: 10, borderRadius: 4 },
  summaryLabel: { fontSize: 7, color: GREEN, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 3 },
  summaryValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEXT_DARK },
  tableHeader: { flexDirection: 'row', backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 2 },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: 'white', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { backgroundColor: LIGHT_BG },
  td: { fontSize: 8, color: TEXT_DARK },
  tdBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_DARK },
  totalRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, backgroundColor: LIGHT_GREEN, borderRadius: 2, marginTop: 2 },
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 7, color: TEXT_MUTED },
});

const W = { sr: '6%', date: '12%', inv: '16%', taxable: '14%', cgst: '11%', sgst: '11%', total: '14%', itc: '16%' };

interface LedgerPDFProps { shop: any; supplier: any; purchases: any[]; startDate: string | null; endDate: string | null; totals: any; }

const LedgerPDF = ({ shop, supplier, purchases, startDate, endDate, totals }: LedgerPDFProps) => {
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const period = startDate && endDate
    ? `${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'All Time';
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topBar} fixed />
        <View style={s.headerRow}>
          <View style={{ maxWidth: '55%' }}>
            <Text style={s.shopName}>{shop.name}</Text>
            {shop.address && <Text style={s.label}>{shop.address}</Text>}
            {shop.gstin && <Text style={{ ...s.label, fontFamily: 'Helvetica-Bold', color: GREEN }}>GSTIN: {shop.gstin}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN }}>SUPPLIER LEDGER</Text>
            <Text style={{ ...s.label, marginTop: 4 }}>Generated: {dateStr}</Text>
            <Text style={s.label}>Period: {period}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: LIGHT_BG, padding: 10, borderRadius: 4, marginBottom: 14, borderWidth: 0.5, borderColor: BORDER }}>
          <Text style={{ fontSize: 7, color: TEXT_MUTED, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4 }}>Supplier Details</Text>
          <Text style={s.value}>{supplier.name}</Text>
          {supplier.gstin && <Text style={{ ...s.label, marginTop: 2 }}>GSTIN: {supplier.gstin}</Text>}
          {supplier.phone && <Text style={s.label}>Phone: +91 {supplier.phone}</Text>}
          {supplier.address && <Text style={s.label}>Address: {supplier.address}</Text>}
        </View>

        <View style={s.summaryRow}>
          <View style={s.summaryBox}><Text style={s.summaryLabel}>Total Purchases</Text><Text style={s.summaryValue}>₹{totals.totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
          <View style={s.summaryBox}><Text style={s.summaryLabel}>Total ITC Earned</Text><Text style={s.summaryValue}>₹{totals.totalItc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
          <View style={s.summaryBox}><Text style={s.summaryLabel}>Total Transactions</Text><Text style={s.summaryValue}>{purchases.length}</Text></View>
        </View>

        <View style={s.tableHeader}>
          <Text style={{ ...s.th, width: W.sr }}>Sr</Text>
          <Text style={{ ...s.th, width: W.date }}>Date</Text>
          <Text style={{ ...s.th, width: W.inv }}>Invoice No.</Text>
          <Text style={{ ...s.th, width: W.taxable, textAlign: 'right' }}>Taxable (₹)</Text>
          <Text style={{ ...s.th, width: W.cgst, textAlign: 'right' }}>CGST (₹)</Text>
          <Text style={{ ...s.th, width: W.sgst, textAlign: 'right' }}>SGST (₹)</Text>
          <Text style={{ ...s.th, width: W.total, textAlign: 'right' }}>Total (₹)</Text>
          <Text style={{ ...s.th, width: W.itc, textAlign: 'center' }}>ITC</Text>
        </View>
        {purchases.map((p, i) => (
          <View key={p.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={{ ...s.td, width: W.sr }}>{i + 1}</Text>
            <Text style={{ ...s.td, width: W.date }}>{new Date(p.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            <Text style={{ ...s.tdBold, width: W.inv }}>{p.purchase_invoice_number}</Text>
            <Text style={{ ...s.td, width: W.taxable, textAlign: 'right' }}>{Number(p.subtotal).toFixed(2)}</Text>
            <Text style={{ ...s.td, width: W.cgst, textAlign: 'right' }}>{Number(p.total_cgst).toFixed(2)}</Text>
            <Text style={{ ...s.td, width: W.sgst, textAlign: 'right' }}>{Number(p.total_sgst).toFixed(2)}</Text>
            <Text style={{ ...s.tdBold, width: W.total, textAlign: 'right' }}>{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <Text style={{ ...s.td, width: W.itc, textAlign: 'center' }}>{p.itc_eligible ? 'Yes' : 'No'}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={{ ...s.tdBold, width: W.sr }}></Text>
          <Text style={{ ...s.tdBold, width: W.date }}></Text>
          <Text style={{ ...s.tdBold, width: W.inv }}>TOTAL</Text>
          <Text style={{ ...s.tdBold, width: W.taxable, textAlign: 'right' }}>{totals.subtotal.toFixed(2)}</Text>
          <Text style={{ ...s.tdBold, width: W.cgst, textAlign: 'right' }}>{totals.cgst.toFixed(2)}</Text>
          <Text style={{ ...s.tdBold, width: W.sgst, textAlign: 'right' }}>{totals.sgst.toFixed(2)}</Text>
          <Text style={{ ...s.tdBold, width: W.total, textAlign: 'right' }}>{totals.totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          <Text style={{ ...s.tdBold, width: W.itc, textAlign: 'center' }}>{totals.totalItc.toFixed(2)}</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{shop.name}</Text>
          <Text style={s.footerText}>Generated by TruBill Invoice</Text>
          <Text style={s.footerText}>This is a system-generated ledger statement</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: shop } = await supabase.from('shops').select('*').eq('auth_user_id', user.id).single();
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

    const buffer = await renderToBuffer(
      <LedgerPDF shop={shop} supplier={supplier} purchases={rows} startDate={startDate} endDate={endDate}
        totals={{ subtotal, cgst, sgst, totalPurchased, totalItc }} />
    );

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Supplier_Ledger_${supplier.name.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Supplier ledger PDF error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
