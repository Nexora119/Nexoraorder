# CHANGELOG — Milestone 4: Menu Management

## Added
- `05_menu_categories.sql` — adds `category` column to `menu_items` (the one real schema gap; everything else already supported by existing RLS).
- `lib/menu/actions.ts` — `addMenuItem`, `updateMenuItem`, `deleteMenuItem`, `toggleAvailability`. Regular RLS-respecting client throughout, never service-role. Each independently re-checks `requireRole(["business_owner"])`.
- `app/business/menu/page.tsx` — list page: empty state, Add Item button, per-item Edit/Delete/Toggle.
- `app/business/menu/new/page.tsx` — add item form.
- `app/business/menu/[id]/edit/page.tsx` — edit item form, pre-filled from the existing row.

## Modified
- `app/business/dashboard/page.tsx` — Menu card changed from an inert "Coming soon" placeholder to a real link to `/business/menu`. Added the `Button` import needed for this (was missing before, only `Card` was imported).

## Removed
- None.

## Why
Implements Milestone 4 per the roadmap: business owners can now fully manage their menu (add, edit, delete, toggle availability), gated by the same `requireRole(["business_owner"])` used throughout, secured by the existing `menu_items_owner_manage` RLS policy with zero new policies needed.
