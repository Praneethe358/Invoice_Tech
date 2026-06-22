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

async function inspect() {
  // Query a sample invoice with all columns
  const { data: invoices, error: err1 } = await supabase.from('invoices').select('*').limit(1);
  if (err1) console.error("Invoices error:", err1);
  else console.log("Invoices columns:", Object.keys(invoices[0] || {}));

  // Query a sample customer with all columns
  const { data: customers, error: err2 } = await supabase.from('customers').select('*').limit(1);
  if (err2) console.error("Customers error:", err2);
  else console.log("Customers columns:", Object.keys(customers[0] || {}));

  // Query a sample credit/debit note with all columns
  const { data: notes, error: err3 } = await supabase.from('credit_debit_notes').select('*').limit(1);
  if (err3) console.error("CreditDebitNotes error:", err3);
  else console.log("CreditDebitNotes columns:", Object.keys(notes[0] || {}));

  // Let's also check if there is an invoice where invoice_number is INV-0004
  const { data: inv4, error: err4 } = await supabase.from('invoices').select('*').eq('invoice_number', 'INV-0004');
  console.log("INV-0004 detail:", inv4);
}

inspect().catch(console.error);
