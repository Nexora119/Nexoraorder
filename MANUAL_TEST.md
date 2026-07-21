# MANUAL_TEST.md — Guest Ordering Migration

## 1. Code/SQL review only (already done)
- [x] Brace balance checked on all 3 changed `.tsx` files.
- [x] SQL migration: balanced parentheses, balanced `$$` dollar-quote pairs (used for the two function bodies).
- [x] Confirmed dropped policies (`orders_insert_customer`, `orders_select_own_customer`) exist in `01_schema.sql` as expected, and are correctly targeted for removal in the new migration — not accidentally referencing something that doesn't exist.

## 2. Requires a live Supabase project
1. Run `03_guest_ordering.sql` in the Supabase SQL Editor (after `01_schema.sql` and `02_profile_trigger.sql`, which should already be applied).
2. Should execute with no errors — it only alters the existing `orders` table and updates one function.
3. Open Table Editor → `orders` — confirm new columns exist: `guest_name`, `guest_phone`, `guest_email`, `order_number`, `lookup_token`, `pickup_code`, `refund_reference`.
4. Open Authentication → Policies → `orders` table — confirm `orders_insert_customer` and `orders_select_own_customer` are gone, and `orders_select_own_business`/`orders_update_business` are still present.
5. Sign up a brand-new test account at `/signup` — check the `profiles` table afterward, confirm `role` is `business_owner`, not `customer`.

## 3. Requires Vercel deployment
6. Visit `/` — confirm the "Log in"/"Sign up" buttons are gone, replaced by a small "Business login" link top-right.
7. Click "Business login" — should go to `/login`, now titled "Business login" with updated copy.
8. Visit `/signup` — should read "Register your business" with updated copy.
9. Log in with an existing test account — should still work identically to before (mechanism unchanged, only copy changed).
10. Confirm nothing else on the site changed behavior — browse/register stubs, header logo/logout, session persistence all identical to before this migration.

## What to report back
- Did the SQL migration run cleanly?
- Does a new signup correctly get `role = business_owner`?
- Does the homepage/login/signup copy read correctly for the business-owner framing?
- Anything unexpected in Vercel logs or browser console?
