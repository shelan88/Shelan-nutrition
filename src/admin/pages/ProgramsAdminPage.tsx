import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import {
  getAllPrograms, createProgram, updateProgram, deleteProgram,
} from "@/admin/repositories/programs.repository";
import type { ProgramRow } from "@/types/database.types";
import FileUploadField from "../components/FileUploadField";
import CurrencySelect from "../components/CurrencySelect";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const ICON_OPTIONS = [
  "Salad", "HeartPulse", "Sparkles", "Star", "Heart",
  "Leaf", "Apple", "Dumbbell", "Brain", "Sun",
];

const GRADIENT_OPTIONS = [
  { value: "",                               label_en: "Pink → Purple (default)", label_ar: "وردي → بنفسجي (افتراضي)" },
  { value: "from-emerald-400 to-teal-500",   label_en: "Emerald → Teal",          label_ar: "زمردي → زمردي غامق" },
  { value: "from-blue-400 to-indigo-500",    label_en: "Blue → Indigo",           label_ar: "أزرق → نيلي" },
  { value: "from-amber-400 to-orange-500",   label_en: "Amber → Orange",          label_ar: "عنبري → برتقالي" },
  { value: "from-violet-500 to-purple-600",  label_en: "Violet → Purple",         label_ar: "بنفسجي → أرجواني" },
  { value: "from-rose-400 to-pink-600",      label_en: "Rose → Pink",             label_ar: "وردي داكن → زهري" },
];

const DURATION_UNITS = [
  { value: "minutes",  label_en: "Minutes",  label_ar: "دقائق" },
  { value: "hours",    label_en: "Hours",    label_ar: "ساعات" },
  { value: "days",     label_en: "Days",     label_ar: "أيام" },
  { value: "weeks",    label_en: "Weeks",    label_ar: "أسابيع" },
  { value: "months",   label_en: "Months",   label_ar: "أشهر" },
  { value: "sessions", label_en: "Sessions", label_ar: "جلسات" },
];

const inp = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const lbl = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

type Row = ProgramRow;

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    name_en: "", name_ar: "", subtitle_en: "", subtitle_ar: "",
    short_description_en: "", short_description_ar: "",
    full_description_en: "", full_description_ar: "",
    icon: "Leaf", gradient: "", price: 0, currency: "$",
    duration_weeks: 4, duration_unit: "weeks",
    features_en: [], features_ar: [],
    cta_text_en: "", cta_text_ar: "",
    badge_en: "", badge_ar: "",
    discount_enabled: false, discount_percent: null,
    active: false, sort_order: 0, image_url: "",
  };
}

