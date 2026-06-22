import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { generateGSTR1 } from '../lib/gstr1';

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

async function run() {
  const shopId = 'd5abe065-9c0f-44d4-81ee-67d9be452503';
  const gstr1 = await generateGSTR1(supabase as any, shopId, 6, 2026);
  console.log("=== GENERATED GSTR-1 JSON ===");
  console.log(JSON.stringify(gstr1, null, 2));
}

run().catch(console.error);
