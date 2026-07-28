# HARDENING_REPORT.md — Business Dashboard Shell

**Scope:** New protected route, changed redirect targets across 3 files. Triggers our standing audit-report rule (authentication).

## No new gap this time
Unlike the admin panel, this required **no service-role client and no new RLS policies**. The dashboard only ever shows a business owner their own data, and existing RLS already permits that: `businesses_select_active_public`'s `owner_id = auth.uid()` branch, and `subscriptions_select_own`. Uses the regular server client, same as every other owner-facing page.

## What was built
- `app/business/dashboard/page.tsx` — protected via `requireRole(["business_owner"])`, unchanged from Milestone 2. Shows business status (pending/active/rejected/inactive with appropriate messaging for each), subscription/trial info when active, and business details. Includes inert placeholder cards for Menu (Milestone 4) and Orders (Milestone 5) — consistent with the existing stub-page pattern (`/browse`, `/register` before it had a real page).
- Defensive redirect: if someone reaches this URL without a business (shouldn't normally happen — both entry points below prevent it), redirects to `/business/register` rather than showing a broken/empty page.

## Redirect changes
- `app/login/page.tsx` — "has a business" branch now goes to `/business/dashboard` instead of `/`.
- `app/auth/callback/route.ts` — same fix, mirroring login for consistency (as it was always designed to).
- `components/business/BusinessRegistrationForm.tsx` — after successful submission, redirects to `/business/dashboard` (which shows the same "pending review" status persistently) instead of a static one-time message with no way back to it. The now-unused `submitted` state and its dead rendering branch were removed — not leaving dead code behind, consistent with the standard set in the last full audit.

## Security review
| Concern | Assessment |
|---|---|
| Can a business owner see another business's dashboard data? | No — query is scoped by `.eq("owner_id", user.id)`, and RLS independently enforces the same boundary regardless. |
| Can a customer/guest reach this page? | No — `requireRole(["business_owner"])` redirects unauthenticated visitors to `/login`. |
| Can an admin account get stuck here? | No — `requireRole(["business_owner"])` would redirect an admin-only account to `/unauthorized`, same as before; unaffected by this change. |

## What did NOT change
`01_schema.sql` and all migrations, RLS policies, `lib/supabase/*`, `lib/auth/*`, `middleware.ts`, the admin panel, `Header.tsx` — all untouched.
