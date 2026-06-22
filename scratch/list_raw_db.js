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
  const month = 6;
  const year = 2026;

  const pad = (num) => String(num).padStart(2, '0');
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shopId)
    .in('status', ['saved', 'sent'])
    .gte('created_at', `${startDate}T00:00:00+05:30`)
    .lte('created_at', `${endDate}T23:59:59+05:30`);

  console.log("=== INVOICES ===");
  console.log(invoices.map(inv => ({
    invoice_number: inv.invoice_number,
    customer_name: inv.customer_name,
    customer_gstin: inv.customer_gstin,
    subtotal: inv.subtotal,
    total_cgst: inv.total_cgst,
    total_sgst: inv.total_sgst,
    total: inv.total,
    created_at: inv.created_at
  })));

  const { data: cdns } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .eq('shop_id', shopId)
    .gte('note_date', startDate)
    .lte('note_date', endDate);

  console.log("=== CREDIT/DEBIT NOTES ===");
  console.log(cdns.map(n => ({
    note_number: n.note_number,
    note_type: n.note_type,
    customer_gstin: n.customer_gstin,
    subtotal: n.subtotal,
    total_cgst: n.total_cgst,
    total_sgst: n.total_sgst,
    total: n.total,
    note_date: n.note_date
  })));
}

run();
