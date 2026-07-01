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

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const data = await res.json();
  const paths = Object.keys(data.paths || {});
  console.log(paths.filter(p => p.includes('rpc')));
}
run();
