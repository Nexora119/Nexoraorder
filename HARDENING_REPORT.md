# HARDENING_REPORT.md — Milestone 4: Menu Management

**Scope:** New schema column, new Server Actions, new protected routes. Triggers our standing audit-report rule (database access).

## The one real gap, explained before building
`menu_items` had no `category` column at all, despite the requirement explicitly asking for one. Added via `05_menu_categories.sql` — additive only, same one-concern-per-migration discipline as 01-04. Nullable free text, matching the existing simple pattern already used for `businesses.category`.

**Everything else needed zero schema/RLS changes.** `menu_items_owner_manage` (`for all`, `01_schema.sql`) already permits an authenticated business owner to select/insert/update/delete rows on businesses they own — this single existing policy covers every operation Milestone 4 needed (add, edit, delete, toggle).

## Why no service-role client is used anywhere in this milestone
Every operation here is naturally scoped to "my own business's menu" — exactly what RLS already enforces. Unlike the admin panel (which genuinely needed cross-user access), there's no legitimate case for menu management to bypass RLS. All four Server Actions (`addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `toggleAvailability`) use `lib/supabase/server.ts`'s regular client throughout.

## Security review
| Concern | Assessment |
|---|---|
| Can a business owner modify another business's menu items? | No — RLS enforces this at the database level regardless of what the action code does. Update/delete actions explicitly check `data.length === 0` after the operation and show a clear error rather than silently succeeding when RLS blocks a cross-owner attempt. |
| Can a customer/guest reach any of these routes? | No — every page and every Server Action independently calls `requireRole(["business_owner"])`, not just the pages that link to the actions. |
| Can invalid data reach the database? | No — server-side validation (required name, price must be a positive number) runs before any database call, with friendly messages redirected back to the form. Native HTML `required`/`min="0.01"` attributes provide a first layer of client-side feedback too, but the server-side check is the actual enforcement, not just a UX nicety. |
| Does price validation match the DB constraint? | The DB's own `check (price >= 0)` (`01_schema.sql`) permits zero; our application-level validation is intentionally stricter (`price > 0`), matching your "positive price only" requirement exactly, without needing to alter the existing constraint. |

## Validation implemented
- Required: name, price.
- Price must be a valid number, and strictly greater than zero (not just non-negative).
- Optional fields (description, category, image URL) explicitly allowed to be empty, stored as `null` rather than empty strings.
- All friendly error messages surfaced via redirect + query param, displayed on the relevant form/list page — consistent with the pattern already used for `/login?error=confirmation_failed`.

## UI/architecture consistency
- Reused `Card`, `Button` components as-is — zero changes to either.
- Reused the existing form field styling (border, focus ring, spacing) copied from `BusinessRegistrationForm.tsx`, not reinvented.
- Reused the Server Action + bound-form pattern already established by the admin panel (`approveBusiness.bind(null, id)` etc.) for delete/toggle — consistent architecture, not a new pattern.
- Mobile-first: single-column layout by default, `sm:` breakpoint used for wider layouts, matching every other form/list in the app.
- Dashboard's Menu card updated from an inert "Coming soon" placeholder to a real link — necessary given it was explicitly built anticipating this exact milestone; leaving it inert after building the real feature would be inconsistent, not "unchanged completed functionality."

## Dead code / cleanup verification
- Zero `console.log` statements anywhere in the new code (checked directly, not assumed).
- Zero TODO/FIXME/temporary markers.
- All `console.error` calls are legitimate permanent error logging, matching the established pattern.
- TypeScript syntax verified in isolation — no errors.

## What did NOT change
`01_schema.sql`, `02_profile_trigger.sql`, `03_guest_ordering.sql`, `04_backfill_missing_profiles.sql`, all existing RLS policies, `lib/supabase/*`, `lib/auth/*`, `middleware.ts`, the admin panel, `Header.tsx`, `Button.tsx`, `Card.tsx` — all untouched.

## Exact list of changed/new files
| File | Status |
|---|---|
| `05_menu_categories.sql` | New |
| `lib/menu/actions.ts` | New |
| `app/business/menu/page.tsx` | New |
| `app/business/menu/new/page.tsx` | New |
| `app/business/menu/[id]/edit/page.tsx` | New |
| `app/business/dashboard/page.tsx` | Modified (Menu card now links to the real feature; added `Button` import) |
