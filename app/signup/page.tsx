"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCheckEmailMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Supabase's default behavior: if email confirmation is required in your
    // project's Auth settings, `session` will be null here even though the
    // user was created. Handle both cases so this works either way.
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setCheckEmailMessage(
        "Account created. Check your email to confirm your address before logging in."
      );
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <h2 className="mb-1">Sign up</h2>
        <p className="text-small text-text-secondary mb-6">
          Create your NexoraOrders account.
        </p>

        {checkEmailMessage ? (
          <p className="text-small text-success" role="status">
            {checkEmailMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="fullName" className="block text-small font-medium mb-1">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Jane Dlamini"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-small font-medium mb-1">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="081 234 5678"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border px-4 py-3 text-body
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-small text-danger" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="mt-2">
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        )}

        <p className="text-small text-text-secondary mt-6 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-primary font-medium">
            Log in
          </a>
        </p>
      </Card>
    </main>
  );
}
