/**
 * QuestionLibraryDrawer
 *
 * A slide-in panel that lets admins browse and import questions
 * from the library directly into the Assessment Question Builder.
 *
 * Props:
 *   open       — whether the drawer is visible
 *   onClose    — callback to close the drawer
 *   onInsert   — called with selected LibraryQuestion[]
 *   isAr       — current UI language flag
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Filter, BookOpen, Plus, Check,
  Type, AlignLeft, ToggleRight, List, CheckSquare,
  ChevronDown, Hash, Calendar, Paperclip, Image as ImageIcon,
} from "lucide-react";
import {
  getLibraryQuestions,
  LIBRARY_CATEGORIES,
  CATEGORY_STYLES,
} from "@/admin/repositories/question-library.repository";
import type { LibraryQuestion, LibraryCategory } from "@/admin/repositories/question-library.repository";
import type { QuestionType } from "@/types/database.types";

// ─── Re-export so consumers don't need a separate import ─────────────────────
export type { LibraryQuestion };

// ─── Shared type badge data ───────────────────────────────────────────────────

const TYPE_META: Record<QuestionType, { label: string; labelAr: string; icon: React.ReactNode }> = {
  short_text:      { label: "Short Text",      labelAr: "نص قصير",       icon: <Type size={11} /> },
  paragraph:       { label: "Paragraph",       labelAr: "فقرة",          icon: <AlignLeft size={11} /> },
  yes_no:          { label: "Yes / No",        labelAr: "نعم / لا",      icon: <ToggleRight size={11} /> },
  single_choice:   { label: "Single Choice",   labelAr: "اختيار واحد",   icon: <List size={11} /> },
  multiple_choice: { label: "Multiple Choice", labelAr: "اختيار متعدد",  icon: <CheckSquare size={11} /> },
  dropdown:        { label: "Dropdown",        labelAr: "قائمة منسدلة",  icon: <ChevronDown size={11} /> },
  number:          { label: "Number",          labelAr: "رقم",           icon: <Hash size={11} /> },
  date:            { label: "Date",            labelAr: "تاريخ",         icon: <Calendar size={11} /> },
  file_upload:     { label: "File Upload",     labelAr: "رفع ملف",       icon: <Paperclip size={11} /> },
  image_upload:    { label: "Image Upload",    labelAr: "رفع صورة",      icon: <ImageIcon size={11} /> },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface QuestionLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onInsert: (questions: LibraryQuestion[]) => void;
  isAr: boolean;
}

export default function QuestionLibraryDrawer({
  open,
  onClose,
  onInsert,
  isAr,
}: QuestionLibraryDrawerProps) {
  const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LibraryCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inserting, setInserting] = useState(false);

  // Load on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    getLibraryQuestions().then((data) => {
      setQuestions(data);
      setLoading(false);
    });
  }, [open]);

  // ── Filtered list ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return questions.filter((lq) => {
      const matchCat = categoryFilter === "all" || lq.category === categoryFilter;
      const matchType = typeFilter === "all" || lq.type === typeFilter;
      const matchSearch = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return matchCat && matchType && matchSearch;
    });
  }, [questions, search, categoryFilter, typeFilter]);

  // ── Selection ──────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((q) => q.id)));
    }
  }

  // ── Insert ─────────────────────────────────────────────────────────────

  async function handleInsert() {
    const toInsert = questions.filter((q) => selected.has(q.id));
    if (!toInsert.length) return;
    setInserting(true);
    await onInsert(toInsert);
    setInserting(false);
    onClose();
  }

  // ── Insert single (quick action) ───────────────────────────────────────

  async function handleInsertOne(lq: LibraryQuestion) {
    setInserting(true);
    await onInsert([lq]);
    setInserting(false);
    onClose();
  }

  const allFilteredSelected = filtered.length > 0 && selected.size >= filtered.length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 250 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--admin-surface)] shadow-2xl z-50 flex flex-col overflow-hidden border-l border-[var(--admin-border)]"
          >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
                  <BookOpen size={14} className="text-primary-pink" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[var(--admin-text)] leading-none">
                    {isAr ? "مكتبة الأسئلة" : "Question Library"}
                  </h2>
                  <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                    {isAr ? "اختاري الأسئلة لإضافتها إلى القالب" : "Pick questions to add to this template"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Filters ─────────────────────────────────────────────── */}
            <div className="px-4 py-3 border-b border-[var(--admin-border)] space-y-2.5 shrink-0 bg-[var(--admin-hover-bg)]">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? "ابحثي في المكتبة…" : "Search library…"}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                />
              </div>

              {/* Category + Type */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] pointer-events-none" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as LibraryCategory | "all")}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="all">{isAr ? "كل الفئات" : "All Categories"}</option>
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as QuestionType | "all")}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer"
                >
                  <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
                  {Object.entries(TYPE_META).map(([v, m]) => (
                    <option key={v} value={v}>{isAr ? m.labelAr : m.label}</option>
                  ))}
                </select>
              </div>

              {/* Select-all row */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between text-[12px]">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${allFilteredSelected ? "bg-primary-pink border-primary-pink" : "border-[var(--admin-border)]"}`}>
                      {allFilteredSelected && <Check size={10} className="text-white" />}
                    </span>
                    {allFilteredSelected
                      ? (isAr ? "إلغاء الكل" : "Deselect all")
                      : (isAr ? "تحديد الكل" : `Select all ${filtered.length}`)}
                  </button>
                  <span className="text-[var(--admin-text-faint)]">
                    {filtered.length} {isAr ? "سؤال" : "questions"}
                  </span>
                </div>
              )}
            </div>

            {/* ── Question list ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                  {isAr ? "جارٍ التحميل…" : "Loading…"}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen size={28} className="mx-auto text-[var(--admin-text-faint)] mb-2" />
                  <p className="text-[13px] text-[var(--admin-text-muted)]">
                    {isAr ? "لا توجد نتائج" : "No questions match"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {filtered.map((lq) => {
                    const isSelected = selected.has(lq.id);
                    const cat = LIBRARY_CATEGORIES.find((c) => c.value === lq.category)!;
                    const style = CATEGORY_STYLES[lq.category];
                    const typeMeta = TYPE_META[lq.type];

                    return (
                      <div
                        key={lq.id}
                        className={`flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--admin-hover-bg)] transition-colors cursor-pointer ${isSelected ? "bg-primary-pink/5" : ""}`}
                        onClick={() => toggleSelect(lq.id)}
                      >
                        {/* Checkbox */}
                        <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary-pink border-primary-pink" : "border-[var(--admin-border)]"}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}>
                              {isAr ? cat.labelAr : cat.labelEn}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[var(--admin-text-muted)] bg-[var(--admin-hover-bg)]">
                              {typeMeta?.icon}
                              {isAr ? typeMeta?.labelAr : typeMeta?.label}
                            </span>
                            {lq.required && (
                              <span className="text-[10px] font-medium text-red-500">*</span>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-[var(--admin-text)] leading-snug line-clamp-2">
                            {lq.label_en}
                          </p>
                          {lq.label_ar && (
                            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5 line-clamp-1" dir="rtl">
                              {lq.label_ar}
                            </p>
                          )}
                          {lq.options && lq.options.length > 0 && (
                            <p className="text-[11px] text-[var(--admin-text-faint)] mt-1">
                              {lq.options.slice(0, 3).map((o) => o.label_en).join(" · ")}
                              {lq.options.length > 3 && ` · +${lq.options.length - 3}`}
                            </p>
                          )}
                        </div>

                        {/* Quick insert single */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleInsertOne(lq); }}
                          disabled={inserting}
                          title={isAr ? "إضافة هذا السؤال فقط" : "Insert this question only"}
                          className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-faint)] hover:bg-primary-pink/10 hover:text-primary-pink transition-colors disabled:opacity-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer action bar ────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0">
              {selected.size === 0 ? (
                <p className="text-[12px] text-center text-[var(--admin-text-faint)]">
                  {isAr ? "اختاري سؤالاً واحداً أو أكثر للإضافة" : "Select one or more questions to insert"}
                </p>
              ) : (
                <button
                  onClick={handleInsert}
                  disabled={inserting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-70"
                >
                  {inserting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  {inserting
                    ? (isAr ? "جارٍ الإضافة…" : "Inserting…")
                    : isAr
                    ? `إضافة ${selected.size} ${selected.size === 1 ? "سؤال" : "أسئلة"}`
                    : `Insert ${selected.size} Question${selected.size > 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
