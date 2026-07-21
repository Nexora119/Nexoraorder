-- My Takeaway — Migration 03: Guest Ordering
-- Run AFTER 01_schema.sql and 02_profile_trigger.sql, in the Supabase SQL Editor.
--
-- WHY THIS FILE EXISTS:
-- Redesigns order creation around true guest checkout (no customer accounts,
-- ever) per the approved migration plan. Additive only — 01_schema.sql and
-- 02_profile_trigger.sql are never edited retroactively.

-- ============================================================
-- 1. Order number sequence (customer-facing: MT-2026-000124)
-- ============================================================
create sequence if not exists order_number_seq start 1;

-- ============================================================
-- 2. Pickup code generator (short, human-friendly: A1B2C3)
-- Not globally unique by design — purely a spoken/visual reference at
-- pickup, carries no security weight. Collision risk is negligible at
-- expected order volumes and low-stakes even if it occurred.
-- ============================================================
create or replace function generate_pickup_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- ============================================================
-- 3. Orders table changes
-- ============================================================

-- Guests never get a profiles row — customer_id is no longer required.
-- Left in place (not dropped) in case a future feature needs it (e.g. a
-- business owner logging a walk-in order under their own profile).
alter table orders alter column customer_id drop not null;

-- Guest contact fields
alter table orders add column guest_name text;
alter table orders add column guest_phone text;
alter table orders add column guest_email text;

-- Customer-facing order number
alter table orders add column order_number text;
alter table orders alter column order_number set default (
  'MT-' || extract(year from now())::text || '-' ||
  lpad(nextval('order_number_seq')::text, 6, '0')
);
alter table orders alter column order_number set not null;
alter table orders add constraint orders_order_number_unique unique (order_number);

-- Secure lookup token for guest tracking URLs — long, random, unguessable.
alter table orders add column lookup_token uuid not null default gen_random_uuid();
alter table orders add constraint orders_lookup_token_unique unique (lookup_token);

-- Pickup code
alter table orders add column pickup_code text not null default generate_pickup_code();

-- Every order needs SOME identification — either a real profile (rare/
-- future use) or full guest contact details. Never neither.
alter table orders add constraint orders_customer_or_guest_check
  check (
    customer_id is not null
    or (guest_name is not null and guest_phone is not null)
  );

-- Recommended addition (forward-looking review, §4): supports Milestone 6's
-- automatic-refund-on-rejection (FR16) without a future one-column migration.
alter table orders add column refund_reference text;

-- ============================================================
-- 4. RLS policy changes
-- ============================================================

-- No longer applicable — customers never authenticate, so these policies
-- can never match anything from now on.
drop policy if exists "orders_insert_customer" on orders;
drop policy if exists "orders_select_own_customer" on orders;

-- NOTE: no new public INSERT or SELECT policy is added for guests.
-- Guest order creation happens server-side (Paystack webhook handler,
-- Milestone 6) using the service-role client (lib/supabase/admin.ts),
-- which bypasses RLS entirely under our own controlled logic. Guest order
-- LOOKUP happens the same way, via a Route Handler matching on
-- lookup_token. A client-side RLS policy can't safely express "let a
-- guest read the one row matching a token they present" — RLS controls
-- per-row visibility, not "did the client apply the right filter."
--
-- orders_select_own_business and orders_update_business (business owners,
-- auth.uid()-based) are UNCHANGED — still work exactly as before.

-- Cleanup: simplify order_items/order_status_history SELECT policies.
-- The old customer_id = auth.uid() branch is now permanently-dead code
-- (customer_id is always NULL for guest orders, and NULL = anything is
-- never true in SQL) — removing it for clarity, not because it was unsafe.
drop policy if exists "order_items_select" on order_items;
create policy "order_items_select" on order_items
  for select using (
    exists (
      select 1 from orders o
      join businesses b on b.id = o.business_id
      where o.id = order_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists "order_status_history_select" on order_status_history;
create policy "order_status_history_select" on order_status_history
  for select using (
    exists (
      select 1 from orders o
      join businesses b on b.id = o.business_id
      where o.id = order_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Profile trigger: default role changes from customer to business_owner
-- ============================================================
-- Customers never sign up anymore — the only people hitting this trigger
-- from now on are business owners. CREATE OR REPLACE, not editing the
-- original 02_profile_trigger.sql file. The trigger itself (on_auth_user_
-- created) is unchanged, only the function body.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'business_owner',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;
