# HARDENING_REPORT.md — Guest Ordering Migration

**Scope:** Database schema, RLS policies, authentication flow, homepage/login/signup copy. Triggers our standing audit-report rule (change affects authentication + database access).

## What changed and why

**Schema (`03_guest_ordering.sql`, new, additive):**
- `orders.customer_id` — now nullable. Guests never get a `profiles` row.
- Added `guest_name`, `guest_phone`, `guest_email` — guest contact capture.
- Added `order_number` (customer-facing, e.g. `MT-2026-000124`), `lookup_token` (secure UUID, private tracking URLs only), `pickup_code` (short spoken/visual reference, no security role).
- Added `refund_reference` — proactive addition for Milestone 6's automatic-refund flow (FR16), avoiding a future single-column migration.
- Added CHECK constraint: every order needs a `customer_id` OR full guest contact details — never neither.
- `handle_new_user()` trigger function updated (via `CREATE OR REPLACE`, not editing `02_profile_trigger.sql`): default role changes from `customer` to `business_owner`, since customers never sign up anymore.

**RLS:**
- Dropped `orders_insert_customer`, `orders_select_own_customer` — permanently unreachable now that customers don't authenticate.
- `orders_select_own_business`, `orders_update_business` — **unchanged**, business owners still work exactly as before.
- **No new public policy added for guest order access.** Guest order creation/lookup will go through server-side Route Handlers using the service-role client (bypasses RLS under our own controlled logic), not direct client queries — a client-side RLS policy can't safely express "let a guest read the one row matching a token they present."
- Simplified `order_items_select`/`order_status_history_select` — removed now-permanently-dead `customer_id = auth.uid()` branch for clarity (was harmless, not unsafe, just dead code).

**Application code:**
- `app/page.tsx` — removed "Log in"/"Sign up" buttons (written for a customer-accounts model that's no longer correct); replaced with a small, low-emphasis "Business login" text link so returning business owners have a way in, without implying customers need an account.
- `app/login/page.tsx`, `app/signup/page.tsx` — copy reframed for business owners ("Business login", "Register your business"). No structural or logic changes.

## Security review

| Concern | Assessment |
|---|---|
| Can a guest read another guest's order? | No new client-accessible path created. All guest order access is deferred to future server-side Route Handlers (Milestone 5/6), not built in this change. |
| Can a business owner see other businesses' orders? | No — `orders_select_own_business`/`orders_update_business` unchanged, still scoped via `auth.uid()` matching `businesses.owner_id`. |
| Does the CHECK constraint allow an orphaned order (no customer, no guest info)? | No — constraint requires one or the other, enforced at the database level, not just application code. |
| Is `lookup_token` guessable? | No — `uuid` via `gen_random_uuid()`, cryptographically random, 122 bits of entropy. |
| Is `pickup_code` guessable, and does that matter? | Yes, guessable (6 chars, no uniqueness enforced) — but deliberately not a security mechanism, only ever used alongside a business owner already looking at their own order list. Documented trade-off, not an oversight. |
| Does the profile trigger change affect existing accounts? | No — `CREATE OR REPLACE FUNCTION` only changes behavior for *future* signups; any existing `profiles` rows are untouched. |

## What did NOT change
`01_schema.sql`, `02_profile_trigger.sql` (files themselves), `lib/supabase/*.ts`, `lib/auth/*.ts`, `middleware.ts`, `components/layout/Header.tsx`, Button/Card/design system — all confirmed unaffected by this migration, consistent with the approved plan.

## Outstanding, not part of this change
- Guest checkout Route Handler, order-creation-on-webhook logic, and the `/orders/track/[token]` page — all Milestone 5/6 work, not built here. This migration only prepares the schema/RLS foundation for them.
- `payment_webhook_events` log table — recommended for Milestone 6, deliberately not bundled into this migration (different concern).
