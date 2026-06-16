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

    // 2. Fetch customer details and verify shop ownership
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*, shops(auth_user_id)')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify ownership
    const shopOwnerId = (customer.shops as any)?.auth_user_id;
    if (shopOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to customer data' }, { status: 403 });
    }

    // 3. Fetch all sent/paid invoices for this customer
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', customer.shop_id)
      .eq('customer_phone', customer.phone)
      .in('status', ['sent', 'paid']) // sent or paid
      .order('created_at', { ascending: true }); // oldest first to compute running balance

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 });
    }

    // 4. Fetch all explicit payment records for this customer's invoices
    const invoiceIds = invoices?.map((inv) => inv.id) || [];
    let payments: any[] = [];

    if (invoiceIds.length > 0) {
      const { data: dbPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('invoice_id', invoiceIds)
        .order('paid_at', { ascending: true });

      if (paymentsError) {
        return NextResponse.json({ error: paymentsError.message }, { status: 500 });
      }
      payments = dbPayments || [];
    }

    // 5. Construct transaction timeline
    const timeline: any[] = [];
    let totalBilled = 0;
    let totalPaid = 0;

    // Map invoices to timeline
    invoices.forEach((inv) => {
      const amount = Number(inv.total);
      totalBilled += amount;

      timeline.push({
        type: 'invoice',
        id: inv.id,
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        amount,
        date: inv.created_at,
      });

      // Handle legacy invoices: if they don't use payments table but have amount_paid,
      // represent this as an implicit payment entry in the ledger.
      if (!inv.uses_payments_table && Number(inv.amount_paid) > 0) {
        const implicitAmt = Number(inv.amount_paid);
        totalPaid += implicitAmt;

        timeline.push({
          type: 'payment',
          id: `implicit-${inv.id}`,
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          amount: implicitAmt,
          payment_method: 'cash',
          note: 'Migrated payment',
          date: inv.paid_at || inv.created_at,
          isImplicit: true,
        });
      }
    });

    // Map explicit payments to timeline
    payments.forEach((p) => {
      const amount = Number(p.amount);
      totalPaid += amount;

      const matchedInvoice = invoices.find((inv) => inv.id === p.invoice_id);
      timeline.push({
        type: 'payment',
        id: p.id,
        invoice_id: p.invoice_id,
        invoice_number: matchedInvoice?.invoice_number || 'INV',
        amount,
        payment_method: p.payment_method,
        note: p.note,
        date: p.paid_at,
      });
    });

    // 6. Sort timeline chronologically (oldest first)
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 7. Calculate running balance chronologically
    let runningBalance = 0;
    timeline.forEach((entry) => {
      if (entry.type === 'invoice') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      entry.running_balance = runningBalance;
    });

    // 8. Reverse timeline to return newest first
    timeline.reverse();

    return NextResponse.json({
      success: true,
      total_billed: totalBilled,
      total_paid: totalPaid,
      outstanding: Math.max(0, totalBilled - totalPaid),
      entries: timeline,
    });
  } catch (err) {
    console.error('Customer ledger API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to retrieve customer ledger' },
      { status: 500 }
    );
  }
}
