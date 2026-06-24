import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { STARTER_CATALOGS, FOOTWEAR_STARTER_VARIANTS } from '../lib/starter-catalogs';

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ Pass: ${message}`);
}

async function runTest() {
  console.log('Starting Footwear Onboarding DB Integration Test...');
  const testEmail = `test_footwear_onboarding_${Date.now()}@example.com`;
  const testPassword = 'Password123';

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        owner_name: 'Test Owner',
      },
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Auth signup failed: ${authError?.message}`);
  }
  const userId = authData.user.id;
  console.log(`Created auth user: ${userId}`);

  try {
    // 2. Insert Shop row
    const { data: newShop, error: shopError } = await supabase
      .from('shops')
      .insert({
        auth_user_id: userId,
        name: 'Test Footwear Store',
        phone: '9000000000',
        shop_type: 'footwear',
        gst_registered: true,
        gstin: '33AAAAA1111A1Z1',
        business_type: 'products',
        inventory_enabled: true,
        onboarding_completed: true,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (shopError || !newShop) {
      throw new Error(`Shop insert failed: ${shopError?.message}`);
    }
    const shopId = newShop.id;
    console.log(`Created shop: ${shopId}`);

    // 3. Insert pre-seeded footwear products
    const footwearCatalog = STARTER_CATALOGS['footwear'] || [];
    const productsToInsert = footwearCatalog.map((item) => ({
      shop_id: shopId,
      name: item.name,
      price: item.price,
      hsn_code: item.hsn_code || null,
      gst_rate: item.gst_rate || 0,
      category: item.category || null,
      track_inventory: true,
    }));

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select('id, name');

    if (productsError || !insertedProducts) {
      throw new Error(`Products insertion failed: ${productsError?.message}`);
    }

    assert(insertedProducts.length === 10, 'Exactly 10 products should be seeded');

    // 4. Map products and insert variants
    const nameToIdMap = new Map<string, string>();
    insertedProducts.forEach((p: { id: string; name: string }) => {
      nameToIdMap.set(p.name, p.id);
    });

    const variantsToInsert = FOOTWEAR_STARTER_VARIANTS.map((v) => {
      const productId = nameToIdMap.get(v.product_name);
      return {
        product_id: productId,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock_qty: v.stock_qty,
        barcode: v.sku,
      };
    }).filter((v) => !!v.product_id);

    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsToInsert);

    if (variantsError) {
      throw new Error(`Variants insertion failed: ${variantsError.message}`);
    }

    // 5. Query back and verify database state
    // Verify Products
    const { data: dbProducts, error: queryProdError } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId);

    if (queryProdError || !dbProducts) {
      throw new Error(`Querying products failed: ${queryProdError?.message}`);
    }

    // Verify HSN/GST Rates
    const formalShoes = dbProducts.find(p => p.name === "Men's Formal Shoes");
    assert(!!formalShoes, 'Men\'s Formal Shoes must exist');
    assert(formalShoes.price === 1499, 'Formal Shoes price must be 1499');
    assert(formalShoes.hsn_code === '6403', 'Formal Shoes HSN must be 6403');
    assert(formalShoes.gst_rate === 12, 'Formal Shoes GST rate must be 12%');

    const kidsShoes = dbProducts.find(p => p.name === "Kids' Shoes");
    assert(!!kidsShoes, 'Kids\' Shoes must exist');
    assert(kidsShoes.price === 799, 'Kids\' Shoes price must be 799');
    assert(kidsShoes.gst_rate === 5, 'Kids\' Shoes GST rate must be 5%');

    const accessories = dbProducts.find(p => p.name === "Shoe Accessories");
    assert(!!accessories, 'Shoe Accessories must exist');
    assert(accessories.price === 99, 'Shoe Accessories price must be 99');
    assert(accessories.gst_rate === 12, 'Shoe Accessories GST rate must be 12%');

    // Verify Variants
    const productIds = dbProducts.map(p => p.id);
    const { data: dbVariants, error: queryVarError } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds);

    if (queryVarError || !dbVariants) {
      throw new Error(`Querying variants failed: ${queryVarError?.message}`);
    }

    assert(dbVariants.length === FOOTWEAR_STARTER_VARIANTS.length, `Exactly ${FOOTWEAR_STARTER_VARIANTS.length} variants should be in the DB`);

    const formalVariants = dbVariants.filter(v => v.product_id === formalShoes.id);
    assert(formalVariants.length === 6, 'Men\'s Formal Shoes should have 6 variants');

    const black7 = formalVariants.find(v => v.size === '7' && v.color === 'Black');
    assert(!!black7, 'Black Size 7 Formal shoes variant must exist');
    assert(black7.stock_qty === 5, 'Black Size 7 stock must be 5');
    assert(black7.sku === 'M-FORM-BLK-7', 'Black Size 7 SKU must match');

    console.log('\nDatabase integration validation succeeded! Cleaning up test data...');

    // 6. Cleanup (Cascade delete handles products and variants when deleting shop)
    await supabase.from('shops').delete().eq('id', shopId);
    console.log(`Deleted shop ${shopId}`);
    
    // Delete user
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.warn(`Failed to delete test auth user: ${deleteUserError.message}`);
    } else {
      console.log(`Deleted auth user ${userId}`);
    }

    console.log('\nDB Integration Test completed successfully!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    // Cleanup if shop was created
    const { data: shop } = await supabase.from('shops').select('id').eq('auth_user_id', userId).single();
    if (shop) {
      await supabase.from('shops').delete().eq('id', shop.id);
    }
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }
}

runTest();
