"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";

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
  const photoUrl = formData.get("photo_url")?.toString().trim() ?? "";

  const validationError = validateMenuItemInput(name, priceRaw);
  if (validationError) {
    redirect(`/business/menu/new?error=${encodeURIComponent(validationError)}`);
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
      const { error } = await supabase.from("menu_items").insert({
        business_id: business.id,
        name,
        description: description || null,
        price: Number(priceRaw),
        category: category || null,
        photo_url: photoUrl || null,
        available: true,
      });

      if (error) {
        target = `/business/menu/new?error=${encodeURIComponent(error.message)}`;
      } else {
        revalidatePath("/business/menu");
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
  const photoUrl = formData.get("photo_url")?.toString().trim() ?? "";

  const validationError = validateMenuItemInput(name, priceRaw);
  if (validationError) {
    redirect(
      `/business/menu/${itemId}/edit?error=${encodeURIComponent(validationError)}`
    );
  }

  let target = "/business/menu";

  try {
    const supabase = createClient();

    // No explicit ownership check needed here beyond RLS itself —
    // menu_items_owner_manage means this UPDATE simply affects zero rows
    // if the item doesn't belong to this owner's business, rather than
    // needing an application-level check to prevent cross-owner edits.
    const { data, error } = await supabase
      .from("menu_items")
      .update({
        name,
        description: description || null,
        price: Number(priceRaw),
        category: category || null,
        photo_url: photoUrl || null,
      })
      .eq("id", itemId)
      .select("id");

    if (error) {
      target = `/business/menu/${itemId}/edit?error=${encodeURIComponent(error.message)}`;
    } else if (!data || data.length === 0) {
      // RLS silently blocked it (not this owner's item) rather than
      // erroring — surface that as a clear message instead of a silent
      // no-op that looks like success.
      target = `/business/menu?error=${encodeURIComponent(
        "That item couldn't be updated — it may not belong to your business."
      )}`;
    } else {
      revalidatePath("/business/menu");
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
