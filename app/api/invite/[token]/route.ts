import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/invite/[token] — validate invite token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: staff, error } = await admin
      .from('staff')
      .select('id, name, email, role, status, shop_id, invited_at')
      .eq('invite_token', token)
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    if (staff.status !== 'invited') {
      return NextResponse.json(
        { error: 'This invite has already been used or expired' },
        { status: 400 }
      );
    }

    const invitedTime = new Date(staff.invited_at).getTime();
    if (Date.now() - invitedTime > 48 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please request a new invite.' },
        { status: 400 }
      );
    }

    // Get shop info
    const { data: shop } = await admin
      .from('shops')
      .select('name, auth_user_id')
      .eq('id', staff.shop_id)
      .single();

    // Get owner name
    let ownerName = 'Shop Owner';
    if (shop?.auth_user_id) {
      const { data: ownerShop } = await admin
        .from('shops')
        .select('name')
        .eq('auth_user_id', shop.auth_user_id)
        .single();
      if (ownerShop) ownerName = ownerShop.name;
    }

    return NextResponse.json({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      shop: {
        name: shop?.name || 'Unknown Shop',
      },
      ownerName,
    });
  } catch (err) {
    console.error('GET /api/invite/[token] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
