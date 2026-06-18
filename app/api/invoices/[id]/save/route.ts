import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const ctx = await getCurrentUserContext(supabase);
    if (!ctx) {
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    if (!hasPermission(ctx.role, 'invoice.create')) {
      return NextResponse.json(
        { error: 'Forbidden' } satisfies ApiError,
        { status: 403 }
      );
    }

    // Fetch invoice for audit
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('id', id)
      .single();

    // Call save_invoice_tx RPC
    const { data: success, error: rpcError } = await supabase.rpc('save_invoice_tx', {
      p_invoice_id: id,
      p_user_id: ctx.userId,
    });

    if (rpcError) {
      console.error('RPC save_invoice_tx error:', rpcError);
      if (rpcError.message.includes('INSUFFICIENT_STOCK')) {
        const prodName = rpcError.message.split('INSUFFICIENT_STOCK: ')[1] || 'Product';
        return NextResponse.json(
          { error: `Insufficient stock for ${prodName}. Negative stock not allowed.` } satisfies ApiError,
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: rpcError.message || 'Failed to save invoice.' } satisfies ApiError,
        { status: 500 }
      );
    }

    logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'invoice.saved',
      entityType: 'invoice',
      entityId: id,
      entityLabel: invoice?.invoice_number || id,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in POST /api/invoices/[id]/save:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
