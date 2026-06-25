export function getClothingGstRate(unitPrice: number): number {
  if (unitPrice <= 1000) return 5;
  if (unitPrice <= 2500) return 12;
  return 18;
}
