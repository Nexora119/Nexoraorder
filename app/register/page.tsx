import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RegisterBusinessPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto text-center">
      <Card>
        <h2 className="mb-2">Business registration is coming soon</h2>
        <p className="text-body text-text-secondary mb-6">
          This page will let food businesses sign up and submit their profile
          once Milestone 3 (Business Onboarding) is built. For now, this
          confirms navigation from the homepage is working correctly.
        </p>
        <Button variant="secondary" href="/">Back to home</Button>
      </Card>
    </main>
  );
}
