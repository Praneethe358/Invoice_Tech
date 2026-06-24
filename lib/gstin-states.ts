export const GST_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

/**
 * Returns the state name matching the first 2 digits of the GSTIN.
 * Returns "Unknown" if not found.
 */
export function getStateFromGSTIN(gstin: string): string {
  if (!gstin || gstin.trim().length < 2) return 'Unknown';
  const code = gstin.trim().slice(0, 2);
  return GST_STATES[code] || 'Unknown';
}

/**
 * Compares the first 2 digits of both GSTINs.
 * Returns true if they are different (inter-state, IGST applies).
 * Returns false if they are the same (intra-state, CGST + SGST applies).
 */
export function isInterState(shopGSTIN: string, buyerGSTIN: string): boolean {
  if (!shopGSTIN || !buyerGSTIN) return false;
  const shopCode = shopGSTIN.trim().slice(0, 2);
  const buyerCode = buyerGSTIN.trim().slice(0, 2);
  return shopCode !== buyerCode;
}

/**
 * Checks if the GSTIN is a valid 15-character Indian GSTIN format.
 * Verifies that the state code prefix exists in our state map.
 */
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  const stateCode = clean.slice(0, 2);
  if (!GST_STATES[stateCode]) return false;

  // Basic GSTIN format regex:
  // - 2 digits (state code)
  // - 5 letters, 4 digits, 1 letter (PAN number)
  // - 1 entity digit (1-9 or A-Z)
  // - 1 default letter 'Z'
  // - 1 checksum digit/letter
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(clean);
}
