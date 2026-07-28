import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect Supabase sends the browser to after email
// confirmation (and would also handle magic links / OAuth if those are
// ever added) — exchanges the PKCE `code` param for a real session,
// setting the session cookie via the existing server client's cookie
// adapter (lib/supabase/server.ts — unchanged, reused as-is).
//
// REQUIRED MANUAL STEP: this route's full URL must be added to Supabase's
// allowed redirect URLs (Authentication -> URL Configuration -> Redirect
// URLs) or Supabase will reject the custom emailRedirectTo and silently
// fall back to the Site URL default, making this fix a no-op until that's
// done. Add both:
//   https://<your-production-domain>/auth/callback
//   http://localhost:3000/auth/callback  (for local dev, if used)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session is now established (cookie set). Check role FIRST — same
      // fix just applied to app/login/page.tsx, kept consistent here.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          return NextResponse.redirect(`${origin}/admin`);
        }

        const { data: existingBusiness } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!existingBusiness) {
          return NextResponse.redirect(`${origin}/business/register`);
        }

        // Business dashboard now exists (Milestone 3) — send them there
        // instead of the homepage.
        return NextResponse.redirect(`${origin}/business/dashboard`);
      }

      return NextResponse.redirect(`${origin}/`);
    }

    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  // No code present, or the exchange failed — send to login with a
  // visible error rather than silently landing on the homepage confused.
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
