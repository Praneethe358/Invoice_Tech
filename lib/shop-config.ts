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
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [],
    stockUnit: 'pieces',
    stockUnitShort: 'pcs',
  },

  footwear: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [],
    stockUnit: 'pairs',
    stockUnitShort: 'prs',
  },

  tailoring: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Service Types',
    itemLabel: 'Services',
    defaultCategories: [],
    stockUnit: null,
    stockUnitShort: null,
  },

  fertilizer: {
    inventoryEnabled: true,
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [],
    stockUnit: 'bags',
    stockUnitShort: 'bags',
  },

  grocery: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: [],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },

  pharmacy: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: true,
    categoryLabels: 'Categories',
    itemLabel: 'Medicines',
    defaultCategories: [],
    stockUnit: 'strips/bottles',
    stockUnitShort: 'units',
  },

  hardware: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: [],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },

  food: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: true,
    categoryLabels: 'Menu Sections',
    itemLabel: 'Menu Items',
    defaultCategories: [],
    stockUnit: null,
    stockUnitShort: null,
  },

  electronics: {
    inventoryEnabled: true,
    showBarcode: true,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Products',
    defaultCategories: [],
    stockUnit: 'pieces',
    stockUnitShort: 'pcs',
  },

  salon: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: true,
    categoryLabels: 'Service Types',
    itemLabel: 'Services',
    defaultCategories: [],
    stockUnit: null,
    stockUnitShort: null,
  },

  other: {
    inventoryEnabled: false,
    showBarcode: false,
    showBundles: false,
    categoryLabels: 'Categories',
    itemLabel: 'Items',
    defaultCategories: [],
    stockUnit: 'units',
    stockUnitShort: 'units',
  },
};
