import { InvoiceItem } from './types';

/**
 * Validates a 10-digit Indian mobile number.
 * Accepts digits only, must start with 6-9.
 */
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates invoice items. Returns error message or null if valid.
 */
export function validateInvoiceItems(
  items: InvoiceItem[]
): string | null {
  if (!items || items.length === 0) {
    return 'At least one item is required';
  }

  for (const item of items) {
    if (!item.name || item.name.trim().length === 0) {
      return 'Item name cannot be empty';
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return `Invalid price for "${item.name}"`;
    }
    if (
      typeof item.quantity !== 'number' ||
      item.quantity < 1 ||
      !Number.isInteger(item.quantity)
    ) {
      return `Invalid quantity for "${item.name}"`;
    }
  }

  return null;
}

/**
 * Validates signup form fields. Returns error message or null.
 */
export function validateSignup(data: {
  email: string;
  password: string;
  shop_name: string;
}): string | null {
  if (!data.email || !validateEmail(data.email)) {
    return 'Please enter a valid email address';
  }
  if (!data.password || data.password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (!data.shop_name || data.shop_name.trim().length < 2) {
    return 'Shop name must be at least 2 characters';
  }
  return null;
}
