import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' } satisfies ApiError,
        { status: 401 }
      );
    }

    // Get cancel reason from body
    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || 'Cancelled by user';

    // Call cancel_invoice_tx RPC
    const { data: success, error: rpcError } = await supabase.rpc('cancel_invoice_tx', {
      p_invoice_id: id,
      p_user_id: user.id,
      p_reason: reason,
    });

    if (rpcError) {
      console.error('RPC cancel_invoice_tx error:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Failed to cancel invoice.' } satisfies ApiError,
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in POST /api/invoices/[id]/cancel:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
