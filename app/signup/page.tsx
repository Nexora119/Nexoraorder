"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
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

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
          // Without this, Supabase falls back to its default Site URL with
          // no code-exchange step — the confirmation link would "work" but
          // never actually establish a session. Must also be added to
          // Supabase's allowed Redirect URLs (see app/auth/callback/route.ts
          // comment) or this gets silently ignored.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Full raw response, as requested — inspect this in the browser
      // console to see exactly what Supabase returns for a genuinely new
      // signup vs. a duplicate email.

      // Supabase's signUp() deliberately does NOT reveal whether an email is
      // already registered, when email confirmation is required — this is
      // intentional anti-enumeration behavior on Supabase's side, not a bug.
      // Instead of an error, it returns success with data.session === null
      // AND data.user.identities as an EMPTY array (a genuinely new signup
      // has identities.length === 1). That's the only reliable signal to
      // tell the two cases apart client-side.
      const isMaskedDuplicate =
        !!data.user && !!data.user.identities && data.user.identities.length === 0;

      if (data.session) {
        // Straight to business registration — the only reason anyone signs
        // up now is to register a business (see app/business/register).
        window.location.href = "/business/register";
        return;
      } else if (isMaskedDuplicate) {
        // Deliberately non-committal message: doesn't lie by claiming an
        // account was created, but also doesn't explicitly confirm the
        // email is taken (that would defeat Supabase's own anti-enumeration
        // protection). Points them toward login without giving away
        // whether this specific email exists.
        setCheckEmailMessage(
          "If an account with this email doesn't already exist, we've sent a confirmation link to your inbox. Already registered? Try logging in instead."
        );
      } else {
        setCheckEmailMessage(
          "Account created. Check your email to confirm your address before logging in."
        );
      }
    } catch (err) {
      // createClient() throws if Supabase env vars are misconfigured —
      // without this catch, that would leave the button stuck on
      // "Creating account..." forever with no explanation.
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
        <h1 className="mb-1 text-h2">Register your business</h1>
        <p className="text-small text-text-secondary mb-6">
          Create your My Takeaway business owner account.
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
                autoComplete="name"
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
                autoComplete="tel"
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
                autoComplete="new-password"
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

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              aria-busy={loading}
              className="mt-2"
            >
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        )}

        <p className="text-small text-text-secondary mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
