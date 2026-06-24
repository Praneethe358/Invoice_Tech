const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atcdcbcybgturgswfjjo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Y2RjYmN5Ymd0dXJnc3dmampvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxNjk1NSwiZXhwIjoyMDk2OTkyOTU1fQ.NQ4EKU7FQTsaGJ-fgfNftNHMOiJnvUode26cuLlH3Dg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying shops table...');
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, subscription_status, trial_ends_at, whatsapp_invoices_sent')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Shops retrieved successfully:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
