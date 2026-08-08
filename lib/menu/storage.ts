import { randomUUID } from "crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

// Kept separate from lib/menu/actions.ts to keep the Server Actions
// themselves focused on orchestration, not storage/image mechanics.

export const MENU_IMAGES_BUCKET = "menu-images";
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — matches the bucket's own file_size_limit (06_menu_image_storage.sql)

// Dimension guards. MAX exists to reject pathological images (technically
// small file size but enormous pixel dimensions — a real resource-exhaustion
// risk for any image-processing step, not just a UX nicety). MIN rejects
// images too small to be a meaningful menu photo.
const MAX_IMAGE_DIMENSION_PX = 8000;
const MIN_IMAGE_DIMENSION_PX = 20;

// Thumbnail: fixed square-ish crop for consistent, fast-loading list
// rendering. Full: capped on the longest side, preserving aspect ratio,
// never upscaled — this is "retaining a higher-resolution original when
// appropriate," not the literal unprocessed upload (which could be far
// larger than any UI ever needs to render).
const THUMBNAIL_SIZE_PX = 400;
const FULL_MAX_DIMENSION_PX = 1600;

/**
 * Fast, pre-decode validation (MIME type + file size only) — checked
 * before any image processing is attempted, so a bad file gives an
 * immediate friendly error rather than wasting a decode attempt. Actual
 * pixel-dimension validation happens in processAndUploadMenuImage below,
 * since it requires decoding the image first.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be smaller than 5MB.";
  }
  return null;
}

export interface ProcessedImageUrls {
  fullUrl: string;
  thumbnailUrl: string;
}

/**
 * Decodes the uploaded file, validates its actual pixel dimensions,
 * generates a thumbnail and (when the source is meaningfully larger than
 * the thumbnail) a separate capped-resolution full version, uploads both
 * to Storage under one item-scoped folder, and returns their public URLs.
 *
 * Storage layout: {businessId}/{itemImageId}/thumb.webp and
 * .../full.webp. Grouping both variants under one per-item prefix (rather
 * than one flat file per item) is what makes cleanup a single two-path
 * delete regardless of how many items exist system-wide — Supabase
 * Storage is S3-compatible object storage under the hood, so "folders"
 * are just key prefixes, not real filesystem directories, meaning this
 * structure doesn't degrade at any realistic scale (tens of thousands of
 * items, or more).
 *
 * The businessId folder segment is what the Storage RLS policies
 * (06_menu_image_storage.sql) check against — the caller is responsible
 * for having already confirmed businessId belongs to the current
 * authenticated owner (both addMenuItem and updateMenuItem already fetch/
 * verify this via the businesses table before calling here).
 */
