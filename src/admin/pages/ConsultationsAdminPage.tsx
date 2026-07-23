import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ArrowLeft, Save, X,
  ChevronUp, ChevronDown,
} from "lucide-react";
import {
  getAllConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
} from "@/admin/repositories/consultations.repository";
import type { ConsultationRow } from "@/types/database.types";

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
  { value: "",                               label: "Pink → Purple (default)" },
  { value: "from-emerald-400 to-teal-500",   label: "Emerald → Teal" },
  { value: "from-blue-400 to-indigo-500",    label: "Blue → Indigo" },
  { value: "from-amber-400 to-orange-500",   label: "Amber → Orange" },
  { value: "from-violet-500 to-purple-600",  label: "Violet → Purple" },
  { value: "from-rose-400 to-pink-600",      label: "Rose → Pink" },
];

// ─── Shared input styles ───────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const lbl = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

type Row = ConsultationRow;

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    title_en:        "",
    title_ar:        "",
    subtitle_en:     "",
    subtitle_ar:     "",
    description_en:  "",
    description_ar:  "",
    price:           null,
    currency:        "$",
    period_en:       "",
    period_ar:       "",
    duration_en:     "",
    duration_ar:     "",
    features_en:     [],
    features_ar:     [],
    cta_text_en:     "",
    cta_text_ar:     "",
    badge_en:        "",
    badge_ar:        "",
    icon:            "",
    gradient:        "",
    discount_enabled: false,
    discount_percent: null,
    active:          false,
    sort_order:      0,
  };
}

