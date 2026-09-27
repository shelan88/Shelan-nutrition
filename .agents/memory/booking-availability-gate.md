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

## Payment-first course checkout

The pricing-card `CheckoutModal` and program-purchase mode of `BookingFlow` are payment-first: they do not ask for a date or time, and the team coordinates the appointment after payment. The standalone appointment-booking mode of `BookingFlow` still honors its scheduling toggle, availability, and timezone behavior. Pending-schedule confirmations should say the team will contact the customer without promising automated WhatsApp contact.

**Why:** The consultation cards and standalone booking page are separate purchase paths; changing only `BookingFlow` left the date picker visible in the course/consultation checkout.

**How to apply:** Keep purchase flows distinct from standalone appointment booking. Payment-first purchases write null date/time and require the optional-scheduling Supabase migration before they are safe to use in production; standalone booking continues to require a selected slot when its toggle is on.
