import { getClothingGstRate } from '../clothing/gst';

/**
 * GST rate rules for footwear shops.
 * - Footwear with RSP <= ₹1000/pair -> 5% GST
 * - Footwear with RSP > ₹1000/pair -> 12% GST
 * - Shoe accessories (laces, insoles, polish) -> HSN 6406 -> 12% GST
 */
export function getFootwearGstRate(unitPrice: number, hsnCode?: string | null): number {
  if (hsnCode) {
    const cleanHsn = hsnCode.replace(/\D/g, '').trim();
    if (cleanHsn.startsWith('6406')) {
      return 12;
    }
  }
  return unitPrice <= 1000 ? 5 : 12;
}

/**
 * Consolidated GST rate resolver helper based on shop type, price, and HSN.
 */
export function getItemGstRate(
  shopType: string,
  price: number,
  hsnCode?: string | null,
  originalRate: number = 0
): number {
  if (shopType === 'clothing') {
    return getClothingGstRate(price);
  }
  if (shopType === 'footwear') {
    return getFootwearGstRate(price, hsnCode);
  }
  return originalRate;
}
