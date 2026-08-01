"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";
import {
  processAndUploadMenuImage,
  deleteMenuImages,
  validateImageFile,
} from "@/lib/menu/storage";

// OWNER-SCOPED OPERATIONS ONLY. Uses the regular RLS-respecting server
// client (lib/supabase/server.ts) throughout — NEVER the service-role
// client. This is deliberate: menu_items_owner_manage (01_schema.sql,
// "for all") already permits an authenticated business owner to select/
// insert/update/delete rows on businesses they own, with no gaps. Unlike
// the admin panel (which genuinely needed cross-user access the
// service-role client provides), there is no legitimate reason for menu
// management to ever bypass RLS — every operation here is naturally
// scoped to "my own business's menu," which is exactly what RLS already
// enforces at the database level, independent of anything checked here.
//
// Each action still independently calls requireRole(["business_owner"])
// first, not just relying on the pages that link to them, matching the
// defense-in-depth pattern already established for admin actions.
//
// redirect() is always called OUTSIDE any try/catch (Next.js requirement
// — it throws internally) — each action computes a target path inside
// try/catch, then redirects once at the end.

function validateMenuItemInput(name: string, priceRaw: string): string | null {
  if (!name) {
    return "Name is required.";
  }
  if (!priceRaw) {
    return "Price is required.";
  }
  const price = Number(priceRaw);
  if (Number.isNaN(price)) {
    return "Price must be a number.";
  }
  if (price <= 0) {
    return "Price must be greater than zero.";
  }
  return null;
}

