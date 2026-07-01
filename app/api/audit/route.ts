import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ctx = await getCurrentUserContext(supabase);

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(ctx.role, 'audit.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25; // page size 25
    const entityType = searchParams.get('entity_type') || 'all';
    const actorId = searchParams.get('actor_id') || 'all';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    const from = (page - 1) * limit;
    const to = page * limit - 1;

    let query = supabase
      .from('audit_logs')
      .select('id, shop_id, actor_user_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, details, created_at', { count: 'exact' })
      .eq('shop_id', ctx.shopId);

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    if (actorId !== 'all') {
      query = query.eq('actor_user_id', actorId);
    }

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`action.ilike.%${q}%,actor_name.ilike.%${q}%,entity_label.ilike.%${q}%`);
    }

    if (startDate) {
      query = query.gte('created_at', startDate + 'T00:00:00Z');
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59Z');
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the list of unique actors for this shop
    const { data: actorsData } = await supabase
      .from('audit_logs')
      .select('actor_user_id, actor_name, actor_role')
      .eq('shop_id', ctx.shopId);

    const uniqueActorsMap = new Map();
    if (actorsData) {
      actorsData.forEach((a) => {
        if (a.actor_user_id) {
          uniqueActorsMap.set(a.actor_user_id, {
            actor_user_id: a.actor_user_id,
            actor_name: a.actor_name,
            actor_role: a.actor_role,
          });
        }
      });
    }
    const actorsList = Array.from(uniqueActorsMap.values());

    const total = count ?? 0;

    return NextResponse.json({
      logs: logs || [],
      totalPages: Math.ceil(total / limit),
      actors: actorsList,
    });
  } catch (err: any) {
    console.error('GET /api/audit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
