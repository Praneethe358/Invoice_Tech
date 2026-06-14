// ─── Database Row Types ───────────────────────────────────────

export interface Shop {
  id: string;
  auth_user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  shop_id: string;
  invoice_number: string;
  customer_phone: string;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  created_at: string;
}

export type InvoiceStatus = 'created' | 'sent' | 'failed';

// ─── Invoice Builder Types ────────────────────────────────────

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

// ─── API Request/Response Types ───────────────────────────────

export interface CreateInvoicePayload {
  items: InvoiceItem[];
  customer_phone: string;
}

export interface CreateInvoiceResponse {
  id: string;
  invoice_number: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

// ─── Signup Types ─────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  shop_name: string;
  address?: string;
  phone?: string;
}

// ─── WhatsApp API Types ───────────────────────────────────────

export interface WhatsAppMediaResponse {
  id: string;
}

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}
