import { SupabaseClient } from '@supabase/supabase-js';

export function formatGstDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export interface Gstr1ValidationResult {
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

export async function validateGstr1Data(
  supabase: SupabaseClient,
  shopId: string,
  month: number,
  year: number
): Promise<Gstr1ValidationResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Fetch shop
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (!shop) {
    errors.push('Shop not found.');
    return { warnings, errors, isValid: false };
  }

  if (!shop.gst_registered) {
    errors.push('Shop is not registered for GST.');
  }

  if (!shop.gstin) {
    errors.push('Shop GSTIN is missing.');
  } else if (shop.gstin.length !== 15) {
    errors.push(`Shop GSTIN "${shop.gstin}" is invalid (must be 15 characters).`);
  }

  // Get date range
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', shopId)
    .in('status', ['saved', 'sent'])
    .gte('created_at', `${startDate}T00:00:00Z`)
    .lte('created_at', `${endDate}T23:59:59Z`);

  if (!invoices || invoices.length === 0) {
    warnings.push('No sent invoices found for this period.');
  } else {
    // Check missing items or HSN codes
    let missingHsnCount = 0;
    let legacyInvoiceCount = 0;

    invoices.forEach((inv: any) => {
      if (!inv.uses_items_table) {
        legacyInvoiceCount++;
      }
      
      const items = inv.invoice_items || [];
      items.forEach((item: any) => {
        if (!item.hsn_code) {
          missingHsnCount++;
        } else if (item.hsn_code.replace(/\D/g, '').length < 4) {
          warnings.push(`Invoice ${inv.invoice_number} has HSN code "${item.hsn_code}" which is shorter than 4 digits.`);
        }
      });

      // Check large B2CS invoices
      if (!inv.customer_gstin && inv.total > 250000) {
        warnings.push(`Invoice ${inv.invoice_number} is a B2C transaction exceeding ₹2.5 Lakhs. Ensure this is correct.`);
      }

      // Check B2B customer gstin length
      if (inv.customer_gstin && inv.customer_gstin.length !== 15) {
        errors.push(`Invoice ${inv.invoice_number} has an invalid customer GSTIN "${inv.customer_gstin}" (must be 15 characters).`);
      }
    });

    if (legacyInvoiceCount > 0) {
      warnings.push(`${legacyInvoiceCount} invoices were created using the old system and will not include separate item/HSN breakdowns.`);
    }

    if (missingHsnCount > 0) {
      warnings.push(`${missingHsnCount} items in invoices are missing HSN codes.`);
    }
  }

  return {
    warnings,
    errors,
    isValid: errors.length === 0,
  };
}

