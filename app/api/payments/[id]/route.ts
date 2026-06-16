import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInvoicePaid, syncInvoicePaymentStatus, syncCustomerOutstanding } from '@/lib/payments';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // 2. Fetch payment record with relationships to verify ownership and grab context
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, shops(auth_user_id), invoices(total, customer_phone)')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Verify ownership
    const shopOwnerId = (payment.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to shop data' }, { status: 403 });
    }

    const { invoice_id, shop_id, customer_phone } = payment;
    const invoiceTotal = Number((payment.invoices as any)?.total || 0);

    // 3. Delete payment record
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 4. Sync invoice and customer states
    await syncInvoicePaymentStatus(invoice_id, invoiceTotal);
    await syncCustomerOutstanding(shop_id, customer_phone);

    // 5. Fetch updated stats to return
    const updatedPaid = await getInvoicePaid(invoice_id);
    const updatedBalance = Math.max(0, invoiceTotal - updatedPaid);

    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('payment_status')
      .eq('id', invoice_id)
      .single();

    return NextResponse.json({
      success: true,
      total_paid: updatedPaid,
      balance_due: updatedBalance,
      payment_status: updatedInvoice?.payment_status || 'unpaid',
    });
  } catch (err) {
    console.error('Delete payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
