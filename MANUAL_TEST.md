# MANUAL_TEST.md — Duplicate Email Signup UX Fix

## Requires Vercel deployment
1. Deploy the updated `app/signup/page.tsx`.
2. Open browser DevTools console before testing (so you catch the logged response).
3. Sign up with a **brand-new** email — confirm:
   - Console shows the full `{ data, error }` response, with `data.user.identities` containing 1 item.
   - UI shows "Account created. Check your email..."
4. Try signing up **again with the exact same email** you just used in step 3 (should still be unconfirmed at this point):
   - Check what the console shows for `identities` this time — Supabase's behavior can vary depending on whether the existing account is confirmed or not, so note what you actually see.
5. Confirm the first account via its email link, then try signing up a **third time with that same now-confirmed email**:
   - Console should show `data.user.identities` as an empty array.
   - UI should show the new neutral message ("If an account with this email doesn't already exist...") — NOT "Account created."

## What to report back
- Paste what the console actually logged for step 5 (the masked-duplicate case) — confirms whether Supabase's real behavior matches what this fix assumes.
- Does the UI message correctly differ between a new signup and a duplicate?
