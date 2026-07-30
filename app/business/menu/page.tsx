import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { deleteMenuItem, toggleAvailability } from "@/lib/menu/actions";

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  photo_url: string | null;
  available: boolean;
}

// Protected: business_owner only. Reuses requireRole() unchanged.
// Regular RLS-respecting client throughout — see lib/menu/actions.ts for
// the full reasoning on why no service-role client is used anywhere in
// menu management.
export default async function MenuPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await requireRole(["business_owner"]);
  const supabase = createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/register");
  }

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category, photo_url, available")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const menuItems = (items as unknown as MenuItemRow[]) ?? [];

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-h2">Menu</h1>
          <Button variant="primary" href="/business/menu/new">
            Add Item
          </Button>
        </div>

        {searchParams.error && (
          <p
            className="text-small text-danger bg-danger/10 border border-danger rounded-md px-3 py-2"
            role="alert"
          >
            {decodeURIComponent(searchParams.error)}
          </p>
        )}

        {menuItems.length === 0 && (
          <Card>
            <p className="text-body text-text-secondary text-center py-4">
              No menu items yet. Add your first item to get started.
            </p>
          </Card>
        )}

        {menuItems.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-h4">{item.name}</h3>
                  <span
                    className={`text-small px-2 py-0.5 rounded-sm ${
                      item.available
                        ? "bg-success/10 text-success"
                        : "bg-border text-text-secondary"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </span>
                </div>
                {item.category && (
                  <p className="text-small text-text-secondary">{item.category}</p>
                )}
                {item.description && (
                  <p className="text-small text-text-secondary mt-1">
                    {item.description}
                  </p>
                )}
                <p className="text-body font-medium mt-1">
                  R{Number(item.price).toFixed(2)}
                </p>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <Button variant="secondary" href={`/business/menu/${item.id}/edit`}>
                  Edit
                </Button>

                <form action={toggleAvailability.bind(null, item.id, item.available)}>
                  <Button type="submit" variant="secondary" className="w-full">
                    {item.available ? "Mark Unavailable" : "Mark Available"}
                  </Button>
                </form>

                <form action={deleteMenuItem.bind(null, item.id)}>
                  <Button type="submit" variant="danger" className="w-full">
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
