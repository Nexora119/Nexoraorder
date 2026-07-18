# MANUAL_TEST.md — Milestone 2, Step 2 (Signup)

Run these once your Vercel deployment limit resets. Grouped by what each check actually requires.

## 1. Code review only (already done — no action needed)
- [x] All imports in `app/signup/page.tsx` and `app/login/page.tsx` resolve to existing files.
- [x] Both pages have `"use client"` as the first line (required for hooks/interactivity).
- [x] `01_schema.sql` confirmed byte-for-byte unchanged.
- [x] No syntax/brace errors in either file.

## 2. Requires a live Supabase project (do this before deploying)
1. Open Supabase SQL Editor → run `02_profile_trigger.sql`.
   - Should execute with no errors (it only creates a function + trigger).
2. Go to Authentication → Providers → Email. Note whether **"Confirm email"** is ON or OFF — this changes what you should expect in step 5 below.

## 3. Requires Vercel deployment
3. Deploy the updated files (overwrite `app/login/page.tsx`, add `app/signup/page.tsx` and `02_profile_trigger.sql` in your repo — see file list in CHANGELOG.md).
4. Visit `/signup`. Fill in the form with a real, checkable email address.
5. Submit:
   - **If "Confirm email" is ON:** you should see the green message "Account created. Check your email to confirm your address before logging in." — you should NOT be redirected.
   - **If "Confirm email" is OFF:** you should be redirected straight to `/`.
6. Open Supabase Table Editor → `profiles` table. Confirm a new row exists with the correct `full_name` and `phone` you entered (this confirms the trigger worked).
7. If email confirmation was ON: click the confirmation link in the email, then go to `/login` and log in with the same credentials — should succeed and redirect to `/`.
8. Try signing up again with the same email — you should see a real error message from Supabase (e.g. "User already registered"), not a crash or blank page.
9. Open browser dev tools console on both `/signup` and `/login` — confirm no red errors, no hydration warnings.
10. Confirm the "Sign up" link on `/login` no longer shows "(coming in the next step)" and correctly navigates to `/signup`.

## What to report back
- Whether email confirmation is ON or OFF in your project (so I know which flow to assume going forward).
- Any console errors, red error messages, or unexpected behavior at any step above.