export async function addMenuItem(formData: FormData) {
  const user = await requireRole(["business_owner"]);

  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString().trim() ?? "";

  const validationError = validateMenuItemInput(name, priceRaw);
  if (validationError) {
    redirect(`/business/menu/new?error=${encodeURIComponent(validationError)}`);
  }

  const imageEntry = formData.get("image");
  const hasImageFile = imageEntry instanceof File && imageEntry.size > 0;

  // Checked before the try/catch (and before ever touching Storage) so a
  // bad file gives an immediate, friendly redirect rather than an
  // unnecessary processing attempt that would fail anyway.
  if (hasImageFile) {
    const fileError = validateImageFile(imageEntry as File);
    if (fileError) {
      redirect(`/business/menu/new?error=${encodeURIComponent(fileError)}`);
    }
  }

  let target = "/business/menu";

  try {
    const supabase = createClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      target = "/business/register";
    } else {
      let fullUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      let uploadFailed = false;

      if (hasImageFile) {
        const { urls, error: uploadError } = await processAndUploadMenuImage(
          supabase,
          business.id,
          imageEntry as File
        );
        if (uploadError || !urls) {
          target = `/business/menu/new?error=${encodeURIComponent(
            uploadError ?? "Image processing failed."
          )}`;
          uploadFailed = true;
        } else {
          fullUrl = urls.fullUrl;
          thumbnailUrl = urls.thumbnailUrl;
        }
      }

      if (!uploadFailed) {
        const { error } = await supabase.from("menu_items").insert({
          business_id: business.id,
          name,
          description: description || null,
          price: Number(priceRaw),
          category: category || null,
          photo_url: fullUrl,
          photo_thumbnail_url: thumbnailUrl,
          available: true,
        });

        if (error) {
          target = `/business/menu/new?error=${encodeURIComponent(error.message)}`;
        } else {
          revalidatePath("/business/menu");
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[addMenuItem] Unexpected error:", message);
    target = `/business/menu/new?error=${encodeURIComponent(
      "Something went wrong. Please try again."
    )}`;
  }

  redirect(target);
}

export async function updateMenuItem(itemId: string, formData: FormData) {
  await requireRole(["business_owner"]);

  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";
  const category = formData.get("category")?.toString().trim() ?? "";

  const validationError = validateMenuItemInput(name, priceRaw);
  if (validationError) {
    redirect(
      `/business/menu/${itemId}/edit?error=${encodeURIComponent(validationError)}`
    );
  }

  const imageEntry = formData.get("image");
  const hasImageFile = imageEntry instanceof File && imageEntry.size > 0;
  const removeImage = formData.get("remove_image") === "true";

  if (hasImageFile) {
    const fileError = validateImageFile(imageEntry as File);
    if (fileError) {
      redirect(`/business/menu/${itemId}/edit?error=${encodeURIComponent(fileError)}`);
    }
  }

  let target = "/business/menu";

  try {
    const supabase = createClient();

    // Need the current photo_url/photo_thumbnail_url and business_id
    // first — the former pair to clean up on replace/remove, the latter
    // for the upload path (RLS requires it to match a business this owner
    // actually owns).
    const { data: existingItem } = await supabase
      .from("menu_items")
      .select("photo_url, photo_thumbnail_url, business_id")
      .eq("id", itemId)
      .maybeSingle();

    if (!existingItem) {
      // Either doesn't exist, or RLS blocked it (not this owner's item).
      target = `/business/menu?error=${encodeURIComponent(
        "That item couldn't be found."
      )}`;
    } else {
      // undefined = leave photo fields untouched; null = clear them;
      // string = replace with the new uploaded URLs.
      let fullUrl: string | null | undefined = undefined;
      let thumbnailUrl: string | null | undefined = undefined;
      let uploadFailed = false;

      if (hasImageFile) {
        const { urls, error: uploadError } = await processAndUploadMenuImage(
          supabase,
          existingItem.business_id,
          imageEntry as File
        );
        if (uploadError || !urls) {
          target = `/business/menu/${itemId}/edit?error=${encodeURIComponent(
            uploadError ?? "Image processing failed."
          )}`;
          uploadFailed = true;
        } else {
          fullUrl = urls.fullUrl;
          thumbnailUrl = urls.thumbnailUrl;
          // New images uploaded successfully — clean up the old pair so
          // they don't become orphaned files (same principle as deletion,
          // applied here too even though only explicitly required there).
          await deleteMenuImages(
            supabase,
            existingItem.photo_url,
            existingItem.photo_thumbnail_url
          );
        }
      } else if (removeImage) {
        await deleteMenuImages(
          supabase,
          existingItem.photo_url,
          existingItem.photo_thumbnail_url
        );
        fullUrl = null;
        thumbnailUrl = null;
      }

      if (!uploadFailed) {
        const updatePayload: {
          name: string;
          description: string | null;
          price: number;
          category: string | null;
          photo_url?: string | null;
          photo_thumbnail_url?: string | null;
        } = {
          name,
          description: description || null,
          price: Number(priceRaw),
          category: category || null,
        };
        if (fullUrl !== undefined) {
          updatePayload.photo_url = fullUrl;
          updatePayload.photo_thumbnail_url = thumbnailUrl;
        }

        const { data, error } = await supabase
          .from("menu_items")
          .update(updatePayload)
          .eq("id", itemId)
          .select("id");

        if (error) {
          target = `/business/menu/${itemId}/edit?error=${encodeURIComponent(error.message)}`;
        } else if (!data || data.length === 0) {
          target = `/business/menu?error=${encodeURIComponent(
            "That item couldn't be updated — it may not belong to your business."
          )}`;
        } else {
          revalidatePath("/business/menu");
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[updateMenuItem] Unexpected error:", message);
    target = `/business/menu/${itemId}/edit?error=${encodeURIComponent(
      "Something went wrong. Please try again."
    )}`;
  }

  redirect(target);
}

export async function deleteMenuItem(itemId: string, _formData: FormData) {
  await requireRole(["business_owner"]);

  let target = "/business/menu";

  try {
    const supabase = createClient();

    // Fetch photo fields BEFORE deleting the row — need them afterward to
    // know what to remove from Storage.
    const { data: existingItem } = await supabase
      .from("menu_items")
      .select("photo_url, photo_thumbnail_url")
      .eq("id", itemId)
      .maybeSingle();

    const { data, error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .select("id");

    if (error) {
      target = `/business/menu?error=${encodeURIComponent(error.message)}`;
    } else if (!data || data.length === 0) {
      target = `/business/menu?error=${encodeURIComponent(
        "That item couldn't be deleted — it may not belong to your business."
      )}`;
    } else {
      // Row confirmed deleted — now safe to clean up its images, if any,
      // so orphaned files don't accumulate in Storage.
      await deleteMenuImages(
        supabase,
        existingItem?.photo_url,
        existingItem?.photo_thumbnail_url
      );
      revalidatePath("/business/menu");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[deleteMenuItem] Unexpected error:", message);
    target = `/business/menu?error=${encodeURIComponent(
      "Something went wrong. Please try again."
    )}`;
  }

  redirect(target);
}

export async function toggleAvailability(
  itemId: string,
  currentAvailable: boolean,
  _formData: FormData
) {
  await requireRole(["business_owner"]);

  let target = "/business/menu";

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("menu_items")
      .update({ available: !currentAvailable })
      .eq("id", itemId)
      .select("id");

    if (error) {
      target = `/business/menu?error=${encodeURIComponent(error.message)}`;
    } else if (!data || data.length === 0) {
      target = `/business/menu?error=${encodeURIComponent(
        "That item couldn't be updated — it may not belong to your business."
      )}`;
    } else {
      revalidatePath("/business/menu");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[toggleAvailability] Unexpected error:", message);
    target = `/business/menu?error=${encodeURIComponent(
      "Something went wrong. Please try again."
    )}`;
  }

  redirect(target);
}
