import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, userId } = await verifyAdmin();
  if (!isAdmin || !userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { reason } = body;

  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('shops')
    .update({
      is_frozen: true,
      frozen_reason: reason.trim(),
      frozen_at: new Date().toISOString(),
      frozen_by: userId,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Shop frozen successfully' });
}
