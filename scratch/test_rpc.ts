import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars: any = {};
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

async function testRpc(name: string, args: any) {
  console.log(`Testing RPC '${name}'...`);
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    console.log(`  Error: ${error.message} (${error.code})`);
  } else {
    console.log(`  Success:`, data);
  }
}

async function run() {
  await testRpc('exec_sql', { sql: 'SELECT 1' });
  await testRpc('run_sql', { sql: 'SELECT 1' });
  await testRpc('execute_sql', { sql: 'SELECT 1' });
  await testRpc('exec_sql', { query: 'SELECT 1' });
  await testRpc('run_sql', { query: 'SELECT 1' });
  await testRpc('execute_sql', { query: 'SELECT 1' });
}

run();
