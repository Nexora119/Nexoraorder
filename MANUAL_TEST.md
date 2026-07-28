# MANUAL_TEST.md — Business Dashboard Shell

## Requires Vercel deployment
1. Deploy all 4 changed/new files.
2. Log in with a business owner account that **already has an approved (active) business**:
   - Should land on `/business/dashboard`, not `/`.
   - Status card should show "Active and visible to customers" with subscription/trial info.
3. Register a **new** test business (new signup → `/business/register` → submit):
   - Should redirect straight to `/business/dashboard` after submitting (not the old static "submitted for review" card).
   - Status card should show "pending admin review" messaging.
4. Have an admin **reject** that test business (via `/admin`), then reload the dashboard as that business owner:
   - Status card should show the rejection message and reason.
5. Have an admin **approve** a pending business, then reload the dashboard as that owner:
   - Status should flip to "Active," subscription info should appear.
6. Confirm the Menu and Orders placeholder cards appear (visually muted, "Coming soon") but aren't clickable/functional — expected, not a bug.
7. Try visiting `/business/dashboard` with a business owner account that has **no business at all** (if you can arrange this test case) — should redirect to `/business/register`.
8. Confirm a **customer/guest** browsing the public site is completely unaffected — `/browse` still works, no login prompts anywhere.

## What to report back
- Does login/signup correctly land approved and pending business owners on the dashboard?
- Does the status messaging correctly reflect pending/active/rejected/inactive?
- Anything unexpected in console or Vercel logs?
