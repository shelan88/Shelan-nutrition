import { useLanguage } from "@/context/LanguageContext";
import { useAdminLabels } from "@/admin/hooks/useAdminLabels";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import {
  getAllConsultations, createConsultation, updateConsultation, deleteConsultation,
} from "@/admin/repositories/consultations.repository";
import type { ConsultationRow } from "@/types/database.types";
import CurrencySelect from "../components/CurrencySelect";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const ICON_OPTIONS = [
  "CalendarCheck", "Stethoscope", "Heart", "HeartPulse", "Sparkles",
  "Star", "Leaf", "Brain", "Sun", "Clock", "Video", "MessageCircle",
];

const GRADIENT_OPTIONS = [
  { value: "",                               label_en: "Pink → Purple (default)", label_ar: "وردي → بنفسجي (افتراضي)" },
  { value: "from-emerald-400 to-teal-500",   label_en: "Emerald → Teal",          label_ar: "زمردي → زمردي غامق" },
  { value: "from-blue-400 to-indigo-500",    label_en: "Blue → Indigo",           label_ar: "أزرق → نيلي" },
  { value: "from-amber-400 to-orange-500",   label_en: "Amber → Orange",          label_ar: "عنبري → برتقالي" },
  { value: "from-violet-500 to-purple-600",  label_en: "Violet → Purple",         label_ar: "بنفسجي → أرجواني" },
  { value: "from-rose-400 to-pink-600",      label_en: "Rose → Pink",             label_ar: "وردي داكن → زهري" },
];

// ─── Period map: key → { en, ar } display strings ─────────────────────────────
const PERIOD_MAP: Record<string, { en: string; ar: string }> = {
  "one-time": { en: "one-time",  ar: "دفعة واحدة" },
  "hourly":   { en: "/ hour",   ar: "/ ساعة" },
  "daily":    { en: "/ day",    ar: "/ يوم" },
  "weekly":   { en: "/ week",   ar: "/ أسبوع" },
  "monthly":  { en: "/ month",  ar: "/ شهريًا" },
  "yearly":   { en: "/ year",   ar: "/ سنويًا" },
};

const PERIOD_LABELS: Record<string, { en: string; ar: string }> = {
  "one-time": { en: "One time",  ar: "دفعة واحدة" },
  "hourly":   { en: "Hourly",   ar: "بالساعة" },
  "daily":    { en: "Daily",    ar: "يوميًا" },
  "weekly":   { en: "Weekly",   ar: "أسبوعيًا" },
  "monthly":  { en: "Monthly",  ar: "شهريًا" },
  "yearly":   { en: "Yearly",   ar: "سنويًا" },
};

// ─── Duration unit map ────────────────────────────────────────────────────────
const UNIT_MAP: Record<string, { en: string; ar: string }> = {
  "minutes":  { en: "minutes",  ar: "دقيقة" },
  "hours":    { en: "hours",    ar: "ساعات" },
  "days":     { en: "days",     ar: "أيام" },
  "weeks":    { en: "weeks",    ar: "أسابيع" },
  "months":   { en: "months",   ar: "أشهر" },
  "sessions": { en: "sessions", ar: "جلسات" },
};

const UNIT_LABELS: Record<string, { en: string; ar: string }> = {
  "minutes":  { en: "Minutes",  ar: "دقائق" },
  "hours":    { en: "Hours",    ar: "ساعات" },
  "days":     { en: "Days",     ar: "أيام" },
  "weeks":    { en: "Weeks",    ar: "أسابيع" },
  "months":   { en: "Months",   ar: "أشهر" },
  "sessions": { en: "Sessions", ar: "جلسات" },
};

function parsePeriodKey(periodEn: string | null | undefined): string {
  if (!periodEn) return "one-time";
  const entry = Object.entries(PERIOD_MAP).find(([, v]) => v.en === periodEn);
  return entry ? entry[0] : "one-time";
}

