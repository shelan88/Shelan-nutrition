/**
 * AvailabilityEditor — reusable admin UI for per-item booking availability.
 * Shows 7 day toggles and 15 time-slot toggles that match the booking flow.
 */
import { ALL_SLOTS, DAY_NAMES, defaultAvailability, resolveAvailability } from "@/lib/availability";
import type { AvailabilitySettings } from "@/lib/availability";

const lbl = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

interface Props {
  value: AvailabilitySettings | null;
  onChange: (v: AvailabilitySettings) => void;
  lang: string;
}

export default function AvailabilityEditor({ value, onChange, lang }: Props) {
  const ar   = lang === "ar";
  const L    = (en: string, arStr: string) => ar ? arStr : en;
  const avail = resolveAvailability(value);

  function toggleDay(key: string) {
    onChange({ ...avail, days: { ...avail.days, [key]: !avail.days[key] } });
  }

  function toggleSlot(slot: string) {
    onChange({ ...avail, slots: { ...avail.slots, [slot]: !avail.slots[slot] } });
  }

  function enableAll() {
    onChange(defaultAvailability());
  }

  function disableAll() {
    const days: Record<string, boolean> = {};
    for (let i = 0; i <= 6; i++) days[String(i)] = false;
    const slots: Record<string, boolean> = {};
    for (const s of ALL_SLOTS) slots[s] = false;
    onChange({ days, slots });
  }

  return (
    <div className="space-y-5">
      {/* Days of week */}
      <div>
        <label className={lbl}>{L("Available Days", "أيام العمل")}</label>
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map(({ key, en, ar: arName }) => {
            const enabled = avail.days[key] ?? true;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all select-none ${
                  enabled
                    ? "bg-gradient-to-r from-primary-pink/15 to-lavender-purple/15 border-primary-pink/40 text-primary-pink"
                    : "bg-[var(--admin-hover-bg)] border-[var(--admin-border)] text-[var(--admin-text-faint)] line-through"
                }`}
              >
                {ar ? arName : en}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--admin-text-faint)]">
          {L("Click a day to enable / disable it.", "انقر على اليوم لتفعيله أو إيقافه.")}
        </p>
      </div>

      {/* Time slots */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={lbl}>{L("Available Time Slots", "أوقات الحجز المتاحة")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={enableAll}
              className="text-[11px] font-medium text-primary-pink hover:underline"
            >
              {L("Enable all", "تفعيل الكل")}
            </button>
            <span className="text-[var(--admin-border)]">·</span>
            <button
              type="button"
              onClick={disableAll}
              className="text-[11px] font-medium text-[var(--admin-text-muted)] hover:underline"
            >
              {L("Disable all", "إيقاف الكل")}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ALL_SLOTS.map((slot) => {
            const enabled = avail.slots[slot] !== false;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={`px-2 py-2 rounded-lg text-[12px] font-semibold border transition-all text-center select-none ${
                  enabled
                    ? "bg-gradient-to-r from-primary-pink/15 to-lavender-purple/15 border-primary-pink/40 text-primary-pink"
                    : "bg-[var(--admin-hover-bg)] border-[var(--admin-border)] text-[var(--admin-text-faint)] line-through"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--admin-text-faint)]">
          {L("Strikethrough slots will not appear in the booking calendar.", "الأوقات المشطوبة لن تظهر في صفحة الحجز.")}
        </p>
      </div>
    </div>
  );
}
