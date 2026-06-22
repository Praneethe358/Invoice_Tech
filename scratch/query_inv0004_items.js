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
    .select('id, invoice_number, customer_name, invoice_items(*)')
    .eq('invoice_number', 'INV-0004');

  if (error) {
    console.error(error);
    return;
  }

  invoices.forEach(inv => {
    console.log(inv.invoice_number, inv.customer_name, JSON.stringify(inv.invoice_items, null, 2));
  });
}

run();
