export function sanitizeText(input: string | null | undefined, maxLength: number): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')  // strip HTML
    .replace(/[^\w\s\-.,@₹()\/]/g, '') // safe chars (alphanumeric, spaces, punctuation, currencies)
    .trim()
    .slice(0, maxLength);
}

export const sanitizeVariantField = (val: string): string => {
  return val
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case output
};
