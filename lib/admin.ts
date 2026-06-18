import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Verify current user is an admin.
 * Uses the server-side Supabase client to get current user,
 * then checks the admins table via service role.
 * Returns { isAdmin: true, userId } or { isAdmin: false }.
 */
export async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  userId: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, userId: null };
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (error || !data) {
      return { isAdmin: false, userId: user.id };
    }

    return { isAdmin: true, userId: user.id };
  } catch {
    return { isAdmin: false, userId: null };
  }
}

/**
 * Verify admin from a user ID (used in middleware where
 * we already have the user from the auth session).
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admins')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
