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

  console.log('1. Setting track_inventory: true for all products of the shop...');
  const { error: prodErr } = await supabase
    .from('products')
    .update({ track_inventory: true })
    .eq('shop_id', shopId);

  if (prodErr) {
    console.error('Error updating products:', prodErr);
    return;
  }
  console.log('Successfully set track_inventory to true for all products.');

  console.log('2. Fetching all products and their variants...');
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('shop_id', shopId);

  if (fetchErr) {
    console.error('Error fetching products:', fetchErr);
    return;
  }

  for (const p of products) {
    let targetStock = 0;
    if (p.name.includes('Cotton shirt')) {
      targetStock = 92; // 100 initial - 10 sold + 2 returned
    } else if (p.name.includes('SILK KURTA')) {
      targetStock = 45; // 50 initial - 5 sold
    } else if (p.name.includes('DENIM JEANS')) {
      targetStock = 80; // 80 initial - 20 sold + 20 returned (full reversal)
    } else if (p.name.includes('KIDS FROCK')) {
      targetStock = 120; // 120 initial - 15 sold + 15 returned (full reversal)
    } else if (p.name.includes('DESIGNER SAREE')) {
      targetStock = 30; // 30 initial (since Kavitha R bought 60 out of stock, let's keep it at 30 or we can make it 40 if needed, let's set it to 30)
    }

    // Update main product stock_qty
    await supabase
      .from('products')
      .update({ stock_qty: targetStock })
      .eq('id', p.id);

    // Update variants stock_qty
    if (p.product_variants && p.product_variants.length > 0) {
      for (const v of p.product_variants) {
        await supabase
          .from('product_variants')
          .update({ stock_qty: targetStock })
          .eq('id', v.id);
      }
    }
    console.log(`Set stock of ${p.name} (and variants) to ${targetStock}`);
  }
}

run();
