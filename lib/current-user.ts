import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from './permissions';
import { cookies } from 'next/headers';

// ─── Current User Context ─────────────────────────────────────
// Server-side function to resolve the current user's role and shop.

export interface UserContext {
  userId: string;
  shopId: string;
  role: UserRole;
  name: string;
  isOwner: boolean;
  staffId?: string; // set when user is a staff member
}

/**
 * Resolve the current authenticated user's shop context and role.
 *
 * 1. Get auth user from the Supabase session.
 * 2. Check if they own a shop → role = 'owner'.
 * 3. If not, check if they are active staff → role = staff.role.
 * 4. Return null if neither.
 */
export async function getCurrentUserContext(
  supabase: SupabaseClient
): Promise<UserContext | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Check if impersonation is active
    let targetOwnerId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('impersonate_token')?.value;
      if (token) {
        // Query impersonation session using a server-side admin client
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient() as any;
        const { data: session } = await admin
          .from('impersonation_sessions')
          .select('target_owner_id')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .single();
        if (session) {
          targetOwnerId = session.target_owner_id;
        }
      }
    } catch {
      // cookies() might fail if not called within server context, fallback to normal user
    }

    const resolvedUserId = targetOwnerId || user.id;

    // Check if user is a shop owner
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name')
      .eq('auth_user_id', resolvedUserId)
      .single();

    if (shop) {
      return {
        userId: resolvedUserId,
        shopId: shop.id,
        role: 'owner',
        name: user.user_metadata?.owner_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        isOwner: true,
      };
    }

    // Check if user is active staff
    const { data: staff } = await supabase
      .from('staff')
      .select('id, shop_id, name, role')
      .eq('auth_user_id', resolvedUserId)
      .eq('status', 'active')
      .single();

    if (staff) {
      return {
        userId: resolvedUserId,
        shopId: staff.shop_id,
        role: staff.role as UserRole,
        name: staff.name || user.user_metadata?.owner_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff',
        isOwner: false,
        staffId: staff.id,
      };
    }

    return null;
  } catch {
    return null;
  }
}
