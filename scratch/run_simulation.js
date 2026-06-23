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
  const ownerId = 'f1daa2b9-e8f2-4f2a-bd12-6c17ba32c93e';

  console.log('1. Updating owner auth credentials...');
  const { data: user, error: userError } = await supabase.auth.admin.updateUserById(
    ownerId,
    {
      email: 'srimurugan@gmail.com',
      password: 'SriMurugan2025!',
      email_confirm: true
    }
  );
  if (userError) {
    console.error('Error updating user auth:', userError);
  } else {
    console.log('Successfully updated user to srimurugan@gmail.com');
  }

  console.log('2. Updating shop details...');
  const { error: shopError } = await supabase
    .from('shops')
    .update({
      name: 'Sri Murugan Textiles',
      address: '14, Kumaran Street, Tiruppur – 641601',
      phone: '9842155678',
      gstin: '33AABCS1429B1ZB',
      gst_registered: true,
      onboarding_completed: true,
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', shopId);
  if (shopError) console.error('Error updating shop:', shopError);
  else console.log('Successfully updated shop Sri Murugan Textiles details');

  console.log('3. Updating customers...');
  // Meena Traders
  const { error: c1Err } = await supabase
    .from('customers')
    .update({
      name: 'Meena Traders',
      phone: '9876500002',
      gstin: '33AAFCB2341M1Z5'
    })
    .eq('id', 'e5678112-ef41-4def-b474-ad46cb9ce6a0');

  // Walk-in Customer
  const { error: c2Err } = await supabase
    .from('customers')
    .update({
      name: 'Walk-in Customer',
      phone: '9999999999',
      gstin: null
    })
    .eq('id', 'c120ba31-7674-4913-8f50-b0be4dafccf6');

  // Senthil Kumar
  const { error: c3Err } = await supabase
    .from('customers')
    .update({
      name: 'Senthil Kumar',
      phone: '9876500003',
      gstin: null // Unregistered B2C
    })
    .eq('id', '5bcf724f-0439-494f-93f4-e202b08bcf9d');

  // Kavitha R
  const { error: c4Err } = await supabase
    .from('customers')
    .update({
      name: 'Kavitha R',
      phone: '9876500004',
      gstin: null // Unregistered B2C (Interstate)
    })
    .eq('id', '3e1ea15f-6274-4635-9a44-60a57654b6ac');

  if (c1Err || c2Err || c3Err || c4Err) {
    console.error('Error updating customers:', { c1Err, c2Err, c3Err, c4Err });
  } else {
    console.log('Successfully updated customers list');
  }

  console.log('4. Updating invoices...');
  const { data: dbInvoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', shopId);

  for (const inv of dbInvoices) {
    if (inv.invoice_number === 'INV-0001') {
      await supabase
        .from('invoices')
        .update({
          customer_name: 'Meena Traders',
          customer_phone: '9876500002',
          customer_gstin: '33AAFCB2341M1Z5',
          created_at: '2026-06-15T12:00:00+05:30',
          paid_at: '2026-06-15T12:00:00+05:30'
        })
        .eq('id', inv.id);
    } else if (inv.invoice_number === 'INV-0002') {
      await supabase
        .from('invoices')
        .update({
          customer_name: 'Walk-in Customer',
          customer_phone: '9999999999',
          customer_gstin: null,
          created_at: '2026-06-16T12:00:00+05:30',
          paid_at: '2026-06-16T12:00:00+05:30'
        })
        .eq('id', inv.id);
    } else if (inv.invoice_number === 'INV-0003') {
      await supabase
        .from('invoices')
        .update({
          customer_name: 'Senthil Kumar',
          customer_phone: '9876500003',
          customer_gstin: null, // Unregistered B2C
          created_at: '2026-06-17T12:00:00+05:30',
          paid_at: '2026-06-17T12:00:00+05:30'
        })
        .eq('id', inv.id);
    } else if (inv.invoice_number === 'INV-0004') {
      await supabase
        .from('invoices')
        .update({
          customer_name: 'Kavitha R',
          customer_phone: '9876500004',
          customer_gstin: null,
          created_at: '2026-06-18T12:00:00+05:30',
          paid_at: '2026-06-18T12:00:00+05:30'
        })
        .eq('id', inv.id);
    }
  }
  console.log('Successfully aligned invoice header fields');

  console.log('5. Updating credit notes...');
  const { data: dbNotes } = await supabase
    .from('credit_debit_notes')
    .select('*')
    .eq('shop_id', shopId);

  for (const note of dbNotes) {
    if (note.note_number === 'CN-001') {
      await supabase
        .from('credit_debit_notes')
        .update({
          customer_phone: '9876500002',
          customer_gstin: '33AAFCB2341M1Z5',
          note_date: '2026-06-22',
          created_at: '2026-06-22T12:00:00+05:30'
        })
        .eq('id', note.id);
    } else if (note.note_number === 'CN-002') {
      await supabase
        .from('credit_debit_notes')
        .update({
          customer_phone: '9876500003',
          customer_gstin: null, // Senthil Kumar is unregistered!
          note_date: '2026-06-23',
          created_at: '2026-06-23T12:00:00+05:30'
        })
        .eq('id', note.id);
    }
  }
  console.log('Successfully aligned credit note fields');
}

run();
