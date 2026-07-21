"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Redirect after successful login. Route protection based on role
      // is handled in a later step (protected routes) — for now this just
      // confirms the session was created.
      router.push("/");
      router.refresh();
    } catch (err) {
      // createClient() throws if Supabase env vars are misconfigured —
      // without this catch, that would leave the button stuck on
      // "Logging in..." forever with no explanation. Show a real message
      // instead.
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-h2">Business login</h1>
        <p className="text-small text-text-secondary mb-6">
          Log in to manage your business, menu, and orders.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-small font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
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
              autoComplete="current-password"
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

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            aria-busy={loading}
            className="mt-2"
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-small text-text-secondary mt-6 text-center">
          New business?{" "}
          <Link href="/signup" className="text-primary font-medium">
            Register your business
          </Link>
        </p>
      </Card>
    </main>
  );
}
