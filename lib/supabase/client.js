import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in Client Components ("use client").
 * Session tokens are managed as HTTP-only cookies automatically — never localStorage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
