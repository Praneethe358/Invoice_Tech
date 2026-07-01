import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      name,
      phone,
      shop_type,
      gst_registered,
      gstin,
      business_type,
      inventory_enabled,
      state,
    } = body;

    if (!name || !phone || !shop_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phone, shop_type' },
        { status: 400 }
      );
    }

    // 3. Use admin client (bypasses RLS) to insert the shop
    let adminSupabase;
    try {
      adminSupabase = createAdminClient();
    } catch (envErr) {
      console.error('Admin client init failed:', envErr);
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Check if user already owns a shop
    const { data: existingShop } = await adminSupabase
      .from('shops')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingShop) {
      return NextResponse.json(
        { id: existingShop.id, alreadyExists: true },
        { status: 200 }
      );
    }

    const trialEndsAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Build insert payload — only include columns that exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopRow: Record<string, any> = {
      auth_user_id: user.id,
      name,
      phone,
      shop_type,
      gst_registered: gst_registered ?? false,
      gstin: gstin || null,
      business_type: business_type || 'products',
      inventory_enabled: inventory_enabled ?? false,
      onboarding_completed: true,
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt,
    };

    // Only include state if provided (column may not exist on older schemas)
    if (state) {
      shopRow.state = state;
    }

    const { data: newShop, error: shopError } = await adminSupabase
      .from('shops')
      .insert(shopRow)
      .select('id')
      .single();

    if (shopError || !newShop) {
      console.error('Shop creation failed:', JSON.stringify(shopError));

      // If the error is about missing column, retry without that column
      if (shopError?.message?.includes('state')) {
        delete shopRow.state;
        const { data: retryShop, error: retryError } = await adminSupabase
          .from('shops')
          .insert(shopRow)
          .select('id')
          .single();

        if (retryError || !retryShop) {
          console.error('Shop creation retry failed:', JSON.stringify(retryError));
          return NextResponse.json(
            { error: retryError?.message || 'Failed to create shop' },
            { status: 500 }
          );
        }
        return NextResponse.json({ id: retryShop.id }, { status: 201 });
      }

      return NextResponse.json(
        { error: shopError?.message || 'Failed to create shop' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: newShop.id }, { status: 201 });
  } catch (err) {
    console.error('Create shop API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
