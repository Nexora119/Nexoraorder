-- My Takeaway — Migration 06: Menu Image Storage
-- Run AFTER 01-05, in the Supabase SQL Editor.
--
-- WHY THIS FILE EXISTS:
-- Replaces the Image URL text field with real Supabase Storage uploads.
-- Creates the storage bucket and its access policies. No changes to
-- menu_items itself — photo_url already exists (01_schema.sql) and simply
-- now stores a Supabase Storage public URL instead of an arbitrary
-- user-pasted one.

-- ============================================================
-- 1. Bucket
-- ============================================================
-- PUBLIC bucket: menu images must be visible to guest customers browsing
-- an active business's menu (customers never authenticate, per the
-- guest-ordering architecture — a private bucket would need signed URLs
-- just to show a food photo on a public page). Public only affects
-- anonymous READ access — upload/replace/delete are independently gated
-- by the RLS policies below regardless of this setting.
--
-- file_size_limit and allowed_mime_types are enforced by Supabase Storage
-- itself at the infrastructure level — a genuine server-side backstop,
-- not just a check in our application code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- 2. RLS policies on storage.objects
-- ============================================================
-- All four scoped identically: the object's path is expected to start
-- with "{business_id}/..." — storage.foldername(name) is Supabase's
-- documented helper for splitting a storage path into folder segments,
-- and (storage.foldername(name))[1] gives the business_id segment (the
-- first segment, regardless of how many segments follow it — this still
-- holds true after 07_menu_image_optimization.sql adds a deeper per-item
-- subfolder). A business owner may only act on objects inside their own
-- business's folder. This is the standard, officially-documented Supabase
-- pattern for owner-scoped storage access.

create policy "menu_images_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );

create policy "menu_images_update_own" on storage.objects
  for update
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );

create policy "menu_images_delete_own" on storage.objects
  for delete
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );

-- Authenticated owner read access (separate from public anonymous reads,
-- which work automatically because the bucket itself is public — this
-- policy covers any authenticated/programmatic access path, e.g. listing).
create policy "menu_images_select_own" on storage.objects
  for select
  using (
    bucket_id = 'menu-images'
    and exists (
      select 1 from businesses b
      where b.id::text = (storage.foldername(name))[1]
      and b.owner_id = auth.uid()
    )
  );
