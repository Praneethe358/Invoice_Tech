import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';

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

    // Fetch suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('shop_id', shop.id)
      .order('name', { ascending: true });

    if (suppliersError) {
      return NextResponse.json({ error: suppliersError.message }, { status: 500 });
    }

    // Fetch all purchases to aggregate data
    const { data: purchases } = await supabase
      .from('purchases')
      .select('supplier_id, total, purchase_date')
      .eq('shop_id', shop.id);

    // Group purchases by supplier_id
    const supplierStats: { [supplierId: string]: { total: number; lastDate: string | null } } = {};
    if (purchases) {
      purchases.forEach((p) => {
        if (!p.supplier_id) return;
        if (!supplierStats[p.supplier_id]) {
          supplierStats[p.supplier_id] = { total: 0, lastDate: null };
        }
        supplierStats[p.supplier_id].total += parseFloat(p.total as any) || 0;
        
        const dateStr = p.purchase_date;
        if (!supplierStats[p.supplier_id].lastDate || dateStr > supplierStats[p.supplier_id].lastDate!) {
          supplierStats[p.supplier_id].lastDate = dateStr;
        }
      });
    }

    // Map stats back to suppliers
    const enrichedSuppliers = suppliers.map((sup) => ({
      ...sup,
      total_purchases: supplierStats[sup.id]?.total || 0,
      last_purchase_date: supplierStats[sup.id]?.lastDate || null,
    }));

    return NextResponse.json(enrichedSuppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, gstin, phone, address } = body;

    const sanitizedName = sanitizeText(name, 100);
    const sanitizedGstin = sanitizeText(gstin, 15);
    const sanitizedPhone = sanitizeText(phone, 15);
    const sanitizedAddress = sanitizeText(address, 250);

    if (!sanitizedName) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    if (sanitizedGstin && sanitizedGstin.length !== 15) {
      return NextResponse.json({ error: 'GSTIN must be exactly 15 characters' }, { status: 400 });
    }

    const { data: supplier, error: insertError } = await supabase
      .from('suppliers')
      .insert({
        shop_id: shop.id,
        name: sanitizedName,
        gstin: sanitizedGstin ? sanitizedGstin.toUpperCase() : null,
        phone: sanitizedPhone || null,
        address: sanitizedAddress || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
