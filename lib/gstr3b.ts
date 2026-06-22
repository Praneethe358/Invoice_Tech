import { SupabaseClient } from '@supabase/supabase-js';

export async function generateGSTR3B(
  supabase: SupabaseClient,
  shopId: string,
  month: number,
  year: number
): Promise<any> {
  // 1. Fetch shop details
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (!shop) throw new Error('Shop not found');
  if (!shop.gstin) throw new Error('Shop GSTIN not configured');

  const fp = `${String(month).padStart(2, '0')}${year}`;

  const pad = (num: number) => String(num).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;

  // 2. Fetch all sent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', shopId)
    .in('status', ['saved', 'sent'])
    .gte('created_at', `${startDate}T00:00:00+05:30`)
    .lte('created_at', `${endDate}T23:59:59+05:30`);

  let totalTaxableSales = 0;
  let totalZeroRatedSales = 0;
  let totalCgstCollected = 0;
  let totalSgstCollected = 0;

  const invoiceList = invoices || [];
  invoiceList.forEach((inv) => {
    const items = inv.invoice_items || [];
    items.forEach((item: any) => {
      const rate = item.gst_rate || 0;
      const taxable = item.line_total - (item.cgst + item.sgst);
      if (rate > 0) {
        totalTaxableSales += taxable;
        totalCgstCollected += item.cgst || 0;
        totalSgstCollected += item.sgst || 0;
      } else {
        totalZeroRatedSales += taxable;
      }
    });
  });

  // 3. Fetch purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('shop_id', shopId)
    .gte('purchase_date', startDate)
    .lte('purchase_date', endDate);

  let registeredPurchasesTotal = 0;
  let unregisteredPurchasesTotal = 0;
  let eligibleCgstItc = 0;
  let eligibleSgstItc = 0;

  const purchaseList = purchases || [];
  purchaseList.forEach((p) => {
    const isRegistered = !!p.supplier_gstin;
    if (isRegistered) {
      registeredPurchasesTotal += p.subtotal || 0;
      if (p.itc_eligible) {
        eligibleCgstItc += p.total_cgst || 0;
        eligibleSgstItc += p.total_sgst || 0;
      }
    } else {
      unregisteredPurchasesTotal += p.subtotal || 0;
    }
  });

  // Build the GSTR-3B JSON schema
  const gstr3bJson = {
    gstin: shop.gstin.trim().toUpperCase(),
    ret_period: fp,
    sup_details: {
      osup_det: {
        txval: parseFloat(totalTaxableSales.toFixed(2)),
        iamt: 0,
        camt: parseFloat(totalCgstCollected.toFixed(2)),
        samt: parseFloat(totalSgstCollected.toFixed(2)),
        csamt: 0,
      },
      osup_zero: {
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      },
      osup_nil_exmp: {
        txval: parseFloat(totalZeroRatedSales.toFixed(2)),
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      },
      isup_rev: {
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0,
      },
      osup_nongst: {
        txval: 0,
      },
    },
    inter_sup: {
      unreg_details: [],
      comp_details: [],
      uin_details: [],
    },
    itc_elg: {
      itc_avl: [
        { ty: 'IMPG', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'IMPS', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        {
          ty: 'ISRC',
          iamt: 0,
          camt: parseFloat(eligibleCgstItc.toFixed(2)),
          samt: parseFloat(eligibleSgstItc.toFixed(2)),
          csamt: 0,
        },
        { ty: 'ISD', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
      ],
      itc_rev: [
        { ty: 'RUL42', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'RUL43', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'TRAN1', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
      ],
      itc_net: {
        iamt: 0,
        camt: parseFloat(eligibleCgstItc.toFixed(2)),
        samt: parseFloat(eligibleSgstItc.toFixed(2)),
        csamt: 0,
      },
      itc_inelg: [
        { ty: 'RUL04', iamt: 0, camt: 0, samt: 0, csamt: 0 },
        { ty: 'OTH', iamt: 0, camt: 0, samt: 0, csamt: 0 },
      ],
    },
    inward_sup: {
      isup_details: [
        {
          ty: 'GST',
          inter: 0,
          intra: parseFloat(registeredPurchasesTotal.toFixed(2)),
        },
        {
          ty: 'NONGST',
          inter: 0,
          intra: parseFloat(unregisteredPurchasesTotal.toFixed(2)),
        },
      ],
    },
    intr_ltfee: {
      intr_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 },
      ltfee_details: { iamt: 0, camt: 0, samt: 0, csamt: 0 },
    },
  };

  return gstr3bJson;
}
