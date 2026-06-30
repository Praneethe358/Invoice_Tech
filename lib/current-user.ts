import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from './permissions';

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

    // Check if user is a shop owner
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single();

    if (shop) {
      return {
        userId: user.id,
        shopId: shop.id,
        role: 'owner',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        isOwner: true,
      };
    }

    // Check if user is active staff
    const { data: staff } = await supabase
      .from('staff')
      .select('id, shop_id, name, role')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (staff) {
      return {
        userId: user.id,
        shopId: staff.shop_id,
        role: staff.role as UserRole,
        name: staff.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff',
        isOwner: false,
        staffId: staff.id,
      };
    }

    return null;
  } catch {
    return null;
  }
}
