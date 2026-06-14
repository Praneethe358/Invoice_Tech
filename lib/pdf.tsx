import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  summaryCard: {
    width: '45%',
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
  paymentStatus,
}: InvoicePDFProps) {
  const formattedPhone = customerPhone
    ? customerPhone.startsWith('+')
      ? customerPhone
      : `+91 ${customerPhone.slice(-10)}`
    : 'Walk-in Customer';

  const clientName = customerName ? customerName.trim() : 'Walk-in Customer';
  const isPaid = paymentStatus !== 'unpaid';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative Top Accent Bar */}
        <View style={styles.topBar} />

        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <View style={styles.shopSection}>
            <Text style={styles.shopName}>{shopName}</Text>
            {shopAddress ? (
              <Text style={styles.shopAddress}>{shopAddress}</Text>
            ) : (
              <Text style={styles.shopAddress}>Tamil Nadu, India</Text>
            )}
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text
              style={[
                styles.badge,
                !isPaid ? {
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                } : {},
              ]}
            >
              {isPaid ? 'PAID' : 'UNPAID'}
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
            <Text style={[styles.tableHeaderText, styles.colItem]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>

          {/* Table Body */}
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colItem}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>₹{Number(item.price).toFixed(2)}</Text>
              <Text style={styles.colAmount}>₹{(Number(item.price) * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (Inclusive)</Text>
              <Text style={styles.summaryValue}>₹0.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
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
          Thank you for shopping! • Powered by Vynkrova Invoice
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
