# MANUAL_TEST.md — Session Handling & Protected Routes

## 1. Code review only (already done)
- [x] Brace/syntax balance checked on all 4 new files — clean.
- [x] `middleware.ts` confirmed at project root (required location — Next.js won't detect it anywhere else).
- [x] All imports resolve to real files/packages.
- [x] `CookieOptions` import verified against current `@supabase/ssr` usage patterns (confirmed via research, not assumption, given the earlier `server.ts` build error).
- [x] `redirect()` null-narrowing pattern in `authorize.ts` confirmed correct per Next.js's own docs (uses the `never` type specifically so this works) — the one isolated-check error I saw was a false positive from checking without real Next.js types available, not a real bug.

## 2. Requires Vercel deployment

### Session handling
1. Deploy these files.
2. Log in at `/login` with a real account.
3. Open DevTools → Application/Storage → Cookies. Confirm you see Supabase auth cookies (names starting with `sb-`).
4. Stay logged in and browse around (`/`, `/browse`, `/register`) — confirm the cookies persist and don't disappear.
5. **Session refresh check**: Supabase access tokens typically expire after 1 hour. If you can wait that long (or adjust the expiry in Supabase Dashboard → Authentication → Settings for testing), stay on the site past that mark and confirm you're NOT logged out — the middleware should silently refresh the token. If you get logged out, the middleware isn't refreshing correctly.
6. Open DevTools → Network tab, reload any page, and check the response headers for `Set-Cookie` on the initial document request — this confirms the middleware is actively running and managing cookies.

### Protected routes
There's nothing protected to click through yet (no dashboard exists until Milestone 3), so this is a code-path test rather than a click-through test:
7. Confirm `/unauthorized` loads correctly on its own — visit it directly in the browser. Should show "You don't have access to this page" with a "Back to home" button.
8. No visual/behavior changes should be present anywhere else on the site — home, browse, register, login, signup should all look and work exactly as before this step.

## 3. What "working" looks like
- No new errors in the browser console on any page.
- No new errors in Vercel's deployment/build logs.
- Cookies present and persisting across navigation while logged in.
- `/unauthorized` renders correctly when visited directly.
- Everything that worked before (homepage nav, login, signup, browse/register stubs) still works identically — this step should be invisible unless you go looking for it.

## What to report back
- Any console or build errors.
- Whether Supabase cookies (`sb-*`) are present after logging in.
- Confirm `/unauthorized` renders correctly.
- Confirm nothing else changed behavior.