export default function ProgramsAdminPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [rows,        setRows]        = useState<Row[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState<"list" | "edit">("list");
  const [editing,     setEditing]     = useState<Row | null>(null);
  const [form,        setForm]        = useState(initForm());
  const [featEnText,  setFeatEnText]  = useState("");
  const [featArText,  setFeatArText]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [reorderingId,setReorderingId]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await getAllPrograms());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null); setForm(initForm());
    setFeatEnText(""); setFeatArText("");
    setSaveError(null); setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name_en: row.name_en ?? "", name_ar: row.name_ar ?? "",
      subtitle_en: row.subtitle_en ?? "", subtitle_ar: row.subtitle_ar ?? "",
      short_description_en: row.short_description_en ?? "",
      short_description_ar: row.short_description_ar ?? "",
      full_description_en: row.full_description_en ?? "",
      full_description_ar: row.full_description_ar ?? "",
      icon: row.icon ?? "Leaf", gradient: row.gradient ?? "",
      price: row.price ?? 0, currency: row.currency ?? "$",
      duration_weeks: row.duration_weeks ?? 4,
      duration_unit: row.duration_unit ?? "weeks",
      features_en: row.features_en ?? [], features_ar: row.features_ar ?? [],
      cta_text_en: row.cta_text_en ?? "", cta_text_ar: row.cta_text_ar ?? "",
      badge_en: row.badge_en ?? "", badge_ar: row.badge_ar ?? "",
      discount_enabled: row.discount_enabled ?? false,
      discount_percent: row.discount_percent ?? null,
      active: row.active ?? false, sort_order: row.sort_order ?? 0,
      image_url: row.image_url ?? "",
    });
    setFeatEnText((row.features_en ?? []).join("\n"));
    setFeatArText((row.features_ar ?? []).join("\n"));
    setSaveError(null); setView("edit");
  }

  function cancel() { setView("list"); setEditing(null); setSaveError(null); }

  async function handleSave() {
    setSaving(true); setSaveError(null);
    const payload = {
      ...form,
      features_en: featEnText.split("\n").filter(Boolean),
      features_ar: featArText.split("\n").filter(Boolean),
      discount_percent: form.discount_enabled ? form.discount_percent : null,
    };
    let ok: boolean;
    if (editing) {
      ok = await updateProgram(editing.id, payload);
    } else {
      const created = await createProgram(payload);
      ok = created !== null;
    }
    setSaving(false);
    if (!ok) { setSaveError(ar ? "فشل الحفظ. يرجى المحاولة مرة أخرى." : "Save failed. Please try again."); return; }
    await load(); setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(ar ? "حذف هذا البرنامج؟" : "Delete this program?")) return;
    setDeletingId(id);
    await deleteProgram(id);
    await load(); setDeletingId(null);
  }

  async function handleReorder(id: string, dir: "up" | "down") {
    const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = sorted.findIndex((r) => r.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    setReorderingId(id);
    await Promise.all([
      updateProgram(a.id, { sort_order: b.sort_order ?? swapIdx }),
      updateProgram(b.id, { sort_order: a.sort_order ?? idx }),
    ]);
    await load(); setReorderingId(null);
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  const discountPct = form.discount_percent ?? 0;
  const finalPrice  = form.price != null && form.discount_enabled && discountPct > 0
    ? Math.round(form.price * (1 - discountPct / 100) * 100) / 100 : null;
  const sortedRows = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  /* ─── helpers for labels ─────────────────────────────────────────────────── */
  const L = (en: string, arStr: string) => ar ? arStr : en;

  return (
    <div>
      <PageHeader
        title={L("Programs", "البرامج")}
        description={L("Manage nutrition and wellness programs.", "إدارة البرامج الغذائية والصحية.")}
        breadcrumbs={[
          { label: L("Admin", "الإدارة"), href: "/admin" },
          { label: L("Programs", "البرامج") },
        ]}
      />

      <AnimatePresence mode="wait">
        {/* ── LIST ──────────────────────────────────────────────────────────── */}
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <p className="text-[13px] text-[var(--admin-text-muted)]">
                  {ar ? `${rows.length} برنامج` : `${rows.length} program${rows.length !== 1 ? "s" : ""}`}
                </p>
                <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Plus size={15} />
                  {L("New Program", "برنامج جديد")}
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("Loading…", "جارٍ التحميل…")}</div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("No programs yet.", "لا توجد برامج بعد.")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--admin-hover-bg)]">
                      <tr>
                        {[
                          L("Order","الترتيب"), L("Name","الاسم"),
                          L("Price","السعر"), L("Duration","المدة"),
                          L("Status","الحالة"), L("Actions","إجراءات"),
                        ].map((h) => (
                          <th key={h} className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
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
                            <p className="font-medium">{row.name_en}</p>
                            {row.name_ar && <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{row.name_ar}</p>}
                            {row.badge_en && <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-pink/10 text-primary-pink">{row.badge_en}</span>}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.price != null ? <span>{row.currency ?? "$"}{row.price}{row.discount_enabled && row.discount_percent ? <span className="ms-1.5 text-[11px] text-emerald-600 font-semibold">-{row.discount_percent}%</span> : null}</span> : "—"}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.duration_weeks != null ? `${row.duration_weeks} ${row.duration_unit ?? "weeks"}` : "—"}
                          </td>
                          <td className="py-3 px-4">
                            {row.active
                              ? <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">{L("Active","نشط")}</span>
                              : <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">{L("Inactive","غير نشط")}</span>}
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
            {/* Action row */}
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
                  {saving ? L("Saving…","جارٍ الحفظ…") : editing ? L("Save Changes","حفظ التغييرات") : L("Create Program","إنشاء برنامج")}
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
                  {editing ? L("Edit Program","تعديل البرنامج") : L("New Program","برنامج جديد")}
                </h2>
              </div>

              <div className="p-6 space-y-6">

                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Name (English)","الاسم (بالإنجليزية)")}</label>
                    <input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} className={inp} placeholder={L("Program name in English","اسم البرنامج بالإنجليزية")} />
                  </div>
                  <div>
                    <label className={lbl}>{L("Name (Arabic)","الاسم (بالعربية)")}</label>
                    <input dir="rtl" value={form.name_ar ?? ""} onChange={(e) => set("name_ar", e.target.value)} className={inp} placeholder={L("Program name in Arabic","اسم البرنامج بالعربية")} />
                  </div>
                </div>

                {/* Subtitles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Subtitle (English)","العنوان الفرعي (بالإنجليزية)")} <span className="font-normal normal-case opacity-60">— {L("optional","اختياري")}</span></label>
                    <input value={form.subtitle_en ?? ""} onChange={(e) => set("subtitle_en", e.target.value)} className={inp} placeholder={L("Short tagline","شعار قصير")} />
                  </div>
                  <div>
                    <label className={lbl}>{L("Subtitle (Arabic)","العنوان الفرعي (بالعربية)")}</label>
                    <input dir="rtl" value={form.subtitle_ar ?? ""} onChange={(e) => set("subtitle_ar", e.target.value)} className={inp} placeholder={L("Short tagline in Arabic","شعار قصير بالعربية")} />
                  </div>
                </div>

                {/* Badge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Badge (English)","الشارة (بالإنجليزية)")} <span className="font-normal normal-case opacity-60">— {L('e.g. "Most Popular"','مثال: الأكثر شعبية')}</span></label>
                    <input value={form.badge_en ?? ""} onChange={(e) => set("badge_en", e.target.value)} className={inp} placeholder='Most Popular' />
                  </div>
                  <div>
                    <label className={lbl}>{L("Badge (Arabic)","الشارة (بالعربية)")}</label>
                    <input dir="rtl" value={form.badge_ar ?? ""} onChange={(e) => set("badge_ar", e.target.value)} className={inp} placeholder='الأكثر شعبية' />
                  </div>
                </div>

                {/* Short description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Short Description (English)","الوصف المختصر (بالإنجليزية)")}</label>
                    <textarea rows={2} value={form.short_description_en ?? ""} onChange={(e) => set("short_description_en", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                  <div>
                    <label className={lbl}>{L("Short Description (Arabic)","الوصف المختصر (بالعربية)")}</label>
                    <textarea dir="rtl" rows={2} value={form.short_description_ar ?? ""} onChange={(e) => set("short_description_ar", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                </div>

                {/* Full description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Full Description (English)","الوصف الكامل (بالإنجليزية)")}</label>
                    <textarea rows={4} value={form.full_description_en ?? ""} onChange={(e) => set("full_description_en", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                  <div>
                    <label className={lbl}>{L("Full Description (Arabic)","الوصف الكامل (بالعربية)")}</label>
                    <textarea dir="rtl" rows={4} value={form.full_description_ar ?? ""} onChange={(e) => set("full_description_ar", e.target.value)} className={`${inp} resize-y`} />
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("Features (English)","المميزات (بالإنجليزية)")}</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">{L("One feature per line","ميزة واحدة في كل سطر")}</p>
                    <textarea rows={5} value={featEnText} onChange={(e) => setFeatEnText(e.target.value)} className={`${inp} resize-y`} placeholder={"Personalized meal plan\nWeekly check-ins"} />
                  </div>
                  <div>
                    <label className={lbl}>{L("Features (Arabic)","المميزات (بالعربية)")}</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">{L("One feature per line","ميزة واحدة في كل سطر")}</p>
                    <textarea dir="rtl" rows={5} value={featArText} onChange={(e) => setFeatArText(e.target.value)} className={`${inp} resize-y`} placeholder={"خطة وجبات مخصصة\nمتابعة أسبوعية"} />
                  </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{L("CTA Button (English)","زر الدعوة للعمل (بالإنجليزية)")} <span className="font-normal normal-case opacity-60">— {L("optional","اختياري")}</span></label>
                    <input value={form.cta_text_en ?? ""} onChange={(e) => set("cta_text_en", e.target.value)} className={inp} placeholder={L("e.g. Get Started","مثال: ابدئي الآن")} />
                  </div>
                  <div>
                    <label className={lbl}>{L("CTA Button (Arabic)","زر الدعوة للعمل (بالعربية)")}</label>
                    <input dir="rtl" value={form.cta_text_ar ?? ""} onChange={(e) => set("cta_text_ar", e.target.value)} className={inp} placeholder='ابدئي الآن' />
                  </div>
                </div>

                {/* Settings */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{L("Settings","الإعدادات")}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Icon */}
                    <div>
                      <label className={lbl}>{L("Icon","الأيقونة")}</label>
                      <select value={form.icon ?? "Leaf"} onChange={(e) => set("icon", e.target.value)} className={inp + " cursor-pointer"}>
                        {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>

                    {/* Gradient */}
                    <div>
                      <label className={lbl}>{L("Icon Gradient","تدرج الأيقونة")}</label>
                      <select value={form.gradient ?? ""} onChange={(e) => set("gradient", e.target.value)} className={inp + " cursor-pointer"}>
                        {GRADIENT_OPTIONS.map((g) => <option key={g.value} value={g.value}>{ar ? g.label_ar : g.label_en}</option>)}
                      </select>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className={lbl}>{L("Currency","العملة")}</label>
                      <CurrencySelect value={form.currency ?? "$"} onChange={(s) => set("currency", s)} lang={lang} />
                    </div>

                    {/* Price */}
                    <div>
                      <label className={lbl}>{L("Price","السعر")}</label>
                      <input type="number" min={0} value={form.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} className={inp} />
                    </div>

                    {/* Duration — number + unit */}
                    <div className="sm:col-span-1">
                      <label className={lbl}>{L("Duration","المدة")}</label>
                      <div className="flex gap-2">
                        <input
                          type="number" min={1}
                          value={form.duration_weeks ?? 1}
                          onChange={(e) => set("duration_weeks", Number(e.target.value))}
                          className={`${inp} w-24 shrink-0`}
                        />
                        <select
                          value={form.duration_unit ?? "weeks"}
                          onChange={(e) => set("duration_unit", e.target.value)}
                          className={`${inp} flex-1 cursor-pointer`}
                        >
                          {DURATION_UNITS.map((u) => <option key={u.value} value={u.value}>{ar ? u.label_ar : u.label_en}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className={lbl}>{L("Sort Order","الترتيب")}</label>
                      <input type="number" min={0} value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} className={inp} />
                    </div>
                  </div>

                  {/* Image — full-width row below the grid to avoid column-span whitespace */}
                  <div className="mt-4">
                    <label className={lbl}>{L("Image","الصورة")}</label>
                    <FileUploadField value={form.image_url ?? ""} onChange={(url) => set("image_url", url)} folder="programs" />
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-3 mt-4">
                    <input id="prog-active" type="checkbox" checked={form.active ?? false} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-pink-500 rounded cursor-pointer" />
                    <label htmlFor="prog-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                      {L("Active (visible on site)","نشط (مرئي على الموقع)")}
                    </label>
                  </div>
                </div>

                {/* Discount */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{L("Discount","الخصم")}</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input id="prog-discount" type="checkbox" checked={form.discount_enabled ?? false} onChange={(e) => set("discount_enabled", e.target.checked)} className="w-4 h-4 accent-pink-500 rounded cursor-pointer" />
                      <label htmlFor="prog-discount" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        {L("Enable Discount","تفعيل الخصم")}
                      </label>
                    </div>

                    {form.discount_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className={lbl}>{L("Discount %","نسبة الخصم %")} <span className="font-normal normal-case opacity-60">(0 – 100)</span></label>
                          <input type="number" min={0} max={100} value={form.discount_percent ?? ""} onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") { set("discount_percent", null); return; }
                            const n = Number(raw);
                            if (!isNaN(n)) set("discount_percent", Math.min(100, Math.max(0, n)));
                          }} className={inp} placeholder="10" />
                        </div>
                        <div>
                          <label className={lbl}>{L("Final Price Preview","معاينة السعر النهائي")}</label>
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
