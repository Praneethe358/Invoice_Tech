import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserContext } from '@/lib/current-user';
import { hasPermission } from '@/lib/permissions';

// GET /api/audit — list audit logs with filters
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
    const limit = 50;
    const offset = (page - 1) * limit;
    const entityType = searchParams.get('entity_type');
    const actorId = searchParams.get('actor_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('shop_id', ctx.shopId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType && entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    if (actorId && actorId !== 'all') {
      query = query.eq('actor_user_id', actorId);
    }

    if (search) {
      query = query.or(`entity_label.ilike.%${search}%,actor_name.ilike.%${search}%`);
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('created_at', start.toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data: logs, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique actors for filter dropdown
    const { data: actors } = await supabase
      .from('audit_logs')
      .select('actor_user_id, actor_name, actor_role')
      .eq('shop_id', ctx.shopId);

    const uniqueActors = actors
      ? Array.from(
          new Map(actors.map((a) => [a.actor_user_id, a])).values()
        )
      : [];

    return NextResponse.json({
      logs: logs ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      actors: uniqueActors,
    });
  } catch (err) {
    console.error('GET /api/audit error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
