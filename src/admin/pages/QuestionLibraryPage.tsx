/**
 * QuestionLibraryPage
 *
 * A full CRUD interface for managing the reusable question library.
 * Questions are stored as JSON in the website_settings table (no schema changes).
 *
 * Features:
 *  - Search, Category filter, Question Type filter
 *  - Card grid view with category-colour badges
 *  - Create / Edit / Duplicate / Delete questions
 *  - Save As Library Question (from Assessment Builder)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, Copy, X, Save, BookOpen,
  Type, AlignLeft, ToggleRight, List, CheckSquare,
  ChevronDown, Hash, Calendar, Paperclip, Image as ImageIcon,
  Filter, ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import {
  getLibraryQuestions,
  addLibraryQuestion,
  updateLibraryQuestion,
  deleteLibraryQuestion,
  duplicateLibraryQuestion,
  LIBRARY_CATEGORIES,
} from "@/admin/repositories/question-library.repository";
import type { LibraryQuestion, LibraryCategory } from "@/admin/repositories/question-library.repository";
import type { QuestionType } from "@/types/database.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const QUESTION_TYPES: { value: QuestionType; label: string; labelAr: string; icon: React.ReactNode }[] = [
  { value: "short_text",      label: "Short Text",       labelAr: "نص قصير",       icon: <Type size={12} /> },
  { value: "paragraph",       label: "Paragraph",        labelAr: "فقرة",          icon: <AlignLeft size={12} /> },
  { value: "yes_no",          label: "Yes / No",         labelAr: "نعم / لا",      icon: <ToggleRight size={12} /> },
  { value: "single_choice",   label: "Single Choice",    labelAr: "اختيار واحد",   icon: <List size={12} /> },
  { value: "multiple_choice", label: "Multiple Choice",  labelAr: "اختيار متعدد",  icon: <CheckSquare size={12} /> },
  { value: "dropdown",        label: "Dropdown",         labelAr: "قائمة منسدلة",  icon: <ChevronDown size={12} /> },
  { value: "number",          label: "Number",           labelAr: "رقم",           icon: <Hash size={12} /> },
  { value: "date",            label: "Date",             labelAr: "تاريخ",         icon: <Calendar size={12} /> },
  { value: "file_upload",     label: "File Upload",      labelAr: "رفع ملف",       icon: <Paperclip size={12} /> },
  { value: "image_upload",    label: "Image Upload",     labelAr: "رفع صورة",      icon: <ImageIcon size={12} /> },
];

const NEEDS_OPTIONS: QuestionType[] = ["single_choice", "multiple_choice", "dropdown"];

const CATEGORY_STYLES: Record<LibraryCategory, { bg: string; text: string; ring: string }> = {
  basic_info:      { bg: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-200" },
  lipedema:        { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  medical_history: { bg: "bg-purple-50",  text: "text-purple-700",  ring: "ring-purple-200" },
  nutrition:       { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  lifestyle:       { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200" },
};

const INPUT = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const LABEL = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

// ─── Blank question form ──────────────────────────────────────────────────────

interface LibraryQuestionForm {
  category: LibraryCategory;
  type: QuestionType;
  label_en: string;
  label_ar: string;
  placeholder_en: string;
  placeholder_ar: string;
  help_en: string;
  help_ar: string;
  required: boolean;
  validation_note: string;
  options: { label_en: string; label_ar: string; value: string }[];
}

function blankForm(): LibraryQuestionForm {
  return {
    category: "basic_info",
    type: "short_text",
    label_en: "",
    label_ar: "",
    placeholder_en: "",
    placeholder_ar: "",
    help_en: "",
    help_ar: "",
    required: false,
    validation_note: "",
    options: [],
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuestionLibraryPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LibraryCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LibraryQuestionForm>(blankForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getLibraryQuestions();
    setQuestions(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return questions.filter((lq) => {
      const matchCat = categoryFilter === "all" || lq.category === categoryFilter;
      const matchType = typeFilter === "all" || lq.type === typeFilter;
      const matchSearch = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return matchCat && matchType && matchSearch;
    });
  }, [questions, search, categoryFilter, typeFilter]);

  // ── Counts per category (for badges) ────────────────────────────────────

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: questions.length };
    for (const q of questions) counts[q.category] = (counts[q.category] ?? 0) + 1;
    return counts;
  }, [questions]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    setForm(blankForm());
    setShowForm(true);
  }

  function openEdit(q: LibraryQuestion) {
    setEditingId(q.id);
    setForm({
      category: q.category,
      type: q.type,
      label_en: q.label_en,
      label_ar: q.label_ar,
      placeholder_en: q.placeholder_en,
      placeholder_ar: q.placeholder_ar,
      help_en: q.help_en,
      help_ar: q.help_ar,
      required: q.required,
      validation_note: q.validation_note,
      options: q.options ?? [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.label_en.trim()) return;
    setSaving(true);
    if (editingId) {
      await updateLibraryQuestion(editingId, form);
    } else {
      await addLibraryQuestion(form);
    }
    await load();
    setSaving(false);
    closeForm();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isAr ? "حذف هذا السؤال من المكتبة؟" : "Delete this question from the library?")) return;
    setDeletingId(id);
    await deleteLibraryQuestion(id);
    await load();
    setDeletingId(null);
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    await duplicateLibraryQuestion(id);
    await load();
    setDuplicatingId(null);
  }

  // ── Form field helpers ────────────────────────────────────────────────────

  function setField<K extends keyof LibraryQuestionForm>(key: K, value: LibraryQuestionForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addOption() {
    setField("options", [...form.options, { label_en: "", label_ar: "", value: "" }]);
  }

  function removeOption(i: number) {
    setField("options", form.options.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, field: "label_en" | "label_ar" | "value", val: string) {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: val };
    if (field === "label_en" && !opts[i].value) {
      opts[i].value = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }
    setField("options", opts);
  }

  const showOptions = NEEDS_OPTIONS.includes(form.type);
  const typeInfo = (t: QuestionType) => QUESTION_TYPES.find((x) => x.value === t);

  return (
    <div>
      <PageHeader
        title={isAr ? "مكتبة الأسئلة" : "Question Library"}
        description={isAr
          ? "أسئلة قابلة لإعادة الاستخدام عبر جميع قوالب التقييم."
          : "Reusable questions shared across all assessment templates."}
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "مكتبة الأسئلة" : "Question Library" },
        ]}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap"
          >
            <Plus size={15} />
            {isAr ? "إضافة سؤال" : "New Question"}
          </button>
        }
      />

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث عن سؤال…" : "Search questions…"}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LibraryCategory | "all")}
            className="pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer appearance-none"
          >
            <option value="all">{isAr ? "كل الفئات" : "All Categories"} ({catCounts.all ?? 0})</option>
            {LIBRARY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {isAr ? c.labelAr : c.labelEn} ({catCounts[c.value] ?? 0})
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as QuestionType | "all")}
          className="px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer"
        >
          <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
          ))}
        </select>
      </motion.div>

      {/* ── Category pill tabs ────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.04)} className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
            categoryFilter === "all"
              ? "bg-primary-pink text-white shadow-sm"
              : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]"
          }`}
        >
          {isAr ? "الكل" : "All"} · {catCounts.all ?? 0}
        </button>
        {LIBRARY_CATEGORIES.map((c) => {
          const s = CATEGORY_STYLES[c.value];
          const active = categoryFilter === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium ring-1 transition-all ${
                active
                  ? `${s.bg} ${s.text} ${s.ring} shadow-sm`
                  : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"
              }`}
            >
              {isAr ? c.labelAr : c.labelEn} · {catCounts[c.value] ?? 0}
            </button>
          );
        })}
      </motion.div>

      {/* ── Question cards ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-[13px] text-[var(--admin-text-muted)]">
          {isAr ? "جارٍ التحميل…" : "Loading library…"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen size={32} className="mx-auto text-[var(--admin-text-faint)] mb-3" />
          <p className="text-[13px] font-semibold text-[var(--admin-text)]">
            {isAr ? "لا توجد أسئلة مطابقة" : "No questions found"}
          </p>
          <p className="text-[12px] text-[var(--admin-text-muted)] mt-1">
            {isAr ? "جرّبي تغيير الفلاتر أو أضيفي سؤالاً جديداً." : "Try adjusting your filters or add a new question."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lq, i) => {
            const cat = LIBRARY_CATEGORIES.find((c) => c.value === lq.category)!;
            const catStyle = CATEGORY_STYLES[lq.category];
            const type = typeInfo(lq.type);
            return (
              <motion.div
                key={lq.id}
                {...fadeUp(i * 0.02)}
                className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-4 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* Top badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${catStyle.bg} ${catStyle.text} ${catStyle.ring}`}>
                    {isAr ? cat.labelAr : cat.labelEn}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)]">
                    {type?.icon}
                    {isAr ? type?.labelAr : type?.label}
                  </span>
                  {lq.required && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
                      {isAr ? "إلزامي" : "Required"}
                    </span>
                  )}
                </div>

                {/* Labels */}
                <div className="flex-1 min-h-0">
                  <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-snug line-clamp-2">
                    {lq.label_en || <span className="italic text-[var(--admin-text-faint)]">No English label</span>}
                  </p>
                  {lq.label_ar && (
                    <p className="text-[12px] text-[var(--admin-text-muted)] mt-1 line-clamp-1" dir="rtl">
                      {lq.label_ar}
                    </p>
                  )}
                  {lq.help_en && (
                    <p className="text-[11px] text-[var(--admin-text-faint)] mt-1.5 line-clamp-2 leading-relaxed">
                      {lq.help_en}
                    </p>
                  )}
                  {lq.options && lq.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lq.options.slice(0, 4).map((o, oi) => (
                        <span key={oi} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] border border-[var(--admin-border)]">
                          {o.label_en}
                        </span>
                      ))}
                      {lq.options.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-[var(--admin-text-faint)]">
                          +{lq.options.length - 4} {isAr ? "أخرى" : "more"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--admin-border)]">
                  <button
                    onClick={() => openEdit(lq)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                  >
                    <Pencil size={12} />
                    {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDuplicate(lq.id)}
                    disabled={duplicatingId === lq.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors disabled:opacity-50"
                  >
                    <Copy size={12} />
                    {duplicatingId === lq.id ? "…" : (isAr ? "نسخ" : "Duplicate")}
                  </button>
                  <button
                    onClick={() => handleDelete(lq.id)}
                    disabled={deletingId === lq.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {deletingId === lq.id ? "…" : (isAr ? "حذف" : "Delete")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit slide-in panel ──────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={closeForm}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-[var(--admin-surface)] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
                <h2 className="text-[14px] font-bold text-[var(--admin-text)]">
                  {editingId
                    ? (isAr ? "تعديل السؤال" : "Edit Question")
                    : (isAr ? "سؤال جديد" : "New Library Question")}
                </h2>
                <button onClick={closeForm} className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Category + Type row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>{isAr ? "الفئة" : "Category"} *</label>
                    <select value={form.category} onChange={(e) => setField("category", e.target.value as LibraryCategory)} className={INPUT}>
                      {LIBRARY_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>{isAr ? "نوع السؤال" : "Question Type"} *</label>
                    <select value={form.type} onChange={(e) => setField("type", e.target.value as QuestionType)} className={INPUT}>
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <label className={LABEL}>Label (EN) *</label>
                  <input
                    value={form.label_en}
                    onChange={(e) => setField("label_en", e.target.value)}
                    placeholder="Question label in English"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Label (AR)</label>
                  <input
                    dir="rtl"
                    value={form.label_ar}
                    onChange={(e) => setField("label_ar", e.target.value)}
                    placeholder="نص السؤال بالعربية"
                    className={INPUT}
                  />
                </div>

                {/* Placeholders */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Placeholder (EN)</label>
                    <input
                      value={form.placeholder_en}
                      onChange={(e) => setField("placeholder_en", e.target.value)}
                      placeholder="Hint text in English…"
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Placeholder (AR)</label>
                    <input
                      dir="rtl"
                      value={form.placeholder_ar}
                      onChange={(e) => setField("placeholder_ar", e.target.value)}
                      placeholder="نص تلميحي بالعربية…"
                      className={INPUT}
                    />
                  </div>
                </div>

                {/* Help text */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Help Text (EN)</label>
                    <textarea
                      rows={2}
                      value={form.help_en}
                      onChange={(e) => setField("help_en", e.target.value)}
                      placeholder="Additional guidance…"
                      className={`${INPUT} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Help Text (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={2}
                      value={form.help_ar}
                      onChange={(e) => setField("help_ar", e.target.value)}
                      placeholder="إرشادات إضافية…"
                      className={`${INPUT} resize-none`}
                    />
                  </div>
                </div>

                {/* Validation note */}
                <div>
                  <label className={LABEL}>{isAr ? "ملاحظة التحقق (للمرجع)" : "Validation Note (reference only)"}</label>
                  <input
                    value={form.validation_note}
                    onChange={(e) => setField("validation_note", e.target.value)}
                    placeholder="e.g. 0–10, min 2 characters, required if …"
                    className={INPUT}
                  />
                </div>

                {/* Required toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setField("required", !form.required)}
                    className={`relative w-10 rounded-full transition-colors shrink-0`}
                    style={{ height: "22px", backgroundColor: form.required ? "#f472b6" : "var(--admin-border)" }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                      style={{ width: "18px", height: "18px", left: "2px", transform: form.required ? "translateX(18px)" : "translateX(0)" }}
                    />
                  </button>
                  <span className="text-[13px] text-[var(--admin-text)]">
                    {form.required ? (isAr ? "إلزامي" : "Required") : (isAr ? "اختياري" : "Optional")}
                  </span>
                </div>

                {/* Options (choice types) */}
                {showOptions && (
                  <div className="border border-[var(--admin-border)] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`${LABEL} mb-0`}>{isAr ? "الخيارات" : "Answer Options"}</label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary-pink hover:text-primary-pink/70 transition-colors"
                      >
                        <Plus size={11} /> {isAr ? "إضافة خيار" : "Add Option"}
                      </button>
                    </div>
                    {form.options.length === 0 && (
                      <p className="text-[11px] text-[var(--admin-text-faint)]">
                        {isAr ? "أضف خياراً على الأقل." : "Add at least one option."}
                      </p>
                    )}
                    {form.options.map((opt, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <input
                          value={opt.label_en}
                          onChange={(e) => updateOption(i, "label_en", e.target.value)}
                          placeholder={`Option ${i + 1} EN`}
                          className={INPUT}
                        />
                        <input
                          dir="rtl"
                          value={opt.label_ar}
                          onChange={(e) => updateOption(i, "label_ar", e.target.value)}
                          placeholder={`الخيار ${i + 1} AR`}
                          className={INPUT}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--admin-border)] shrink-0 bg-[var(--admin-surface)]">
                <button
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[13px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.label_en.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving
                    ? (isAr ? "جارٍ الحفظ…" : "Saving…")
                    : editingId
                    ? (isAr ? "حفظ التغييرات" : "Save Changes")
                    : (isAr ? "إضافة إلى المكتبة" : "Add to Library")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
