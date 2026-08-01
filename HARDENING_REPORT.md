# HARDENING_REPORT.md — Menu Image Optimization (Thumbnails, Dimension Validation, Scale)

**Scope:** New dependency, new schema column, rewritten storage processing, updated Server Actions and pages. Triggers our standing audit-report rule (database/storage access).

## Note on this session
The sandbox environment I work in reset partway through this task (an occasional occurrence in long sessions — unrelated to your repo, which is unaffected). I reconstructed every file from the complete history of this conversation before continuing, and re-ran full verification (brace balance, dead-code sweep, isolated TypeScript check) against the reconstructed set rather than assuming it was correct. Flagging this for transparency, not because it changes what's being delivered.

## New dependency: `sharp`
Added to `package.json`. This is the same image-processing library Next.js itself uses internally (for its own Image Optimization API), well-supported on Vercel's Node.js serverless runtime with prebuilt binaries — not an exotic or risky addition.

## Schema change, explained before building
`menu_items` had one `photo_url` column. Storing a separate thumbnail requires a second column — `07_menu_image_optimization.sql` adds `photo_thumbnail_url`, nullable, fully backward-compatible (existing/future items without a thumbnail simply fall back to `photo_url` in the UI).

## Storage structure for scale
Changed from one flat file per item (`{business_id}/{uuid}.ext`) to a per-item folder (`{business_id}/{item_uuid}/thumb.webp` + `.../full.webp`). Supabase Storage is S3-compatible object storage — "folders" are key prefixes, not real filesystem directories, so this structure doesn't degrade at any realistic scale (tens of thousands of items, or far more). Grouping both variants under one prefix also makes cleanup a single two-path delete, regardless of scale.

**No Storage RLS changes needed** — the existing four policies (`06_menu_image_storage.sql`, unchanged) check `(storage.foldername(name))[1]`, the *first* path segment. Adding a deeper subfolder level doesn't change what that first segment is, so the existing owner-scoping continues to work correctly with zero policy edits.

## What actually happens on upload now
1. Fast pre-check: MIME type + file size (unchanged from the prior refinement).
2. File decoded via `sharp`, actual pixel dimensions read.
3. **Dimension validation** (new): rejects anything above 8000px per side (guards against pathological images — small file size but enormous pixel dimensions, a real resource-exhaustion risk for any image-processing step) or below 20px per side (too small to be a meaningful photo).
4. **Thumbnail generated**: 400×400, cropped to cover, re-encoded as WebP at quality 75 — small and fast for list rendering.
5. **Full version generated conditionally**: only when the source is meaningfully larger than the thumbnail (>1.5× in either dimension). If the source is already thumbnail-sized or smaller, the thumbnail is reused as both variants rather than storing a near-duplicate second file. When generated, capped at 1600px on the longest side, never upscaled, re-encoded as WebP at quality 82. This is "retaining a higher-resolution original when appropriate" — not the raw unprocessed upload, which could be far larger than any UI will ever render.
6. Both variants uploaded to the per-item folder; if the full-version upload fails after the thumbnail already succeeded, the orphaned thumbnail is cleaned up immediately rather than left behind.

## Orphan cleanup — now handles two files consistently, in the same three places as before
- Delete menu item, replace image on edit, explicit "Remove image" — all three now delete *both* stored variants (deduplicated if they happen to be the same file, in the "no separate full needed" case).

## Security review
| Concern | Assessment |
|---|---|
| Can a business owner upload/process images for another business? | No — RLS policies unchanged and still correctly scoped, confirmed above. |
| Can a maliciously crafted image (e.g. a "decompression bomb") cause resource exhaustion during processing? | Mitigated — dimension validation happens immediately after decode, before either resize operation runs, rejecting anything above 8000px per side. |
| Does adding `sharp` introduce a new service-role or elevated-privilege need? | No — all storage operations still go through the same `SupabaseClient` instance passed in by the calling Server Action (the regular RLS-respecting client). `sharp` itself never touches Supabase; it only processes bytes in memory. |
| Can a failed processing step leave a half-created item or orphaned files? | No — validation and processing happen entirely before any `menu_items` database write; if processing fails, the action redirects with an error and never reaches the insert/update. |

## Cleanup verification
- Zero `console.log` anywhere in the new/changed files.
- Zero TODO/FIXME/XXX markers.
- The one new `console.error` (in `deleteMenuImages`, carried over from the prior refinement, now handling two paths instead of one) is legitimate — logs a failed cleanup attempt without blocking the calling action.
- TypeScript verified in isolation — no genuine syntax errors. Three filtered false-positives (`crypto`, `Buffer`, both Node built-ins) explained directly in this report rather than silently dropped — both are covered by the already-present `@types/node` devDependency, invisible only because this sandbox check has no real `node_modules`.

## What did NOT change
`01_schema.sql` through `06_menu_image_storage.sql` (policies), all RLS policies on `menu_items`/`businesses`/`profiles`, `lib/supabase/*`, `lib/auth/*`, `middleware.ts`, the admin panel, `toggleAvailability`, `Card.tsx`/`Button.tsx` — all untouched.

## Exact list of changed/new files
| File | Status |
|---|---|
| `package.json` | Modified — added `sharp` dependency |
| `07_menu_image_optimization.sql` | New — SQL migration, run in Supabase |
| `lib/menu/storage.ts` | Rewritten — dimension validation, thumbnail + conditional full generation, two-file deletion |
| `lib/menu/actions.ts` | Modified — `addMenuItem`/`updateMenuItem`/`deleteMenuItem` now handle both photo fields; `toggleAvailability` untouched |
| `components/menu/MenuItemImage.tsx` | Modified — added `loading="lazy"` (small, legitimate "keep loading fast" improvement) |
| `components/menu/ImageUploadField.tsx` | Unchanged in logic — caller now passes the thumbnail URL for the edit-form preview |
| `app/business/menu/page.tsx` | Modified — list now renders the thumbnail (falling back to full image for pre-thumbnail items) |
| `app/business/menu/[id]/edit/page.tsx` | Modified — fetches and passes `photo_thumbnail_url` for the preview |
| `app/business/menu/new/page.tsx` | Unchanged (no existing image to preview) |
