import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();
  const impersonateToken = cookieStore.get('impersonate_token')?.value;

  if (impersonateToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      // Create a temporary client to check session
      const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: session } = await admin
        .from('impersonation_sessions')
        .select('target_owner_id')
        .eq('token', impersonateToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (session) {
        // Create service role client to bypass RLS
        const client = createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Get target owner user details
        const { data: { user: targetUser } } = await admin.auth.admin.getUserById(session.target_owner_id);

        if (targetUser) {
          // Override auth.getUser
          const overrideUser = {
            data: { user: targetUser },
            error: null,
          };
          client.auth.getUser = async () => overrideUser as any;
          return client as any;
        }
      }
    }
  }

  // Fallback to standard client
  return createServerClient(
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
          } catch {
            // Ignore
          }
        },
      },
    }
  );
}
