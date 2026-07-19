import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// SESSION REFRESH ONLY — no authorization/role logic belongs in this file.
// Route protection (Step 4) is handled separately, server-side, in
// lib/auth/authorize.ts, called from individual Server Components/layouts.
//
// Why getUser() and not getSession(): getSession() only reads the JWT out
// of the cookie without verifying it against Supabase's Auth server — a
// stale or tampered cookie would be trusted blindly. getUser() revalidates
// the token server-side on every call, which is why it's used here despite
// the extra network round-trip. This is the ONE place that call happens on
// every request; avoid adding more getUser() calls than necessary elsewhere
// in the same request (each Server Component that needs the user should
// call it once, not repeatedly within the same render).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Check your .env.local " +
        "(or Vercel project environment variables)."
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refreshes the session (rewrites cookies via setAll above if the token
  // was rotated) and validates the user server-side. The returned user is
  // intentionally unused here — this function's only job is to keep the
  // session cookie fresh for every downstream request.
  await supabase.auth.getUser();

  return supabaseResponse;
}
