# CHANGELOG — Menu Image Optimization

## Added
- `07_menu_image_optimization.sql` — adds `photo_thumbnail_url` column to `menu_items`.
- `sharp` dependency in `package.json` for server-side image processing.

## Modified
- `lib/menu/storage.ts` — rewritten: `processAndUploadMenuImage` replaces `uploadMenuImage`, now validating actual pixel dimensions (not just file size/MIME type), generating a 400×400 WebP thumbnail always, and a capped-1600px WebP "full" version only when the source is meaningfully larger than the thumbnail. `deleteMenuImages` replaces `deleteMenuImage`, now deleting both variants per item (deduplicated when they're the same file).
- `lib/menu/actions.ts` — `addMenuItem`, `updateMenuItem`, `deleteMenuItem` updated to read/write both `photo_url` and `photo_thumbnail_url`, and to clean up both files on replace/remove/delete. `toggleAvailability` untouched.
- `components/menu/MenuItemImage.tsx` — added `loading="lazy"`.
- `app/business/menu/page.tsx` — renders the thumbnail (`photo_thumbnail_url || photo_url`) on each card instead of the full image.
- `app/business/menu/[id]/edit/page.tsx` — fetches `photo_thumbnail_url`, passes it as the edit form's image preview.

## Removed
- None (the prior single-file storage helpers were replaced, not left alongside the new ones).

## Why
Direct performance/scale refinement per your request: menu listings now load smaller, pre-optimized thumbnails instead of full-size uploaded images; dimension validation guards against pathological uploads; the per-item storage folder structure keeps management simple regardless of how many items accumulate system-wide.
