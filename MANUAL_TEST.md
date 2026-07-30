# MANUAL_TEST.md — Milestone 4: Menu Management

## Required first
1. Run `05_menu_categories.sql` in Supabase's SQL Editor (after 01-04).
2. Confirm in Table Editor: `menu_items` now has a `category` column.

## Requires Vercel deployment
3. Deploy all 5 changed/new files.
4. Log in as a business owner with an active (or pending) business.
5. On `/business/dashboard`, confirm the Menu card now says "Manage menu" with a working button (not "Coming soon").
6. Visit `/business/menu` — should show the empty state ("No menu items yet...").

### Add
7. Click "Add Item," fill in Name and Price only (leave description/category/image blank) — submit.
   - Should redirect to `/business/menu` and show the new item.
8. Click "Add Item" again, leave Name blank, try to submit — browser should block it (native `required`). Bypass this by testing directly if needed, or trust the server-side check (step 9).
9. Try adding an item with Price = 0 or a negative number — should show "Price must be greater than zero," item should NOT be created.
10. Add a second item with all fields filled in (description, category, image URL) — confirm all fields display correctly on the list.

### Edit
11. Click "Edit" on an item — form should be pre-filled with its current values.
12. Change the name and price, save — confirm the list reflects the changes.
13. Try clearing the price field and saving — should show the validation error, not silently fail.

### Toggle
14. Click "Mark Unavailable" on an item — badge should flip to "Unavailable," button label should flip to "Mark Available."
15. Click it again — should flip back.

### Delete
16. Delete an item — should disappear from the list immediately.
17. Delete all items — should return to the empty state.

### Security (if you can test with two business owner accounts)
18. As Business Owner A, note a menu item's URL (`/business/menu/<id>/edit`).
19. Log in as Business Owner B, try visiting that exact URL directly.
   - Should show a 404 (via `notFound()`), not Business Owner A's item.

### Mobile
20. Check `/business/menu`, the Add form, and the Edit form on a narrow viewport — should stack cleanly, no horizontal scrolling, buttons full-width where expected.

## What to report back
- Does every CRUD operation work correctly?
- Does price validation correctly reject zero/negative values?
- Does the cross-owner security test (steps 18-19) show a 404, not someone else's data?
- Anything unexpected in console or Vercel logs?
