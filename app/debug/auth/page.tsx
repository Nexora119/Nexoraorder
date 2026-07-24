import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/authorize";
import { Card } from "@/components/ui/Card";

// TEMPORARY DEBUG PAGE — remove before production.
//
// Deliberately does NOT go through getAuthUser() alone as a black box —
// it independently checks each layer (raw session, raw profiles query,
// AND getAuthUser()'s own result) so any mismatch between them pinpoints
// exactly which layer is failing, rather than getAuthUser()'s internal
// try/catch masking where a problem actually occurred.
//
// No access control on this page by design (so it's easy to check while
// testing) — it only ever displays the CURRENT VISITOR's own session data
// (via their own cookies), never another user's data. Still: real emails
// and user IDs are visible to anyone who loads this URL, so it must be
// deleted before real customers/businesses are on the platform.
export const dynamic = "force-dynamic";

export default async function DebugAuthPage() {
  const supabase = createClient();

  // Layer 1: raw session check, independent of getAuthUser()
  let rawUser: { id: string; email: string | undefined } | null = null;
  let rawAuthError: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      rawAuthError = error.message;
    } else if (data.user) {
      rawUser = { id: data.user.id, email: data.user.email };
    }
  } catch (err) {
    rawAuthError = err instanceof Error ? err.message : "Unknown exception";
  }

  // Layer 2: raw profiles table check, independent of getAuthUser()
  let rawProfileRole: string | null = null;
  let rawProfileFound = false;
  let rawProfileError: string | null = null;
  if (rawUser) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", rawUser.id)
        .single();
      if (error) {
        rawProfileError = error.message;
      } else if (data) {
        rawProfileFound = true;
        rawProfileRole = data.role;
      }
    } catch (err) {
      rawProfileError = err instanceof Error ? err.message : "Unknown exception";
    }
  }

  // Layer 3: the actual helper Header.tsx uses
  let helperResult: Awaited<ReturnType<typeof getAuthUser>> = null;
  let helperError: string | null = null;
  try {
    helperResult = await getAuthUser();
  } catch (err) {
    // getAuthUser() is designed to never throw — if this catches anything,
    // that itself is a significant finding.
    helperError = err instanceof Error ? err.message : "Unknown exception";
  }

  const rows: { label: string; value: string }[] = [
    { label: "1. Supabase session present?", value: rawUser ? "Yes" : "No" },
    { label: "1. Raw auth.getUser() error", value: rawAuthError ?? "None" },
    { label: "1. User ID (from session)", value: rawUser?.id ?? "—" },
    { label: "1. User email (from session)", value: rawUser?.email ?? "—" },
    {
      label: "2. Matching profiles row exists?",
      value: rawUser ? (rawProfileFound ? "Yes" : "No") : "N/A (no session)",
    },
    { label: "2. Raw profiles query error", value: rawProfileError ?? "None" },
    { label: "2. Role (from raw profiles query)", value: rawProfileRole ?? "null" },
    {
      label: "3. getAuthUser() succeeded?",
      value: helperResult ? "Yes (returned a user)" : "No (returned null)",
    },
    { label: "3. getAuthUser() threw an exception?", value: helperError ?? "No" },
    { label: "3. Role (from getAuthUser())", value: helperResult?.role ?? "null" },
  ];

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      <div className="bg-warning/10 border border-warning text-text-primary rounded-md px-4 py-3 mb-6 text-small">
        ⚠️ Temporary debug page — shows your own current session state only.
        Must be deleted before real customers/businesses use the platform.
      </div>

      <Card>
        <h1 className="mb-4 text-h2">Auth Debug</h1>
        <dl className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col border-b border-border pb-2 last:border-0">
              <dt className="text-small font-medium text-text-secondary">{row.label}</dt>
              <dd className="text-body font-mono break-all">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </main>
  );
}
