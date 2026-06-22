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
  const startDate = '2026-06-01T00:00:00+05:30';
  const endDate = '2026-06-30T23:59:59+05:30';

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    console.error("Error fetching invoices:", error);
    return;
  }

  console.log("=== June 2026 Invoices ===");
  invoices.forEach(inv => {
    console.log({
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_name,
      customer_phone: inv.customer_phone,
      customer_gstin: inv.customer_gstin,
      subtotal: inv.subtotal,
      total_cgst: inv.total_cgst,
      total_sgst: inv.total_sgst,
      total_gst: inv.total_gst,
      total: inv.total,
      status: inv.status
    });
  });

  const { data: notes, error: notesError } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .gte('note_date', '2026-06-01')
    .lte('note_date', '2026-06-30');

  if (notesError) {
    console.error("Error fetching credit_debit_notes:", notesError);
    return;
  }

  console.log("=== June 2026 Credit/Debit Notes ===");
  notes.forEach(note => {
    console.log({
      note_number: note.note_number,
      note_type: note.note_type,
      customer_gstin: note.customer_gstin,
      subtotal: note.subtotal,
      total_cgst: note.total_cgst,
      total_sgst: note.total_sgst,
      total_gst: note.total_gst,
      total: note.total,
      status: note.status
    });
  });
}

run().catch(console.error);
