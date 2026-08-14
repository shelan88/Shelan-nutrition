---
name: Booking availability gate
description: Global open/scheduled/closed booking gate — settings shape, dual client/server logic, fail-closed policy.
---

**Rule:** Booking availability lives in `website_settings` key `booking_availability` `{status: open|scheduled|closed, startDate, endDate}` (legacy fallback `booking_start_date` string = scheduled). Effective state is computed against today in the *admin timezone*; endDate is inclusive. Logic is mirrored in `src/lib/bookingAvailability.ts` (UI) and `api/_lib/booking-availability.js` (authoritative, gates `/api/create-payment-intent`) — keep them in sync.

**Why:** The site has TWO independent Stripe payment paths (BookingFlow and CheckoutModal); a client-only gate was bypassed by the second path. Only the PaymentIntent endpoint covers everything, including direct POSTs.

**How to apply:**
- Any new payment path automatically inherits the gate as long as it goes through `/api/create-payment-intent` — never create PaymentIntents elsewhere.
- Fail-closed: lookup errors return state `unknown` → endpoint responds 503, never creates a PI. `scheduled` without a startDate is treated as closed on both sides.
- Admin UI (AdminSettingsPage "Booking Availability") keeps legacy `booking_start_date` in sync on save and refuses to save scheduled without a start date.
- Remember Express api server (port 3001) must be restarted to pick up api/ changes — a stale process will happily serve the old ungated code and make tests lie.
