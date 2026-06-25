import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, entity_type, entity_id, entity_label, details } = body;

    await logAudit({
      shopId: ctx.shopId,
      actorUserId: ctx.userId,
      actorName: ctx.name,
      actorRole: ctx.role,
      action,
      entityType: entity_type,
      entityId: entity_id,
      entityLabel: entity_label,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/audit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
