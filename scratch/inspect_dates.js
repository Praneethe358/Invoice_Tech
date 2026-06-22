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
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number, customer_name, created_at, status, total, subtotal, total_cgst, total_sgst')
    .eq('shop_id', 'd5abe065-9c0f-44d4-81ee-67d9be452503');

  if (error) {
    console.error(error);
    return;
  }

  console.log("=== Shop Invoices ===");
  invoices.forEach(inv => {
    console.log({
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_name,
      created_at: inv.created_at,
      status: inv.status,
      total: inv.total,
      subtotal: inv.subtotal,
      total_cgst: inv.total_cgst,
      total_sgst: inv.total_sgst
    });
  });
}

run();
