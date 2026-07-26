# HARDENING_REPORT.md — Authentication Flow Production Readiness Audit

**Scope:** Full audit of `/signup`, `/login`, `/auth/callback`, middleware, auth helpers, and related components. No behavior changed — cleanup and verification only, per your request.

## Findings

### 1. Removed: `app/debug/auth/page.tsx` (entire route)
This was explicitly built as temporary — displays raw session/user ID/email at a public, unauthenticated URL. Its job (diagnosing the missing-profile-row issue) is done and confirmed fixed. Fully deleted, not just emptied. Confirmed nothing else in the codebase links to it.

### 2. Removed: leftover `console.log` in `app/signup/page.tsx`
You reported this was already removed manually in your repo — it was still present in the source I'm tracking (I hadn't shipped the removal myself, only advised it), so this reconciles my tracked copy with what you already did. Net effect: no change to your live deployment, just keeping the file I hand you in sync with reality.

### 3. Reviewed, kept intentionally: `'customer'` in `UserRole` type (`lib/auth/authorize.ts`)
```ts
export type UserRole = "customer" | "business_owner" | "admin";
```
This mirrors the database's `user_role` enum (`01_schema.sql`), which still includes `'customer'` as a valid value — a deliberate decision made during the guest-ordering migration (removing a value from a Postgres enum requires recreating the type, judged not worth the risk for a value that's simply never assigned anymore). No code path ever assigns `'customer'` to a real user (confirmed by search — zero matches). Keeping the TypeScript type in sync with the actual database schema is correct here, not dead code — removing it from the type while the database still allows it would make the type inaccurate, not safer.

## Everything else audited, found clean

- **Unused imports/variables:** checked every import across all 14 auth-flow files individually — every single one is genuinely referenced in its file body. None found.
- **`console.error` calls** (in `middleware.ts`, `authorize.ts`, `actions.ts`, `auth/callback/route.ts`): all legitimate, permanent production error logging — not debug artifacts. These are what let you diagnose real issues via Vercel's Function logs once real users are on the platform. Correctly left in place.
- **TODO/FIXME/temporary markers:** none found anywhere in the auth flow.
- **Dead/unreachable code:** none found.

## Architecture verification — matches intended design

| Requirement | Verified |
|---|---|
| Only business owners and admins authenticate | ✅ — no code path ever creates a `'customer'`-role profile; the signup trigger defaults to `business_owner` |
| Customers remain guests | ✅ — nothing in the ordering-adjacent code (which doesn't exist yet beyond the schema) requires authentication; `/browse` remains public |
| Email confirmation + callback flow works correctly | ✅ — `emailRedirectTo` points at `/auth/callback`, which exchanges the code for a session and routes based on whether a business already exists, exactly as designed |
| Session middleware unchanged, still crash-safe | ✅ — untouched by this audit |
| RLS remains the data-access source of truth | ✅ — untouched by this audit |

## Summary
2 real cleanup items found and resolved (1 debug route deleted, 1 debug log removed/reconciled). 1 item reviewed and confirmed intentional, not a bug. No dead imports, no unused variables, no architecture drift. **The authentication flow is clean and ready.**
