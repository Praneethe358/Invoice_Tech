import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

// POST /api/staff/[id]/reactivate — reactivate deactivated staff
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(ctx.role, 'staff.edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('shop_id', ctx.shopId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (staff.status !== 'deactivated') {
      return NextResponse.json({ error: 'Staff member is not deactivated' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('staff')
      .update({ status: staff.auth_user_id ? 'active' : 'invited' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/staff/[id]/reactivate error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
