/**
 * AdminSettingsPage — clinic operational settings.
 *
 * Covers working hours, appointment configuration, and portal preferences.
 * Reads from / writes to the `website_settings` Supabase table (key-value store).
 *
 * Does NOT overlap with:
 *   • WebsiteSettingsPage  — public website content (hero, about, contact)
 *   • AdminProfilePage     — personal account settings (password, language, theme)
 */
import { useState, useEffect, useCallback } from "react";
import { Clock, Calendar, Bell, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getSetting, setSetting } from "@/admin/repositories/settings.repository";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkingDay {
  enabled: boolean;
  start:   string;   // "09:00"
  end:     string;   // "18:00"
}

type WorkingHours = Record<string, WorkingDay>;

interface AppointmentConfig {
  defaultDurationMins: number;   // 30 | 60 | 90
  leadTimeHours:       number;   // min hours before booking
  bufferMins:          number;   // gap between appointments
  slotIntervalMins:    number;   // time slot interval (30 | 60)
}

interface NotificationConfig {
  newBooking:  boolean;
  newMessage:  boolean;
}

const DAY_KEYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS: Record<string, { en: string; ar: string }> = {
  monday:    { en: "Monday",    ar: "الاثنين"    },
  tuesday:   { en: "Tuesday",   ar: "الثلاثاء"   },
  wednesday: { en: "Wednesday", ar: "الأربعاء"   },
  thursday:  { en: "Thursday",  ar: "الخميس"    },
  friday:    { en: "Friday",    ar: "الجمعة"    },
  saturday:  { en: "Saturday",  ar: "السبت"     },
  sunday:    { en: "Sunday",    ar: "الأحد"     },
};

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday:    { enabled: true,  start: "09:00", end: "18:00" },
  tuesday:   { enabled: true,  start: "09:00", end: "18:00" },
  wednesday: { enabled: true,  start: "09:00", end: "18:00" },
  thursday:  { enabled: true,  start: "09:00", end: "18:00" },
  friday:    { enabled: true,  start: "09:00", end: "18:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00" },
  sunday:    { enabled: false, start: "10:00", end: "14:00" },
};

const DEFAULT_APPOINTMENT: AppointmentConfig = {
  defaultDurationMins: 60,
  leadTimeHours:       24,
  bufferMins:          15,
  slotIntervalMins:    30,
};

