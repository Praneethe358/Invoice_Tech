import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

// POST /api/invite/[token]/accept — accept invite and join team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const admin = createAdminClient();
    const body = await request.json();
    const { password, name } = body;

    // Validate invite
    const { data: staff, error: staffError } = await admin
      .from('staff')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'invited')
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    const invitedTime = new Date(staff.invited_at).getTime();
    if (Date.now() - invitedTime > 48 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please request a new invite.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    let authUserId: string;

    // Check if user already exists in auth
    const { data: existingAuthData } = await admin.auth.admin.getUserByEmail(staff.email);
    const existingAuthUser = existingAuthData?.user;

    if (existingAuthUser) {
      // User exists, verify password using a standard client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      const verifyClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: staff.email,
        password,
      });

      if (signInError) {
        return NextResponse.json(
          { error: 'Invalid password for this account. Please verify your credentials.' },
          { status: 401 }
        );
      }

      authUserId = existingAuthUser.id;

      // Update their metadata to set is_staff: true
      await admin.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          ...existingAuthUser.user_metadata,
          name: name?.trim() || staff.name,
          is_staff: true,
        }
      });
    } else {
      // Create Supabase auth user
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: staff.email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name?.trim() || staff.name,
          is_staff: true,
        },
      });

      if (authError) {
        console.error('Create user error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
      authUserId = authData.user.id;
    }

    // Check if this user is already staff at another shop
    const { data: existingStaff } = await admin
      .from('staff')
      .select('id')
      .eq('auth_user_id', authUserId)
      .eq('status', 'active')
      .single();

    if (existingStaff) {
      return NextResponse.json(
        { error: 'This account is already linked to another shop' },
        { status: 409 }
      );
    }

    // Link auth user to staff record
    const { error: updateError } = await admin
      .from('staff')
      .update({
        auth_user_id: authUserId,
        name: name?.trim() || staff.name,
        status: 'active',
        joined_at: new Date().toISOString(),
        invite_token: null,
      })
      .eq('id', staff.id);

    if (updateError) {
      console.error('Staff update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      shopId: staff.shop_id,
      actorUserId: authUserId,
      actorName: `${name?.trim() || staff.name} (${staff.role === 'admin' ? 'Admin' : staff.role === 'billing_staff' ? 'Billing Staff' : 'View Only'})`,
      actorRole: staff.role,
      action: 'staff.joined',
      entityType: 'staff',
      entityId: staff.id,
      entityLabel: name?.trim() || staff.name,
    });

    return NextResponse.json({ success: true, email: staff.email });
  } catch (err) {
    console.error('POST /api/invite/[token]/accept error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
