# MANUAL_TEST.md — Logo Integration & Rebrand

## 1. Code review only (already done)
- [x] Logo background removed cleanly — verified visually on both white and gray backgrounds, no halo.
- [x] Logo resized to 162×80 (14.5KB, down from 415KB).
- [x] `Header.tsx` imports resolve correctly (`next/image`, `next/link`).
- [x] `layout.tsx` correctly imports and renders `<Header />`.
- [x] No remaining "NexoraOrders" text anywhere in `app/`, `components/`, `lib/`, `package.json`, or `README.md`.
- [x] Brace/syntax balance checked on all modified files.

## 2. Requires Vercel deployment
1. Deploy the updated files (see file list below).
2. Visit the homepage — confirm:
   - The logo appears top-left in a white header bar with a subtle bottom border.
   - The logo has NO visible box/halo around it — it should look like it's sitting directly on the white page.
   - The logo is a reasonable, readable size (not huge, not tiny) — roughly 40px tall.
   - Clicking the logo takes you back to `/` (test this from `/browse` or `/register`).
3. Check the browser tab title — should read "My Takeaway — Skip the queue", not "NexoraOrders...".
4. Visit `/login` and `/signup` — confirm the welcome text says "My Takeaway", not "NexoraOrders".
5. Resize your browser / check on an actual phone — confirm the header looks correct at mobile width (logo shouldn't overflow or get cut off).
6. Open browser dev tools console — confirm no image loading errors (404 on `/logo.png` would mean the file didn't deploy correctly) and no hydration warnings.

## What to report back
- Does the logo look properly integrated (not like a pasted image) on your actual deployed site?
- Any console errors, especially anything related to `/logo.png` failing to load.
