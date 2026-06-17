import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { data: notes, error: notesError } = await supabase
      .from('credit_debit_notes')
      .select('*, invoices(invoice_number)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (notesError) {
      return NextResponse.json({ error: notesError.message }, { status: 500 });
    }

    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
