import { Product, ProductVariant } from './types';

export interface BarcodeResolution {
  type: 'variant' | 'product';
  variant?: ProductVariant;
  product: Product;
}

/**
 * Shared function to resolve a scanned barcode/SKU to either a product variant or a base product.
 * Camera path and Bluetooth/USB scanner path must both resolve through this single shared function.
 */
export function resolveBarcode(
  code: string,
  products: Product[],
  variants: ProductVariant[]
): BarcodeResolution | null {
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return null;

  // 1. Check product variants (clothing shops)
  // Try matching against 'barcode' field first, then fall back to 'sku'
  let matchedVariant = variants.find(
    (v) => v.barcode && v.barcode.toLowerCase() === trimmed
  );

  if (!matchedVariant) {
    matchedVariant = variants.find(
      (v) => v.sku && v.sku.toLowerCase() === trimmed
    );
  }

  if (matchedVariant) {
    const parentProduct = products.find((p) => p.id === matchedVariant!.product_id);
    if (parentProduct) {
      return {
        type: 'variant',
        variant: matchedVariant,
        product: parentProduct,
      };
    }
  }

  // 2. Check base products directly by SKU/barcode
  const matchedProduct = products.find(
    (p) => (p as any).sku && (p as any).sku.toLowerCase() === trimmed
  );

  if (matchedProduct) {
    return {
      type: 'product',
      product: matchedProduct,
    };
  }

  return null;
}
