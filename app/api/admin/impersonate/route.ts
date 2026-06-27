import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, userId: adminUserId } = await verifyAdmin();
    if (!isAdmin || !adminUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { target_owner_id } = await request.json();
    if (!target_owner_id) {
      return NextResponse.json({ error: 'Target owner ID is required' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const admin = createAdminClient();
    const { error } = await admin
      .from('impersonation_sessions')
      .insert({
        admin_id: adminUserId,
        target_owner_id,
        token,
        expires_at: expiresAt,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token,
      redirectUrl: `/dashboard?impersonate=${token}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