const DEFAULT_NOTIFICATIONS: NotificationConfig = {
  newBooking: true,
  newMessage: true,
};

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({
  icon: Icon, title, children,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
          <Icon size={16} className="text-primary-pink" strokeWidth={2} />
        </div>
        <h2 className="text-[14px] font-bold text-[var(--admin-text)]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [workingHours,   setWorkingHours]   = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [apptConfig,     setApptConfig]     = useState<AppointmentConfig>(DEFAULT_APPOINTMENT);
  const [notifications,  setNotifications]  = useState<NotificationConfig>(DEFAULT_NOTIFICATIONS);

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  // ── Load settings ──────────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoading(true);
    const [wh, ac, nc] = await Promise.all([
      getSetting("working_hours"),
      getSetting("appointment_config"),
      getSetting("notification_config"),
    ]);
    if (wh)  setWorkingHours(wh as unknown as WorkingHours);
    if (ac)  setApptConfig(ac as unknown as AppointmentConfig);
    if (nc)  setNotifications(nc as unknown as NotificationConfig);
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Save all ───────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    await Promise.all([
      setSetting("working_hours",      workingHours  as unknown as import("@/types/database.types").Json),
      setSetting("appointment_config", apptConfig    as unknown as import("@/types/database.types").Json),
      setSetting("notification_config",notifications as unknown as import("@/types/database.types").Json),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function updateDay(day: string, patch: Partial<WorkingDay>) {
    setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="text-primary-pink animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--admin-text)]">
            {isAr ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-[13px] text-[var(--admin-text-faint)] mt-0.5">
            {isAr
              ? "إعدادات ساعات العمل والمواعيد والإشعارات"
              : "Working hours, appointment configuration, and notifications"}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-pink text-white text-[13px] font-bold hover:bg-primary-pink/90 transition-all disabled:opacity-60 shrink-0"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={15} />
          ) : (
            <Save size={15} strokeWidth={2} />
          )}
          {saved
            ? (isAr ? "تم الحفظ" : "Saved!")
            : saving
            ? (isAr ? "جاري الحفظ…" : "Saving…")
            : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </button>
      </div>

      {/* ── Working Hours ────────────────────────────────────────────────────── */}
      <Section icon={Clock} title={isAr ? "ساعات العمل" : "Working Hours"}>
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const cfg = workingHours[day] ?? DEFAULT_WORKING_HOURS[day];
            return (
              <div key={day} className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => updateDay(day, { enabled: !cfg.enabled })}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${cfg.enabled ? "bg-primary-pink" : "bg-[var(--admin-border)]"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${cfg.enabled ? "start-[calc(100%-18px)]" : "start-0.5"}`} />
                </button>

                {/* Day label */}
                <span className={`w-24 text-[13px] font-semibold shrink-0 ${cfg.enabled ? "text-[var(--admin-text)]" : "text-[var(--admin-text-faint)]"}`}>
                  {DAY_LABELS[day][isAr ? "ar" : "en"]}
                </span>

                {/* Time range */}
                {cfg.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={cfg.start}
                      onChange={e => updateDay(day, { start: e.target.value })}
                      className="form-input py-1.5 text-[13px] w-[110px]"
                    />
                    <span className="text-[var(--admin-text-faint)] text-[12px]">→</span>
                    <input
                      type="time"
                      value={cfg.end}
                      onChange={e => updateDay(day, { end: e.target.value })}
                      className="form-input py-1.5 text-[13px] w-[110px]"
                    />
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--admin-text-faint)] italic">
                    {isAr ? "مغلق" : "Closed"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Appointment Settings ─────────────────────────────────────────────── */}
      <Section icon={Calendar} title={isAr ? "إعدادات المواعيد" : "Appointment Settings"}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-input-label">
              {isAr ? "مدة الجلسة الافتراضية" : "Default Session Duration"}
            </label>
            <select
              className="form-input"
              value={apptConfig.defaultDurationMins}
              onChange={e => setApptConfig(p => ({ ...p, defaultDurationMins: Number(e.target.value) }))}
            >
              <option value={30}>{isAr ? "30 دقيقة" : "30 minutes"}</option>
              <option value={60}>{isAr ? "60 دقيقة" : "60 minutes"}</option>
              <option value={90}>{isAr ? "90 دقيقة" : "90 minutes"}</option>
            </select>
          </div>
          <div>
            <label className="form-input-label">
              {isAr ? "فترة التخزين بين المواعيد" : "Buffer Between Appointments"}
            </label>
            <select
              className="form-input"
              value={apptConfig.bufferMins}
              onChange={e => setApptConfig(p => ({ ...p, bufferMins: Number(e.target.value) }))}
            >
              <option value={0}>{isAr ? "بدون فاصل" : "No buffer"}</option>
              <option value={15}>{isAr ? "15 دقيقة" : "15 minutes"}</option>
              <option value={30}>{isAr ? "30 دقيقة" : "30 minutes"}</option>
            </select>
          </div>
          <div>
            <label className="form-input-label">
              {isAr ? "فاصل الوقت بين الخانات" : "Time Slot Interval"}
            </label>
            <select
              className="form-input"
              value={apptConfig.slotIntervalMins}
              onChange={e => setApptConfig(p => ({ ...p, slotIntervalMins: Number(e.target.value) }))}
            >
              <option value={30}>{isAr ? "كل 30 دقيقة" : "Every 30 minutes"}</option>
              <option value={60}>{isAr ? "كل 60 دقيقة" : "Every 60 minutes"}</option>
            </select>
          </div>
          <div>
            <label className="form-input-label">
              {isAr ? "الحد الأدنى للحجز المسبق (ساعات)" : "Minimum Lead Time (hours)"}
            </label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={168}
              value={apptConfig.leadTimeHours}
              onChange={e => setApptConfig(p => ({ ...p, leadTimeHours: Number(e.target.value) }))}
            />
          </div>
        </div>
      </Section>

      {/* ── Notifications ────────────────────────────────────────────────────── */}
      <Section icon={Bell} title={isAr ? "الإشعارات" : "Notifications"}>
        <div className="space-y-3">
          {[
            {
              key: "newBooking" as const,
              label:   isAr ? "إشعار عند حجز موعد جديد"   : "Notify on new booking",
              sublabel:isAr ? "استلام إشعار عند تأكيد موعد جديد" : "Receive an alert when a client books a new appointment",
            },
            {
              key: "newMessage" as const,
              label:   isAr ? "إشعار عند وصول رسالة جديدة" : "Notify on new message",
              sublabel:isAr ? "استلام إشعار عند وصول رسالة من العميل"  : "Receive an alert when a client submits a contact message",
            },
          ].map(({ key, label, sublabel }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 border-b border-[var(--admin-border)] last:border-0">
              <div>
                <p className="text-[13.5px] font-semibold text-[var(--admin-text)]">{label}</p>
                <p className="text-[12px] text-[var(--admin-text-faint)] mt-0.5">{sublabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${notifications[key] ? "bg-primary-pink" : "bg-[var(--admin-border)]"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${notifications[key] ? "start-[calc(100%-18px)]" : "start-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
