export type ShopType =
  | 'clothing'
  | 'tailoring'
  | 'fertilizer'
  | 'grocery'
  | 'pharmacy'
  | 'hardware'
  | 'food'
  | 'electronics'
  | 'salon'
  | 'other';

export interface StarterItem {
  name: string;
  price: number;
  hsn_code: string;
  gst_rate: number;
  category?: string;
}

export const STARTER_CATALOGS: Record<ShopType, StarterItem[]> = {
  clothing: [
    { name: 'Saree', price: 0, hsn_code: '5007', gst_rate: 5, category: 'Sarees' },
    { name: 'Blouse', price: 0, hsn_code: '6211', gst_rate: 5, category: 'Blouses' },
    { name: 'Kurta', price: 0, hsn_code: '6211', gst_rate: 5, category: 'Kurtаs' },
    { name: 'Lehenga', price: 0, hsn_code: '6211', gst_rate: 5, category: 'Lehengas' },
    { name: 'Dupatta', price: 0, hsn_code: '6214', gst_rate: 5, category: 'Accessories' },
    { name: 'Fabric (per metre)', price: 0, hsn_code: '5208', gst_rate: 5, category: 'Fabric' },
    { name: 'Shirt', price: 0, hsn_code: '6205', gst_rate: 12, category: 'Others' },
    { name: 'Trouser', price: 0, hsn_code: '6203', gst_rate: 12, category: 'Others' },
  ],

  tailoring: [
    { name: 'Blouse Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
    { name: 'Salwar Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
    { name: 'Saree Fall & Pico', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Finishing' },
    { name: 'Alteration Charges', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Alterations' },
    { name: 'Churidar Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
    { name: 'Kurti Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
    { name: 'Frock Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
    { name: 'Gown Stitching', price: 0, hsn_code: '9988', gst_rate: 5, category: 'Stitching' },
  ],

  fertilizer: [
    { name: 'Urea (50kg)', price: 0, hsn_code: '3102', gst_rate: 0, category: 'Fertilizers' },
    { name: 'DAP (50kg)', price: 0, hsn_code: '3105', gst_rate: 0, category: 'Fertilizers' },
    { name: 'Potash (50kg)', price: 0, hsn_code: '3104', gst_rate: 0, category: 'Fertilizers' },
    { name: 'NPK Fertilizer', price: 0, hsn_code: '3105', gst_rate: 0, category: 'Fertilizers' },
    { name: 'Pesticide (1L)', price: 0, hsn_code: '3808', gst_rate: 18, category: 'Pesticides' },
    { name: 'Herbicide (1L)', price: 0, hsn_code: '3808', gst_rate: 18, category: 'Herbicides' },
    { name: 'Seeds (1kg)', price: 0, hsn_code: '1209', gst_rate: 0, category: 'Seeds' },
    { name: 'Micronutrient Mix', price: 0, hsn_code: '3105', gst_rate: 0, category: 'Fertilizers' },
  ],

  grocery: [
    { name: 'Rice (1kg)', price: 0, hsn_code: '1006', gst_rate: 0, category: 'Grains & Pulses' },
    { name: 'Dal (1kg)', price: 0, hsn_code: '0713', gst_rate: 0, category: 'Grains & Pulses' },
    { name: 'Oil (1L)', price: 0, hsn_code: '1507', gst_rate: 5, category: 'Oils & Ghee' },
    { name: 'Sugar (1kg)', price: 0, hsn_code: '1701', gst_rate: 0, category: 'Others' },
    { name: 'Salt (1kg)', price: 0, hsn_code: '2501', gst_rate: 0, category: 'Spices' },
    { name: 'Atta (1kg)', price: 0, hsn_code: '1101', gst_rate: 0, category: 'Grains & Pulses' },
    { name: 'Tea Powder (100g)', price: 0, hsn_code: '0902', gst_rate: 5, category: 'Beverages' },
    { name: 'Coffee Powder (100g)', price: 0, hsn_code: '0901', gst_rate: 5, category: 'Beverages' },
  ],

  pharmacy: [
    { name: 'Tablet Strip', price: 0, hsn_code: '3004', gst_rate: 12, category: 'Tablets' },
    { name: 'Syrup (100ml)', price: 0, hsn_code: '3004', gst_rate: 12, category: 'Syrups' },
    { name: 'Ointment', price: 0, hsn_code: '3004', gst_rate: 12, category: 'Ointments' },
    { name: 'Injection', price: 0, hsn_code: '3004', gst_rate: 12, category: 'Injections' },
    { name: 'Surgical Gloves', price: 0, hsn_code: '4015', gst_rate: 12, category: 'Surgical' },
    { name: 'Bandage', price: 0, hsn_code: '3005', gst_rate: 12, category: 'Surgical' },
    { name: 'Sanitizer (500ml)', price: 0, hsn_code: '3808', gst_rate: 18, category: 'Others' },
    { name: 'Vitamin Supplement', price: 0, hsn_code: '2106', gst_rate: 18, category: 'Vitamins' },
  ],

  hardware: [
    { name: 'Cement Bag (50kg)', price: 0, hsn_code: '2523', gst_rate: 28, category: 'Cement & Steel' },
    { name: 'Steel Rod (per kg)', price: 0, hsn_code: '7214', gst_rate: 18, category: 'Cement & Steel' },
    { name: 'PVC Pipe (per ft)', price: 0, hsn_code: '3917', gst_rate: 18, category: 'Pipes & Fittings' },
    { name: 'Paint (1L)', price: 0, hsn_code: '3208', gst_rate: 18, category: 'Paint' },
    { name: 'Electrical Wire (per m)', price: 0, hsn_code: '8544', gst_rate: 18, category: 'Electrical' },
    { name: 'Switch Board', price: 0, hsn_code: '8536', gst_rate: 18, category: 'Electrical' },
    { name: 'Nut & Bolt Set', price: 0, hsn_code: '7318', gst_rate: 18, category: 'Tools' },
    { name: 'Plywood Sheet', price: 0, hsn_code: '4412', gst_rate: 18, category: 'Plywood' },
  ],

  food: [
    { name: 'Idli (2 pcs)', price: 0, hsn_code: '2106', gst_rate: 5, category: 'Tiffin' },
    { name: 'Dosa', price: 0, hsn_code: '2106', gst_rate: 5, category: 'Tiffin' },
    { name: 'Meals', price: 0, hsn_code: '9963', gst_rate: 5, category: 'Meals' },
    { name: 'Parcel Charge', price: 0, hsn_code: '9963', gst_rate: 5, category: 'Extras' },
    { name: 'Tea', price: 0, hsn_code: '9963', gst_rate: 5, category: 'Beverages' },
    { name: 'Coffee', price: 0, hsn_code: '9963', gst_rate: 5, category: 'Beverages' },
    { name: 'Catering (per head)', price: 0, hsn_code: '9963', gst_rate: 5, category: 'Combos' },
    { name: 'Cake (per kg)', price: 0, hsn_code: '1905', gst_rate: 18, category: 'Sweets' },
  ],

  electronics: [
    { name: 'Mobile Phone', price: 0, hsn_code: '8517', gst_rate: 18, category: 'Phones' },
    { name: 'Charger', price: 0, hsn_code: '8504', gst_rate: 18, category: 'Cables & Chargers' },
    { name: 'Earphones', price: 0, hsn_code: '8518', gst_rate: 18, category: 'Audio' },
    { name: 'Mobile Cover', price: 0, hsn_code: '3926', gst_rate: 18, category: 'Accessories' },
    { name: 'Screen Guard', price: 0, hsn_code: '3919', gst_rate: 18, category: 'Accessories' },
    { name: 'Power Bank', price: 0, hsn_code: '8507', gst_rate: 18, category: 'Accessories' },
    { name: 'Repair Charge', price: 0, hsn_code: '9987', gst_rate: 18, category: 'Repair Services' },
    { name: 'Data Cable', price: 0, hsn_code: '8544', gst_rate: 18, category: 'Cables & Chargers' },
  ],

  salon: [
    { name: 'Haircut', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Hair' },
    { name: 'Hair Colour', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Hair' },
    { name: 'Facial', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Skin' },
    { name: 'Waxing', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Skin' },
    { name: 'Manicure', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Nails' },
    { name: 'Pedicure', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Nails' },
    { name: 'Bridal Makeup', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Bridal' },
    { name: 'Hair Spa', price: 0, hsn_code: '9882', gst_rate: 18, category: 'Hair' },
  ],

  other: [
    { name: 'Item 1', price: 0, hsn_code: '', gst_rate: 0, category: 'General' },
    { name: 'Item 2', price: 0, hsn_code: '', gst_rate: 0, category: 'General' },
    { name: 'Item 3', price: 0, hsn_code: '', gst_rate: 0, category: 'General' },
  ],
};
