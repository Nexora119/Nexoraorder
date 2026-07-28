# MANUAL_TEST.md — Business Dashboard Subscription Display Fix

## Requires Vercel deployment
1. Deploy the updated `app/business/dashboard/page.tsx`.
2. Log in as a business owner whose business is already `active` (approved).
3. On the dashboard, confirm you now see all four:
   - Billing status
   - Trial status ("In trial" or "Trial ended")
   - Trial start date
   - Trial end date
4. Cross-check the dates against Supabase Table Editor — `businesses.trial_start_date` and `subscriptions.trial_end_date` for that business — should match what's displayed.
5. If you have any business that's `active` but somehow has no subscription row, confirm it shows "No subscription record found for this business yet" instead of a blank space.

## What to report back
- Do all four pieces of subscription/trial info now display correctly?
- Do the displayed dates match what's actually in the database?
