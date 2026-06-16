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
}

export const STARTER_CATALOGS: Record<ShopType, StarterItem[]> = {
  clothing: [
    { name: 'Saree', price: 0, hsn_code: '5007', gst_rate: 5 },
    { name: 'Blouse', price: 0, hsn_code: '6211', gst_rate: 5 },
    { name: 'Kurta', price: 0, hsn_code: '6211', gst_rate: 5 },
    { name: 'Lehenga', price: 0, hsn_code: '6211', gst_rate: 5 },
    { name: 'Dupatta', price: 0, hsn_code: '6214', gst_rate: 5 },
    { name: 'Fabric (per metre)', price: 0, hsn_code: '5208', gst_rate: 5 },
    { name: 'Shirt', price: 0, hsn_code: '6205', gst_rate: 12 },
    { name: 'Trouser', price: 0, hsn_code: '6203', gst_rate: 12 },
  ],

  tailoring: [
    { name: 'Blouse Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Salwar Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Saree Fall & Pico', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Alteration Charges', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Churidar Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Kurti Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Frock Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
    { name: 'Gown Stitching', price: 0, hsn_code: '9988', gst_rate: 5 },
  ],

  fertilizer: [
    { name: 'Urea (50kg)', price: 0, hsn_code: '3102', gst_rate: 0 },
    { name: 'DAP (50kg)', price: 0, hsn_code: '3105', gst_rate: 0 },
    { name: 'Potash (50kg)', price: 0, hsn_code: '3104', gst_rate: 0 },
    { name: 'NPK Fertilizer', price: 0, hsn_code: '3105', gst_rate: 0 },
    { name: 'Pesticide (1L)', price: 0, hsn_code: '3808', gst_rate: 18 },
    { name: 'Herbicide (1L)', price: 0, hsn_code: '3808', gst_rate: 18 },
    { name: 'Seeds (1kg)', price: 0, hsn_code: '1209', gst_rate: 0 },
    { name: 'Micronutrient Mix', price: 0, hsn_code: '3105', gst_rate: 0 },
  ],

  grocery: [
    { name: 'Rice (1kg)', price: 0, hsn_code: '1006', gst_rate: 0 },
    { name: 'Dal (1kg)', price: 0, hsn_code: '0713', gst_rate: 0 },
    { name: 'Oil (1L)', price: 0, hsn_code: '1507', gst_rate: 5 },
    { name: 'Sugar (1kg)', price: 0, hsn_code: '1701', gst_rate: 0 },
    { name: 'Salt (1kg)', price: 0, hsn_code: '2501', gst_rate: 0 },
    { name: 'Atta (1kg)', price: 0, hsn_code: '1101', gst_rate: 0 },
    { name: 'Tea Powder (100g)', price: 0, hsn_code: '0902', gst_rate: 5 },
    { name: 'Coffee Powder (100g)', price: 0, hsn_code: '0901', gst_rate: 5 },
  ],

  pharmacy: [
    { name: 'Tablet Strip', price: 0, hsn_code: '3004', gst_rate: 12 },
    { name: 'Syrup (100ml)', price: 0, hsn_code: '3004', gst_rate: 12 },
    { name: 'Ointment', price: 0, hsn_code: '3004', gst_rate: 12 },
    { name: 'Injection', price: 0, hsn_code: '3004', gst_rate: 12 },
    { name: 'Surgical Gloves', price: 0, hsn_code: '4015', gst_rate: 12 },
    { name: 'Bandage', price: 0, hsn_code: '3005', gst_rate: 12 },
    { name: 'Sanitizer (500ml)', price: 0, hsn_code: '3808', gst_rate: 18 },
    { name: 'Vitamin Supplement', price: 0, hsn_code: '2106', gst_rate: 18 },
  ],

  hardware: [
    { name: 'Cement Bag (50kg)', price: 0, hsn_code: '2523', gst_rate: 28 },
    { name: 'Steel Rod (per kg)', price: 0, hsn_code: '7214', gst_rate: 18 },
    { name: 'PVC Pipe (per ft)', price: 0, hsn_code: '3917', gst_rate: 18 },
    { name: 'Paint (1L)', price: 0, hsn_code: '3208', gst_rate: 18 },
    { name: 'Electrical Wire (per m)', price: 0, hsn_code: '8544', gst_rate: 18 },
    { name: 'Switch Board', price: 0, hsn_code: '8536', gst_rate: 18 },
    { name: 'Nut & Bolt Set', price: 0, hsn_code: '7318', gst_rate: 18 },
    { name: 'Plywood Sheet', price: 0, hsn_code: '4412', gst_rate: 18 },
  ],

  food: [
    { name: 'Idli (2 pcs)', price: 0, hsn_code: '2106', gst_rate: 5 },
    { name: 'Dosa', price: 0, hsn_code: '2106', gst_rate: 5 },
    { name: 'Meals', price: 0, hsn_code: '9963', gst_rate: 5 },
    { name: 'Parcel Charge', price: 0, hsn_code: '9963', gst_rate: 5 },
    { name: 'Tea', price: 0, hsn_code: '9963', gst_rate: 5 },
    { name: 'Coffee', price: 0, hsn_code: '9963', gst_rate: 5 },
    { name: 'Catering (per head)', price: 0, hsn_code: '9963', gst_rate: 5 },
    { name: 'Cake (per kg)', price: 0, hsn_code: '1905', gst_rate: 18 },
  ],

  electronics: [
    { name: 'Mobile Phone', price: 0, hsn_code: '8517', gst_rate: 18 },
    { name: 'Charger', price: 0, hsn_code: '8504', gst_rate: 18 },
    { name: 'Earphones', price: 0, hsn_code: '8518', gst_rate: 18 },
    { name: 'Mobile Cover', price: 0, hsn_code: '3926', gst_rate: 18 },
    { name: 'Screen Guard', price: 0, hsn_code: '3919', gst_rate: 18 },
    { name: 'Power Bank', price: 0, hsn_code: '8507', gst_rate: 18 },
    { name: 'Repair Charge', price: 0, hsn_code: '9987', gst_rate: 18 },
    { name: 'Data Cable', price: 0, hsn_code: '8544', gst_rate: 18 },
  ],

  salon: [
    { name: 'Haircut', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Hair Colour', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Facial', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Waxing', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Manicure', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Pedicure', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Bridal Makeup', price: 0, hsn_code: '9882', gst_rate: 18 },
    { name: 'Hair Spa', price: 0, hsn_code: '9882', gst_rate: 18 },
  ],

  other: [
    { name: 'Item 1', price: 0, hsn_code: '', gst_rate: 0 },
    { name: 'Item 2', price: 0, hsn_code: '', gst_rate: 0 },
    { name: 'Item 3', price: 0, hsn_code: '', gst_rate: 0 },
  ],
};
