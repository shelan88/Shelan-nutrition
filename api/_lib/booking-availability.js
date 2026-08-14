/**
 * api/_lib/booking-availability.js
 *
 * Server-side (authoritative) booking-availability gate.
 * Mirrors src/lib/bookingAvailability.ts — keep the two in sync.
 *
 * Reads website_settings keys:
 *   - booking_availability  { status, startDate, endDate }
 *   - booking_start_date    legacy fallback (string "YYYY-MM-DD")
 *   - timezone_config       { timezone } — "today" is computed in this TZ
 *
 * Fail-closed policy: if the settings lookup itself errors (network/db),
 * we return state "unknown" and the payment endpoint refuses to create a
 * PaymentIntent (503) — availability that cannot be verified must never
 * allow a charge, since callers can POST to the public API directly.
 */

import { adminClient } from "./clients.js";

function todayInTz(tz) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()); // en-CA → YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function computeEffective(settings, today) {
  if (!settings) return { state: "open", opensOn: null };
  const { status, startDate, endDate } = settings;

  if (status === "closed") return { state: "closed", opensOn: null };
  const ended = !!endDate && today > endDate; // endDate inclusive

  if (status === "open") {
    return ended ? { state: "closed", opensOn: null } : { state: "open", opensOn: null };
  }
  // scheduled: a start date is required — misconfiguration fails closed.
  if (!startDate) return { state: "closed", opensOn: null };
  if (ended) return { state: "closed", opensOn: null };
  if (today < startDate) return { state: "scheduled", opensOn: startDate };
  return { state: "open", opensOn: null };
}

function parseSettings(raw, legacy) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const status = ["open", "scheduled", "closed"].includes(raw.status) ? raw.status : "open";
    return {
      status,
      startDate: typeof raw.startDate === "string" && raw.startDate ? raw.startDate : null,
      endDate: typeof raw.endDate === "string" && raw.endDate ? raw.endDate : null,
    };
  }
  if (typeof legacy === "string" && legacy) {
    return { status: "scheduled", startDate: legacy, endDate: null };
  }
  return null;
}

/**
 * Returns { state: "open"|"scheduled"|"closed"|"unknown", opensOn: string|null }.
 * Never throws; returns "unknown" (fail closed at the caller) on lookup errors.
 */
export async function getBookingAvailability() {
  try {
    const { data, error } = await adminClient
      .from("website_settings")
      .select("key, value")
      .in("key", ["booking_availability", "booking_start_date", "timezone_config"]);
    if (error) throw error;

    const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    const tz =
      (map.timezone_config && typeof map.timezone_config === "object" && map.timezone_config.timezone) ||
      "UTC";
    const settings = parseSettings(map.booking_availability, map.booking_start_date);
    return computeEffective(settings, todayInTz(tz));
  } catch (err) {
    console.error("[booking-availability] lookup failed, failing closed:", err?.message ?? err);
    return { state: "unknown", opensOn: null };
  }
}