export default function ConsultationsAdminPage() {
  const { lang } = useLanguage();
  const [rows, setRows]               = useState<Row[]>([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<"list" | "edit">("list");
  const [editing, setEditing]         = useState<Row | null>(null);
  const [form, setForm]               = useState(initForm());
  const [featuresEnText, setFeaturesEnText] = useState("");
  const [featuresArText, setFeaturesArText] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllConsultations();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(initForm());
    setFeaturesEnText("");
    setFeaturesArText("");
    setSaveError(null);
    setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      title_en:        row.title_en       ?? "",
      title_ar:        row.title_ar       ?? "",
      subtitle_en:     row.subtitle_en    ?? "",
      subtitle_ar:     row.subtitle_ar    ?? "",
      description_en:  row.description_en ?? "",
      description_ar:  row.description_ar ?? "",
      price:           row.price          ?? null,
      currency:        row.currency       ?? "$",
      period_en:       row.period_en      ?? "",
      period_ar:       row.period_ar      ?? "",
      duration_en:     row.duration_en    ?? "",
      duration_ar:     row.duration_ar    ?? "",
      features_en:     row.features_en    ?? [],
      features_ar:     row.features_ar    ?? [],
      cta_text_en:     row.cta_text_en    ?? "",
      cta_text_ar:     row.cta_text_ar    ?? "",
      badge_en:        row.badge_en       ?? "",
      badge_ar:        row.badge_ar       ?? "",
      icon:            row.icon           ?? "",
      gradient:        row.gradient       ?? "",
      discount_enabled: row.discount_enabled ?? false,
      discount_percent: row.discount_percent ?? null,
      active:          row.active         ?? false,
      sort_order:      row.sort_order     ?? 0,
    });
    setFeaturesEnText((row.features_en ?? []).join("\n"));
    setFeaturesArText((row.features_ar ?? []).join("\n"));
    setSaveError(null);
    setView("edit");
  }

  function cancel() { setView("list"); setEditing(null); setSaveError(null); }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const payload = {
      ...form,
      features_en:     featuresEnText.split("\n").filter(Boolean),
      features_ar:     featuresArText.split("\n").filter(Boolean),
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
    if (!ok) {
      setSaveError("Save failed. Please check your connection and try again.");
      return;
    }
    await load();
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this consultation package?")) return;
    setDeletingId(id);
    await deleteConsultation(id);
    await load();
    setDeletingId(null);
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex((r) => r.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const aRow = sorted[idx];
    const bRow = sorted[swapIdx];
    const aOrder = aRow.sort_order ?? idx;
    const bOrder = bRow.sort_order ?? swapIdx;
    setReorderingId(id);
    const [ok1, ok2] = await Promise.all([
      updateConsultation(aRow.id, { sort_order: bOrder }),
      updateConsultation(bRow.id, { sort_order: aOrder }),
    ]);
    if (!ok1 || !ok2) console.error("[consultations] reorder failed for", aRow.id, bRow.id);
    await load();
    setReorderingId(null);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Live discount preview
  const discountPercent = form.discount_percent ?? 0;
  const finalPrice =
    form.price != null && form.discount_enabled && discountPercent > 0
      ? Math.round(form.price * (1 - discountPercent / 100) * 100) / 100
      : null;

  const sortedRows = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الاستشارات" : "Consultations"}
        description={lang === "ar" ? "إدارة باقات الاستشارة المعروضة في قسم الحجز." : "Manage consultation packages shown in the booking section."}
        breadcrumbs={[
          { label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" },
          { label: lang === "ar" ? "الاستشارات" : "Consultations" },
        ]}
      />

      <AnimatePresence mode="wait">
        {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <p className="text-[13px] text-[var(--admin-text-muted)]">
                  {lang === "ar"
                    ? `${rows.length} باقة`
                    : `${rows.length} package${rows.length !== 1 ? "s" : ""}`}
                </p>
                <button
                  onClick={openNew}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <Plus size={15} />
                  {lang === "ar" ? "إضافة باقة" : "New Package"}
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                  {lang === "ar" ? "جارٍ التحميل…" : "Loading…"}
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                  {lang === "ar" ? "لا توجد باقات بعد." : "No packages yet."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--admin-hover-bg)]">
                      <tr>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider w-8">
                          {lang === "ar" ? "الترتيب" : "Order"}
                        </th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                          {lang === "ar" ? "الباقة" : "Package"}
                        </th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                          {lang === "ar" ? "السعر" : "Price"}
                        </th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                          {lang === "ar" ? "المدة" : "Duration"}
                        </th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                          {lang === "ar" ? "الحالة" : "Status"}
                        </th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                          {lang === "ar" ? "إجراءات" : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors"
                        >
                          {/* Reorder */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              <button
                                disabled={idx === 0 || reorderingId === row.id}
                                onClick={() => handleReorder(row.id, "up")}
                                className="p-0.5 rounded text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                disabled={idx === sortedRows.length - 1 || reorderingId === row.id}
                                onClick={() => handleReorder(row.id, "down")}
                                className="p-0.5 rounded text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            <p className="font-medium">{row.title_en}</p>
                            {row.title_ar && (
                              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">
                                {row.title_ar}
                              </p>
                            )}
                            {row.badge_en && (
                              <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-pink/10 text-primary-pink">
                                {row.badge_en}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.price != null ? (
                              <span>
                                {row.currency ?? "$"}{row.price}
                                {row.discount_enabled && row.discount_percent ? (
                                  <span className="ms-1.5 text-[11px] text-emerald-600 font-semibold">
                                    -{row.discount_percent}%
                                  </span>
                                ) : null}
                              </span>
                            ) : "—"}
                          </td>

                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.duration_en || "—"}
                          </td>

                          <td className="py-3 px-4 text-[13px]">
                            {row.active ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                                {lang === "ar" ? "نشط" : "Active"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                                {lang === "ar" ? "مخفي" : "Hidden"}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(row)}
                                className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                              >
                                <Pencil size={12} /> {lang === "ar" ? "تعديل" : "Edit"}
                              </button>
                              <button
                                onClick={() => handleDelete(row.id)}
                                disabled={deletingId === row.id}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                {deletingId === row.id ? "…" : (lang === "ar" ? "حذف" : "Delete")}
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
        /* ── EDIT / CREATE FORM ───────────────────────────────────────────── */
          <motion.div key="edit" {...fadeUp()}>
            {/* Top action row */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={cancel}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <ArrowLeft size={13} className="rtl:rotate-180" />
                {lang === "ar" ? "رجوع" : "Back"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancel}
                  className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                >
                  <X size={13} className="inline me-1" />
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving
                    ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…")
                    : editing
                    ? (lang === "ar" ? "حفظ التغييرات" : "Save Changes")
                    : (lang === "ar" ? "إنشاء باقة" : "Create Package")}
                </button>
              </div>
            </div>

            {/* Save error banner */}
            {saveError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
                <span className="font-semibold">⚠</span> {saveError}
              </div>
            )}

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing
                    ? (lang === "ar" ? "تعديل الباقة" : "Edit Package")
                    : (lang === "ar" ? "باقة جديدة" : "New Package")}
                </h2>
              </div>

              <div className="p-6 space-y-6">

                {/* ── Titles ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Title (EN)</label>
                    <input value={form.title_en} onChange={(e) => set("title_en", e.target.value)} className={inp} placeholder="e.g. Single Diagnostic Session" />
                  </div>
                  <div>
                    <label className={lbl}>Title (AR)</label>
                    <input dir="rtl" value={form.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} className={inp} placeholder="مثال: جلسة تشخيصية واحدة" />
                  </div>
                </div>

                {/* ── Subtitles ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Subtitle (EN) <span className="font-normal normal-case opacity-60">— optional</span></label>
                    <input value={form.subtitle_en ?? ""} onChange={(e) => set("subtitle_en", e.target.value)} className={inp} placeholder="Short tagline in English" />
                  </div>
                  <div>
                    <label className={lbl}>Subtitle (AR)</label>
                    <input dir="rtl" value={form.subtitle_ar ?? ""} onChange={(e) => set("subtitle_ar", e.target.value)} className={inp} placeholder="الشعار القصير بالعربية" />
                  </div>
                </div>

                {/* ── Badge ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Badge (EN) <span className="font-normal normal-case opacity-60">— also marks this as the featured card</span></label>
                    <input value={form.badge_en ?? ""} onChange={(e) => set("badge_en", e.target.value)} className={inp} placeholder='e.g. Most Popular' />
                  </div>
                  <div>
                    <label className={lbl}>Badge (AR)</label>
                    <input dir="rtl" value={form.badge_ar ?? ""} onChange={(e) => set("badge_ar", e.target.value)} className={inp} placeholder='مثال: الأكثر طلبًا' />
                  </div>
                </div>

                {/* ── Description ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Description (EN) <span className="font-normal normal-case opacity-60">— optional</span></label>
                    <textarea rows={3} value={form.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} className={`${inp} resize-y`} placeholder="Package description in English…" />
                  </div>
                  <div>
                    <label className={lbl}>Description (AR)</label>
                    <textarea dir="rtl" rows={3} value={form.description_ar ?? ""} onChange={(e) => set("description_ar", e.target.value)} className={`${inp} resize-y`} placeholder="وصف الباقة بالعربية…" />
                  </div>
                </div>

                {/* ── Features ──────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Features (EN)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">One feature per line</p>
                    <textarea rows={5} value={featuresEnText} onChange={(e) => setFeaturesEnText(e.target.value)} className={`${inp} resize-y`} placeholder={"Personalized nutrition plan\nWeekly check-ins\nDirect messaging support"} />
                  </div>
                  <div>
                    <label className={lbl}>Features (AR)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">ميزة واحدة في كل سطر</p>
                    <textarea dir="rtl" rows={5} value={featuresArText} onChange={(e) => setFeaturesArText(e.target.value)} className={`${inp} resize-y`} placeholder={"خطة تغذية شخصية\nمتابعة أسبوعية\nدعم مباشر عبر الرسائل"} />
                  </div>
                </div>

                {/* ── CTA ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>CTA Button Text (EN)</label>
                    <input value={form.cta_text_en ?? ""} onChange={(e) => set("cta_text_en", e.target.value)} className={inp} placeholder='e.g. Book Now' />
                  </div>
                  <div>
                    <label className={lbl}>CTA Button Text (AR)</label>
                    <input dir="rtl" value={form.cta_text_ar ?? ""} onChange={(e) => set("cta_text_ar", e.target.value)} className={inp} placeholder='مثال: احجزي الآن' />
                  </div>
                </div>

                {/* ── Pricing & Timing ──────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Pricing & Timing</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

                    <div>
                      <label className={lbl}>Price</label>
                      <input type="number" min={0} value={form.price ?? ""} onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))} className={inp} placeholder="e.g. 120" />
                    </div>

                    <div>
                      <label className={lbl}>Currency Symbol</label>
                      <input value={form.currency ?? "$"} onChange={(e) => set("currency", e.target.value)} className={inp} placeholder="$" maxLength={5} />
                    </div>

                    <div>
                      <label className={lbl}>Period (EN) <span className="font-normal normal-case opacity-60">— e.g. "one-time"</span></label>
                      <input value={form.period_en ?? ""} onChange={(e) => set("period_en", e.target.value)} className={inp} placeholder="one-time" />
                    </div>

                    <div>
                      <label className={lbl}>Period (AR)</label>
                      <input dir="rtl" value={form.period_ar ?? ""} onChange={(e) => set("period_ar", e.target.value)} className={inp} placeholder="دفعة واحدة" />
                    </div>

                    <div>
                      <label className={lbl}>Duration (EN) <span className="font-normal normal-case opacity-60">— e.g. "45 minutes"</span></label>
                      <input value={form.duration_en ?? ""} onChange={(e) => set("duration_en", e.target.value)} className={inp} placeholder="45 minutes" />
                    </div>

                    <div>
                      <label className={lbl}>Duration (AR)</label>
                      <input dir="rtl" value={form.duration_ar ?? ""} onChange={(e) => set("duration_ar", e.target.value)} className={inp} placeholder="٤٥ دقيقة" />
                    </div>
                  </div>
                </div>

                {/* ── Appearance ────────────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Appearance &amp; Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

                    <div>
                      <label className={lbl}>Icon</label>
                      <select value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value)} className={inp + " cursor-pointer"}>
                        <option value="">None</option>
                        {ICON_OPTIONS.map((ic) => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>Gradient</label>
                      <select value={form.gradient ?? ""} onChange={(e) => set("gradient", e.target.value)} className={inp + " cursor-pointer"}>
                        {GRADIENT_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={lbl}>Sort Order</label>
                      <input type="number" min={0} value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} className={inp} />
                    </div>

                    <div className="flex items-center gap-3 pt-5">
                      <input
                        id="consult-active"
                        type="checkbox"
                        checked={form.active ?? false}
                        onChange={(e) => set("active", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor="consult-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        Active (visible on site)
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── Discount ──────────────────────────────────────────── */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Discount</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        id="discount-enabled"
                        type="checkbox"
                        checked={form.discount_enabled ?? false}
                        onChange={(e) => set("discount_enabled", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor="discount-enabled" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        Enable Discount
                      </label>
                    </div>

                    {form.discount_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className={lbl}>Discount % <span className="font-normal normal-case opacity-60">(0 – 100)</span></label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={form.discount_percent ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") { set("discount_percent", null); return; }
                              const n = Number(raw);
                              if (isNaN(n)) return;
                              set("discount_percent", Math.min(100, Math.max(0, n)));
                            }}
                            className={inp}
                            placeholder="e.g. 10"
                          />
                        </div>
                        <div>
                          <label className={lbl}>Final Price Preview</label>
                          <div className={`${inp} flex items-center gap-2 bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold`}>
                            {finalPrice != null ? (
                              <>
                                <span className="line-through opacity-50 font-normal text-[12px]">
                                  {form.currency ?? "$"}{form.price}
                                </span>
                                <span>{form.currency ?? "$"}{finalPrice}</span>
                              </>
                            ) : (
                              <span className="text-[var(--admin-text-faint)] font-normal">
                                Enter price &amp; discount %
                              </span>
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
