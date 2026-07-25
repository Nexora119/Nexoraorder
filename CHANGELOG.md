# CHANGELOG — Milestone 3: Business Registration

## Added
- `app/business/register/page.tsx` — protected page (business_owner only).
- `components/business/BusinessRegistrationForm.tsx` — the actual registration form (name, category, description, structured address, business email/phone, operating hours as free text). No payment fields, per your decision to defer to Milestone 6.

## Modified
- `app/page.tsx` — "List your business" → `/signup` (was `/register`).
- `app/signup/page.tsx` — successful signup redirects to `/business/register` (was `/`).
- `app/login/page.tsx` — after login, checks for an existing business; redirects to `/business/register` if none found, otherwise `/`.
- `app/register/page.tsx` — old stub converted to a redirect to `/signup`.

## Removed
- None.

## Why
First deliverable of Milestone 3 (Business Onboarding), per the roadmap. Reuses 100% of Milestone 2's authentication infrastructure (`requireRole`, session middleware, RLS) with zero changes to any of it.
