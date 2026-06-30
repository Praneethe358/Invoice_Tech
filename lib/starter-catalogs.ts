export type ShopType =
  | 'clothing'
  | 'footwear'
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

  footwear: [
    { name: "Men's Formal Shoes", price: 1499, hsn_code: '6403', gst_rate: 12, category: 'Formal Shoes' },
    { name: "Men's Casual Shoes", price: 1299, hsn_code: '6403', gst_rate: 12, category: 'Casual Shoes' },
    { name: "Men's Slippers/Chappals", price: 399, hsn_code: '6402', gst_rate: 5, category: 'Slippers' },
    { name: "Women's Heels/Sandals", price: 1199, hsn_code: '6402', gst_rate: 12, category: 'Sandals' },
    { name: "Women's Slippers/Flats", price: 299, hsn_code: '6402', gst_rate: 5, category: 'Slippers' },
    { name: "Kids' Shoes", price: 799, hsn_code: '6404', gst_rate: 5, category: 'Kids' },
    { name: "Sports/Running Shoes", price: 2499, hsn_code: '6404', gst_rate: 12, category: 'Sports Shoes' },
    { name: "Canvas/School Shoes", price: 499, hsn_code: '6404', gst_rate: 5, category: 'School Shoes' },
    { name: "Rubber/PVC Slippers", price: 199, hsn_code: '6401', gst_rate: 5, category: 'Slippers' },
    { name: "Shoe Accessories", price: 99, hsn_code: '6406', gst_rate: 12, category: 'Accessories' }
  ],
};

export interface StarterVariant {
  product_name: string;
  size: string;
  color: string;
  sku: string;
  stock_qty: number;
}

