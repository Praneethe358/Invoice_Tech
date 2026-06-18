import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { ROLE_LABELS, UserRole } from '@/lib/permissions';

// PATCH /api/staff/[id]/role — change staff role
export async function PATCH(
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

    const body = await request.json();
    const { role } = body;

    const validRoles = ['admin', 'billing_staff', 'view_only'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get current staff data
    const { data: staff } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('shop_id', ctx.shopId)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const oldRole = staff.role;

    const { error: updateError } = await supabase
      .from('staff')
      .update({ role })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'staff.role_changed',
      entityType: 'staff',
      entityId: id,
      entityLabel: staff.name,
      details: {
        before: ROLE_LABELS[oldRole as UserRole],
        after: ROLE_LABELS[role as UserRole],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/staff/[id]/role error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
