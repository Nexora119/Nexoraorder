-- NexoraOrders — Migration: Auto-create profile on signup
-- Milestone 2, Step 2 (Signup)
-- Run this AFTER 01_schema.sql, in the Supabase SQL Editor.
--
-- WHY THIS FILE EXISTS:
-- The `profiles` table (01_schema.sql) has no automatic way to get a row
-- when someone signs up via Supabase Auth. Without this trigger, every
-- new user would exist in `auth.users` but have no matching `profiles`
-- row, breaking RLS policies and any code that joins on `profiles`.
--
-- This does NOT modify 01_schema.sql or any existing table — it only adds
-- a trigger function that fires on new auth.users rows.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    'customer', -- default role; upgraded to 'business_owner' during business registration (Milestone 3)
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
