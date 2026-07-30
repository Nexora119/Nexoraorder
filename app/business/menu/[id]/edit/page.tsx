import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorize";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateMenuItem } from "@/lib/menu/actions";

interface MenuItemDetail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  photo_url: string | null;
}

// Protected: business_owner only.
export default async function EditMenuItemPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  await requireRole(["business_owner"]);
  const supabase = createClient();

  // RLS (menu_items_owner_manage) already ensures this only returns a row
  // if it belongs to the current owner's business — no separate
  // ownership check needed here.
  const { data: item } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category, photo_url")
    .eq("id", params.id)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  const menuItem = item as unknown as MenuItemDetail;
  const updateAction = updateMenuItem.bind(null, menuItem.id);

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-6 text-h2">Edit menu item</h1>

        <Card>
          <form action={updateAction} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-small font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={menuItem.name}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-small font-medium mb-1">
                Description <span className="text-text-secondary font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={menuItem.description ?? ""}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-small font-medium mb-1">
                  Price (R)
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={menuItem.price}
                  className="w-full rounded-md border border-border px-4 py-3 text-body
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-small font-medium mb-1">
                  Category <span className="text-text-secondary font-normal">(optional)</span>
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  defaultValue={menuItem.category ?? ""}
                  className="w-full rounded-md border border-border px-4 py-3 text-body
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="photo_url" className="block text-small font-medium mb-1">
                Image URL <span className="text-text-secondary font-normal">(optional)</span>
              </label>
              <input
                id="photo_url"
                name="photo_url"
                type="url"
                defaultValue={menuItem.photo_url ?? ""}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {searchParams.error && (
              <p
                className="text-small text-danger bg-danger/10 border border-danger rounded-md px-3 py-2"
                role="alert"
              >
                {decodeURIComponent(searchParams.error)}
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <Button type="submit" variant="primary">
                Save changes
              </Button>
              <Button variant="secondary" href="/business/menu">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
