import { requireRole } from "@/lib/auth/authorize";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/menu/ImageUploadField";
import { addMenuItem } from "@/lib/menu/actions";

// Protected: business_owner only.
export default async function NewMenuItemPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireRole(["business_owner"]);

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-6 text-h2">Add menu item</h1>

        <Card>
          <form action={addMenuItem} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-small font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="e.g. Quarter kota"
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
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="What's in it"
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
                  className="w-full rounded-md border border-border px-4 py-3 text-body
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="35.00"
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
                  className="w-full rounded-md border border-border px-4 py-3 text-body
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="e.g. Kotas, Drinks, Sides"
                />
              </div>
            </div>

            <ImageUploadField />

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
                Add item
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
