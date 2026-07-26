# MANUAL_TEST.md — Admin Approval Panel

## Prerequisite
You need at least one account with `role = 'admin'` in `profiles` (per Milestone 2, this is set manually — e.g. via the optional `UPDATE` in `04_backfill_missing_profiles.sql`, or directly in Supabase's Table Editor).

Also confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel for Production (you were asked to grab this "while you were there" back in the env var recovery step — this is the first feature that actually needs it).

## Requires Vercel deployment
1. Deploy `lib/admin/actions.ts` and `app/admin/page.tsx`.
2. Log in with a **non-admin** business owner account, visit `/admin` directly — should redirect to `/unauthorized`.
3. Log out, log in with your **admin** account, visit `/admin` — should load, no redirect.
4. If you have a business already submitted (from testing Business Registration), it should appear under "Pending review" with its details and Approve/Reject controls.
5. Click **Approve** on a pending business:
   - Page should refresh showing it under "All other businesses" with status `active`.
   - Check Supabase Table Editor → `businesses`: confirm `status = 'active'`, `approved_at` set, `approved_by` = your admin profile id, `trial_start_date` set.
   - Check `subscriptions` table: confirm a new row exists for that business with `billing_status = 'trial'` and `trial_end_date` ≈ 30 days from now.
6. Submit a second test business (via `/business/register` with a different test account), then **Reject** it with a reason typed in the text field:
   - Should move to "All other businesses" with status `rejected` and show the reason you typed.
7. Try rejecting a third test business with the reason field **left blank**:
   - Should still work, showing "No reason provided."
8. On an **active** business, click **Deactivate**:
   - Status should change to `inactive`.
9. Confirm a **customer/guest** browsing `/browse` never sees pending, rejected, or inactive businesses — only active ones (this was already true before this feature via existing RLS on `businesses_select_active_public`, just confirming nothing regressed).
10. Check browser console and Vercel Function logs throughout — no unexpected errors.

## What to report back
- Does role-based access work correctly (non-admin blocked, admin allowed)?
- Does approval correctly create both the business status change AND the subscription row?
- Does rejection with and without a reason both work?
- Does deactivation work?
- Anything unexpected in logs?
