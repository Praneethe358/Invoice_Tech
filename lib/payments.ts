import { createAdminClient } from './supabase/admin';

// Get total paid for an invoice from payments table
export async function getInvoicePaid(invoiceId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId);
  return data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
}

// Get balance due for an invoice
export async function getInvoiceBalance(
  invoiceId: string,
  invoiceTotal: number
): Promise<number> {
  const paid = await getInvoicePaid(invoiceId);
  return Math.max(0, invoiceTotal - paid);
}

// Recompute and update invoice payment_status based on payments
export async function syncInvoicePaymentStatus(
  invoiceId: string,
  invoiceTotal: number
): Promise<void> {
  const paid = await getInvoicePaid(invoiceId);
  let payment_status = 'unpaid';
  if (paid >= invoiceTotal) {
    payment_status = 'paid';
  } else if (paid > 0) {
    payment_status = 'partial';
  }

  const supabase = createAdminClient();
  await supabase
    .from('invoices')
    .update({
      payment_status,
      amount_paid: paid, // keep in sync for backward compat
      paid_at: payment_status === 'paid' ? new Date().toISOString() : null
    })
    .eq('id', invoiceId);
}

// Recompute customer outstanding balance
export async function syncCustomerOutstanding(
  shopId: string,
  customerPhone: string
): Promise<void> {
  const supabase = createAdminClient();

  // Get all sent invoices for this customer
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total')
    .eq('shop_id', shopId)
    .eq('customer_phone', customerPhone)
    .eq('status', 'sent');

  if (!invoices) return;

  // Get all payments for these invoices
  let totalPaid = 0;
  let totalBilled = 0;
  for (const inv of invoices) {
    totalBilled += Number(inv.total);
    totalPaid += await getInvoicePaid(inv.id);
  }

  await supabase
    .from('customers')
    .update({ outstanding_balance: Math.max(0, totalBilled - totalPaid) })
    .eq('shop_id', shopId)
    .eq('phone', customerPhone);
}
