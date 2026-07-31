/**
 * availability.ts — shared helpers for per-service booking availability.
 *
 * Availability is stored as a JSONB column on both `programs` and
 * `consultations`. When null/missing the defaults kick in (all days
 * except Sunday, all 15 canonical slots).
 */

export interface AvailabilitySettings {
  /** day-of-week → enabled  (0 = Sunday … 6 = Saturday) */
  days: Record<string, boolean>;
  /** "9:00 AM" → enabled */
  slots: Record<string, boolean>;
}

/** Canonical 15-slot list shared by booking UI and admin panel. */
export const ALL_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM",
  "1:00 PM",  "1:30 PM",  "2:00 PM",  "2:30 PM",
  "3:00 PM",  "4:00 PM",  "4:30 PM",  "5:00 PM",
] as const;

export const DAY_NAMES = [
  { key: "0", en: "Sun", ar: "أحد" },
  { key: "1", en: "Mon", ar: "اثنين" },
  { key: "2", en: "Tue", ar: "ثلاثاء" },
  { key: "3", en: "Wed", ar: "أربعاء" },
  { key: "4", en: "Thu", ar: "خميس" },
  { key: "5", en: "Fri", ar: "جمعة" },
  { key: "6", en: "Sat", ar: "سبت" },
] as const;

/** Default: every day except Sunday, every slot. */
export function defaultAvailability(): AvailabilitySettings {
  const days: Record<string, boolean> = {};
  for (let i = 0; i <= 6; i++) days[String(i)] = i !== 0;
  const slots: Record<string, boolean> = {};
  for (const s of ALL_SLOTS) slots[s] = true;
  return { days, slots };
}

/** Merge raw DB value with defaults so missing keys are handled gracefully. */
export function resolveAvailability(
  raw: AvailabilitySettings | null | undefined,
): AvailabilitySettings {
  if (!raw) return defaultAvailability();
  const def = defaultAvailability();
  return {
    days:  { ...def.days,  ...raw.days },
    slots: { ...def.slots, ...raw.slots },
  };
}

/** Numbers of days that should be disabled in the calendar. */
export function getDisabledDays(avail: AvailabilitySettings): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i <= 6; i++) {
    if (!avail.days[String(i)]) s.add(i);
  }
  return s;
}

/** CMSTimeSlot array containing only the enabled slots. */
export function getEnabledTimeSlots(
  avail: AvailabilitySettings,
): { time: string; available: boolean }[] {
  return ALL_SLOTS
    .filter((s) => avail.slots[s] !== false)
    .map((time) => ({ time, available: true }));
}
