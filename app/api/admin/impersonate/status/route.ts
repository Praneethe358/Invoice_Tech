import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: session, error } = await admin
      .from('impersonation_sessions')
      .select('target_owner_id, expires_at')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' });
    }

    // Get the target owner's email
    const { data: { user } } = await admin.auth.admin.getUserById(session.target_owner_id);

    const expiresInSeconds = Math.max(0, Math.round((new Date(session.expires_at).getTime() - Date.now()) / 1000));

    return NextResponse.json({
      success: true,
      email: user?.email || '—',
      expiresInSeconds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
