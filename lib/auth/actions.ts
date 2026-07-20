"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server Action — invoked from a <form action={signOut}> (see Header.tsx).
// Reuses the existing RLS-respecting server client from lib/supabase/server.ts
// — no new Supabase client, no new cookie-handling logic. supabase.auth.signOut()
// clears the session through that client's existing cookie adapter, the same
// mechanism already used everywhere else in the app.
//
// redirect() is deliberately called OUTSIDE the try/catch below — Next.js
// implements redirect by throwing internally, and their own docs specify it
// must not be caught by a surrounding try/catch or it won't work correctly.
export async function signOut() {
  const supabase = createClient();

  try {
    await supabase.auth.signOut();
  } catch (err) {
    // Even if sign-out itself fails (e.g. a transient network error), still
    // redirect home rather than leaving the user on a stuck page — matches
    // the defensive-logging style already used in lib/supabase/middleware.ts.
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[signOut] Supabase sign-out failed:", message);
  }

  redirect("/");
}
