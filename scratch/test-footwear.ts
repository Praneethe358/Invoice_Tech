import { getFootwearGstRate } from '../lib/footwear/gst';
import { STARTER_CATALOGS, FOOTWEAR_STARTER_VARIANTS } from '../lib/starter-catalogs';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ Pass: ${message}`);
}

async function runTests() {
  console.log('Running Footwear GST Slab tests...');
  // Footwear RSP <= 1000 => 5%
  assert(getFootwearGstRate(500, '6403') === 5, 'RSP 500 should be 5% GST');
  assert(getFootwearGstRate(1000, '6403') === 5, 'RSP 1000 should be 5% GST');

  // Footwear RSP > 1000 => 12%
  assert(getFootwearGstRate(1001, '6403') === 12, 'RSP 1001 should be 12% GST');
  assert(getFootwearGstRate(2500, '6403') === 12, 'RSP 2500 should be 12% GST');

  // Shoe accessories HSN 6406 => 12% always
  assert(getFootwearGstRate(300, '6406') === 12, 'HSN 6406 at RSP 300 should be 12% GST');
  assert(getFootwearGstRate(1200, '6406') === 12, 'HSN 6406 at RSP 1200 should be 12% GST');

  // Test starter catalog preloads
  console.log('\nVerifying Footwear Starter Catalog...');
  const footwearCatalog = STARTER_CATALOGS['footwear'];
  assert(!!footwearCatalog, 'Footwear starter catalog must exist');
  assert(footwearCatalog.length === 10, `Footwear should have 10 products, found ${footwearCatalog.length}`);

  // Check structure of first product
  const p1 = footwearCatalog[0];
  assert(p1.name === "Men's Formal Shoes", 'First product should be Men\'s Formal Shoes');
  assert(p1.category === 'Formal Shoes', 'Category should be Formal Shoes');
  assert(p1.hsn_code === '6403', 'HSN should be 6403');
  assert(p1.price === 1499, 'Price should be 1499');

  // Check variants are present
  assert(FOOTWEAR_STARTER_VARIANTS.length > 0, 'Variants should be seeded');
  const formalShoesVariants = FOOTWEAR_STARTER_VARIANTS.filter(v => v.product_name === "Men's Formal Shoes");
  assert(formalShoesVariants.length === 6, `Men's Formal Shoes should have 6 variants (3 sizes * 2 colors), found ${formalShoesVariants.length}`);

  console.log('\nAll Footwear tests completed successfully!');
}

runTests().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
