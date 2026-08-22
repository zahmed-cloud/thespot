import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service role key. This bypasses RLS —
 * it must never be imported from a client component. The "server-only"
 * style guard: this module throws if the service key leaks into a
 * browser bundle, because process.env.SUPABASE_SERVICE_ROLE_KEY is
 * only defined on the server.
 */
export function serviceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
