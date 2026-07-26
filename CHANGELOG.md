# CHANGELOG — Duplicate Email Signup UX Fix

## Modified
- `app/signup/page.tsx` — `handleSubmit` now:
  - Logs the full raw `{ data, error }` Supabase response to the browser console.
  - Detects Supabase's anti-enumeration "masked duplicate" response (`data.user.identities.length === 0`) and shows a neutral, honest message instead of falsely claiming "Account created."
  - Genuinely new signups still show "Account created" as before.

## Added / Removed
None.

## Why
You reported duplicate email signups always showed "Account created" — root cause was Supabase's intentional fake-success response for already-registered emails (see HARDENING_REPORT.md), not a bug in our error handling per se, just an unhandled third case.
