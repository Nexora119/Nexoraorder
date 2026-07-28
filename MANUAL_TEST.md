# MANUAL_TEST.md — Admin Login Redirect Fix

## Requires Vercel deployment
1. Deploy `app/login/page.tsx` and `app/auth/callback/route.ts`.
2. Log in with the admin account via `/login` directly (not by first visiting `/admin`) — should land straight on `/admin`, no `/unauthorized` detour.
3. Repeat, but starting from `/admin` while logged out (redirects to `/login` first, then log in) — should also land on `/admin` correctly now.
4. Log in with a business-owner account that has no business yet — should still go to `/business/register` (unchanged).
5. Log in with a business-owner account that already has a business — should still go to `/business/dashboard` (unchanged).
6. If you have an unconfirmed admin signup available to test: confirm the email, land via `/auth/callback` — should also go straight to `/admin`.

## Separately — continue the logout investigation as planned
7. Log in as admin, visit `/admin` (confirm it loads normally).
8. Log out.
9. Navigate to `/admin` again the same way that previously showed the stale "loads without login" behavior.
10. Check Vercel logs for `[ADMIN PAGE DEBUG]` entries during step 9 specifically, and report back:
    - No log entries at all → points to browser back-forward cache.
    - Log entries present, showing a still-valid admin session → points to incomplete sign-out.

## What to report back
- Does admin login now correctly land on `/admin` every time?
- Business-owner flows still unaffected?
- Results of the logout re-test (step 10) — this determines what, if anything, we fix next for issue #2.
