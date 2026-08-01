-- My Takeaway — Migration 07: Menu Image Thumbnails
-- Run AFTER 01-06, in the Supabase SQL Editor.
--
-- WHY THIS FILE EXISTS:
-- Performance/scale refinement: uploaded images are now processed
-- server-side into two variants — a small thumbnail for menu listings and
-- a capped-resolution full version. Storing both requires a second URL
-- column. photo_url (01_schema.sql) is repurposed to mean "full/optimized
-- image" rather than "the only image" — fully backward compatible, since
-- it already stores a URL and the UI already falls back to it wherever a
-- thumbnail isn't present (e.g. items uploaded before this migration).

alter table menu_items add column photo_thumbnail_url text;

-- No RLS changes needed — menu_items_owner_manage (01_schema.sql) already
-- covers this new column with no policy changes, same as category was
-- covered by it in 05_menu_categories.sql. The Storage RLS policies
-- (06_menu_image_storage.sql) also require no changes — see the comment
-- there explaining why the new deeper per-item subfolder structure
-- doesn't affect the folder-segment check.
