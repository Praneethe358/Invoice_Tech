// ─── Database Row Types ───────────────────────────────────────

export interface Shop {
  id: string;
  auth_user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url?: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  created_at: string;
  shop_type: string;
  gst_registered: boolean;
  gstin: string | null;
  business_type: string;
  inventory_enabled: boolean;
  onboarding_completed: boolean;
  subscription_status?: string;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  subscription_started_at?: string | null;
  subscription_notes?: string | null;
  next_credit_note_number?: number;
  next_debit_note_number?: number;
  credit_note_prefix?: string;
  debit_note_prefix?: string;
  whatsapp_invoices_sent?: number;
  is_frozen?: boolean;
  frozen_reason?: string | null;
  frozen_at?: string | null;
  frozen_by?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export type CustomerTag = 'regular' | 'vip';

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  tag: CustomerTag;
  total_invoices: number;
  total_spent: number;
  created_at: string;
  outstanding_balance?: number;
  gstin?: string | null;
  price_tier?: 'retail' | 'wholesale';
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  created_at: string;
  hsn_code?: string | null;
  gst_rate?: number;
  stock_qty?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  is_favorite?: boolean;
  category?: string | null;
  last_used_at?: string | null;
  use_count?: number;
  wholesale_price?: number | null;
  season_tag?: string | null;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Payment {
  id: string;
  invoice_id: string;
  shop_id: string;
  customer_phone: string;
  amount: number;
  payment_method: string;
  note?: string | null;
  paid_at: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  shop_id: string;
  invoice_number: string;
  customer_phone: string;
  customer_name?: string;
  customer_gstin?: string | null;
  payment_status: PaymentStatus;
  amount_paid: number;
  payment_note?: string | null;
  paid_at?: string | null;
  sent_reminders?: number;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  created_at: string;
  uses_items_table?: boolean;
  uses_payments_table?: boolean;
  subtotal?: number | null;
  total_cgst?: number;
  total_sgst?: number;
  total_gst?: number;
  sent_at?: string | null;
  sent_by?: string | null;
  delivery_status?: string | null;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;
  public_token?: string | null;
}

export type InvoiceStatus = 'draft' | 'saved' | 'sent' | 'cancelled' | 'failed';

// ─── Invoice Builder Types ────────────────────────────────────

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  hsn_code?: string | null;
  gst_rate?: number;
  cgst?: number;
  sgst?: number;
  line_total?: number;
  variant_id?: string | null;
}

// ─── API Request/Response Types ───────────────────────────────

export interface CreateInvoicePayload {
  items: InvoiceItem[];
  customer_phone: string;
  customer_name?: string;
  customer_gstin?: string;
  payment_status?: string;
  payment_method?: string;
  payment_note?: string;
  amount_paid?: number;
  status?: InvoiceStatus;
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

// ─── Phase 8 Database Row Types ───────────────────────────────

export interface Supplier {
  id: string;
  shop_id: string;
  name: string;
  gstin: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  total_purchases?: number;
  last_purchase_date?: string | null;
}

export interface Purchase {
  id: string;
  shop_id: string;
  supplier_id: string | null;
  supplier_name: string;
  supplier_gstin: string | null;
  purchase_invoice_number: string;
  purchase_date: string;
  subtotal: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_gst: number;
  total: number;
  itc_eligible: boolean;
  auto_update_stock: boolean;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  name: string;
  hsn_code: string | null;
  qty: number;
  unit: string;
  price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  line_total: number;
  created_at: string;
}

export interface CreditDebitNote {
  id: string;
  shop_id: string;
  invoice_id: string | null;
  note_type: 'credit' | 'debit';
  note_number: string;
  note_date: string;
  customer_phone: string;
  customer_name?: string;
  customer_gstin: string | null;
  reason: 'sales_return' | 'price_correction' | 'damaged_goods' | 'other' | 'additional_charges';
  reason_note: string | null;
  subtotal: number;
  total_cgst: number;
  total_sgst: number;
  total_gst: number;
  total: number;
  status: 'created' | 'sent';
  created_at: string;
}

export interface CDNItem {
  id: string;
  cdn_id: string;
  name: string;
  hsn_code: string | null;
  qty: number;
  price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  line_total: number;
  variant_id?: string | null;
  created_at: string;
}

// ─── Customer Ledger Module Types ─────────────────────────────

export interface PaymentTransaction {
  id: string;
  shop_id: string;
  customer_id: string;
  invoice_id: string | null;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  transaction_date: string;
  note: string | null;
  created_at: string;
}

export interface CustomerLedgerEntry {
  id: string;
  shop_id: string;
  customer_id: string;
  entry_type: 'debit' | 'credit';
  entry_date: string;
  reference_id: string;
  reference_type: 'invoice' | 'payment';
  invoice_number: string | null;
  particulars: string;
  debit_amount: number;
  credit_amount: number;
  running_balance?: number;
  created_at: string;
}

export interface CustomerStatementExport {
  id: string;
  shop_id: string;
  customer_id: string;
  export_type: 'csv' | 'pdf';
  date_range_start: string | null;
  date_range_end: string | null;
  records_count: number;
  outstanding_amount: number;
  created_at: string;
}

// ─── Phase 11 — Staff & Audit Types ──────────────────────────

export interface Staff {
  id: string;
  shop_id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: 'admin' | 'billing_staff' | 'view_only';
  status: 'invited' | 'active' | 'deactivated';
  invite_token: string | null;
  invite_sent_at: string | null;
  joined_at: string | null;
  created_at: string;
  passcode?: string | null;
}

export interface AuditLog {
  id: string;
  shop_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock_qty: number;
  low_stock_threshold: number;
  created_at: string;
  barcode?: string | null;
  barcode_source?: 'scanned' | 'generated' | null;
  cost_price?: number | null;
  min_selling_price?: number | null;
}
