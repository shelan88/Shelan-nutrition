/**
 * bookingAvailability.ts — Global Booking Availability system.
 *
 * Reads the `booking_availability` setting from website_settings:
 *   { status: "open" | "scheduled" | "closed", startDate: string|null, endDate: string|null }
 *
 * Falls back to the legacy `booking_start_date` key (treated as
 * status="scheduled") when the new object doesn't exist yet.
 *
 * The EFFECTIVE state is computed against "today" in the admin timezone:
 *   - closed                          → "closed"
 *   - open      + endDate passed      → "closed"
 *   - scheduled + before startDate    → "scheduled" (opens on startDate)
 *   - scheduled + within window       → "open"
 *   - scheduled + after endDate       → "closed"
 *
 * NOTE: this mirrors api/_lib/booking-availability.js (server enforcement).
 * Keep the two in sync.
 */

import { useEffect, useMemo, useState } from "react";
import { getSetting } from "@/admin/repositories/settings.repository";
import { todayInTz, useAdminTimezone } from "@/lib/timezone";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus = "open" | "scheduled" | "closed";

export interface BookingAvailabilitySettings {
  status: BookingStatus;
  startDate: string | null; // YYYY-MM-DD (admin timezone)
  endDate: string | null;   // YYYY-MM-DD (admin timezone), inclusive
}

export interface EffectiveAvailability {
  /** What the visitor experiences right now. */
  state: "open" | "scheduled" | "closed";
  /** Set when state === "scheduled" — the date bookings open. */
  opensOn: string | null;
}

// ─── Pure compute (shared with tests / mirrored on server) ───────────────────

export function computeEffectiveAvailability(
  settings: BookingAvailabilitySettings | null,
  today: string,
): EffectiveAvailability {
  // No settings at all → open (safety default, matches previous behaviour)
  if (!settings) return { state: "open", opensOn: null };

  const { status, startDate, endDate } = settings;

  if (status === "closed") return { state: "closed", opensOn: null };

  // End date is inclusive: bookings stop the day AFTER endDate.
  const ended = !!endDate && today > endDate;

  if (status === "open") {
    return ended ? { state: "closed", opensOn: null } : { state: "open", opensOn: null };
  }

  // status === "scheduled": a start date is required — misconfiguration
  // fails closed (mirrors the server-side gate).
  if (!startDate) return { state: "closed", opensOn: null };
  if (ended) return { state: "closed", opensOn: null };
  if (today < startDate) return { state: "scheduled", opensOn: startDate };
  return { state: "open", opensOn: null };
}

// ─── Settings parsing ─────────────────────────────────────────────────────────

export function parseAvailabilitySetting(
  raw: unknown,
  legacyStartDate: unknown,
): BookingAvailabilitySettings | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const status =
      obj.status === "open" || obj.status === "scheduled" || obj.status === "closed"
        ? obj.status
        : "open";
    return {
      status,
      startDate: typeof obj.startDate === "string" && obj.startDate ? obj.startDate : null,
      endDate: typeof obj.endDate === "string" && obj.endDate ? obj.endDate : null,
    };
  }
  // Legacy fallback: booking_start_date string → scheduled from that date
  if (typeof legacyStartDate === "string" && legacyStartDate) {
    return { status: "scheduled", startDate: legacyStartDate, endDate: null };
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBookingAvailability(): {
  availability: EffectiveAvailability;
  settings: BookingAvailabilitySettings | null;
  loading: boolean;
} {
  const { adminTz, tzLoading } = useAdminTimezone();
  const [settings, setSettings] = useState<BookingAvailabilitySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSetting("booking_availability"), getSetting("booking_start_date")])
      .then(([raw, legacy]) => setSettings(parseAvailabilitySetting(raw, legacy)))
      .catch(() => setSettings(null))
      .finally(() => setSettingsLoading(false));
  }, []);

  const loading = settingsLoading || tzLoading;

  const availability = useMemo<EffectiveAvailability>(() => {
    // While loading, treat as open so the UI never flashes a lock incorrectly;
    // the server-side gate is the authoritative enforcement anyway.
    if (loading) return { state: "open", opensOn: null };
    return computeEffectiveAvailability(settings, todayInTz(adminTz ?? "UTC"));
  }, [loading, settings, adminTz]);

  return { availability, settings, loading };
}

// ─── Customer-facing copy ─────────────────────────────────────────────────────

export function formatOpenDate(dateStr: string, lang: string): string {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(
      lang === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
  } catch {
    return dateStr;
  }
}

/** Branded message for a blocked booking state. Returns null when open. */
export function availabilityMessage(
  availability: EffectiveAvailability,
  lang: string,
): { title: string; body: string } | null {
  const isAr = lang === "ar";
  if (availability.state === "scheduled" && availability.opensOn) {
    const d = formatOpenDate(availability.opensOn, lang);
    return isAr
      ? {
          title: "الحجوزات ستفتح قريباً",
          body: `سيبدأ قبول الحجوزات اعتباراً من ${d}. يمكنك الاطلاع على الخدمات المتاحة في الأثناء.`,
        }
      : {
          title: "Bookings open soon",
          body: `Booking opens on ${d}. You can browse the available services in the meantime.`,
        };
  }
  if (availability.state === "closed") {
    return isAr
      ? {
          title: "الحجوزات مغلقة حالياً",
          body: "نعتذر، الحجوزات غير متاحة في الوقت الحالي. يمكنك الاطلاع على خدماتنا، وترقّب فتح الحجوزات قريباً.",
        }
      : {
          title: "Bookings are currently closed",
          body: "We're sorry — bookings are not available at the moment. Feel free to browse our services and check back soon.",
        };
  }
  return null;
}
