# HARDENING_REPORT.md — Business Dashboard Subscription Display Fix

**Scope:** Query and display logic in one file. Triggers our standing audit-report rule (database access).

## Root cause
The original dashboard used a nested/embedded Supabase query — `businesses.select("...subscriptions(billing_status, trial_end_date)")`. The admin panel uses the identical embed syntax successfully, but the admin panel goes through the service-role client (bypasses RLS entirely). The dashboard deliberately used the RLS-respecting client instead (matching the least-privilege design already documented), and RLS evaluated *through* a PostgREST join is a known source of silently-empty nested results — the top-level `businesses` row passed its own policy fine, but the embedded `subscriptions` rows were dropped rather than erroring, so `sub` was always `undefined`.

## Fix
Replaced the single nested-embed query with **two separate, direct top-level queries** — one for `businesses`, one for `subscriptions` — both still on the RLS-respecting client. Direct RLS evaluation (not through a join) is simpler and more reliable, and this keeps the dashboard's architecture consistent with what was already documented (no service-role client needed here, unlike the admin panel).

## What's now displayed (all four items requested)
- **Billing status** — from `subscriptions.billing_status`.
- **Trial status** — derived (`"In trial"` if `trial_end_date` is in the future, `"Trial ended"` otherwise), since there's no dedicated column for this; computed from data that already exists rather than adding a new one.
- **Trial start date** — from `businesses.trial_start_date` (a different table than the other three — added to the businesses query, wasn't there before).
- **Trial end date** — from `subscriptions.trial_end_date`.

## Explicit fallback, not silence
If a business is `active` but genuinely has no subscription row (shouldn't happen given `approveBusiness` creates one, but could occur for edge cases like data imported before that code existed), the dashboard now explicitly says "No subscription record found for this business yet" instead of silently showing nothing — directly per your request to "explain why they are not available" if that's ever the case.

## Security review
No change in access boundary — both queries are still scoped by `.eq("owner_id", user.id)` / `.eq("business_id", ...)` server-side, and RLS independently enforces the same boundary. Splitting into two queries doesn't weaken anything, just makes each one's RLS evaluation more straightforward.

## What did NOT change
`01_schema.sql`, RLS policies themselves, `lib/supabase/*`, `lib/auth/*`, the admin panel, login/callback redirects — all untouched. Only the dashboard's data-fetching and display logic changed.
