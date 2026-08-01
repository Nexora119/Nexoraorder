# MANUAL_TEST.md — Menu Image Optimization

## Required first
1. Run `07_menu_image_optimization.sql` in Supabase's SQL Editor (after 01-06).
2. Confirm `menu_items` now has a `photo_thumbnail_url` column.
3. Redeploy so `npm install` picks up the new `sharp` dependency — confirm the build succeeds (sharp requires a native binary; Vercel's build environment supports this automatically, but worth confirming the deploy log shows no errors around it).

## Thumbnail generation
4. Add a new menu item with a large photo (e.g. a typical phone photo, several MB, several thousand pixels wide).
5. Confirm it uploads successfully and appears on `/business/menu`.
6. In Supabase Storage, confirm TWO files now exist under `menu-images/{business_id}/{some-uuid}/`: `thumb.webp` and `full.webp`.
7. Confirm the thumbnail file is small (well under 100KB typically) and the full file is larger but still capped (not the original multi-MB size).

## Small-image handling
8. Add another item using a small image (e.g. under 400px wide/tall if you have one, or a small screenshot).
9. Confirm only ONE file exists in its storage folder this time (no separate `full.webp`) — this is the "retain higher-res original when appropriate" behavior; a source that's already thumbnail-sized doesn't get a redundant near-duplicate.

## Dimension validation
10. If you can find or create a test image with unusually large pixel dimensions (e.g. a stitched panorama over 8000px on one side, even if the file size itself is small) — try uploading it, should show a dimension-related error, not succeed.

## Display
11. Confirm `/business/menu` loads noticeably faster with several items than it did with full-size images (informal check — should feel snappier, especially on a throttled/mobile connection).
12. Confirm images are still consistently sized and cropped (not stretched) on the list.

## Edit / Replace / Remove — re-verify with the new two-file structure
13. Edit an item, replace its image with a new one — confirm both OLD files (thumb + full) are gone from Storage, and both NEW files exist.
14. Edit an item, remove its image — confirm both files are deleted, placeholder shows on the list.
15. Delete an item entirely — confirm both its files are gone from Storage (no orphans left behind, including the case from item 9 where there was only one file to begin with).

## What to report back
- Does the build succeed with the new `sharp` dependency?
- Do thumbnails generate correctly and load fast?
- Does the "skip redundant full version" behavior work for small source images?
- Does dimension validation catch an oversized image if you're able to test it?
- Confirmed no orphaned files after replace/remove/delete?
