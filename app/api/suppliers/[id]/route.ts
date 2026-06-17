import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Fetch supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Fetch purchase history
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .eq('supplier_id', id)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      return NextResponse.json({ error: purchasesError.message }, { status: 500 });
    }

    // Calculate aggregations
    let totalPurchased = 0;
    let totalItcEligible = 0;

    purchases.forEach((p) => {
      totalPurchased += parseFloat(p.total as any) || 0;
      if (p.itc_eligible) {
        totalItcEligible += parseFloat((p.total_cgst + p.total_sgst) as any) || 0;
      }
    });

    return NextResponse.json({
      supplier,
      purchases,
      totalPurchased,
      totalItcEligible,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const body = await request.json();
    const { name, gstin, phone, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    if (gstin && gstin.trim().length !== 15) {
      return NextResponse.json({ error: 'GSTIN must be exactly 15 characters' }, { status: 400 });
    }

    // Update
    const { data: supplier, error: updateError } = await supabase
      .from('suppliers')
      .update({
        name: name.trim(),
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
      })
      .eq('id', id)
      .eq('shop_id', shop.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('shop_id', shop.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
