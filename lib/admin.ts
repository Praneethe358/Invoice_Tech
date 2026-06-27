import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

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
