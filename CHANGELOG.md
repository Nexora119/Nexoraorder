# CHANGELOG — Logo Integration & Rebrand (NexoraOrders → My Takeaway)

## Added
- `public/logo.png` — Your uploaded logo, background removed (was a JPG with a baked-in cream background; chroma-keyed to transparent, cropped to content, resized to 162×80 for retina display at 81×40).
- `components/layout/Header.tsx` — New header component. Renders a real `<header>` element (white background, bottom border, per Design System) with the logo as inline `next/image` content inside normal page flow — not an absolutely-positioned overlay. Logo links to `/`.

## Modified
- `app/layout.tsx` — Imported and rendered `<Header />` above `{children}` so it appears on every page. Updated `metadata.title` from "NexoraOrders — Skip the queue" to "My Takeaway — Skip the queue".
- `package.json` — `name` field changed from `nexora-orders` to `my-takeaway`.
- `README.md` — Title and Design System doc reference updated to "My Takeaway".
- `app/login/page.tsx` — One line of text: "Welcome back to NexoraOrders" → "Welcome back to My Takeaway". No logic changed.
- `app/signup/page.tsx` — One line of text: "Create your NexoraOrders account" → "Create your My Takeaway account". No logic changed.
- All approved process docs (Constitution, Business Architecture, Engineering Architecture, Architecture Review, SRS, Roadmap, Design System) — renamed references from NexoraOrders to My Takeaway, since you approved the full project rename. `NexoraOrders_Design_System.md` renamed to `My_Takeaway_Design_System.md`.

## Removed
- None.

## Why each change was required
- **Logo/Header**: your explicit request — integrate the logo so it reads as part of the page, not an image dropped on top. Achieved via: (1) real background removal so no boxed edge, (2) a semantic `<header>` in normal document flow rather than an overlay, (3) white background matching the approved Design System (you chose this over matching the mockup's beige).
- **Rebrand**: you approved using the logo as-is and renaming the project to "My Takeaway" — every place the old name appeared needed updating so the codebase and docs stay internally consistent (per NUASEF: "treat the approved Project Bible as the source of truth" — the Constitution itself needed updating to remain accurate).
- **Image optimization**: the raw background-removed PNG was 415KB — too heavy for a header asset that loads on every page. Resized to the actual display resolution needed (2x for retina), bringing it to 14.5KB with no visible quality loss at header size.

## Confirmed unchanged
- `01_schema.sql`, `02_profile_trigger.sql` — untouched.
- All Milestone 1 and Milestone 2 Step 1/2 functionality (routing, Button/Card components, auth logic) — untouched, only text/branding edited where noted above.
