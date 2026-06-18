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

    // Call save_invoice_tx RPC
    const { data: success, error: rpcError } = await supabase.rpc('save_invoice_tx', {
      p_invoice_id: id,
      p_user_id: user.id,
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in POST /api/invoices/[id]/save:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' } satisfies ApiError,
      { status: 500 }
    );
  }
}
