'use client';

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }

  if (typeof window !== 'undefined' && document.cookie.includes('impersonate_token=')) {
    url = `${window.location.origin}/api/supabase`;
  }

  // Singleton pattern — reuse the same client, but recreate if the target URL changed
  if (!client || (client as any).supabaseUrl !== url) {
    client = createBrowserClient(url, key);
  }

  return client;
}
