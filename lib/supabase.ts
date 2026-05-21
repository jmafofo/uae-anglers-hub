import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
    _client = createClient(url, key);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Return an Authorization header with the current user's access token.
 * Use this when calling App Router API routes from client components,
 * because the client-side Supabase client stores auth in localStorage
 * (not cookies), so fetch() won't automatically send session cookies.
 *
 * Fallback: reads directly from localStorage to avoid race conditions
 * with multiple GoTrueClient instances during Turbopack hot reload.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const sb = getSupabase();

  // 1. Try the standard path
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  }

  // 2. Fallback: read directly from localStorage
  //    Supabase stores the session under sb-<project-ref>-auth-token
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const ref = url.replace('https://', '').split('.')[0];
    const key = ref ? `sb-${ref}-auth-token` : null;
    if (key && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token;
        if (token) return { Authorization: `Bearer ${token}` };
      }
    }
  } catch {
    // ignore localStorage errors
  }

  return {};
}
