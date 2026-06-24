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
  const { data: products } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('shop_id', shopId);

  console.log('=== Products and Variants ===');
  products.forEach(p => {
    console.log(`Product: ${p.name} (stock_qty: ${p.stock_qty}, track_inventory: ${p.track_inventory})`);
    if (p.product_variants && p.product_variants.length > 0) {
      p.product_variants.forEach(v => {
        console.log(`  - Variant: ${v.size} / ${v.color} (stock_qty: ${v.stock_qty})`);
      });
    }
  });
}

run();
