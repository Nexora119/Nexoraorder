# My Takeaway

Pickup-only ordering platform for kotas & takeaways. Built with Next.js + Supabase + Vercel + Paystack.

## Getting started
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in real Supabase/Paystack/Resend keys.
3. Run the schema in `01_schema.sql` against a fresh Supabase project (SQL Editor).
4. `npm run dev`

## Structure
- `app/` — Next.js App Router pages
- `components/ui/` — design-system-driven base components (Button, Card, ...)
- `lib/supabase/` — client.ts (browser), server.ts (server components, RLS-respecting), admin.ts (service role, server-only)
- `tailwind.config.ts` — all design tokens (color, type, spacing, radius, shadow) live here — don't hardcode values elsewhere.

## Design system
See `My_Takeaway_Design_System.md` for the full spec this project is built against.