function parseDuration(durationEn: string | null | undefined): { value: number; unit: string } {
  if (!durationEn) return { value: 1, unit: "sessions" };
  const parts = durationEn.trim().split(/\s+/);
  const value = parseInt(parts[0]) || 1;
  const unitText = parts.slice(1).join(" ").toLowerCase();
  const unit = Object.entries(UNIT_MAP).find(([, v]) => v.en.toLowerCase() === unitText)?.[0] ?? "sessions";
  return { value, unit };
}

// ─── Form styles ──────────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const lbl = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

type Row = ConsultationRow;

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    title_en: "", title_ar: "", subtitle_en: "", subtitle_ar: "",
    description_en: "", description_ar: "",
    price: null, currency: "$",
    period_en: "one-time", period_ar: "دفعة واحدة",
    duration_en: "1 sessions", duration_ar: "1 جلسات",
    features_en: [], features_ar: [],
    cta_text_en: "", cta_text_ar: "",
    badge_en: "", badge_ar: "",
    icon: "", gradient: "",
    discount_enabled: false, discount_percent: null,
    active: false, sort_order: 0,
  };
}

export default function ConsultationsAdminPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const L = (en: string, arStr: string) => ar ? arStr : en;
  const fl = useAdminLabels();

  const [rows,         setRows]         = useState<Row[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState<"list" | "edit">("list");
  const [editing,      setEditing]      = useState<Row | null>(null);
  const [form,         setForm]         = useState(initForm());
  const [featEnText,   setFeatEnText]   = useState("");
  const [featArText,   setFeatArText]   = useState("");
  const [periodKey,    setPeriodKey]    = useState("one-time");
  const [durationVal,  setDurationVal]  = useState(1);
  const [durationUnit, setDurationUnit] = useState("sessions");
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await getAllConsultations());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null); setForm(initForm());
    setFeatEnText(""); setFeatArText("");
    setPeriodKey("one-time"); setDurationVal(1); setDurationUnit("sessions");
    setSaveError(null); setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      title_en: row.title_en ?? "", title_ar: row.title_ar ?? "",
      subtitle_en: row.subtitle_en ?? "", subtitle_ar: row.subtitle_ar ?? "",
      description_en: row.description_en ?? "", description_ar: row.description_ar ?? "",
      price: row.price ?? null, currency: row.currency ?? "$",
      period_en: row.period_en ?? "", period_ar: row.period_ar ?? "",
      duration_en: row.duration_en ?? "", duration_ar: row.duration_ar ?? "",
      features_en: row.features_en ?? [], features_ar: row.features_ar ?? [],
      cta_text_en: row.cta_text_en ?? "", cta_text_ar: row.cta_text_ar ?? "",
      badge_en: row.badge_en ?? "", badge_ar: row.badge_ar ?? "",
      icon: row.icon ?? "", gradient: row.gradient ?? "",
      discount_enabled: row.discount_enabled ?? false,
      discount_percent: row.discount_percent ?? null,
      active: row.active ?? false, sort_order: row.sort_order ?? 0,
    });
    setFeatEnText((row.features_en ?? []).join("\n"));
    setFeatArText((row.features_ar ?? []).join("\n"));
    setPeriodKey(parsePeriodKey(row.period_en));
    const { value, unit } = parseDuration(row.duration_en);
    setDurationVal(value); setDurationUnit(unit);
    setSaveError(null); setView("edit");
  }

  function cancel() { setView("list"); setEditing(null); setSaveError(null); }

  async function handleSave() {
    setSaving(true); setSaveError(null);
    const pm = PERIOD_MAP[periodKey] ?? PERIOD_MAP["one-time"];
    const um = UNIT_MAP[durationUnit] ?? UNIT_MAP["sessions"];
    const payload = {
      ...form,
      period_en:   pm.en,
      period_ar:   pm.ar,
      duration_en: `${durationVal} ${um.en}`,
      duration_ar: `${durationVal} ${um.ar}`,
      features_en: featEnText.split("\n").filter(Boolean),
      features_ar: featArText.split("\n").filter(Boolean),
      discount_percent: form.discount_enabled ? form.discount_percent : null,
    };
    let ok: boolean;
    if (editing) {
      ok = await updateConsultation(editing.id, payload);
    } else {
      const created = await createConsultation(payload);
      ok = created !== null;
    }
    setSaving(false);
    if (!ok) { setSaveError(L("Save failed. Please try again.","فشل الحفظ. يرجى المحاولة مرة أخرى.")); return; }
    await load(); setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(L("Delete this consultation package?","حذف هذه الباقة؟"))) return;
    setDeletingId(id);
    await deleteConsultation(id);
    await load(); setDeletingId(null);
  }

  async function handleReorder(id: string, dir: "up" | "down") {
    const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx    = sorted.findIndex((r) => r.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    setReorderingId(id);
    const [ok1, ok2] = await Promise.all([
      updateConsultation(a.id, { sort_order: b.sort_order ?? swapIdx }),
      updateConsultation(b.id, { sort_order: a.sort_order ?? idx }),
    ]);
    if (!ok1 || !ok2) console.error("[consultations] reorder failed");
    await load(); setReorderingId(null);
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const discountPct = form.discount_percent ?? 0;
  const finalPrice  = form.price != null && form.discount_enabled && discountPct > 0
    ? Math.round(form.price * (1 - discountPct / 100) * 100) / 100 : null;
  const sortedRows = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div>
      <PageHeader
        title={L("Consultations","الاستشارات")}
        description={L("Manage consultation packages shown in the booking section.","إدارة باقات الاستشارة المعروضة في قسم الحجز.")}
        breadcrumbs={[
          { label: L("Admin","الإدارة"), href: "/admin" },
          { label: L("Consultations","الاستشارات") },
        ]}
      />

      <AnimatePresence mode="wait">
        {/* ── LIST ──────────────────────────────────────────────────────────── */}
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <p className="text-[13px] text-[var(--admin-text-muted)]">
                  {ar ? `${rows.length} باقة` : `${rows.length} package${rows.length !== 1 ? "s" : ""}`}
                </p>
                <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Plus size={15} />
                  {L("New Package","باقة جديدة")}
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("Loading…","جارٍ التحميل…")}</div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("No packages yet.","لا توجد باقات بعد.")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--admin-hover-bg)]">
                      <tr>
                        {[L("Order","الترتيب"),L("Package","الباقة"),L("Price","السعر"),L("Duration","المدة"),L("Status","الحالة"),L("Actions","إجراءات")].map((h) => (
                          <th key={h} className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row, idx) => (
                        <tr key={row.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <button disabled={idx === 0 || reorderingId === row.id} onClick={() => handleReorder(row.id, "up")} className="p-0.5 rounded text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronUp size={13} /></button>
                              <button disabled={idx === sortedRows.length - 1 || reorderingId === row.id} onClick={() => handleReorder(row.id, "down")} className="p-0.5 rounded text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown size={13} /></button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            <p className="font-medium">{row.title_en}</p>
                            {row.title_ar && <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{row.title_ar}</p>}
                            {row.badge_en && <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-pink/10 text-primary-pink">{row.badge_en}</span>}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.price != null ? <span>{row.currency ?? "$"}{row.price}{row.discount_enabled && row.discount_percent ? <span className="ms-1.5 text-[11px] text-emerald-600 font-semibold">-{row.discount_percent}%</span> : null}</span> : "—"}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">{row.duration_en || "—"}</td>
                          <td className="py-3 px-4">
                            {row.active
                              ? <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">{L("Active","نشط")}</span>
                              : <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">{L("Hidden","مخفي")}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(row)} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1">
                                <Pencil size={12} /> {L("Edit","تعديل")}
                              </button>
                              <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1">
                                <Trash2 size={12} /> {deletingId === row.id ? "…" : L("Delete","حذف")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

        ) : (
        /* ── EDIT / CREATE ────────────────────────────────────────────────── */
          <motion.div key="edit" {...fadeUp()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={cancel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                <ArrowLeft size={13} className="rtl:rotate-180" /> {L("Back","رجوع")}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={13} className="inline me-1" /> {L("Cancel","إلغاء")}
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                  <Save size={14} />
                  {saving ? L("Saving…","جارٍ الحفظ…") : editing ? L("Save Changes","حفظ التغييرات") : L("Create Package","إنشاء باقة")}
                </button>
              </div>
            </div>

            {saveError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
                <span className="font-semibold">⚠</span> {saveError}
              </div>
            )}

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing ? L("Edit Package","تعديل الباقة") : L("New Package","باقة جديدة")}
                </h2>
              </div>

              <div className="p-6 space-y-6">

                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("title")} (EN)</label>
                    <input value={form.title_en} onChange={(e) => set("title_en", e.target.value)} className={inp} placeholder={L("Package name in English","اسم الباقة بالإنجليزية")} />
                  </div>
                  <div>
                    <label className={lbl}>{fl("title")} (AR)</label>
                    <input dir="rtl" value={form.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} className={inp} placeholder={L("Package name in Arabic","اسم الباقة بالعربية")} />
                  </div>
                </div>

                {/* Subtitles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("subtitle")} (EN) <span className="font-normal normal-case opacity-60">— {L("optional","اختياري")}</span></label>
                    <input value={form.subtitle_en ?? ""} onChange={(e) => set("subtitle_en", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>{fl("subtitle")} (AR)</label>
                    <input dir="rtl" value={form.subtitle_ar ?? ""} onChange={(e) => set("subtitle_ar", e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Badge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("badge")} (EN) <span className="font-normal normal-case opacity-60">— {L("marks this as featured","يُعلّمها كباقة مميزة")}</span></label>
                    <input value={form.badge_en ?? ""} onChange={(e) => set("badge_en", e.target.value)} className={inp} placeholder="Most Popular" />
                  </div>
                  <div>
                    <label className={lbl}>{fl("badge")} (AR)</label>
                    <input dir="rtl" value={form.badge_ar ?? ""} onChange={(e) => set("badge_ar", e.target.value)} className={inp} placeholder="الأكثر طلبًا" />
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("description")} (EN) <span className="font-normal normal-case opacity-60">— {L("optional","اختياري")}</span></label>
                    <textarea rows={3} value={form.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                  <div>
                    <label className={lbl}>{fl("description")} (AR)</label>
                    <textarea dir="rtl" rows={3} value={form.description_ar ?? ""} onChange={(e) => set("description_ar", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("features")} (EN)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">{L("One feature per line","ميزة واحدة في كل سطر")}</p>
                    <textarea rows={5} value={featEnText} onChange={(e) => setFeatEnText(e.target.value)} className={`${inp} resize-y`} placeholder={"Personalized plan\nWeekly check-ins"} />
                  </div>
                  <div>
                    <label className={lbl}>{fl("features")} (AR)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">{L("One feature per line","ميزة واحدة في كل سطر")}</p>
                    <textarea dir="rtl" rows={5} value={featArText} onChange={(e) => setFeatArText(e.target.value)} className={`${inp} resize-y`} placeholder={"خطة مخصصة\nمتابعة أسبوعية"} />
                  </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{fl("ctaButton")} (EN)</label>
                    <input value={form.cta_text_en ?? ""} onChange={(e) => set("cta_text_en", e.target.value)} className={inp} placeholder="Book Now" />
                  </div>
                  <div>
                    <label className={lbl}>{fl("ctaButton")} (AR)</label>
                    <input dir="rtl" value={form.cta_text_ar ?? ""} onChange={(e) => set("cta_text_ar", e.target.value)} className={inp} placeholder="احجزي الآن" />
                  </div>
                </div>

                {/* ── Pricing & Timing ──────────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{L("Pricing & Timing","السعر والمدة")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Price */}
                    <div>
                      <label className={lbl}>{fl("price")}</label>
                      <input type="number" min={0} value={form.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} className={inp} placeholder="120" />
                    </div>

                    {/* Currency */}
                    <div>
                      <label className={lbl}>{fl("currency")}</label>
                      <CurrencySelect value={form.currency ?? "$"} onChange={(s) => set("currency", s)} lang={lang} />
                    </div>

                    {/* Billing Period */}
                    <div>
                      <label className={lbl}>{fl("billingPeriod")}</label>
                      <select
                        value={periodKey}
                        onChange={(e) => setPeriodKey(e.target.value)}
                        className={inp + " cursor-pointer"}
                      >
                        {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{ar ? v.ar : v.en}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="sm:col-span-2">
                      <label className={lbl}>{fl("duration")}</label>
                      <div className="flex gap-2">
                        <input
                          type="number" min={1}
                          value={durationVal}
                          onChange={(e) => setDurationVal(Math.max(1, Number(e.target.value) || 1))}
                          className={`${inp} w-24 shrink-0`}
                        />
                        <select
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value)}
                          className={`${inp} flex-1 cursor-pointer`}
                        >
                          {Object.entries(UNIT_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{ar ? v.ar : v.en}</option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--admin-text-faint)]">
                        {L("Stored as:","يُحفظ كـ:")} <span className="font-mono">{durationVal} {UNIT_MAP[durationUnit]?.en}</span>
                        {" / "}
                        <span className="font-mono" dir="rtl">{durationVal} {UNIT_MAP[durationUnit]?.ar}</span>
                      </p>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className={lbl}>{fl("sortOrder")}</label>
                      <input type="number" min={0} value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} className={inp} />
                    </div>
                  </div>
                </div>

                {/* ── Appearance ────────────────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{L("Appearance","المظهر")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>{fl("icon")}</label>
                      <select value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value)} className={inp + " cursor-pointer"}>
                        <option value="">{L("None","بدون أيقونة")}</option>
                        {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>{fl("gradient")}</label>
                      <select value={form.gradient ?? ""} onChange={(e) => set("gradient", e.target.value)} className={inp + " cursor-pointer"}>
                        {GRADIENT_OPTIONS.map((g) => <option key={g.value} value={g.value}>{ar ? g.label_ar : g.label_en}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-3 mt-4">
                    <input id="consult-active" type="checkbox" checked={form.active ?? false} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-pink-500 rounded cursor-pointer" />
                    <label htmlFor="consult-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                      {L("Active (visible on site)","نشط (مرئي على الموقع)")}
                    </label>
                  </div>
                </div>

                {/* ── Discount ──────────────────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{L("Discount","الخصم")}</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input id="consult-discount" type="checkbox" checked={form.discount_enabled ?? false} onChange={(e) => set("discount_enabled", e.target.checked)} className="w-4 h-4 accent-pink-500 rounded cursor-pointer" />
                      <label htmlFor="consult-discount" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        {L("Enable Discount","تفعيل الخصم")}
                      </label>
                    </div>
                    {form.discount_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className={lbl}>{fl("discountPercent")} <span className="font-normal normal-case opacity-60">(0 – 100)</span></label>
                          <input type="number" min={0} max={100} value={form.discount_percent ?? ""} onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") { set("discount_percent", null); return; }
                            const n = Number(raw);
                            if (!isNaN(n)) set("discount_percent", Math.min(100, Math.max(0, n)));
                          }} className={inp} placeholder="10" />
                        </div>
                        <div>
                          <label className={lbl}>{fl("finalPrice")}</label>
                          <div className={`${inp} flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold`}>
                            {finalPrice != null ? (
                              <><span className="line-through opacity-50 font-normal text-[12px]">{form.currency ?? "$"}{form.price}</span><span>{form.currency ?? "$"}{finalPrice}</span></>
                            ) : (
                              <span className="text-[var(--admin-text-faint)] font-normal">{L("Enter price & discount %","أدخل السعر والنسبة")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
