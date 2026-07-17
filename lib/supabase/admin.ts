import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE ROLE CLIENT — bypasses RLS entirely.
// Only ever import this in server-only code: API routes, webhooks,
// the admin approval panel's server actions. NEVER import in a
// Client Component or anything shipped to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