export const FOOTWEAR_STARTER_VARIANTS: StarterVariant[] = [
  // Men's Formal Shoes
  { product_name: "Men's Formal Shoes", size: '7', color: 'Black', sku: 'M-FORM-BLK-7', stock_qty: 5 },
  { product_name: "Men's Formal Shoes", size: '8', color: 'Black', sku: 'M-FORM-BLK-8', stock_qty: 5 },
  { product_name: "Men's Formal Shoes", size: '9', color: 'Black', sku: 'M-FORM-BLK-9', stock_qty: 5 },
  { product_name: "Men's Formal Shoes", size: '7', color: 'Brown', sku: 'M-FORM-BRN-7', stock_qty: 5 },
  { product_name: "Men's Formal Shoes", size: '8', color: 'Brown', sku: 'M-FORM-BRN-8', stock_qty: 5 },
  { product_name: "Men's Formal Shoes", size: '9', color: 'Brown', sku: 'M-FORM-BRN-9', stock_qty: 5 },

  // Men's Casual Shoes
  { product_name: "Men's Casual Shoes", size: '7', color: 'Blue', sku: 'M-CAS-BLU-7', stock_qty: 5 },
  { product_name: "Men's Casual Shoes", size: '8', color: 'Blue', sku: 'M-CAS-BLU-8', stock_qty: 5 },
  { product_name: "Men's Casual Shoes", size: '9', color: 'Blue', sku: 'M-CAS-BLU-9', stock_qty: 5 },
  { product_name: "Men's Casual Shoes", size: '7', color: 'Grey', sku: 'M-CAS-GRY-7', stock_qty: 5 },
  { product_name: "Men's Casual Shoes", size: '8', color: 'Grey', sku: 'M-CAS-GRY-8', stock_qty: 5 },
  { product_name: "Men's Casual Shoes", size: '9', color: 'Grey', sku: 'M-CAS-GRY-9', stock_qty: 5 },

  // Men's Slippers/Chappals
  { product_name: "Men's Slippers/Chappals", size: '7', color: 'Black', sku: 'M-SLIP-BLK-7', stock_qty: 10 },
  { product_name: "Men's Slippers/Chappals", size: '8', color: 'Black', sku: 'M-SLIP-BLK-8', stock_qty: 10 },
  { product_name: "Men's Slippers/Chappals", size: '9', color: 'Black', sku: 'M-SLIP-BLK-9', stock_qty: 10 },
  { product_name: "Men's Slippers/Chappals", size: '7', color: 'Blue', sku: 'M-SLIP-BLU-7', stock_qty: 10 },
  { product_name: "Men's Slippers/Chappals", size: '8', color: 'Blue', sku: 'M-SLIP-BLU-8', stock_qty: 10 },
  { product_name: "Men's Slippers/Chappals", size: '9', color: 'Blue', sku: 'M-SLIP-BLU-9', stock_qty: 10 },

  // Women's Heels/Sandals
  { product_name: "Women's Heels/Sandals", size: '5', color: 'Red', sku: 'W-HEEL-RED-5', stock_qty: 4 },
  { product_name: "Women's Heels/Sandals", size: '6', color: 'Red', sku: 'W-HEEL-RED-6', stock_qty: 4 },
  { product_name: "Women's Heels/Sandals", size: '7', color: 'Red', sku: 'W-HEEL-RED-7', stock_qty: 4 },
  { product_name: "Women's Heels/Sandals", size: '5', color: 'Black', sku: 'W-HEEL-BLK-5', stock_qty: 4 },
  { product_name: "Women's Heels/Sandals", size: '6', color: 'Black', sku: 'W-HEEL-BLK-6', stock_qty: 4 },
  { product_name: "Women's Heels/Sandals", size: '7', color: 'Black', sku: 'W-HEEL-BLK-7', stock_qty: 4 },

  // Women's Slippers/Flats
  { product_name: "Women's Slippers/Flats", size: '5', color: 'Pink', sku: 'W-SLIP-PNK-5', stock_qty: 8 },
  { product_name: "Women's Slippers/Flats", size: '6', color: 'Pink', sku: 'W-SLIP-PNK-6', stock_qty: 8 },
  { product_name: "Women's Slippers/Flats", size: '7', color: 'Pink', sku: 'W-SLIP-PNK-7', stock_qty: 8 },
  { product_name: "Women's Slippers/Flats", size: '5', color: 'Beige', sku: 'W-SLIP-BEI-5', stock_qty: 8 },
  { product_name: "Women's Slippers/Flats", size: '6', color: 'Beige', sku: 'W-SLIP-BEI-6', stock_qty: 8 },
  { product_name: "Women's Slippers/Flats", size: '7', color: 'Beige', sku: 'W-SLIP-BEI-7', stock_qty: 8 },

  // Kids' Shoes
  { product_name: "Kids' Shoes", size: '1C', color: 'Blue', sku: 'K-SHOE-BLU-1C', stock_qty: 6 },
  { product_name: "Kids' Shoes", size: '2C', color: 'Blue', sku: 'K-SHOE-BLU-2C', stock_qty: 6 },
  { product_name: "Kids' Shoes", size: '3C', color: 'Blue', sku: 'K-SHOE-BLU-3C', stock_qty: 6 },
  { product_name: "Kids' Shoes", size: '1C', color: 'Pink', sku: 'K-SHOE-PNK-1C', stock_qty: 6 },
  { product_name: "Kids' Shoes", size: '2C', color: 'Pink', sku: 'K-SHOE-PNK-2C', stock_qty: 6 },
  { product_name: "Kids' Shoes", size: '3C', color: 'Pink', sku: 'K-SHOE-PNK-3C', stock_qty: 6 },

  // Sports/Running Shoes
  { product_name: "Sports/Running Shoes", size: '7', color: 'Black', sku: 'S-SPOR-BLK-7', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '8', color: 'Black', sku: 'S-SPOR-BLK-8', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '9', color: 'Black', sku: 'S-SPOR-BLK-9', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '10', color: 'Black', sku: 'S-SPOR-BLK-10', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '7', color: 'White', sku: 'S-SPOR-WHT-7', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '8', color: 'White', sku: 'S-SPOR-WHT-8', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '9', color: 'White', sku: 'S-SPOR-WHT-9', stock_qty: 3 },
  { product_name: "Sports/Running Shoes", size: '10', color: 'White', sku: 'S-SPOR-WHT-10', stock_qty: 3 },

  // Canvas/School Shoes
  { product_name: "Canvas/School Shoes", size: '5', color: 'White', sku: 'C-SCH-WHT-5', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '6', color: 'White', sku: 'C-SCH-WHT-6', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '7', color: 'White', sku: 'C-SCH-WHT-7', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '8', color: 'White', sku: 'C-SCH-WHT-8', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '5', color: 'Black', sku: 'C-SCH-BLK-5', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '6', color: 'Black', sku: 'C-SCH-BLK-6', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '7', color: 'Black', sku: 'C-SCH-BLK-7', stock_qty: 15 },
  { product_name: "Canvas/School Shoes", size: '8', color: 'Black', sku: 'C-SCH-BLK-8', stock_qty: 15 },

  // Rubber/PVC Slippers
  { product_name: "Rubber/PVC Slippers", size: '6', color: 'Blue', sku: 'R-SLIP-BLU-6', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '7', color: 'Blue', sku: 'R-SLIP-BLU-7', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '8', color: 'Blue', sku: 'R-SLIP-BLU-8', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '9', color: 'Blue', sku: 'R-SLIP-BLU-9', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '10', color: 'Blue', sku: 'R-SLIP-BLU-10', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '6', color: 'Green', sku: 'R-SLIP-GRN-6', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '7', color: 'Green', sku: 'R-SLIP-GRN-7', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '8', color: 'Green', sku: 'R-SLIP-GRN-8', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '9', color: 'Green', sku: 'R-SLIP-GRN-9', stock_qty: 20 },
  { product_name: "Rubber/PVC Slippers", size: '10', color: 'Green', sku: 'R-SLIP-GRN-10', stock_qty: 20 },

  // Shoe Accessories
  { product_name: 'Shoe Accessories', size: 'Universal', color: 'Black', sku: 'A-ACC-BLK-U', stock_qty: 25 },
  { product_name: 'Shoe Accessories', size: 'Universal', color: 'White', sku: 'A-ACC-WHT-U', stock_qty: 25 },
];

