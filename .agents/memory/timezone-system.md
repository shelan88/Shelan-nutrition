---
name: Timezone system
description: How the global admin timezone is stored, converted, and displayed in the booking flow.
---

# Timezone System

## The rule
- Admin timezone is stored as `{ timezone: "America/Detroit" }` under `website_settings` key `"timezone_config"`.
- All slot times (`"9:00 AM"`, etc.) are authored and stored in the DB in admin TZ as plain strings.
- Visitors see those slots converted to their browser local time via `Intl.DateTimeFormat` — no library.
- The stored DB value (`time` field in `appointments`) remains the admin-TZ string for exact-match booked-times conflict detection.

**Why:** Storing UTC would require migrating all historical appointments; storing admin-TZ strings keeps backward compat while allowing display-layer conversion.

## Key files
- `src/lib/timezone.ts` — `COMMON_TIMEZONES`, `getAdminTimezone()`, `setAdminTimezone()`, `slotToLocalDisplay(date, adminSlot, adminTz)`, `useAdminTimezone()` hook, `getLocalTimezone()`
- `src/admin/pages/AdminSettingsPage.tsx` — "Time Zone" Section added at the top, loads/saves `timezone_config`
- `src/sections/booking/BookingFlow.tsx` — `useAdminTimezone()` called in `BookingFlowInner`; `adminTz` passed to `PickTime` (display conversion + note) and `BookingSummary` (display conversion)

## How slotToLocalDisplay works
1. Parse `"9:00 AM"` → 24h hours/minutes.
2. Use UTC noon on the selected date as a DST-stable reference, get adminTz UTC offset via `Intl.DateTimeFormat.formatToParts`.
3. Compute `slotUtc = date at UTC midnight + (slotMins − adminOffsetMins)`.
4. Format `slotUtc` in browser local TZ with `toLocaleTimeString(undefined, { hour12: true })`.
5. Appends `(Month Day)` note if local calendar day differs (e.g. far-east users with early-morning slots).

## How to apply
- Any new time-display surface should call `slotToLocalDisplay(date, slot.time, adminTz)` for display and keep `slot.time` for storage/comparison.
- If `adminTz` is `null` (not configured), fall back to raw slot string — current behavior preserved.
- `useAdminTimezone()` returns `{ adminTz: string | null, tzLoading: boolean }`.
