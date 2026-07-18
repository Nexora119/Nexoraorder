"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Redirect after successful login. Route protection based on role
    // is handled in a later step (protected routes) — for now this just
    // confirms the session was created.
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <h2 className="mb-1">Log in</h2>
        <p className="text-small text-text-secondary mb-6">
          Welcome back to NexoraOrders.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-small font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-small font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 text-body
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-small text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="mt-2">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-small text-text-secondary mt-6 text-center">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary font-medium">
            Sign up
          </a>
        </p>
      </Card>
    </main>
  );
}
