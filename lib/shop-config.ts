import { ShopType } from './starter-catalogs';

export interface ShopTypeConfig {
  inventoryEnabled: boolean;
  showBarcode: boolean;
  showBundles: boolean;
  categoryLabels: string;
  itemLabel: string;
  defaultCategories: string[];
  stockUnit: string | null;
  stockUnitShort: string | null;
}

export const SHOP_CONFIG: Record<ShopType, ShopTypeConfig> = {
  clothing: {
    inventoryEnabled: true,
    showBarcode: false,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [
      'Sarees',
      'Blouses',
      'Kurtаs',
      'Lehengas',
      'Fabric',
      'Accessories',
      'Kids Wear',
      'Others',
    ],
    stockUnit: 'pieces',
    stockUnitShort: 'pcs',
  },

  tailoring: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Service Types',
    itemLabel: 'Services',
    defaultCategories: [
      'Stitching',
      'Alterations',
      'Embroidery',
      'Finishing',
      'Others',
    ],
    stockUnit: null,
    stockUnitShort: null,
  },

  fertilizer: {
    inventoryEnabled: true,
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [
      'Fertilizers',
      'Pesticides',
      'Herbicides',
      'Seeds',
      'Tools & Equipment',
      'Others',
    ],
    stockUnit: 'bags',
    stockUnitShort: 'bags',
  },

  grocery: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: [
      'Grains & Pulses',
      'Oils & Ghee',
      'Spices',
      'Beverages',
      'Snacks',
      'Dairy',
      'Others',
    ],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },

  pharmacy: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Medicines',
    defaultCategories: [
      'Tablets',
      'Syrups',
      'Ointments',
      'Surgical',
      'Vitamins',
      'Injections',
      'Others',
    ],
    stockUnit: 'strips/bottles',
    stockUnitShort: 'units',
  },

  hardware: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: [
      'Cement & Steel',
      'Pipes & Fittings',
      'Electrical',
      'Paint',
      'Tools',
      'Plywood',
      'Others',
    ],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },

  food: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: true,
    categoryLabels: 'Menu Sections',
    itemLabel: 'Menu Items',
    defaultCategories: [
      'Tiffin',
      'Meals',
      'Beverages',
      'Sweets',
      'Combos',
      'Extras',
    ],
    stockUnit: null,
    stockUnitShort: null,
  },

  electronics: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [
      'Phones',
      'Accessories',
      'Cables & Chargers',
      'Audio',
      'Repair Services',
      'Others',
    ],
    stockUnit: 'pieces',
    stockUnitShort: 'pcs',
  },

  salon: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: true,
    categoryLabels: 'Service Types',
    itemLabel: 'Services',
    defaultCategories: [
      'Hair',
      'Skin',
      'Nails',
      'Bridal',
      'Packages',
      'Others',
    ],
    stockUnit: null,
    stockUnitShort: null,
  },

  other: {
    inventoryEnabled: false, // shop owner enables manually
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: ['General', 'Others'],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },
};
