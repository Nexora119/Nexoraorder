import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardBusiness {
  id: string;
  name: string;
  category: string | null;
  status: "pending" | "active" | "inactive" | "rejected";
  rejection_reason: string | null;
  street_address: string | null;
  suburb: string | null;
  city: string | null;
  email: string;
  phone: string;
  trial_start_date: string | null;
}

interface DashboardSubscription {
  billing_status: string;
  trial_end_date: string;
}

// Protected: business_owner only. Reuses requireRole() unchanged.
//
// Uses the regular RLS-respecting server client, NOT the service-role
// client — this is the owner viewing their OWN data, already permitted by
// existing policies (businesses_select_active_public's owner_id = auth.uid()
// branch, subscriptions_select_own). No new RLS needed, unlike the admin
// panel which genuinely required the service-role client for cross-user
// access.
//
// Deliberately TWO separate top-level queries rather than one nested
// embed (business.select("...subscriptions(...)")). The embedded form
// silently returned no subscription rows even when one existed — a known
// class of issue where RLS evaluated through a PostgREST join behaves
// unreliably. Two direct queries, each evaluating RLS against its own
// table directly, avoids that entirely.
export default async function BusinessDashboardPage() {
  const user = await requireRole(["business_owner"]);

  const supabase = createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, category, status, rejection_reason, street_address, suburb, city, email, phone, trial_start_date"
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  // Shouldn't normally happen — login/callback both redirect to
  // /business/register when no business exists — but someone could land
  // here directly via a bookmark before ever registering.
  if (!business) {
    redirect("/business/register");
  }

  const typedBusiness = business as unknown as DashboardBusiness;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("billing_status, trial_end_date")
    .eq("business_id", typedBusiness.id)
    .maybeSingle();

  const sub = subscription as unknown as DashboardSubscription | null;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="mb-1 text-h2">{typedBusiness.name}</h1>
          <p className="text-small text-text-secondary">{typedBusiness.category}</p>
        </div>

        <Card>
          <h2 className="text-h4 mb-2">Status</h2>
          {typedBusiness.status === "pending" && (
            <p className="text-body text-text-secondary">
              Your business is pending admin review. You&apos;ll be able to
              manage your menu and receive orders once approved.
            </p>
          )}
          {typedBusiness.status === "active" && (
            <div className="flex flex-col gap-1">
              <p className="text-body text-success">Active and visible to customers.</p>
              {sub ? (
                <div className="text-small text-text-secondary flex flex-col gap-0.5 mt-1">
                  <p>Billing status: {sub.billing_status}</p>
                  <p>
                    Trial status:{" "}
                    {new Date(sub.trial_end_date) > new Date() ? "In trial" : "Trial ended"}
                  </p>
                  {typedBusiness.trial_start_date && (
                    <p>
                      Trial start date:{" "}
                      {new Date(typedBusiness.trial_start_date).toLocaleDateString()}
                    </p>
                  )}
                  <p>
                    Trial end date: {new Date(sub.trial_end_date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-small text-text-secondary mt-1">
                  No subscription record found for this business yet.
                </p>
              )}
            </div>
          )}
          {typedBusiness.status === "rejected" && (
            <div className="flex flex-col gap-1">
              <p className="text-body text-danger">Your business was not approved.</p>
              {typedBusiness.rejection_reason && (
                <p className="text-small text-text-secondary">
                  Reason: {typedBusiness.rejection_reason}
                </p>
              )}
            </div>
          )}
          {typedBusiness.status === "inactive" && (
            <p className="text-body text-text-secondary">
              Your business is currently deactivated and not visible to customers.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-h4 mb-2">Business details</h2>
          <p className="text-small text-text-secondary">
            {typedBusiness.street_address}, {typedBusiness.suburb}, {typedBusiness.city}
          </p>
          <p className="text-small text-text-secondary">
            {typedBusiness.email} · {typedBusiness.phone}
          </p>
        </Card>

        {/* Menu is now real (Milestone 4). Orders remains a deliberately
            inert placeholder — Milestone 5 will replace it. */}
        <Card>
          <h2 className="text-h4 mb-1">Menu</h2>
          <p className="text-small text-text-secondary mb-3">
            Manage what customers see and order.
          </p>
          <Button variant="secondary" href="/business/menu">
            Manage menu
          </Button>
        </Card>

        <Card className="opacity-60">
          <h2 className="text-h4 mb-1">Orders</h2>
          <p className="text-small text-text-secondary">Coming soon (Milestone 5).</p>
        </Card>
      </div>
    </main>
  );
}