export async function processAndUploadMenuImage(
  supabase: SupabaseClient,
  businessId: string,
  file: File
): Promise<{ urls: ProcessedImageUrls | null; error: string | null }> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { urls: null, error: validationError };
  }

  let inputBuffer: Buffer;
  try {
    inputBuffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { urls: null, error: "Couldn't read the uploaded file. Please try again." };
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch {
    return { urls: null, error: "That file doesn't appear to be a valid image." };
  }

  const { width, height } = metadata;
  if (!width || !height) {
    return { urls: null, error: "Couldn't determine the image's dimensions." };
  }
  if (width > MAX_IMAGE_DIMENSION_PX || height > MAX_IMAGE_DIMENSION_PX) {
    return {
      urls: null,
      error: `Image dimensions are too large (max ${MAX_IMAGE_DIMENSION_PX}px per side).`,
    };
  }
  if (width < MIN_IMAGE_DIMENSION_PX || height < MIN_IMAGE_DIMENSION_PX) {
    return {
      urls: null,
      error: `Image dimensions are too small (min ${MIN_IMAGE_DIMENSION_PX}px per side).`,
    };
  }

  const itemImageId = randomUUID();
  const folder = `${businessId}/${itemImageId}`;

  try {
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(THUMBNAIL_SIZE_PX, THUMBNAIL_SIZE_PX, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();

    const thumbPath = `${folder}/thumb.webp`;

    // TEMPORARY DIAGNOSTIC — determine whether this Storage request is
    // actually authenticated, per your instruction. Not modifying the
    // upload call itself, just observing state immediately before/after it.
    {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();
      const {
        data: { session },
        error: getSessionError,
      } = await supabase.auth.getSession();
      console.log("=== STORAGE DEBUG ===");
      console.log("Call:", "thumbnail");
      console.log("auth.getUser() user:", user);
      console.log("auth.getUser() error:", getUserError);
      console.log("auth.getSession() session:", session);
      console.log("auth.getSession() error:", getSessionError);
      console.log("Business ID:", businessId);
      console.log("Upload path:", thumbPath);
      console.log("Bucket:", MENU_IMAGES_BUCKET);
    }

    const thumbUploadResult = await supabase.storage
      .from(MENU_IMAGES_BUCKET)
      .upload(thumbPath, thumbnailBuffer, { contentType: "image/webp" });

    console.log("=== STORAGE DEBUG ===");
    console.log("Call:", "thumbnail");
    console.log("Upload result data:", thumbUploadResult.data);
    console.log("Upload result error:", thumbUploadResult.error);

    const { error: thumbUploadError } = thumbUploadResult;

    if (thumbUploadError) {
      return { urls: null, error: thumbUploadError.message };
    }

    const thumbnailUrl = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(thumbPath)
      .data.publicUrl;

    // Only generate a separate full-size file when the source is
    // meaningfully larger than the thumbnail — otherwise it would just be
    // a near-duplicate of the thumbnail, wasting storage. This is the
    // "retaining a higher-resolution original when appropriate" behavior.
    const needsSeparateFull =
      width > THUMBNAIL_SIZE_PX * 1.5 || height > THUMBNAIL_SIZE_PX * 1.5;

    let fullUrl = thumbnailUrl;

    if (needsSeparateFull) {
      const fullBuffer = await sharp(inputBuffer)
        .resize(FULL_MAX_DIMENSION_PX, FULL_MAX_DIMENSION_PX, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();

      const fullPath = `${folder}/full.webp`;

      // TEMPORARY DIAGNOSTIC — same pattern as the thumbnail upload above.
      {
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();
        const {
          data: { session },
          error: getSessionError,
        } = await supabase.auth.getSession();
        console.log("=== STORAGE DEBUG ===");
        console.log("Call:", "full");
        console.log("auth.getUser() user:", user);
        console.log("auth.getUser() error:", getUserError);
        console.log("auth.getSession() session:", session);
        console.log("auth.getSession() error:", getSessionError);
        console.log("Business ID:", businessId);
        console.log("Upload path:", fullPath);
        console.log("Bucket:", MENU_IMAGES_BUCKET);
      }

      const fullUploadResult = await supabase.storage
        .from(MENU_IMAGES_BUCKET)
        .upload(fullPath, fullBuffer, { contentType: "image/webp" });

      console.log("=== STORAGE DEBUG ===");
      console.log("Call:", "full");
      console.log("Upload result data:", fullUploadResult.data);
      console.log("Upload result error:", fullUploadResult.error);

      const { error: fullUploadError } = fullUploadResult;

      if (fullUploadError) {
        // Thumbnail already uploaded successfully at this point — clean it
        // up rather than leaving an orphaned thumb with no matching item.
        await supabase.storage.from(MENU_IMAGES_BUCKET).remove([thumbPath]);
        return { urls: null, error: fullUploadError.message };
      }

      fullUrl = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(fullPath).data.publicUrl;
    }

    return { urls: { fullUrl, thumbnailUrl }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { urls: null, error: `Image processing failed: ${message}` };
  }
}

/**
 * Reverses getPublicUrl() to recover the storage path from a stored URL,
 * needed for deletion. Deterministic — public URLs always follow this
 * exact format because we're the only ones who ever generate them.
 */
export function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${MENU_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}

/**
 * Deletes both stored variants (full + thumbnail) for a menu item, given
 * its current photo_url/photo_thumbnail_url. Used on explicit "remove
 * image", on replace (cleaning up the old pair), and on menu item deletion
 * (so orphaned files don't accumulate). Deduplicates in case both URLs
 * point at the same file (the "no separate full needed" case) and
 * silently no-ops on anything null/unparseable — callers don't need to
 * check first.
 */
export async function deleteMenuImages(
  supabase: SupabaseClient,
  fullUrl: string | null | undefined,
  thumbnailUrl: string | null | undefined
): Promise<void> {
  const paths = new Set<string>();

  for (const url of [fullUrl, thumbnailUrl]) {
    if (!url) continue;
    const path = storagePathFromPublicUrl(url);
    if (path) paths.add(path);
  }

  if (paths.size === 0) return;

  const { error } = await supabase.storage.from(MENU_IMAGES_BUCKET).remove([...paths]);
  if (error) {
    console.error("[deleteMenuImages] Failed to delete storage object(s):", error.message);
  }
}
