import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { randomUUID } from 'crypto';

// GET /api/staff — list staff for the shop
export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(ctx.role, 'staff.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('shop_id', ctx.shopId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ staff: staff ?? [] });
  } catch (err) {
    console.error('GET /api/staff error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/staff — invite a new staff member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(ctx.role, 'staff.invite')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const validRoles = ['admin', 'billing_staff', 'view_only'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if email already invited for this shop
    const { data: existing } = await supabase
      .from('staff')
      .select('id, status')
      .eq('shop_id', ctx.shopId)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing && existing.status !== 'deactivated') {
      return NextResponse.json(
        { error: 'A staff member with this email already exists' },
        { status: 409 }
      );
    }

    const inviteToken = randomUUID();

    const { data: newStaff, error: insertError } = await supabase
      .from('staff')
      .insert({
        shop_id: ctx.shopId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        status: 'invited',
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Staff invite insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: `${ctx.name} (${ctx.isOwner ? 'Owner' : ctx.role})`,
      actorRole: ctx.role,
      action: 'staff.invited',
      entityType: 'staff',
      entityId: newStaff.id,
      entityLabel: name.trim(),
      details: { email: email.toLowerCase().trim(), role },
    });

    return NextResponse.json({
      staff: newStaff,
      inviteUrl: `/invite/${inviteToken}`,
    });
  } catch (err) {
    console.error('POST /api/staff error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
