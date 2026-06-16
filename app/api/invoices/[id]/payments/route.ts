import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // 2. Fetch invoice and verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, shops(auth_user_id)')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership
    const shopOwnerId = (invoice.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to invoice data' }, { status: 403 });
    }

    // 3. Fetch explicit payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('paid_at', { ascending: false });

    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    // 4. Calculate total paid and balance due with legacy compatibility
    const total = Number(invoice.total);
    const usesPayments = invoice.uses_payments_table;
    const dbPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    const total_paid = usesPayments ? dbPaid : Number(invoice.amount_paid || 0);
    const balance_due = Math.max(0, total - total_paid);

    return NextResponse.json({
      success: true,
      uses_payments_table: usesPayments,
      total_paid,
      balance_due,
      payments: payments || [],
    });
  } catch (err) {
    console.error('Invoice payments API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve invoice payments' },
      { status: 500 }
    );
  }
}
