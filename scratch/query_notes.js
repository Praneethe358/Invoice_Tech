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
    .select('*')
    .eq('shop_id', 'd5abe065-9c0f-44d4-81ee-67d9be452503');

  if (error) {
    console.error(error);
    return;
  }

  console.log("=== All Notes for Shop ===");
  notes.forEach(note => {
    console.log({
      id: note.id,
      invoice_id: note.invoice_id,
      note_number: note.note_number,
      note_type: note.note_type,
      customer_gstin: note.customer_gstin,
      subtotal: note.subtotal,
      total_cgst: note.total_cgst,
      total_sgst: note.total_sgst,
      total_gst: note.total_gst,
      total: note.total,
      note_date: note.note_date
    });
  });
}

run();
