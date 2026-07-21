# CHANGELOG — Guest Ordering Migration

## Added
- `03_guest_ordering.sql` — additive schema migration (see HARDENING_REPORT.md for full detail): nullable `customer_id`, guest contact fields, `order_number`/`lookup_token`/`pickup_code`, `refund_reference`, updated CHECK constraint, dropped obsolete customer-auth RLS policies, updated profile-creation trigger's default role.

## Modified
- `app/page.tsx` — removed customer-facing Log in/Sign up buttons, added a small "Business login" text link instead.
- `app/login/page.tsx` — copy only ("Business login" framing, updated footer link text).
- `app/signup/page.tsx` — copy only ("Register your business" framing).

## Removed
- None (RLS policy drops happen inside the new migration file, not by deleting anything from `01_schema.sql`).

## Why
Implements the approved Option B guest-ordering architecture: customers never need accounts; only business owners and admins authenticate. See `Guest_Ordering_Migration_Plan.md` (delivered earlier) for the full design rationale, and `HARDENING_REPORT.md` in this delta for the security/architecture audit.
