# MANUAL_TEST.md — Business Registration

## Requires Vercel deployment
1. Deploy all 6 files.
2. Visit `/` while logged out — click "List your business" — should land on `/signup` (not the old stub).
3. Sign up with a new test account.
4. If email confirmation is OFF: should land directly on `/business/register`.
5. If email confirmation is ON: confirm the email, log in at `/login` — should also land on `/business/register` (not `/`), since this account has no business yet.
6. Fill out the form and submit — should show "Business submitted for review."
7. In Supabase Table Editor → `businesses`, confirm the new row exists with `status = 'pending'`, correct `owner_id`, and all fields matching what you entered.
8. Try submitting a second business with the **same email** as an existing one — should show "A business is already registered with this email," not crash.
9. Log out, then log back in with the **same account** that already has a business — should land on `/` this time, not `/business/register` (confirms the "already has a business" check works both ways).
10. Visit the old `/register` URL directly — should redirect straight to `/signup`, not 404 or show the old "coming soon" message.
11. Try visiting `/business/register` directly while logged out — should redirect to `/login` (confirms protection still works).

## What to report back
- Does the full signup → register flow work end to end?
- Does the duplicate-email error show correctly?
- Does the login redirect correctly distinguish "has a business" vs "doesn't yet"?
