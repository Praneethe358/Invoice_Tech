import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

// POST /api/staff/[id]/deactivate — deactivate staff
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

    if (!hasPermission(ctx.role, 'staff.deactivate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get staff
    const { data: staff } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('shop_id', ctx.shopId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('staff')
      .update({ status: 'deactivated' })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'staff.deactivated',
      entityType: 'staff',
      entityId: id,
      entityLabel: staff.name,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/staff/[id]/deactivate error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
