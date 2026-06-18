import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInvoicePaid, syncInvoicePaymentStatus, syncCustomerOutstanding } from '@/lib/payments';
import { logAudit } from '@/lib/audit';
import { getCurrentUserContext } from '@/lib/current-user';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { invoice_id, amount: rawAmount, payment_method, note, paid_at } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    const amount = Number(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // 3. Fetch invoice and verify shop ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, shops(auth_user_id)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership
    const shopOwnerId = (invoice.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to shop data' }, { status: 403 });
    }

    // 4. Calculate balance due
    const invoiceTotal = Number(invoice.total);
    const totalPaid = await getInvoicePaid(invoice_id);
    const balanceDue = Math.max(0, invoiceTotal - totalPaid);

    // Rounding safety check (epsilon tolerance)
    if (amount > balanceDue + 0.01) {
      return NextResponse.json(
        { error: `Payment amount ₹${amount} exceeds balance due ₹${balanceDue.toFixed(2)}` },
        { status: 400 }
      );
    }

    // 4.5 Migrate legacy payments if uses_payments_table is false and amount_paid > 0
    if (!invoice.uses_payments_table && Number(invoice.amount_paid) > 0) {
      const { error: migrateErr } = await supabase
        .from('payments')
        .insert({
          invoice_id,
          shop_id: invoice.shop_id,
          customer_phone: invoice.customer_phone,
          amount: Number(invoice.amount_paid),
          payment_method: 'cash',
          note: 'Migrated payment',
          paid_at: invoice.paid_at || invoice.created_at,
        });
      if (migrateErr) {
        return NextResponse.json({ error: 'Failed to migrate legacy payment details: ' + migrateErr.message }, { status: 500 });
      }
    }

    // 5. Insert payment record
    const { data: newPayment, error: insertError } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        shop_id: invoice.shop_id,
        customer_phone: invoice.customer_phone,
        amount,
        payment_method: payment_method || 'cash',
        note: note?.trim() || null,
        paid_at: paid_at ? new Date(paid_at).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 6. Set invoice flag (uses_payments_table = true) on new payments
    await supabase
      .from('invoices')
      .update({ uses_payments_table: true })
      .eq('id', invoice_id);

    // 7. Sync invoice and customer state
    await syncInvoicePaymentStatus(invoice_id, invoiceTotal);
    await syncCustomerOutstanding(invoice.shop_id, invoice.customer_phone);

    // 8. Fetch updated statistics to return
    const updatedPaid = await getInvoicePaid(invoice_id);
    const updatedBalance = Math.max(0, invoiceTotal - updatedPaid);

    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('payment_status')
      .eq('id', invoice_id)
      .single();

    // Audit log (fire-and-forget)
    const ctx = await getCurrentUserContext(supabase);
    if (ctx) {
      logAudit({
        shopId: invoice.shop_id,
        actorUserId: ctx.userId,
        actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
        actorRole: ctx.role,
        action: 'payment.recorded',
        entityType: 'payment',
        entityId: newPayment.id,
        entityLabel: invoice.invoice_number || invoice_id,
        details: {
          amount,
          payment_method: payment_method || 'cash',
          total_paid: updatedPaid,
          balance_due: updatedBalance,
          payment_status: updatedInvoice?.payment_status || 'unpaid',
        },
      });
    }

    return NextResponse.json({
      success: true,
      total_paid: updatedPaid,
      balance_due: updatedBalance,
      payment_status: updatedInvoice?.payment_status || 'unpaid',
      payment: newPayment,
    });
  } catch (err) {
    console.error('Record payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
}
