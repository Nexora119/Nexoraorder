# CHANGELOG — Milestone 2, Step 3 (Session Handling) & Step 4 (Protected Routes)

## Added

### Step 3 — Session Handling
- **`middleware.ts`** (project root — required location for Next.js middleware to run) — thin entry point that delegates to `updateSession()`. Matcher excludes static assets (`_next/static`, `_next/image`, favicon, image files) so the middleware doesn't do unnecessary work on requests that can't have auth state.
- **`lib/supabase/middleware.ts`** — the actual session-refresh logic, kept separate from `middleware.ts` per standard convention. Creates a Supabase server client bound to the request/response cookies, then calls `supabase.auth.getUser()` **immediately** with no logic in between (this matters — Supabase's docs specifically warn against inserting code between client creation and this call, since it can cause session refresh bugs). Uses `getUser()` rather than `getSession()` because `getUser()` revalidates the token against Supabase's Auth server instead of trusting whatever's in the cookie — this is what "do not trust client-side session state" means in practice. This is the only place in the whole request lifecycle that call happens automatically on every request.

### Step 4 — Protected Routes
- **`lib/auth/authorize.ts`** — reusable, server-only authorization helpers, deliberately in a separate file/folder from the session-handling code (different concern, as required):
  - `getAuthUser()` — returns the current user + their `profiles.role`, or `null`. Does not redirect. For places that need to know "is someone logged in" without forcing navigation.
  - `requireUser()` — redirects to `/login` if not authenticated, otherwise returns the user. For any page that requires being logged in, regardless of role.
  - `requireRole(allowedRoles)` — redirects to `/login` if not authenticated, or `/unauthorized` if authenticated but the wrong role. Takes an array so a page can allow multiple roles if needed (e.g. `["business_owner", "admin"]`).
  - Roles match the `user_role` enum already defined in `01_schema.sql`: `customer`, `business_owner`, `admin`.
- **`app/unauthorized/page.tsx`** — new stub page, same style as the existing `/browse` and `/register` stubs. This exists because `requireRole()` needs somewhere real to send an authenticated-but-wrong-role user — without it, "redirected appropriately" (your requirement) had no valid target. Not a new user-facing feature, just necessary plumbing for Step 4 to function.

## Modified
- None. This step is purely additive.

## Removed
- None.

## Why each change was required
- **Middleware**: Supabase-issued JWTs expire; without a refresh mechanism, users get silently logged out mid-session. Middleware is the standard place to do this in Next.js App Router because it runs before every request, ahead of Server Components.
- **Separation of concerns**: you explicitly required session handling and authorization to be separate. `middleware.ts`/`lib/supabase/middleware.ts` know nothing about roles. `lib/auth/authorize.ts` knows nothing about cookie refresh — it assumes the session is already fresh by the time it runs and just asks "who is this, and are they allowed here."
- **RLS unchanged**: nothing here touches `01_schema.sql` or any RLS policy. These helpers control page-level access (can a user *navigate* here); RLS remains the actual data-access security boundary underneath, exactly as required.

## Not yet wired up (by design)
No existing page currently calls `requireUser()` or `requireRole()` — there's nothing to protect yet. Milestone 3 (Business Onboarding) will be the first real consumer, e.g. a future business dashboard page starting with:
```ts
const user = await requireRole(["business_owner"]);
```
This step only had to prepare the mechanism, not apply it anywhere, since the pages that need it don't exist yet.
