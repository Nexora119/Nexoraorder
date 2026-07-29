import { requireRole } from "@/lib/auth/authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { approveBusiness, rejectBusiness, deactivateBusiness } from "@/lib/admin/actions";

interface BusinessRow {
  id: string;
  name: string;
  category: string | null;
  email: string;
  phone: string;
  street_address: string | null;
  suburb: string | null;
  city: string | null;
  status: "pending" | "active" | "inactive" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  subscriptions: { billing_status: string; trial_end_date: string }[] | null;
}

// Protected: admin only. Reuses requireRole() unchanged from Milestone 2.
export default async function AdminPage() {
  await requireRole(["admin"]);

  let businesses: BusinessRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, category, email, phone, street_address, suburb, city, status, rejection_reason, created_at, subscriptions(billing_status, trial_end_date)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      loadError = error.message;
    } else {
      businesses = (data as unknown as BusinessRow[]) ?? [];
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  if (loadError) {
    return (
      <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
        <Card>
          <h1 className="mb-2 text-h2">Admin</h1>
          <p className="text-body text-danger" role="alert">
            Couldn&apos;t load businesses: {loadError}
          </p>
        </Card>
      </main>
    );
  }

  const pending = businesses.filter((b) => b.status === "pending");
  const others = businesses.filter((b) => b.status !== "pending");

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="mb-1 text-h2">Admin — Business Approvals</h1>
          <p className="text-small text-text-secondary">
            {pending.length} pending review
          </p>
        </div>

        {/* Pending — needs a decision */}
        <section className="flex flex-col gap-4">
          <h2 className="text-h4">Pending review</h2>
          {pending.length === 0 && (
            <p className="text-small text-text-secondary">Nothing pending.</p>
          )}
          {pending.map((b) => (
            <Card key={b.id}>
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-h4">{b.name}</h3>
                <p className="text-small text-text-secondary">{b.category}</p>
                <p className="text-small text-text-secondary">
                  {b.street_address}, {b.suburb}, {b.city}
                </p>
                <p className="text-small text-text-secondary">
                  {b.email} · {b.phone}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <form action={approveBusiness.bind(null, b.id)}>
                  <Button type="submit" variant="primary">
                    Approve
                  </Button>
                </form>

                <form
                  action={rejectBusiness.bind(null, b.id)}
                  className="flex flex-col sm:flex-row gap-2 flex-1"
                >
                  <input
                    type="text"
                    name="reason"
                    placeholder="Rejection reason (optional)"
                    className="flex-1 rounded-md border border-border px-3 py-2 text-small
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Button type="submit" variant="danger">
                    Reject
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </section>

        {/* Everything else — active, inactive, rejected */}
        <section className="flex flex-col gap-4">
          <h2 className="text-h4">All other businesses</h2>
          {others.length === 0 && (
            <p className="text-small text-text-secondary">None yet.</p>
          )}
          {others.map((b) => {
            const sub = b.subscriptions?.[0];
            return (
              <Card key={b.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-h4">{b.name}</h3>
                    <p className="text-small text-text-secondary">
                      Status:{" "}
                      <span
                        className={
                          b.status === "active"
                            ? "text-success"
                            : b.status === "rejected"
                              ? "text-danger"
                              : "text-text-secondary"
                        }
                      >
                        {b.status}
                      </span>
                      {sub &&
                        ` · Subscription: ${sub.billing_status} (trial ends ${new Date(sub.trial_end_date).toLocaleDateString()})`}
                    </p>
                    {b.status === "rejected" && b.rejection_reason && (
                      <p className="text-small text-text-secondary">
                        Reason: {b.rejection_reason}
                      </p>
                    )}
                  </div>

                  {b.status === "active" && (
                    <form action={deactivateBusiness.bind(null, b.id)}>
                      <Button type="submit" variant="secondary">
                        Deactivate
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
