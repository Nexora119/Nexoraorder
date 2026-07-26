# HARDENING_REPORT.md — Admin Approval Panel

**Scope:** New protected route, first real usage of the service-role client, business status mutations. Triggers our standing audit-report rule (authentication + database access).

## The real gap this addresses (explained before building, per your instruction)
`requireRole(["admin"])` only ever gated *page access*. Under existing RLS, an admin had **zero special data access** — `businesses_select_active_public` only permits seeing active businesses or your own, and `subscriptions_select_own` is owner-only. Without addressing this, an admin could pass the role check and still see nothing.

**Resolution chosen:** use the already-built, previously-unused service-role client (`lib/supabase/admin.ts`) rather than add new RLS policies. This was explicitly flagged as the intended path in the last hardening report ("when Milestone 3 wires this into an admin route, wrap it in try/catch"). Result: **zero new RLS policies, zero schema changes** — pure reuse, as requested.

## What was built
- `lib/admin/actions.ts` — three Server Actions: `approveBusiness`, `rejectBusiness`, `deactivateBusiness`.
- `app/admin/page.tsx` — protected admin panel, lists pending businesses (with Approve/Reject) and all others (with status, subscription billing status, Deactivate for active ones).

## Security review
| Concern | Assessment |
|---|---|
| Can a non-admin reach `/admin`? | No — `requireRole(["admin"])` redirects to `/login` (unauthenticated) or `/unauthorized` (wrong role), unchanged from Milestone 2. |
| Can a Server Action be invoked directly, bypassing the page? | Technically yes (Server Actions are callable independent of the page that links to them) — **each of the three actions independently calls `requireRole(["admin"])` itself**, not just relying on the page's gate. |
| Does the service-role client ever get exposed to the browser? | No — only ever called from `"use server"` files, never imported into a Client Component. |
| Can approval/rejection/deactivation crash the whole request? | No — `createAdminClient()` and all Supabase calls are wrapped in try/catch, logging errors rather than throwing uncaught, consistent with the established pattern across the codebase. |
| Does approval correctly start the trial? | Yes — reuses `businesses.trial_start_date` (existing column) and creates a `subscriptions` row (existing table) with `billing_status = 'trial'` and `trial_end_date` = now + 30 days, matching the locked-in R200/30-day-trial business model. |
| Does rejection require a reason? | No — optional, per a reasonable reading of FR4 ("approve or reject with a reason"); defaults to "No reason provided" if left blank. Flagging in case you want this to be required instead — easy one-line change. |

## Five-point security verification (requested before approval)

Checked line-by-line against the actual code, not asserted from memory:

| # | Requirement | Result |
|---|---|---|
| 1 | Never accepts `adminId` or `role` from the client | ✅ Confirmed — every action's signature is `(businessId: string, formData: FormData)`. `businessId` comes from a server-rendered `.bind()`, not client-editable input. `reason` (reject only) is free text with no privilege implication. Neither `adminId` nor `role` appears as a parameter anywhere. |
| 2 | Always derives the current user from the authenticated session | ✅ Confirmed — `approveBusiness` uses `admin.id` (from `requireRole()`'s return value, session-derived) for `approved_by`, never a client-supplied id. |
| 3 | Calls `requireRole(["admin"])` before any database operation | ✅ Confirmed — it's the literal first statement in all three actions and in the page component, before `createAdminClient()` or any query/mutation. |
| 4 | Never exposes the service-role client outside the server | ✅ Confirmed — `createAdminClient` is imported only in `lib/admin/actions.ts` (`"use server"`, every export becomes a server action) and `app/admin/page.tsx` (Server Component, no `"use client"`). No other file in the codebase imports it. |
| 5 | Returns only the data the admin page actually needs | ⚠️ **One genuine exception found and fixed**: `trial_end_date` was selected but never rendered anywhere in the UI. Fixed by displaying it (trial end date now shown next to billing status) rather than removing it — closes the "fetched but unused" gap while adding real value the admin panel should have had anyway (FR23 asks for subscription status visibility). One accepted trade-off, not a violation: `email`/`phone`/address fields are fetched for every business row in a single query, but only rendered for *pending* ones in the current UI — splitting into two separate queries to avoid this would add real complexity for a negligible efficiency gain on what's a low-row-count admin panel. Documenting this as a deliberate choice rather than an oversight.

## What did NOT change
`01_schema.sql`, `02_profile_trigger.sql`, `03_guest_ordering.sql`, all existing RLS policies, `lib/supabase/client.ts`/`server.ts`/`middleware.ts`, `lib/auth/authorize.ts`, `middleware.ts` — all untouched. `lib/supabase/admin.ts` itself also untouched — used exactly as it was already built.

## One design note, not a gap
`revalidatePath("/admin")` is called at the end of every action so the panel reflects the new status immediately without a manual refresh — standard Next.js pattern for Server Actions that mutate data a Server Component subsequently reads.
