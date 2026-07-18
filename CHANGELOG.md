# CHANGELOG — Milestone 2, Step 2 (Signup)

## Added
- `app/signup/page.tsx` — Signup form (full name, phone, email, password). Calls Supabase `auth.signUp()` with `options.data` to pass `full_name`/`phone` as user metadata. Handles both possible Supabase behaviors: instant session (redirects home) or email-confirmation-required (shows a message instead of redirecting).
- `02_profile_trigger.sql` — New, standalone migration. Adds a Postgres trigger (`on_auth_user_created`) that fires after every insert into `auth.users`, automatically creating a matching row in `public.profiles` with the metadata passed from signup. Does not alter `01_schema.sql` in any way — kept separate so database changes stay trackable and the original setup file stays intact, per your instruction.

## Modified
- `app/login/page.tsx` — Removed the placeholder text `(coming in the next step)` next to the "Sign up" link, since `/signup` is now a real page. No logic, imports, or structure changed — this was a single line of JSX text removed.

## Removed
- None.

## Why each change was required
- **Signup page**: this step's deliverable per the roadmap (Milestone 2: Login → Signup → Session handling → Protected routes).
- **Profile trigger**: without it, users created via `auth.signUp()` would have no corresponding `profiles` row, which breaks every RLS policy that joins against `profiles` (see `01_schema.sql`) and would silently fail later features (business registration, order history, etc.) that expect a profile to exist. This is a required dependency of the signup feature, not an optional add-on.
- **Login page edit**: purely cosmetic correction now that the link target exists; left in because shipping a page that says "coming soon" next to a working link would be misleading.

## Confirmed unchanged
- `01_schema.sql` — checksum-verified untouched.
- All other files from Milestone 1 and Step 1 (Login) — untouched.
