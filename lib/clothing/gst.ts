/**
 * GST rate rules for clothing shops.
 * Effective September 22, 2025:
 * - 5% GST for apparel/clothing item price <= ₹2,500
 * - 18% GST for apparel/clothing item price > ₹2,500
 */
export function getClothingGstRate(unitPrice: number): number {
  return unitPrice <= 2500 ? 5 : 18;
}
