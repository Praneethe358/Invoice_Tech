import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Skip auth if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Write Guard for Impersonation ──────────────────────────
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const impersonateToken = request.cookies.get('impersonate_token')?.value;
    if (impersonateToken && !pathname.startsWith('/api/admin')) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: session } = await adminClient
          .from('impersonation_sessions')
          .select('id')
          .eq('token', impersonateToken)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (session) {
          return NextResponse.json(
            { error: 'Write mutations are blocked during impersonation.' },
            { status: 403 }
          );
        }
      }
    }
  }

  // ─── Admin Route Protection (Level 1) ───────────────────────
  // Block /admin routes for non-admins. Check admins table via 
  // service role. Redirect silently to /dashboard.
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check admins table via service role (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminRecord } = await adminClient
      .from('admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminRecord) {
      // Not an admin — redirect silently to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  }

  // ─── Protected routes — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/invoice', '/settings'];
  const isProtected = protectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login page
  const authPaths = ['/login'];
  const isAuthPage = authPaths.includes(pathname);

  if (user && isAuthPage) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  }

  if (pathname.startsWith('/status/')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|icon-.*\\.png|manifest\\.webmanifest).*)',
  ],
};
