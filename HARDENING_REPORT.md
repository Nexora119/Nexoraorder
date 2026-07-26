# HARDENING_REPORT.md — Duplicate Email Signup UX Fix

**Scope:** Signup response handling. Triggers our standing audit-report rule (authentication).

## Root cause
Not a bug in our code's logic so much as an incomplete response-handling case: Supabase's `signUp()` intentionally returns a **fake-success response** (no `error`) when email confirmation is required and the email already belongs to a confirmed user — this is deliberate anti-enumeration behavior on Supabase's side, preventing attackers from probing which emails are registered by checking for a different error response. Our code only branched on `data.session` (always `null` in both the genuinely-new and masked-duplicate cases), so both were indistinguishable and both fell through to "Account created."

## Fix
Added a check on `data.user.identities.length === 0` — Supabase's one reliable signal for this case (a genuinely new signup has exactly one identity; a masked duplicate has zero). Three distinct outcomes now handled:
1. `data.session` present → immediate login, redirect to `/business/register` (unchanged).
2. Masked duplicate detected → neutral message: doesn't falsely claim an account was created, but also doesn't explicitly confirm the email is taken.
3. Genuinely new signup → "Account created..." (unchanged, now only shown when actually true).

Also added: full raw `{ data, error }` logged to the browser console, as requested, so the exact Supabase response is inspectable during testing.

## Why the message stays deliberately non-committal
Explicitly saying "this email is already registered" would defeat Supabase's own anti-enumeration protection — anyone could then probe arbitrary emails to discover who has an account. The chosen wording ("If an account with this email doesn't already exist... Already registered? Try logging in instead.") is honest and actionable without confirming or denying which case applies. This is a deliberate security trade-off, not an oversight — happy to revisit if you'd rather prioritize UX clarity over enumeration protection, but defaulting to the more secure/standard pattern.

## What did NOT change
`lib/supabase/*`, `lib/auth/*`, RLS policies, the login page, the auth callback route — all unaffected. Only `app/signup/page.tsx`'s response-handling logic changed.
