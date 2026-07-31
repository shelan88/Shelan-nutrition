/**
 * timezone.ts — Global timezone utilities for the booking system.
 *
 * The admin selects one IANA timezone stored under website_settings key
 * "timezone_config". All slot times are managed in that admin timezone.
 * Visitors see slots converted to their browser's local timezone.
 */
import { useState, useEffect } from "react";
import { getSetting } from "@/admin/repositories/settings.repository";

// ─── Timezone catalogue (curated list for the admin dropdown) ─────────────────
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "Pacific/Honolulu",              label: "Hawaii (UTC−10)" },
  { value: "America/Anchorage",             label: "Alaska (UTC−9)" },
  { value: "America/Los_Angeles",           label: "Pacific — Los Angeles (UTC−8/−7)" },
  { value: "America/Denver",               label: "Mountain — Denver (UTC−7/−6)" },
  { value: "America/Phoenix",              label: "Mountain — Phoenix (UTC−7, no DST)" },
  { value: "America/Chicago",              label: "Central — Chicago (UTC−6/−5)" },
  { value: "America/Detroit",              label: "Eastern — Detroit (UTC−5/−4)" },
  { value: "America/New_York",             label: "Eastern — New York (UTC−5/−4)" },
  { value: "America/Toronto",              label: "Eastern — Toronto (UTC−5/−4)" },
  { value: "America/Halifax",              label: "Atlantic — Halifax (UTC−4/−3)" },
  { value: "America/Sao_Paulo",            label: "Brazil — São Paulo (UTC−3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina — Buenos Aires (UTC−3)" },
  { value: "UTC",                          label: "UTC (UTC±0)" },
  { value: "Europe/London",               label: "London (UTC±0/+1)" },
  { value: "Europe/Paris",                label: "Central Europe — Paris (UTC+1/+2)" },
  { value: "Europe/Berlin",               label: "Central Europe — Berlin (UTC+1/+2)" },
  { value: "Europe/Athens",               label: "Eastern Europe — Athens (UTC+2/+3)" },
  { value: "Europe/Moscow",               label: "Moscow (UTC+3)" },
  { value: "Africa/Cairo",                label: "Egypt — Cairo (UTC+2/+3)" },
  { value: "Africa/Johannesburg",         label: "South Africa — Johannesburg (UTC+2)" },
  { value: "Asia/Riyadh",                 label: "Saudi Arabia — Riyadh (UTC+3)" },
  { value: "Asia/Dubai",                  label: "Gulf — Dubai / Abu Dhabi (UTC+4)" },
  { value: "Asia/Karachi",               label: "Pakistan — Karachi (UTC+5)" },
  { value: "Asia/Kolkata",               label: "India — Kolkata (UTC+5:30)" },
  { value: "Asia/Dhaka",                 label: "Bangladesh — Dhaka (UTC+6)" },
  { value: "Asia/Bangkok",               label: "Indochina — Bangkok (UTC+7)" },
  { value: "Asia/Singapore",             label: "Singapore (UTC+8)" },
  { value: "Asia/Shanghai",              label: "China — Shanghai (UTC+8)" },
  { value: "Asia/Tokyo",                 label: "Japan — Tokyo (UTC+9)" },
  { value: "Australia/Sydney",           label: "Australia — Sydney (UTC+10/+11)" },
  { value: "Pacific/Auckland",           label: "New Zealand — Auckland (UTC+12/+13)" },
];

const TIMEZONE_SETTING_KEY = "timezone_config";

// ─── DB helpers ───────────────────────────────────────────────────────────────

/** Fetch the admin-selected timezone from website_settings. Returns null if not set. */
export async function getAdminTimezone(): Promise<string | null> {
  try {
    const val = await getSetting(TIMEZONE_SETTING_KEY);
    if (val && typeof val === "object" && "timezone" in val) {
      const tz = String((val as { timezone: string }).timezone).trim();
      return tz || null;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Persist the admin timezone selection. */
export async function setAdminTimezone(tz: string): Promise<boolean> {
  const { setSetting } = await import("@/admin/repositories/settings.repository");
  return setSetting(TIMEZONE_SETTING_KEY, { timezone: tz } as unknown as import("@/types/database.types").Json);
}

// ─── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Returns the UTC offset of `tz` at `atUtc` in minutes.
 * Positive = east of UTC (e.g. Asia/Dubai is +240), negative = west.
 */
function getUtcOffsetMins(atUtc: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(atUtc);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10);
  const localMs = Date.UTC(
    get("year"), get("month") - 1, get("day"),
    get("hour"), get("minute"), get("second"),
  );
  return (localMs - atUtc.getTime()) / 60_000;
}

/**
 * Convert a slot string (e.g. "9:00 AM") on a given date from the admin
 * timezone into the visitor's browser local time string for display.
 *
 * Returns the original string unchanged if adminTz is null/empty, the date
 * is missing, or parsing fails — so it is always safe to call.
 *
 * If the converted time lands on a different calendar day (e.g. user is UTC+12
 * and the slot is early morning admin time), a date note is appended:
 * "5:00 PM (Aug 1)".
 */
export function slotToLocalDisplay(
  date: string,
  adminSlot: string,
  adminTz: string | null,
): string {
  if (!adminTz || !date || !adminSlot) return adminSlot;
  try {
    // Parse "9:00 AM" → 24-hour hours/minutes
    const match = adminSlot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return adminSlot;
    let h = +match[1];
    const min = +match[2];
    const mer = match[3].toUpperCase();
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;

    const [yr, mo, dy] = date.split("-").map(Number);

    // Use noon UTC on that date as a DST-stable reference for offset detection
    const noonUtc = new Date(Date.UTC(yr, mo - 1, dy, 12, 0));
    const adminOffsetMins = getUtcOffsetMins(noonUtc, adminTz);

    // Convert slot from adminTz → UTC, then let the browser format in local TZ
    const slotUtcMins = h * 60 + min - adminOffsetMins;
    const slotUtc = new Date(Date.UTC(yr, mo - 1, dy, 0, slotUtcMins));

    const localTimeStr = slotUtc.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Append a date note if the slot crosses midnight into a different day
    const slotLocalDate = slotUtc.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const origDate = new Date(Date.UTC(yr, mo - 1, dy)).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const dateNote = slotLocalDate !== origDate ? ` (${slotLocalDate})` : "";

    return localTimeStr + dateNote;
  } catch {
    return adminSlot;
  }
}

/** Returns the visitor's IANA timezone string from the browser. */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * React hook — loads the admin timezone once and memoises it.
 * Returns null while loading OR when no timezone has been configured.
 */
export function useAdminTimezone(): { adminTz: string | null; tzLoading: boolean } {
  const [adminTz,  setAdminTz]  = useState<string | null>(null);
  const [tzLoading, setTzLoading] = useState(true);

  useEffect(() => {
    getAdminTimezone()
      .then((tz) => { setAdminTz(tz); setTzLoading(false); })
      .catch(() => { setAdminTz(null); setTzLoading(false); });
  }, []);

  return { adminTz, tzLoading };
}
