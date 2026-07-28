# CHANGELOG — Admin Login Redirect Fix

## Modified
- `app/login/page.tsx` — post-login logic now checks `profiles.role` first. `admin` → `/admin`. Everyone else falls through to the existing, unchanged business-owner logic (`/business/register` or `/business/dashboard`).
- `app/auth/callback/route.ts` — identical fix applied, for consistency with login (this route was always built to mirror it).

## Unchanged (confirmed, per your instruction)
- `lib/auth/authorize.ts` — `requireRole()` itself untouched.
- `lib/auth/actions.ts` (`signOut`) — untouched, no logout logic changed.
- `app/admin/page.tsx` — the two temporary `[ADMIN PAGE DEBUG]` logs from last turn remain exactly as shipped, nothing added or removed, no cache-control headers added.

## Why
Confirmed root cause: admin accounts have no business, so the old logic's only check ("does a business exist?") always resolved to "no" for admins, sending them to `/business/register` — which then redirected to `/unauthorized` since that page requires `business_owner`, not `admin`. Checking role first closes this gap without touching the business-owner path at all.
