import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto text-center">
      <Card>
        <h1 className="mb-2 text-h2">You don&apos;t have access to this page</h1>
        <p className="text-body text-text-secondary mb-6">
          Your account doesn&apos;t have permission to view this page.
        </p>
        <Button variant="secondary" href="/">Back to home</Button>
      </Card>
    </main>
  );
}
