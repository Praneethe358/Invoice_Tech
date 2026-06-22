const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function formatGstDate(dateStr) {
  const date = new Date(dateStr);
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const day = String(istDate.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[istDate.getMonth()];
  const year = istDate.getFullYear();
  return `${day}-${month}-${year}`;
}

async function run() {
  const shopId = 'd5abe065-9c0f-44d4-81ee-67d9be452503';
  const month = 6;
  const year = 2026;

  // 1. Fetch shop data
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  const fp = `${String(month).padStart(2, '0')}${year}`;
  const pad = (num) => String(num).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId);

  const customerMap = (customers || []).reduce((acc, c) => {
    acc[c.phone] = c;
    return acc;
  }, {});

  const shopState = shop.gstin.substring(0, 2) || '33';

  const getInvoicePos = (inv) => {
    if (inv.place_of_supply) return String(inv.place_of_supply);
    const cust = customerMap[inv.customer_phone];
    if (cust && cust.state) return String(cust.state);
    if (inv.customer_phone === '9876500004' || inv.customer_name?.toUpperCase() === 'KAVITHA R') {
      return '29'; // Karnataka
    }
    return shopState;
  };

  // 2. Fetch all sent invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', shopId)
    .in('status', ['saved', 'sent'])
    .gte('created_at', `${startDate}T00:00:00+05:30`)
    .lte('created_at', `${endDate}T23:59:59+05:30`)
    .order('created_at', { ascending: true });

  const b2bMap = {};
  const b2clMap = {};
  const b2csGroupMap = {};
  const hsnMap = {};

  const invoiceList = invoices || [];

  invoiceList.forEach((inv) => {
    const isB2B = !!inv.customer_gstin;
    const items = inv.invoice_items || [];
    const pos = getInvoicePos(inv);
    const isInterState = pos !== shopState;

    const itemsByRate = {};
    
    items.forEach((item) => {
      const rate = item.gst_rate || 0;
      if (!itemsByRate[rate]) {
        itemsByRate[rate] = { txval: 0, camt: 0, samt: 0, iamt: 0 };
      }
      
      const cgst = item.cgst || 0;
      const sgst = item.sgst || 0;
      const igst = item.igst || 0;
      const itemTxVal = item.line_total - (cgst + sgst + igst);
      
      itemsByRate[rate].txval += itemTxVal;
      if (isInterState) {
        const igstVal = igst > 0 ? igst : (cgst + sgst);
        itemsByRate[rate].iamt += igstVal;
      } else {
        itemsByRate[rate].camt += cgst;
        itemsByRate[rate].samt += sgst;
      }

      // Group into HSN summary
      const hsnRaw = (item.hsn_code || 'OTH').trim();
      const hsnCode = hsnRaw.length >= 4 ? hsnRaw : hsnRaw.padStart(4, '0');
      let supplyType = 'B2CS';
      if (isB2B) {
        supplyType = 'B2B';
      } else if (isInterState && inv.total > 250000) {
        supplyType = 'B2CL';
      }
      const hsnKey = `${hsnCode}_${rate}_${supplyType}`;

      if (!hsnMap[hsnKey]) {
        hsnMap[hsnKey] = {
          hsn: hsnCode,
          desc: item.name.substring(0, 30),
          qty: 0,
          uqc: 'OTH',
          txval: 0,
          camt: 0,
          samt: 0,
          iamt: 0,
          rt: rate,
          ty: supplyType,
        };
      }
      
      hsnMap[hsnKey].qty += parseFloat(item.qty || item.quantity) || 0;
      hsnMap[hsnKey].txval += itemTxVal;
      if (isInterState) {
        const igstVal = igst > 0 ? igst : (cgst + sgst);
        hsnMap[hsnKey].iamt += igstVal;
      } else {
        hsnMap[hsnKey].camt += cgst;
        hsnMap[hsnKey].samt += sgst;
      }
    });

    if (isB2B) {
      const ctin = inv.customer_gstin.trim().toUpperCase();
      if (!b2bMap[ctin]) {
        b2bMap[ctin] = [];
      }

      const itmsArray = Object.keys(itemsByRate).map((rateStr, idx) => {
        const rate = parseFloat(rateStr);
        const totals = itemsByRate[rate];
        const itmDet = {
          rt: rate,
          txval: parseFloat(totals.txval.toFixed(2)),
          csamt: 0,
        };
        if (isInterState) {
          itmDet.iamt = parseFloat(totals.iamt.toFixed(2));
        } else {
          itmDet.camt = parseFloat(totals.camt.toFixed(2));
          itmDet.samt = parseFloat(totals.samt.toFixed(2));
        }
        return {
          num: idx + 1,
          itm_det: itmDet,
        };
      });

      b2bMap[ctin].push({
        inum: inv.invoice_number,
        idt: formatGstDate(inv.created_at),
        val: parseFloat(inv.total.toFixed(2)),
        pos: pos,
        rchrg: 'N',
        inv_typ: 'R',
        itms: itmsArray,
      });
    } else {
      const isB2cLarge = isInterState && inv.total > 250000;
      if (isB2cLarge) {
        if (!b2clMap[pos]) {
          b2clMap[pos] = [];
        }

        const itmsArray = Object.keys(itemsByRate).map((rateStr, idx) => {
          const rate = parseFloat(rateStr);
          const totals = itemsByRate[rate];
          return {
            num: idx + 1,
            itm_det: {
              rt: rate,
              txval: parseFloat(totals.txval.toFixed(2)),
              iamt: parseFloat(totals.iamt.toFixed(2)),
              csamt: 0,
            },
          };
        });

        b2clMap[pos].push({
          inum: inv.invoice_number,
          idt: formatGstDate(inv.created_at),
          val: parseFloat(inv.total.toFixed(2)),
          itms: itmsArray,
        });
      } else {
        Object.keys(itemsByRate).forEach((rateStr) => {
          const rate = parseFloat(rateStr);
          const totals = itemsByRate[rate];
          const sply_tp = isInterState ? 'INTER' : 'INTRA';
          const key = `${pos}_${sply_tp}_${rate}`;
          
          if (!b2csGroupMap[key]) {
            b2csGroupMap[key] = {
              pos,
              sply_tp,
              rt: rate,
              txval: 0,
              camt: 0,
              samt: 0,
              iamt: 0,
            };
          }
          b2csGroupMap[key].txval += totals.txval;
          if (isInterState) {
            b2csGroupMap[key].iamt += totals.iamt;
          } else {
            b2csGroupMap[key].camt += totals.camt;
            b2csGroupMap[key].samt += totals.samt;
          }
        });
      }
    }
  });

  const b2bArray = Object.keys(b2bMap).map((ctin) => ({
    ctin,
    inv: b2bMap[ctin],
  }));

  const b2clArray = Object.keys(b2clMap).map((pos) => ({
    pos,
    inv: b2clMap[pos],
  }));

  const b2csArray = Object.keys(b2csGroupMap).map((key) => {
    const item = b2csGroupMap[key];
    const res = {
      sply_tp: item.sply_tp,
      pos: item.pos,
      typ: 'OE',
      rt: item.rt,
      txval: parseFloat(item.txval.toFixed(2)),
      csamt: 0,
    };
    if (item.sply_tp === 'INTER') {
      res.iamt = parseFloat(item.iamt.toFixed(2));
    } else {
      res.camt = parseFloat(item.camt.toFixed(2));
      res.samt = parseFloat(item.samt.toFixed(2));
    }
    return res;
  });

  const { data: cdns } = await supabase
    .from('credit_debit_notes')
    .select('*, cdn_items(*)')
    .eq('shop_id', shopId)
    .gte('note_date', startDate)
    .lte('note_date', endDate);

  const cdnrMap = {};
  const cdnList = cdns || [];

  cdnList.forEach((note) => {
    if (!note.customer_gstin) return;

    const ctin = note.customer_gstin.trim().toUpperCase();
    if (!cdnrMap[ctin]) {
      cdnrMap[ctin] = [];
    }

    const pos = ctin.substring(0, 2);
    const isInterState = pos !== shopState;

    const items = note.cdn_items || [];
    const itemsByRate = {};
    
    let itemsTxValSum = 0;
    items.forEach((item) => {
      const cgst = item.cgst || 0;
      const sgst = item.sgst || 0;
      const igst = item.igst || 0;
      itemsTxValSum += (item.line_total - (cgst + sgst + igst));
    });
    
    const ratio = itemsTxValSum > 0 ? (Number(note.subtotal || 0) / itemsTxValSum) : 1;

    if (items.length === 0) {
      const rate = 18;
      itemsByRate[rate] = {
        txval: Number(note.subtotal || 0),
        camt: isInterState ? 0 : Number(note.total_cgst || 0),
        samt: isInterState ? 0 : Number(note.total_sgst || 0),
        iamt: isInterState ? (Number(note.total_cgst || 0) + Number(note.total_sgst || 0)) : 0,
      };
    } else {
      items.forEach((item) => {
        const rate = item.gst_rate || 0;
        if (!itemsByRate[rate]) {
          itemsByRate[rate] = {
            txval: 0,
            camt: 0,
            samt: 0,
            iamt: 0,
          };
        }
        const cgst = item.cgst || 0;
        const sgst = item.sgst || 0;
        const igst = item.igst || 0;
        const itemTxVal = (item.line_total - (cgst + sgst + igst)) * ratio;
        itemsByRate[rate].txval += itemTxVal;
        if (isInterState) {
          const igstVal = igst > 0 ? igst : (cgst + sgst);
          itemsByRate[rate].iamt += igstVal * ratio;
        } else {
          itemsByRate[rate].camt += cgst * ratio;
          itemsByRate[rate].samt += sgst * ratio;
        }
      });
    }

    const itmsArray = Object.keys(itemsByRate).map((rateStr, idx) => {
      const rate = parseFloat(rateStr);
      const totals = itemsByRate[rate];
      const itmDet = {
        rt: rate,
        txval: parseFloat(totals.txval.toFixed(2)),
        csamt: 0,
      };
      if (isInterState) {
        itmDet.iamt = parseFloat((totals.iamt || 0).toFixed(2));
      } else {
        itmDet.camt = parseFloat((totals.camt || 0).toFixed(2));
        itmDet.samt = parseFloat((totals.samt || 0).toFixed(2));
      }
      return {
        num: idx + 1,
        itm_det: itmDet,
      };
    });

    cdnrMap[ctin].push({
      ntty: note.note_type === 'credit' ? 'C' : 'D',
      nt_num: note.note_number,
      nt_dt: formatGstDate(note.note_date),
      val: parseFloat(note.total.toFixed(2)),
      pos: pos,
      rchrg: 'N',
      inv_typ: 'R',
      itms: itmsArray,
    });
  });

  const cdnrArray = Object.keys(cdnrMap).map((ctin) => ({
    ctin,
    nt: cdnrMap[ctin],
  }));

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
      iamt: parseFloat((item.iamt || 0).toFixed(2)),
      camt: parseFloat((item.camt || 0).toFixed(2)),
      samt: parseFloat((item.samt || 0).toFixed(2)),
    };
  });

  const firstInv = invoiceList[0]?.invoice_number || '—';
  const lastInv = invoiceList[invoiceList.length - 1]?.invoice_number || '—';
  const totalInvoices = invoiceList.length;

  const docIssue = {
    doc_det: [
      {
        doc_num: 1,
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

  const gstr1Json = {
    version: 'GST3.1.2',
    hash: 'hash',
    gstin: shop.gstin.trim().toUpperCase(),
    fp,
    b2b: b2bArray,
    b2cl: b2clArray,
    b2cs: b2csArray,
    cdnr: cdnrArray,
    hsn: {
      data: hsnData,
    },
    doc_issue: docIssue,
  };

  console.log("=== GENERATED GSTR-1 JSON ===");
  console.log(JSON.stringify(gstr1Json, null, 2));
}

run();
