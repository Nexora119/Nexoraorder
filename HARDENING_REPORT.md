# HARDENING_REPORT.md — Business Registration

**Scope:** New protected route, new database writes, changed navigation flow. Triggers our standing audit-report rule (database access + authentication-adjacent flow).

## What was built
- `app/business/register/page.tsx` — protected via `requireRole(["business_owner"])`, reused unchanged from Milestone 2.
- `components/business/BusinessRegistrationForm.tsx` — Client Component, inserts directly into `businesses` via the browser Supabase client.

## Why direct browser-client insert is safe here (no Server Action/service-role needed)
`businesses_insert_own` (already in `01_schema.sql`, unchanged) permits an authenticated user to insert a row only where `owner_id = auth.uid()`. The form always sets `owner_id` to the server-verified `user.id` returned by `requireRole()` on the page itself — not something the client can spoof to claim someone else's identity, since RLS checks the *actual* authenticated session server-side at insert time, not whatever the client claims.

## Security checks
| Concern | Assessment |
|---|---|
| Can an unauthenticated visitor reach this form? | No — `requireRole(["business_owner"])` redirects to `/login` first. |
| Can a customer (guest) or admin misuse this? | N/A for guests (they never authenticate). Admins aren't blocked by role, but nothing links them here, and creating a business under an admin account would still correctly set `owner_id` to their own id — no privilege escalation possible either way. |
| Can someone insert a business under another user's `owner_id`? | No — RLS enforces `owner_id = auth.uid()` regardless of what the client sends. |
| Duplicate email/phone across businesses? | Enforced by existing `UNIQUE` constraints in `01_schema.sql` — the form catches the specific Postgres `23505` error and shows a friendly message rather than a generic crash. |
| Payment/Paystack data exposure? | None collected — deferred to Milestone 6 per your decision. |
| Does a new business go live immediately? | No — `status` defaults to `'pending'` (`01_schema.sql`), invisible to public browsing until an admin approves it (next step in this milestone). |

## Flow changes
- `app/page.tsx` — "List your business" now links to `/signup` (was the old stub `/register`).
- `app/signup/page.tsx` — successful signup (no email confirmation required) now redirects straight to `/business/register` instead of `/`.
- `app/login/page.tsx` — after login, checks whether the business owner already has a business; if not, redirects to `/business/register` instead of a dead-end homepage. Closes the gap for the email-confirmation-required signup path, where signup itself can't immediately redirect there.
- `app/register/page.tsx` — old "coming soon" stub converted to a redirect to `/signup`, rather than deleted, so existing bookmarks/links don't 404.

## What did NOT change
`01_schema.sql`, RLS policies, `lib/supabase/*`, `lib/auth/*`, middleware, Header — all unaffected. No new tables, no new policies needed (existing `businesses_insert_own` already covered this use case).
