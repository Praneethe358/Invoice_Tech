import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path.join('/');

    // 1. Read impersonate token
    const cookieStore = await cookies();
    const token = cookieStore.get('impersonate_token')?.value;

    let useServiceRole = false;
    if (token) {
      // Verify token in database
      const admin = createAdminClient();
      const { data: session } = await admin
        .from('impersonation_sessions')
        .select('id, expires_at')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (session) {
        useServiceRole = true;
      }
    }

    // 2. Build target URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const targetUrl = `${supabaseUrl}/${pathStr}${request.nextUrl.search}`;

    // 3. Build headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'origin', 'referer', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Override key/auth if impersonation is active
    if (useServiceRole) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      headers.set('apikey', serviceRoleKey);
      headers.set('Authorization', `Bearer ${serviceRoleKey}`);
    } else {
      headers.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    }

    // 4. Forward body if exists
    let body: any = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.blob();
      } catch {
        body = null;
      }
    }

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await res.blob();
    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