export interface ShopPlaceholderConfig {
  productName: string;
  hsnCode: string;
  categoryName: string;
  supplierName: string;
  variantSize: string;
  variantColor: string;
  returnRemarks: string;
}

export const SHOP_PLACEHOLDERS: Record<ShopType, ShopPlaceholderConfig> = {
  clothing: {
    productName: "e.g. COTTON SAREE",
    hsnCode: "e.g. 5208 (Cotton Fabric)",
    categoryName: "e.g. Sarees, Shirts",
    supplierName: "e.g. SURAT TEXTILES MILL",
    variantSize: "e.g. S, M, L, XL, XXL",
    variantColor: "e.g. Red, Blue, Green",
    returnRemarks: "e.g. Return of 2 metres damaged fabric"
  },
  footwear: {
    productName: "e.g. MEN'S SPORTS RUNNING SHOES",
    hsnCode: "e.g. 6403 (Footwear HSN)",
    categoryName: "e.g. Sandals, Sports Shoes",
    supplierName: "e.g. BALAJI LEATHER CO.",
    variantSize: "e.g. 7, 8, 9, UK8",
    variantColor: "e.g. Black, Brown",
    returnRemarks: "e.g. Return of 1 pair defective shoes"
  },
  food: {
    productName: "e.g. CHICKEN BIRYANI",
    hsnCode: "e.g. 9963 (Restaurant HSN)",
    categoryName: "e.g. Starters, Main Course",
    supplierName: "e.g. METRO CASH & CARRY",
    variantSize: "e.g. Regular, Large, Family Pack",
    variantColor: "e.g. Spicy, Medium, Mild",
    returnRemarks: "e.g. Return of stale ingredient supplies"
  },
  grocery: {
    productName: "e.g. BASMATI RICE 5KG",
    hsnCode: "e.g. 1006 (Rice HSN)",
    categoryName: "e.g. Rice, Grains, Oils",
    supplierName: "e.g. WHOLESALE FOOD DISTRIBUTORS",
    variantSize: "e.g. 1kg, 5kg, 10kg",
    variantColor: "e.g. Standard",
    returnRemarks: "e.g. Return of expired bags"
  },
  pharmacy: {
    productName: "e.g. PARACETAMOL 650MG",
    hsnCode: "e.g. 3004 (Medicines HSN)",
    categoryName: "e.g. Tablets, Syrups, First Aid",
    supplierName: "e.g. SUN PHARMA DISTRIBUTORS",
    variantSize: "e.g. 10 Tablets, 100ml",
    variantColor: "e.g. Standard",
    returnRemarks: "e.g. Return of expired batch"
  },
  hardware: {
    productName: "e.g. PVC PIPE 3 INCH",
    hsnCode: "e.g. 3917 (PVC HSN)",
    categoryName: "e.g. Pipes, Cement, Tools",
    supplierName: "e.g. SHREE CEMENT LTD",
    variantSize: "e.g. 10ft, 20ft",
    variantColor: "e.g. Grey, White",
    returnRemarks: "e.g. Return of cracked pipes"
  },
  electronics: {
    productName: "e.g. USB TYPE-C CABLE",
    hsnCode: "e.g. 8544 (Cables HSN)",
    categoryName: "e.g. Accessories, Chargers",
    supplierName: "e.g. REDMI DISTRIBUTORS",
    variantSize: "e.g. 1m, 2m",
    variantColor: "e.g. Black, White, Red",
    returnRemarks: "e.g. Return of non-functional charger"
  },
  salon: {
    productName: "e.g. HAIR CUT & STYLING",
    hsnCode: "e.g. 9982 (Salon Services)",
    categoryName: "e.g. Hair Care, Skin Care",
    supplierName: "e.g. LOREAL PROFESSIONNEL",
    variantSize: "e.g. Short, Medium, Long",
    variantColor: "e.g. Natural Black, Brown",
    returnRemarks: "e.g. Return of unused cosmetic kits"
  },
  tailoring: {
    productName: "e.g. SUIT STITCHING SERVICE",
    hsnCode: "e.g. 9988 (Tailoring HSN)",
    categoryName: "e.g. Stitching, Alterations",
    supplierName: "e.g. BOMBAY DYEING MILL",
    variantSize: "e.g. Standard Fit, Custom Fit",
    variantColor: "e.g. Black, Blue, Grey",
    returnRemarks: "e.g. Return of extra unused threads"
  },
  fertilizer: {
    productName: "e.g. UREA 50KG",
    hsnCode: "e.g. 3102 (Urea HSN)",
    categoryName: "e.g. Fertilizers, Pesticides",
    supplierName: "e.g. IFFCO FERTILIZERS LTD",
    variantSize: "e.g. 50kg, 10kg",
    variantColor: "e.g. Standard",
    returnRemarks: "e.g. Return of 2 bags Urea"
  },
  other: {
    productName: "e.g. GENERAL ITEM",
    hsnCode: "e.g. 0000",
    categoryName: "e.g. General",
    supplierName: "e.g. APEX SUPPLIERS",
    variantSize: "e.g. S, M, L",
    variantColor: "e.g. Standard",
    returnRemarks: "e.g. Return of damaged goods"
  }
};

export function getShopPlaceholders(shopType?: string): ShopPlaceholderConfig {
  const type = (shopType || 'other') as ShopType;
  return SHOP_PLACEHOLDERS[type] || SHOP_PLACEHOLDERS.other;
}

