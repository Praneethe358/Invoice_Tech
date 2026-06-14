import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer';
import { InvoiceItem } from './types';

// ─── Register Inter font for PDF ──────────────────────────────
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2',
      fontWeight: 700,
    },
  ],
});

// ─── Styles ───────────────────────────────────────────────────
const GREEN = '#1a6b3c';
const LIGHT_BG = '#f3f4f6';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#111827',
  },
  header: {
    marginBottom: 20,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 700,
    color: GREEN,
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  taxInvoiceLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: GREEN,
    textAlign: 'right',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 9,
    color: '#6b7280',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    padding: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 2,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_BG,
  },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: GREEN,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: GREEN,
    marginRight: 16,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
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
}

function InvoicePDF({
  shopName,
  shopAddress,
  invoiceNumber,
  date,
  items,
  total,
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.metaRow}>
          <View style={styles.header}>
            <Text style={styles.shopName}>{shopName}</Text>
            {shopAddress && (
              <Text style={styles.shopAddress}>{shopAddress}</Text>
            )}
          </View>
          <View>
            <Text style={styles.taxInvoiceLabel}>TAX INVOICE</Text>
            <Text style={styles.metaText}>
              Invoice No: {invoiceNumber}
            </Text>
            <Text style={styles.metaText}>Date: {date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colItem]}>
            Item
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>
            Qty
          </Text>
          <Text style={[styles.tableHeaderText, styles.colRate]}>
            Rate
          </Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>
            Amount
          </Text>
        </View>

        {/* Table Rows */}
        {items.map((item, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              i % 2 === 1 ? styles.tableRowAlt : {},
            ]}
          >
            <Text style={styles.colItem}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>
              ₹{item.price.toFixed(2)}
            </Text>
            <Text style={styles.colAmount}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ₹{total.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by Vynkrova Invoice
        </Text>
      </Page>
    </Document>
  );
}

// ─── PDF Generation Function ──────────────────────────────────

export async function generateInvoicePDF(
  props: InvoicePDFProps
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <InvoicePDF {...props} />
  );
  return Buffer.from(buffer);
}

export { InvoicePDF };
