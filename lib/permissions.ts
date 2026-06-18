// ─── Role & Permission System ─────────────────────────────────
// Single source of truth for what each role can do in TruBill.

export type UserRole = 'owner' | 'admin' | 'billing_staff' | 'view_only';

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  billing_staff: 'Billing Staff',
  view_only: 'View Only',
};

export const PERMISSIONS = {
  // Invoices
  'invoice.create':     ['owner', 'admin', 'billing_staff'],
  'invoice.send':       ['owner', 'admin', 'billing_staff'],
  'invoice.view':       ['owner', 'admin', 'billing_staff', 'view_only'],
  'invoice.delete':     ['owner', 'admin'],

  // Payments
  'payment.record':     ['owner', 'admin', 'billing_staff'],
  'payment.delete':     ['owner', 'admin'],
  'payment.view':       ['owner', 'admin', 'billing_staff', 'view_only'],

  // Customers
  'customer.create':    ['owner', 'admin', 'billing_staff'],
  'customer.edit':      ['owner', 'admin', 'billing_staff'],
  'customer.delete':    ['owner', 'admin'],
  'customer.view':      ['owner', 'admin', 'billing_staff', 'view_only'],

  // Products / Catalog
  'product.create':     ['owner', 'admin'],
  'product.edit':       ['owner', 'admin'],
  'product.delete':     ['owner', 'admin'],
  'product.view':       ['owner', 'admin', 'billing_staff', 'view_only'],
  'product.price_edit': ['owner', 'admin'],

  // Purchases
  'purchase.create':    ['owner', 'admin', 'billing_staff'],
  'purchase.edit':      ['owner', 'admin'],
  'purchase.delete':    ['owner', 'admin'],
  'purchase.view':      ['owner', 'admin', 'billing_staff', 'view_only'],

  // Inventory
  'inventory.restock':  ['owner', 'admin'],
  'inventory.view':     ['owner', 'admin', 'billing_staff', 'view_only'],

  // Reports
  'reports.view':       ['owner', 'admin'],
  'reports.export':     ['owner', 'admin'],

  // GST
  'gst.view':           ['owner', 'admin'],
  'gst.export':         ['owner', 'admin'],

  // Credit/Debit notes
  'cdn.create':         ['owner', 'admin'],
  'cdn.view':           ['owner', 'admin', 'billing_staff', 'view_only'],

  // Settings
  'settings.shop':      ['owner'],
  'settings.catalog':   ['owner', 'admin'],
  'settings.gst':       ['owner'],

  // Staff management
  'staff.invite':       ['owner'],
  'staff.edit':         ['owner'],
  'staff.deactivate':   ['owner'],
  'staff.view':         ['owner', 'admin'],

  // Audit log
  'audit.view':         ['owner', 'admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

/**
 * Get all permissions for a given role.
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter(
    (perm) => hasPermission(role, perm)
  );
}
