import { requireRole } from "@/lib/auth/authorize";
import { BusinessRegistrationForm } from "@/components/business/BusinessRegistrationForm";

// Protected: only authenticated business_owner accounts can reach this.
// requireRole() redirects to /login if not authenticated, or /unauthorized
// if authenticated with the wrong role — reusing the exact same helper
// built in Milestone 2, no new authorization logic here.
export default async function BusinessRegisterPage() {
  const user = await requireRole(["business_owner"]);

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-1 text-h2">Register your business</h1>
        <p className="text-small text-text-secondary mb-6">
          Tell customers about your business. Payment setup comes later — for now
          we just need your profile details. An admin will review and approve
          your business before it goes live.
        </p>
        <BusinessRegistrationForm ownerId={user.id} />
      </div>
    </main>
  );
}
