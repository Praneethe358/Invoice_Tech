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
import { InvoiceItem } from './types';

// ─── Styles ───────────────────────────────────────────────────
const GREEN = '#1a6b3c';
const DARK_GREEN = '#0d3c20';
const LIGHT_GREEN = '#e6f4ea';
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
    maxHeight: 60,
    maxWidth: 120,
    marginBottom: 10,
    objectFit: 'contain',
  },
  invoiceTitleSection: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: LIGHT_GREEN,
    color: GREEN,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    textAlign: 'center',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    alignItems: 'center',
  },
  colItem: { flex: 3.5, paddingRight: 10 },
  colQty: { flex: 1, textAlign: 'center' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // GST Specific Columns
  colItemGst: { flex: 2.2, paddingRight: 5 },
  colHsnGst: { flex: 0.9, textAlign: 'center' },
  colQtyGst: { flex: 0.6, textAlign: 'center' },
  colRateGst: { flex: 1.0, textAlign: 'right' },
  colGstPctGst: { flex: 0.8, textAlign: 'center' },
  colCgstGst: { flex: 0.8, textAlign: 'right' },
  colSgstGst: { flex: 0.8, textAlign: 'right' },
  colAmountGst: { flex: 1.2, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

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
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK_GREEN,
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  notesSection: {
    marginTop: 40,
    paddingTop: 15,
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
    fontSize: 8,
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
  stampContainer: {
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'center',
    transform: 'rotate(-5deg)',
  },
  stampText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});

// ─── PDF Component ────────────────────────────────────────────

interface InvoicePDFProps {
  shopName: string;
  shopAddress: string;
  invoiceNumber: string;
  date: string;
  items: InvoiceItem[];
  total: number;
  customerPhone?: string;
  customerName?: string;
  paymentStatus?: string;
  amountPaid?: number;
  shopPhone?: string | null;
  logoBase64?: string | null;
  gstRegistered?: boolean;
  gstin?: string | null;
}

function InvoicePDF({
  shopName,
  shopAddress,
  invoiceNumber,
  date,
  items,
  total,
  customerPhone,
  customerName,
  paymentStatus = 'unpaid',
  amountPaid = 0,
  shopPhone,
  logoBase64,
  gstRegistered = false,
  gstin = null,
}: InvoicePDFProps) {
  const formattedPhone = customerPhone
    ? customerPhone.startsWith('+')
      ? customerPhone
      : `+91 ${customerPhone.slice(-10)}`
    : 'Walk-in Customer';

  const clientName = customerName ? customerName.trim().toUpperCase() : 'WALK-IN CUSTOMER';
  
  const amountPaidVal = Number(amountPaid || 0);
  const balanceVal = total - amountPaidVal;

  let badgeStyle = {};
  let statusText = 'UNPAID';
  if (paymentStatus === 'paid') {
    badgeStyle = { backgroundColor: '#e6f4ea', color: '#1a6b3c' };
    statusText = 'PAID';
  } else if (paymentStatus === 'partial') {
    badgeStyle = { backgroundColor: '#fef3c7', color: '#b45309' };
    statusText = 'PARTIAL';
  } else {
    badgeStyle = { backgroundColor: '#fee2e2', color: '#ef4444' };
    statusText = 'UNPAID';
  }

  // Pre-calculate sums for summary
  const subtotalVal = gstRegistered
    ? items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    : total;

  const totalGstVal = gstRegistered
    ? items.reduce((sum, item) => sum + (Number(item.price) * item.quantity) * ((item.gst_rate || 0) / 100), 0)
    : 0;

  const cgstVal = totalGstVal / 2;
  const sgstVal = totalGstVal / 2;

  // Group by HSN code (only if gstRegistered)
  const hsnGroups = (() => {
    if (!gstRegistered) return [];
    const groups: Record<string, { taxable: number; cgst: number; sgst: number; rate: number }> = {};
    items.forEach((item) => {
      const hsn = item.hsn_code || 'Other';
      const baseAmount = Number(item.price) * item.quantity;
      const rate = item.gst_rate || 0;
      const gstAmount = baseAmount * (rate / 100);
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      if (!groups[hsn]) {
        groups[hsn] = { taxable: 0, cgst: 0, sgst: 0, rate };
      }
      groups[hsn].taxable += baseAmount;
      groups[hsn].cgst += cgst;
      groups[hsn].sgst += sgst;
    });
    return Object.entries(groups).map(([hsn, data]) => ({
      hsn,
      rate: data.rate,
      taxable: data.taxable,
      cgst: data.cgst,
      sgst: data.sgst,
      totalGst: data.cgst + data.sgst,
    }));
  })();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative Top Accent Bar */}
        <View style={styles.topBar} />

        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.shopSection}>
            {logoBase64 && (
              <Image src={logoBase64} style={styles.logo} />
            )}
            <Text style={styles.shopName}>{shopName}</Text>
            {shopAddress ? (
              <Text style={styles.shopAddress}>{shopAddress}</Text>
            ) : (
              <Text style={styles.shopAddress}>Tamil Nadu, India</Text>
            )}
            {shopPhone && (
              <Text style={styles.shopAddress}>{shopPhone}</Text>
            )}
            {gstRegistered && gstin && (
              <Text style={[styles.shopAddress, { fontFamily: 'Helvetica-Bold', color: GREEN, marginTop: 4 }]}>
                GSTIN: {gstin}
              </Text>
            )}
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={[styles.badge, badgeStyle]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Invoice Metadata Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Billed To</Text>
            <Text style={styles.infoValue}>{clientName}</Text>
            <Text style={styles.infoValueSub}>{formattedPhone}</Text>
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <Text style={styles.infoValue}>No: {invoiceNumber}</Text>
            <Text style={styles.infoValueSub}>Date: {date}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {gstRegistered ? (
              <>
                <Text style={[styles.tableHeaderText, styles.colItemGst]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.colHsnGst]}>HSN</Text>
                <Text style={[styles.tableHeaderText, styles.colQtyGst]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.colRateGst]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.colGstPctGst]}>GST%</Text>
                <Text style={[styles.tableHeaderText, styles.colCgstGst]}>CGST</Text>
                <Text style={[styles.tableHeaderText, styles.colSgstGst]}>SGST</Text>
                <Text style={[styles.tableHeaderText, styles.colAmountGst]}>Amount</Text>
              </>
            ) : (
              <>
                <Text style={[styles.tableHeaderText, styles.colItem]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
              </>
            )}
          </View>

          {/* Table Body */}
          {items.map((item, i) => {
            const baseAmount = Number(item.price) * item.quantity;
            const gstRate = item.gst_rate || 0;
            const gstAmount = baseAmount * (gstRate / 100);
            const cgst = gstAmount / 2;
            const sgst = gstAmount / 2;
            const lineTotal = baseAmount + gstAmount;

            return (
              <View key={i} style={styles.tableRow}>
                {gstRegistered ? (
                  <>
                    <Text style={styles.colItemGst}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.colHsnGst}>{item.hsn_code || '—'}</Text>
                    <Text style={styles.colQtyGst}>{item.quantity}</Text>
                    <Text style={styles.colRateGst}>₹{Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.colGstPctGst}>{gstRate}%</Text>
                    <Text style={styles.colCgstGst}>₹{cgst.toFixed(2)}</Text>
                    <Text style={styles.colSgstGst}>₹{sgst.toFixed(2)}</Text>
                    <Text style={styles.colAmountGst}>₹{lineTotal.toFixed(2)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.colItem}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colRate}>₹{Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.colAmount}>₹{baseAmount.toFixed(2)}</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>

        {/* Totals Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            {gstRegistered ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{subtotalVal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CGST</Text>
                  <Text style={styles.summaryValue}>₹{cgstVal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>SGST</Text>
                  <Text style={styles.summaryValue}>₹{sgstVal.toFixed(2)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST (Inclusive)</Text>
                  <Text style={styles.summaryValue}>₹0.00</Text>
                </View>
              </>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
            {paymentStatus === 'paid' ? (
              <View style={styles.stampContainer}>
                <Text style={styles.stampText}>PAID ✓</Text>
              </View>
            ) : paymentStatus === 'partial' ? (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6 }}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={styles.summaryValue}>₹{amountPaidVal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>Balance Due</Text>
                  <Text style={[styles.summaryValue, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>₹{balanceVal.toFixed(2)}</Text>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6 }}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>Balance Due</Text>
                  <Text style={[styles.summaryValue, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>₹{total.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Professional Terms and Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Terms & Conditions</Text>
          <Text style={styles.notesContent}>
            1. This is a computer-generated digital receipt. No signature is required.{"\n"}
            2. Thank you for your business! For any returns or exchanges, please contact the shop directly with this receipt.
          </Text>
        </View>

        {/* Footer Accent */}
        <Text style={styles.footer}>
          Thank you for shopping! • Powered by Varavu Invoice
        </Text>
      </Page>
    </Document>
  );
}

// ─── PDF Generation Function ──────────────────────────────────

export async function generateInvoicePDF(
  props: InvoicePDFProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoicePDF {...props} />);
  return Buffer.from(buffer);
}

export { InvoicePDF };
