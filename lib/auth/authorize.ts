import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// AUTHORIZATION ONLY — session refresh is handled separately by
// middleware.ts + lib/supabase/middleware.ts. These helpers assume the
// session cookie is already fresh by the time they run.
//
// These are server-only (import "next/navigation" redirect + the RLS-
// respecting server Supabase client) — never call from a Client Component.
//
// Supabase RLS policies (01_schema.sql) remain the primary security layer.
// These helpers control PAGE ACCESS (what a user sees/can navigate to),
// not DATA ACCESS — RLS still governs what queries can actually return,
// even if a check here were ever bypassed or misapplied.

export type UserRole = "customer" | "business_owner" | "admin";

export interface AuthedUser {
  id: string;
  email: string | undefined;
  role: UserRole;
}

/**
 * Fetches the current authenticated user + their profile role.
 * Returns null if not authenticated — does NOT redirect. Use this when you
 * need to know if someone is logged in without forcing a redirect (e.g. to
 * conditionally show a "Log in" vs "My account" link).
 *
 * Calls supabase.auth.getUser() once. If you need the user in multiple
 * places on the same page, call this once and pass the result down rather
 * than calling it again.
 */
export async function getAuthUser(): Promise<AuthedUser | null> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: profile.role as UserRole,
  };
}

/**
 * Requires ANY authenticated user, regardless of role.
 * Redirects to /login if not signed in.
 * Use at the top of a Server Component (page or layout) that any logged-in
 * user (customer, business_owner, or admin) should be able to reach.
 */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Requires an authenticated user whose role is in `allowedRoles`.
 * - Not authenticated -> redirected to /login
 * - Authenticated but wrong role -> redirected to /unauthorized
 *
 * Example:
 *   const user = await requireRole(["business_owner"]);
 *   // only reachable by business_owner accounts past this line
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthedUser> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}
