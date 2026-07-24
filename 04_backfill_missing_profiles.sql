-- My Takeaway — Migration 04: Backfill Missing Profiles + Trigger Verification
-- Run in the Supabase SQL Editor, after 01/02/03.
--
-- WHY THIS FILE EXISTS:
-- Confirmed via /debug/auth: at least one auth.users account has no matching
-- profiles row. A completely MISSING row (not a wrong role) means the
-- on_auth_user_created trigger never fired for that signup — almost always
-- because the account was created before 02_profile_trigger.sql was run.
-- This is a one-time historical gap, not an ongoing bug, but the backfill
-- below repairs ALL orphaned accounts, not just the one already found.

-- ============================================================
-- STEP 1 — Verify the trigger actually exists and is enabled
-- (read-only, safe to run any time)
-- ============================================================
select
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled_status  -- 'O' = enabled (origin), 'D' = disabled
from pg_trigger
where tgname = 'on_auth_user_created';

-- Expect exactly one row: on_auth_user_created | auth.users | O
-- If this returns ZERO rows, the trigger doesn't exist at all — re-run
-- 02_profile_trigger.sql before continuing.

-- ============================================================
-- STEP 2 — Verify the trigger function's current logic
-- (read-only, safe to run any time)
-- ============================================================
select prosrc as function_body
from pg_proc
where proname = 'handle_new_user';

-- Confirm the body shows role default 'business_owner' (from
-- 03_guest_ordering.sql's CREATE OR REPLACE). If it still shows
-- 'customer', 03_guest_ordering.sql wasn't fully applied — re-run it.

-- ============================================================
-- STEP 3 — Find every orphaned account (read-only diagnostic)
-- ============================================================
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Review this list before proceeding to Step 4 — confirms exactly which
-- accounts are affected (should include b3270dc9-e0d4-48c4-bce0-be1d0a918ce5
-- at minimum).

-- ============================================================
-- STEP 4 — Backfill: create a profiles row for every orphaned account
-- ============================================================
-- Safe to re-run (idempotent) — ON CONFLICT DO NOTHING means running this
-- twice never creates duplicates or errors.
insert into public.profiles (id, role, full_name, phone)
select
  u.id,
  'business_owner', -- matches the trigger's current default
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'phone'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ============================================================
-- STEP 5 — Confirm zero orphans remain
-- ============================================================
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Expect ZERO rows returned. If any remain, something else is wrong —
-- stop and investigate rather than re-running Step 4 blindly.

-- ============================================================
-- OPTIONAL — Promote a specific account to admin
-- ============================================================
-- Uncomment and run manually ONLY if b3270dc9-... (or any other backfilled
-- account) should be your admin account rather than a business_owner.
-- Not run automatically — this is a deliberate, one-off decision, not
-- something a migration should do silently.

-- update public.profiles
-- set role = 'admin'
-- where id = 'b3270dc9-e0d4-48c4-bce0-be1d0a918ce5';
