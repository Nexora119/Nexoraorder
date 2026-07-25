# HARDENING_REPORT.md — Email Confirmation Session Fix

**Scope:** New auth callback route, changed signup redirect target. Triggers our standing audit-report rule (authentication).

## Root cause
`signUp()` never set `emailRedirectTo`, and no route existed to handle Supabase's PKCE-flow confirmation redirect (`?code=...`). The code arrived at `/` and was silently ignored — no session was ever established, despite the email confirmation itself succeeding.

## Fix
- **`app/auth/callback/route.ts`** (new) — exchanges the `code` for a real session via `exchangeCodeForSession()`, using the existing, unchanged `lib/supabase/server.ts` client (its cookie-writing logic already handles this correctly — Route Handlers, unlike plain Server Components, can genuinely set cookies on the response).
- **`app/signup/page.tsx`** — `emailRedirectTo` now points at this new route.
- **`app/login/page.tsx`** — restructured to use `useSearchParams()` inside a `Suspense` boundary (a hard Next.js requirement, not optional — omitting it causes a build-time warning/error), to show a clear message if someone lands here via a failed confirmation.

## Required manual step — cannot be done from code
Supabase rejects any `emailRedirectTo` that isn't on its allow-list and silently falls back to the default Site URL instead — meaning this fix does nothing until you add the callback URL in Supabase's dashboard:

**Authentication → URL Configuration → Redirect URLs**, add:
- `https://<your-production-domain>/auth/callback`
- `http://localhost:3000/auth/callback` (only if you test locally)

## Security review
| Concern | Assessment |
|---|---|
| Can this callback be used to hijack someone else's session? | No — `exchangeCodeForSession` only succeeds with a valid, single-use code Supabase itself issued for that specific confirmation email. |
| Does a failed exchange leak error detail to the user? | No — logged server-side only (`console.error`), user just sees a generic "didn't work or expired" message. |
| Does this change any RLS policy or existing auth flow? | No — reuses `lib/supabase/server.ts` unchanged; the "does this user have a business" check duplicates existing logic already in `app/login/page.tsx`, not new authorization logic. |

## What did NOT change
`lib/supabase/*`, `lib/auth/*`, `middleware.ts`, RLS policies, `01_schema.sql` — all unaffected.
