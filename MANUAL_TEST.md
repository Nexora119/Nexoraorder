# MANUAL_TEST.md — Email Confirmation Session Fix

## Required first — cannot skip
1. In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:
   `https://<your-production-domain>/auth/callback`
2. Deploy the 3 changed/new files.

## Test
3. Sign up with a brand-new test email at `/signup`.
4. Check the email, click the confirmation link.
5. Confirm you land on `/business/register` (not the homepage, not logged out).
6. Check the header — should show "Log out" (confirms a real session exists, not just a redirect).
7. Fill out and submit the business registration form — should work exactly as before.
8. Test the "already has a business" path: confirm a second test signup that already completed registration — should land on `/` instead, header still showing "Log out".
9. Test the failure path (optional): visit `/auth/callback` directly with no `code` param — should redirect to `/login` showing the "didn't work or expired" banner.

## What to report back
- Does clicking the confirmation link now result in a real logged-in session?
- Does it correctly route to `/business/register` vs `/` depending on whether a business already exists?
- Any errors in Vercel logs (specifically anything prefixed `[auth/callback]`)?
