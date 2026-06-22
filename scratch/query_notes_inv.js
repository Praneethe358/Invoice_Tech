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
  const { data: notes, error } = await supabase
    .from('credit_debit_notes')
    .select('*, invoices(*)')
    .eq('shop_id', 'd5abe065-9c0f-44d4-81ee-67d9be452503');

  if (error) {
    console.error(error);
    return;
  }

  console.log("=== Notes with Invoices ===");
  notes.forEach(note => {
    console.log({
      note_number: note.note_number,
      note_type: note.note_type,
      note_subtotal: note.subtotal,
      invoice_number: note.invoices?.invoice_number,
      invoice_subtotal: note.invoices?.subtotal,
      invoice_total: note.invoices?.total
    });
  });
}

run();
