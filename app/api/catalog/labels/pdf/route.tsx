import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { getCurrentUserContext } from '@/lib/current-user';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  labelCard: {
    width: '31%', // Fits 3 columns nicely with gaps
    height: 110,  // Approx 38mm
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 6,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  shopName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0050e8',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  barcode: {
    width: 145,
    height: 38,
  },
  qrCode: {
    width: 42,
    height: 42,
  },
  skuText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: '#4b5563',
  },
});

interface LabelPDFProps {
  shopName: string;
  labels: Array<{
    productName: string;
    size: string;
    color: string;
    sku: string;
    price: number;
  }>;
}

const LabelsPDFDocument = ({ shopName, labels }: LabelPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.grid}>
          {labels.map((item, idx) => {
            const isLongSku = item.sku.length > 12;
            const barcodeUrl = isLongSku
              ? `https://quickchart.io/qr?text=${encodeURIComponent(item.sku)}&size=60`
              : `https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(item.sku)}&height=35`;

            return (
              <View key={idx} style={styles.labelCard}>
                <Text style={styles.shopName}>{shopName.slice(0, 20)}</Text>
                <Image src={barcodeUrl} style={isLongSku ? styles.qrCode : styles.barcode} />
                <Text style={styles.skuText}>{item.sku}</Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const variantIdsParam = searchParams.get('variant_ids') || '';
  const copiesParam = searchParams.get('copies') || '';

  try {
    const context = await getCurrentUserContext(supabase);
    if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: shop } = await supabase.from('shops').select('*').eq('id', context.shopId).single();
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const variantIds = variantIdsParam.split(',').filter(Boolean);
    const copiesList = copiesParam.split(',').map(Number);

    if (variantIds.length === 0) {
      return NextResponse.json({ error: 'No variants selected' }, { status: 400 });
    }

    // Fetch the selected product variants and their products
    const { data: variants, error: varError } = await supabase
      .from('product_variants')
      .select('*, products(*)')
      .in('id', variantIds);

    if (varError || !variants) {
      throw new Error(varError?.message || 'Failed to fetch variants');
    }

    // Build the list of labels based on requested copies
    const labels: Array<{
      productName: string;
      size: string;
      color: string;
      sku: string;
      price: number;
    }> = [];

    variants.forEach((v: any, idx: number) => {
      const parentProduct = v.products;
      const copyCount = copiesList[idx] || 1;
      const skuVal = v.barcode || v.sku; // Prefer barcode column, fallback to sku
      for (let i = 0; i < copyCount; i++) {
        labels.push({
          productName: parentProduct.name,
          size: v.size,
          color: v.color,
          sku: skuVal,
          price: Number(parentProduct.price),
        });
      }
    });

    const buffer = await renderToBuffer(
      <LabelsPDFDocument shopName={shop.name} labels={labels} />
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="barcode_labels.pdf"',
      },
    });
  } catch (err: any) {
    console.error('Label PDF generation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
