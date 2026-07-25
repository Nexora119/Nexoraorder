# CHANGELOG — Email Confirmation Session Fix

## Added
- `app/auth/callback/route.ts` — exchanges the PKCE confirmation code for a real session, then redirects to `/business/register` (no business yet) or `/` (already has one).

## Modified
- `app/signup/page.tsx` — added `emailRedirectTo` pointing at the new callback route.
- `app/login/page.tsx` — restructured with a `Suspense` boundary (required for `useSearchParams()`), added a visible error banner for failed confirmations.

## Removed
- None.

## Action required from you (not code)
Add the callback URL to Supabase's allowed Redirect URLs list — see HARDENING_REPORT.md for exact steps. The fix will not take effect until this is done.