export async function generateGSTR1(
  supabase: SupabaseClient,
  shopId: string,
  month: number,
  year: number
): Promise<any> {
  // 1. Fetch shop data
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (!shop) throw new Error('Shop not found');
  if (!shop.gstin) throw new Error('Shop GSTIN not configured');

  // Format filing period MMYYYY
  const fp = `${String(month).padStart(2, '0')}${year}`;

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  // 2. Fetch all sent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', shopId)
    .in('status', ['saved', 'sent'])
    .gte('created_at', `${startDate}T00:00:00Z`)
    .lte('created_at', `${endDate}T23:59:59Z`)
    .order('created_at', { ascending: true });

  const b2bMap: { [gstin: string]: any[] } = {};
  const b2csMap: { [rate: number]: { txval: number; camt: number; samt: number } } = {};
  const hsnMap: { [key: string]: { hsn: string; desc: string; qty: number; uqc: string; txval: number; camt: number; samt: number; rt: number; ty: 'B2B' | 'B2CS' } } = {};

  const invoiceList = invoices || [];

  invoiceList.forEach((inv) => {
    const isB2B = !!inv.customer_gstin;
    const items = inv.invoice_items || [];

    // Group items by rate for invoice summaries
    const itemsByRate: { [rate: number]: { txval: number; camt: number; samt: number } } = {};
    
    items.forEach((item: any) => {
      const rate = item.gst_rate || 0;
      if (!itemsByRate[rate]) {
        itemsByRate[rate] = { txval: 0, camt: 0, samt: 0 };
      }
      
      const itemTxVal = item.line_total - (item.cgst + item.sgst);
      itemsByRate[rate].txval += itemTxVal;
      itemsByRate[rate].camt += item.cgst;
      itemsByRate[rate].samt += item.sgst;

      // Group into HSN summary
      const hsnRaw = (item.hsn_code || 'OTH').trim();
      const hsnCode = hsnRaw.length >= 4 ? hsnRaw : hsnRaw.padStart(4, '0');
      const supplyType: 'B2B' | 'B2CS' = isB2B ? 'B2B' : 'B2CS';
      const hsnKey = `${hsnCode}_${rate}_${supplyType}`;

      if (!hsnMap[hsnKey]) {
        hsnMap[hsnKey] = {
          hsn: hsnCode,
          desc: item.name.substring(0, 30),
          qty: 0,
          uqc: 'OTH', // Default
          txval: 0,
          camt: 0,
          samt: 0,
          rt: rate,
          ty: supplyType,
        };
      }
      
      hsnMap[hsnKey].qty += parseFloat(item.qty) || 0;
      hsnMap[hsnKey].txval += itemTxVal;
      hsnMap[hsnKey].camt += item.cgst;
      hsnMap[hsnKey].samt += item.sgst;
    });

    if (isB2B) {
      const ctin = inv.customer_gstin!.trim().toUpperCase();
      if (!b2bMap[ctin]) {
        b2bMap[ctin] = [];
      }

      // Construct invoice items breakdown by rate
      const itmsArray = Object.keys(itemsByRate).map((rateStr, idx) => {
        const rate = parseFloat(rateStr);
        const totals = itemsByRate[rate];
        return {
          num: idx + 1,
          itm_det: {
            rt: rate,
            txval: parseFloat(totals.txval.toFixed(2)),
            csamt: 0,
            camt: parseFloat(totals.camt.toFixed(2)),
            samt: parseFloat(totals.samt.toFixed(2)),
          },
        };
      });

      b2bMap[ctin].push({
        inum: inv.invoice_number,
        idt: formatGstDate(inv.created_at),
        val: parseFloat(inv.total.toFixed(2)),
        pos: '33', // Tamil Nadu
        rchrg: 'N',
        inv_typ: 'R',
        itms: itmsArray,
      });
    } else {
      // Unregistered B2CS
      Object.keys(itemsByRate).forEach((rateStr) => {
        const rate = parseFloat(rateStr);
        const totals = itemsByRate[rate];
        if (!b2csMap[rate]) {
          b2csMap[rate] = { txval: 0, camt: 0, samt: 0 };
        }
        b2csMap[rate].txval += totals.txval;
        b2csMap[rate].camt += totals.camt;
        b2csMap[rate].samt += totals.samt;
      });
    }
  });

  // Convert B2B map to array
  const b2bArray = Object.keys(b2bMap).map((ctin) => ({
    ctin,
    inv: b2bMap[ctin],
  }));

  // Convert B2CS map to array
  const b2csArray = Object.keys(b2csMap).map((rateStr) => {
    const rate = parseFloat(rateStr);
    const totals = b2csMap[rate];
    return {
      sply_tp: 'INTRA',
      pos: '33',
      typ: 'OE',
      rt: rate,
      txval: parseFloat(totals.txval.toFixed(2)),
      csamt: 0,
      camt: parseFloat(totals.camt.toFixed(2)),
      samt: parseFloat(totals.samt.toFixed(2)),
    };
  });

  // 3. Fetch credit & debit notes
  const { data: cdns } = await supabase
    .from('credit_debit_notes')
    .select('*, cdn_items(*)')
    .eq('shop_id', shopId)
    .gte('note_date', startDate)
    .lte('note_date', endDate);

  const cdnrMap: { [gstin: string]: any[] } = {};
  const cdnList = cdns || [];

  cdnList.forEach((note) => {
    // Only B2B credit/debit notes go into CDNR (registered)
    if (!note.customer_gstin) return;

    const ctin = note.customer_gstin.trim().toUpperCase();
    if (!cdnrMap[ctin]) {
      cdnrMap[ctin] = [];
    }

    const items = note.cdn_items || [];
    const itemsByRate: { [rate: number]: { txval: number; camt: number; samt: number } } = {};
    
    items.forEach((item: any) => {
      const rate = item.gst_rate || 0;
      if (!itemsByRate[rate]) {
        itemsByRate[rate] = {
          txval: 0,
          camt: 0,
          samt: 0,
        };
      }
      const itemTxVal = item.line_total - (item.cgst + item.sgst);
      itemsByRate[rate].txval += itemTxVal;
      itemsByRate[rate].camt += item.cgst;
      itemsByRate[rate].samt += item.sgst;
    });

    const itmsArray = Object.keys(itemsByRate).map((rateStr, idx) => {
      const rate = parseFloat(rateStr);
      const totals = itemsByRate[rate];
      return {
        num: idx + 1,
        itm_det: {
          rt: rate,
          txval: parseFloat(totals.txval.toFixed(2)),
          csamt: 0,
          camt: parseFloat(totals.camt.toFixed(2)),
          samt: parseFloat(totals.samt.toFixed(2)),
        },
      };
    });

    cdnrMap[ctin].push({
      ntty: note.note_type === 'credit' ? 'C' : 'D',
      nt_num: note.note_number,
      nt_dt: formatGstDate(note.note_date),
      val: parseFloat(note.total.toFixed(2)),
      pos: '33',
      rchrg: 'N',
      inv_typ: 'R',
      itms: itmsArray,
    });
  });

  const cdnrArray = Object.keys(cdnrMap).map((ctin) => ({
    ctin,
    nt: cdnrMap[ctin],
  }));

  // Convert HSN map to data array
  const hsnData = Object.keys(hsnMap).map((key, idx) => {
    const item = hsnMap[key];
    return {
      num: idx + 1,
      hsn_sc: item.hsn,
      desc: item.desc,
      uqc: item.uqc,
      qty: parseFloat(item.qty.toFixed(3)),
      ty: item.ty,
      rt: item.rt,
      txval: parseFloat(item.txval.toFixed(2)),
      csamt: 0,
      camt: parseFloat(item.camt.toFixed(2)),
      samt: parseFloat(item.samt.toFixed(2)),
    };
  });

  // Document Issue Summary
  const firstInv = invoiceList[0]?.invoice_number || '—';
  const lastInv = invoiceList[invoiceList.length - 1]?.invoice_number || '—';
  const totalInvoices = invoiceList.length;

  const docIssue = {
    doc_det: [
      {
        doc_num: 1, // Invoices
        docs: [
          {
            num: 1,
            from: firstInv,
            to: lastInv,
            totnum: totalInvoices,
            cancel: 0,
            net_issue: totalInvoices,
          },
        ],
      },
    ],
  };

  // Build the final JSON structure
  const gstr1Json = {
    version: 'GST3.1.2',
    hash: 'hash',
    gstin: shop.gstin.trim().toUpperCase(),
    fp,
    b2b: b2bArray,
    b2cs: b2csArray,
    cdnr: cdnrArray,
    hsn: {
      data: hsnData,
    },
    doc_issue: docIssue,
  };

  return gstr1Json;
}
