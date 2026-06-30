import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import { getCurrentUserContext } from '@/lib/current-user';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const context = await getCurrentUserContext(supabase);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', context.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const context = await getCurrentUserContext(supabase);
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', context.shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, phone, gstin, tag, price_tier } = body;

    const sanitizedName = sanitizeText(name, 100);
    const sanitizedGstin = sanitizeText(gstin, 15);
    const sanitizedPhone = sanitizeText(phone, 15);

    if (!sanitizedName) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }

    // Phone / WhatsApp validation: must be 10 digits
    if (!sanitizedPhone) {
      return NextResponse.json({ error: 'WhatsApp number is required.' }, { status: 400 });
    }
    const cleanPhone = sanitizedPhone.replace(/\D/g, '');
    const last10Digits = cleanPhone.slice(-10);
    if (last10Digits.length !== 10 || !/^[6-9]\d{9}$/.test(last10Digits)) {
      return NextResponse.json({ error: 'WhatsApp number must be exactly 10 digits and start with 6-9.' }, { status: 400 });
    }

    // GSTIN validation: exactly 15 characters, valid format
    if (sanitizedGstin) {
      const gstinUpper = sanitizedGstin.toUpperCase().trim();
      if (gstinUpper.length !== 15) {
        return NextResponse.json({ error: 'GSTIN must be exactly 15 characters.' }, { status: 400 });
      }
      const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
      if (!gstinRegex.test(gstinUpper)) {
        return NextResponse.json({ error: 'Invalid GSTIN format. Must match standard Indian 15-digit GSTIN (e.g. 33AABCS1429B1ZB).' }, { status: 400 });
      }
    }

    // Duplicate Phone check
    const { data: phoneDuplicate } = await supabase
      .from('customers')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('phone', last10Digits)
      .maybeSingle();

    if (phoneDuplicate) {
      return NextResponse.json({ error: 'Customer with this phone number already exists.' }, { status: 400 });
    }

    // Duplicate GSTIN check
    if (sanitizedGstin) {
      const gstinUpper = sanitizedGstin.toUpperCase().trim();
      const { data: gstinDuplicate } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', shop.id)
        .eq('gstin', gstinUpper)
        .maybeSingle();

      if (gstinDuplicate) {
        return NextResponse.json({ error: 'Customer with this GSTIN already exists.' }, { status: 400 });
      }
    }

    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        shop_id: shop.id,
        name: sanitizedName,
        phone: last10Digits,
        gstin: sanitizedGstin ? sanitizedGstin.toUpperCase().trim() : null,
        tag: tag || 'regular',
        price_tier: price_tier || 'retail',
        total_invoices: 0,
        total_spent: 0,
        outstanding_balance: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
