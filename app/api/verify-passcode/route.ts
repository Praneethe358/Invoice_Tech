import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { passcode } = body;

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode is required' }, { status: 400 });
    }

    // 1. Check shop owner passcode
    const { data: shop } = await supabase
      .from('shops')
      .select('passcode, auth_user_id, name')
      .eq('id', ctx.shopId)
      .single();

    if (shop) {
      const ownerPasscode = shop.passcode;
      // If passcode is set and matches, OR if no passcode is set and entered passcode is '123456'
      if ((ownerPasscode && ownerPasscode.trim() === passcode.trim()) || 
          (!ownerPasscode && passcode.trim() === '123456')) {
        return NextResponse.json({
          success: true,
          authorizedBy: {
            name: `${shop.name} (Owner)`,
            role: 'owner',
            userId: shop.auth_user_id,
          }
        });
      }
    }

    // 2. Check active admin/manager staff passcodes
    const { data: adminStaff } = await supabase
      .from('staff')
      .select('id, name, passcode, auth_user_id')
      .eq('shop_id', ctx.shopId)
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminStaff && adminStaff.length > 0) {
      for (const member of adminStaff) {
        const memberPasscode = member.passcode;
        if ((memberPasscode && memberPasscode.trim() === passcode.trim()) ||
            (!memberPasscode && passcode.trim() === '123456')) {
          return NextResponse.json({
            success: true,
            authorizedBy: {
              name: member.name,
              role: 'admin',
              userId: member.auth_user_id,
              staffId: member.id,
            }
          });
        }
      }
    }

    return NextResponse.json({ error: 'Invalid passcode' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/verify-passcode error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
