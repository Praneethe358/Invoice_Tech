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

async function run() {
  const shopId = 'd5abe065-9c0f-44d4-81ee-67d9be452503';
  
  console.log('1. Fetching CN-002...');
  const { data: note, error: noteErr } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .eq('shop_id', shopId)
    .eq('note_number', 'CN-002')
    .single();

  if (noteErr || !note) {
    console.error('CN-002 not found:', noteErr);
    return;
  }
  console.log('Found CN-002 ID:', note.id);

  console.log('2. Deleting current cdn_items for CN-002...');
  const { error: delErr } = await supabase
    .from('cdn_items')
    .delete()
    .eq('cdn_id', note.id);
  if (delErr) console.error('Error deleting items:', delErr);

  console.log('3. Inserting full reversal items...');
  const newItems = [
    {
      cdn_id: note.id,
      name: 'DENIM JEANS (Free Size / Assorted)',
      hsn_code: '6203',
      qty: 20,
      price: 1500,
      gst_rate: 5,
      cgst: 750,
      sgst: 750,
      line_total: 31500
    },
    {
      cdn_id: note.id,
      name: 'KIDS FROCK (Free Size / Assorted)',
      hsn_code: '6209',
      qty: 15,
      price: 400,
      gst_rate: 5,
      cgst: 150,
      sgst: 150,
      line_total: 6300
    }
  ];

  const { error: insErr } = await supabase
    .from('cdn_items')
    .insert(newItems);
  if (insErr) {
    console.error('Error inserting items:', insErr);
  } else {
    console.log('Successfully inserted items.');
  }

  console.log('4. Updating CN-002 totals...');
  const { error: updErr } = await supabase
    .from('credit_debit_notes')
    .update({
      subtotal: 36000,
      total_cgst: 900,
      total_sgst: 900,
      total_gst: 1800,
      total: 37800,
      reason: 'sales_return',
      reason_note: 'Full reversal of invoice INV-0003'
    })
    .eq('id', note.id);
  if (updErr) {
    console.error('Error updating note header:', updErr);
  } else {
    console.log('Successfully updated note header.');
  }

  console.log('5. Adjusting stock back to inventory...');
  // Senthil bought 20 Jeans and 15 Frocks. In our previous seed, 10 Jeans were returned.
  // We need to restore stock levels:
  // Denim Jeans: was reduced by 20 (invoice) and added by 10 (old credit note return).
  // Net invoice impact was -10.
  // For a full reversal, we want the net invoice impact to be 0. So we need to add another 10 Jeans.
  // Kids Frock: was reduced by 15 (invoice) and added by 0 (old credit note).
  // Net invoice impact was -15.
  // For a full reversal, we want net impact to be 0. So we need to add 15 Frocks back to stock.
  
  // Denim Jeans stock
  const { data: pJeans } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('name', 'DENIM JEANS (Free Size / Assorted)')
    .maybeSingle();

  if (pJeans) {
    console.log('Jeans current stock:', pJeans.stock_qty);
    // Add 10 Jeans
    const { error: jErr } = await supabase
      .from('products')
      .update({ stock_qty: pJeans.stock_qty + 10 })
      .eq('id', pJeans.id);
    if (jErr) console.error('Error updating Jeans stock:', jErr);
    else console.log('Updated Jeans stock to:', pJeans.stock_qty + 10);
  }

  // Kids Frocks stock
  const { data: pFrocks } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('name', 'KIDS FROCK (Free Size / Assorted)')
    .maybeSingle();

  if (pFrocks) {
    console.log('Frocks current stock:', pFrocks.stock_qty);
    // Add 15 Frocks
    const { error: fErr } = await supabase
      .from('products')
      .update({ stock_qty: pFrocks.stock_qty + 15 })
      .eq('id', pFrocks.id);
    if (fErr) console.error('Error updating Frocks stock:', fErr);
    else console.log('Updated Frocks stock to:', pFrocks.stock_qty + 15);
  }

  // Sync Senthil's outstanding balance
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total')
      .eq('shop_id', shopId)
      .eq('customer_phone', '9876500003')
      .in('status', ['saved', 'sent']);

    let totalBilled = 0;
    let totalPaid = 0;
    if (invoices) {
      for (const inv of invoices) {
        totalBilled += Number(inv.total);
        const { data: pData } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', inv.id);
        totalPaid += pData?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
      }
    }

    const { data: notes } = await supabase
      .from('credit_debit_notes')
      .select('note_type, total')
      .eq('shop_id', shopId)
      .eq('customer_phone', '9876500003');

    let totalCredit = 0;
    let totalDebit = 0;
    if (notes) {
      notes.forEach((note) => {
        if (note.note_type === 'credit') {
          totalCredit += Number(note.total || 0);
        } else if (note.note_type === 'debit') {
          totalDebit += Number(note.total || 0);
        }
      });
    }

    const outstanding = Math.max(0, totalBilled + totalDebit - totalPaid - totalCredit);
    await supabase
      .from('customers')
      .update({ outstanding_balance: outstanding })
      .eq('shop_id', shopId)
      .eq('phone', '9876500003');

    console.log(`Successfully synced Senthil Kumar\'s outstanding balance. Total Billed: ${totalBilled}, Total Paid: ${totalPaid}, Total Credit: ${totalCredit}, Outstanding: ${outstanding}`);
  } catch (err) {
    console.error('Error syncing customer outstanding:', err);
  }
}

run();
