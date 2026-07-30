-- My Takeaway — Migration 05: Menu Item Categories
-- Run AFTER 01-04, in the Supabase SQL Editor.
--
-- WHY THIS FILE EXISTS:
-- Milestone 4 (Menu Management) requires each menu item to support a
-- category (e.g. "Kotas", "Drinks", "Sides"). No column for this exists
-- on menu_items today. Additive only, per the established one-concern-
-- per-migration discipline (01-04).
--
-- Free text, matching the same simple pattern already used for
-- businesses.category — no separate categories table, consistent with
-- MVP scope. Nullable: existing/future items without a category set are
-- still valid, just grouped under "Uncategorized" in the UI.

alter table menu_items add column category text;

-- No RLS changes needed — menu_items_owner_manage (01_schema.sql) already
-- covers select/insert/update/delete scoped to the owning business, and
-- automatically applies to this new column with no policy changes.
