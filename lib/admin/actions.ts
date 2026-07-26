"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorize";
import { createAdminClient } from "@/lib/supabase/admin";

// All three actions independently call requireRole(["admin"]) — not just
// relying on the admin page's own gate — since Server Actions can be
// invoked directly, not only through the page that links to them.
//
// Uses the service-role client (bypasses RLS) rather than new admin RLS
// policies — see the explanation given before this file was written.
// createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY is missing;
// wrapped in try/catch per the commitment made in the last hardening
// report, so a misconfigured env var shows a clear error instead of an
// uncaught Server Action failure.

export async function approveBusiness(businessId: string, _formData: FormData) {
  const admin = await requireRole(["admin"]);

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        status: "active",
        approved_at: now.toISOString(),
        approved_by: admin.id,
        trial_start_date: now.toISOString(),
      })
      .eq("id", businessId);

    if (updateError) {
      console.error("[approveBusiness] Failed to update business:", updateError.message);
      return;
    }

    // Reuses the existing subscriptions table (01_schema.sql) — no new
    // schema needed. billing_status defaults to 'trial' at the column
    // level, but set explicitly here for clarity.
    const { error: subError } = await supabase.from("subscriptions").insert({
      business_id: businessId,
      trial_end_date: trialEnd.toISOString(),
      billing_status: "trial",
    });

    if (subError) {
      console.error("[approveBusiness] Failed to create subscription:", subError.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[approveBusiness] Unexpected error:", message);
  }

  revalidatePath("/admin");
}

export async function rejectBusiness(businessId: string, formData: FormData) {
  await requireRole(["admin"]);

  const reason = formData.get("reason")?.toString().trim() || "No reason provided";

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("businesses")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", businessId);

    if (error) {
      console.error("[rejectBusiness] Failed to update business:", error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[rejectBusiness] Unexpected error:", message);
  }

  revalidatePath("/admin");
}

export async function deactivateBusiness(businessId: string, _formData: FormData) {
  await requireRole(["admin"]);

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("businesses")
      .update({ status: "inactive" })
      .eq("id", businessId);

    if (error) {
      console.error("[deactivateBusiness] Failed to update business:", error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[deactivateBusiness] Unexpected error:", message);
  }

  revalidatePath("/admin");
}
