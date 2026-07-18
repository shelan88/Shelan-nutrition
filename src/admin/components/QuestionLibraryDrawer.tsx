/**
 * QuestionLibraryDrawer — v2
 *
 * Slide-in panel for importing questions from the Question Library
 * directly into the Assessment Question Builder.
 *
 * Shows two collapsible sections:
 *   📚 System Library  — 44 read-only questions
 *   ⭐ My Library      — admin-created questions, filterable by folder
 *
 * Props:
 *   open     — visibility
 *   onClose  — close callback
 *   onInsert — called with selected LibraryQuestion[]
 *   isAr     — language flag
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Filter, BookOpen, Star, Plus, Check, Folder, ChevronDown,
  Type, AlignLeft, ToggleRight, List, CheckSquare,
  Hash, Calendar, Paperclip, Image as ImageIcon,
} from "lucide-react";
import {
  getSystemLibraryQuestions,
  getMyLibraryQuestions,
  getMyLibraryFolders,
  LIBRARY_CATEGORIES,
  CATEGORY_STYLES,
} from "@/admin/repositories/question-library.repository";
import type {
  LibraryQuestion,
  LibraryCategory,
  MyLibraryFolder,
} from "@/admin/repositories/question-library.repository";
import type { QuestionType } from "@/types/database.types";

// Re-export so consumers don't need a separate import
export type { LibraryQuestion };

// ─── Type badge data ──────────────────────────────────────────────────────────

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

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (questions: LibraryQuestion[]) => void;
  isAr: boolean;
}

export default function QuestionLibraryDrawer({ open, onClose, onInsert, isAr }: Props) {
  // ── Data
  const [sysQuestions, setSysQuestions] = useState<LibraryQuestion[]>([]);
  const [myQuestions,  setMyQuestions]  = useState<LibraryQuestion[]>([]);
  const [folders,      setFolders]      = useState<MyLibraryFolder[]>([]);
  const [loading, setLoading]           = useState(false);

  // ── Filters (shared across both sections)
  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState<LibraryCategory | "all">("all");
  const [typeFilter,    setTypeFilter]    = useState<QuestionType | "all">("all");

  // ── My Library folder filter
  const [folderFilter, setFolderFilter]  = useState<string>("all");

  // ── Section collapse
  const [sysOpen, setSysOpen]            = useState(true);
  const [myOpen,  setMyOpen]             = useState(true);

  // ── Selection
  const [selected, setSelected]          = useState<Set<string>>(new Set());
  const [inserting, setInserting]        = useState(false);

  // Load on open
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(new Set());
    setSearch("");
    setCatFilter("all");
    setTypeFilter("all");
    setFolderFilter("all");

    Promise.all([
      Promise.resolve(getSystemLibraryQuestions()),
      getMyLibraryQuestions(),
      getMyLibraryFolders(),
    ]).then(([sys, my, fol]) => {
      setSysQuestions(sys);
      setMyQuestions(my);
      setFolders(fol);
      setLoading(false);
    });
  }, [open]);

  // ── Filtered system questions
  const sysFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sysQuestions.filter((lq) => {
      const mc = catFilter === "all" || lq.category === catFilter;
      const mt = typeFilter === "all" || lq.type === typeFilter;
      const ms = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return mc && mt && ms;
    });
  }, [sysQuestions, search, catFilter, typeFilter]);

  // ── Filtered my library questions
  const myFiltered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return myQuestions.filter((lq) => {
      const mc = catFilter === "all" || lq.category === catFilter;
      const mt = typeFilter === "all" || lq.type === typeFilter;
      const mf = folderFilter === "all"
        ? true
        : folderFilter === "__uncat__"
        ? !lq.folderId
        : lq.folderId === folderFilter;
      const ms = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return mc && mt && mf && ms;
    });
  }, [myQuestions, search, catFilter, typeFilter, folderFilter]);

  const allFiltered = useMemo(() => [...sysFiltered, ...myFiltered], [sysFiltered, myFiltered]);

  // ── Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected(new Set(allFiltered.map((q) => q.id)));
  }

  function deselectAll() { setSelected(new Set()); }

  const allSelected = allFiltered.length > 0 && selected.size >= allFiltered.length;

  // ── Insert helpers
  async function handleInsert() {
    const all = [...sysQuestions, ...myQuestions];
    const toInsert = all.filter((q) => selected.has(q.id));
    if (!toInsert.length) return;
    setInserting(true);
    await onInsert(toInsert);
    setInserting(false);
    onClose();
  }

  async function handleInsertOne(lq: LibraryQuestion) {
    setInserting(true);
    await onInsert([lq]);
    setInserting(false);
    onClose();
  }

  const hasUncat = myQuestions.some((q) => !q.folderId);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 250 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--admin-surface)] shadow-2xl z-50 flex flex-col overflow-hidden border-l border-[var(--admin-border)]"
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
                  <BookOpen size={14} className="text-primary-pink" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[var(--admin-text)] leading-none">
                    {isAr ? "استيراد من المكتبة" : "Import from Library"}
                  </h2>
                  <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                    {isAr ? "اختاري الأسئلة لإضافتها إلى القالب" : "Pick questions to add to this template"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* ── Filters ───────────────────────────────────────────────── */}
            <div className="px-4 py-3 border-b border-[var(--admin-border)] space-y-2.5 shrink-0 bg-[var(--admin-hover-bg)]">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAr ? "ابحثي في المكتبتين…" : "Search both libraries…"}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                />
              </div>

              {/* Category + Type */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] pointer-events-none" />
                  <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as LibraryCategory | "all")}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer appearance-none">
                    <option value="all">{isAr ? "كل الفئات" : "All Categories"}</option>
                    {LIBRARY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
                    ))}
                  </select>
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as QuestionType | "all")}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer">
                  <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
                  {Object.entries(TYPE_META).map(([v, m]) => (
                    <option key={v} value={v}>{isAr ? m.labelAr : m.label}</option>
                  ))}
                </select>
              </div>

              {/* My Library folder filter (only when my section open) */}
              {myOpen && myQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wide">
                    {isAr ? "مجلد:" : "Folder:"}
                  </span>
                  <button onClick={() => setFolderFilter("all")}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${folderFilter === "all" ? "bg-primary-pink text-white" : "bg-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]"}`}>
                    {isAr ? "الكل" : "All"}
                  </button>
                  {folders.map((f) => (
                    <button key={f.id} onClick={() => setFolderFilter(f.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${folderFilter === f.id ? "bg-violet-500 text-white" : "bg-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]"}`}>
                      <Folder size={9} />
                      {isAr ? f.nameAr : f.name}
                    </button>
                  ))}
                  {hasUncat && (
                    <button onClick={() => setFolderFilter("__uncat__")}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${folderFilter === "__uncat__" ? "bg-violet-500 text-white" : "bg-[var(--admin-border)] text-[var(--admin-text-muted)]"}`}>
                      {isAr ? "بدون مجلد" : "No folder"}
                    </button>
                  )}
                </div>
              )}

              {/* Select-all row */}
              {allFiltered.length > 0 && (
                <div className="flex items-center justify-between text-[12px]">
                  <button onClick={allSelected ? deselectAll : selectAllFiltered}
                    className="flex items-center gap-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${allSelected ? "bg-primary-pink border-primary-pink" : "border-[var(--admin-border)]"}`}>
                      {allSelected && <Check size={10} className="text-white" />}
                    </span>
                    {allSelected
                      ? (isAr ? "إلغاء الكل" : "Deselect all")
                      : (isAr ? `تحديد الكل (${allFiltered.length})` : `Select all ${allFiltered.length}`)}
                  </button>
                  <span className="text-[var(--admin-text-faint)]">
                    {allFiltered.length} {isAr ? "سؤال" : "questions"}
                  </span>
                </div>
              )}
            </div>

            {/* ── Question list ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                  {isAr ? "جارٍ التحميل…" : "Loading…"}
                </div>
              ) : (
                <>
                  {/* ── System Library section */}
                  <SectionHeader
                    icon={<BookOpen size={13} className="text-blue-500" />}
                    title={isAr ? "مكتبة النظام" : "System Library"}
                    count={sysFiltered.length}
                    open={sysOpen}
                    onToggle={() => setSysOpen((v) => !v)}
                    badge="blue"
                  />
                  {sysOpen && (
                    <div className="divide-y divide-[var(--admin-border)]">
                      {sysFiltered.length === 0 ? (
                        <p className="px-4 py-4 text-[12px] text-[var(--admin-text-faint)]">
                          {isAr ? "لا توجد نتائج" : "No matches"}
                        </p>
                      ) : (
                        sysFiltered.map((lq) => (
                          <QuestionRow
                            key={lq.id}
                            lq={lq}
                            isAr={isAr}
                            selected={selected.has(lq.id)}
                            onToggle={() => toggleSelect(lq.id)}
                            onInsertOne={() => handleInsertOne(lq)}
                            inserting={inserting}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* ── My Library section */}
                  <SectionHeader
                    icon={<Star size={13} className="text-amber-500 fill-amber-400" />}
                    title={isAr ? "مكتبتي" : "My Library"}
                    count={myFiltered.length}
                    open={myOpen}
                    onToggle={() => setMyOpen((v) => !v)}
                    badge="amber"
                  />
                  {myOpen && (
                    <div className="divide-y divide-[var(--admin-border)]">
                      {myFiltered.length === 0 ? (
                        <p className="px-4 py-4 text-[12px] text-[var(--admin-text-faint)]">
                          {myQuestions.length === 0
                            ? (isAr ? "مكتبتك فارغة" : "My Library is empty")
                            : (isAr ? "لا توجد نتائج" : "No matches")}
                        </p>
                      ) : (
                        myFiltered.map((lq) => (
                          <QuestionRow
                            key={lq.id}
                            lq={lq}
                            isAr={isAr}
                            selected={selected.has(lq.id)}
                            onToggle={() => toggleSelect(lq.id)}
                            onInsertOne={() => handleInsertOne(lq)}
                            inserting={inserting}
                            myLibrary
                          />
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] shrink-0">
              {selected.size === 0 ? (
                <p className="text-[12px] text-center text-[var(--admin-text-faint)]">
                  {isAr ? "اختاري سؤالاً أو أكثر للإضافة" : "Select one or more questions to insert"}
                </p>
              ) : (
                <button
                  onClick={handleInsert}
                  disabled={inserting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-70"
                >
                  {inserting
                    ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    : <Plus size={15} />}
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, count, open, onToggle, badge,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  badge: "blue" | "amber";
}) {
  const badgeCls = badge === "blue"
    ? "bg-blue-50 text-blue-600 ring-blue-200"
    : "bg-amber-50 text-amber-600 ring-amber-200";

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--admin-hover-bg)] border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)] transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-bold text-[var(--admin-text)]">{title}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${badgeCls}`}>
          {count}
        </span>
      </div>
      <ChevronDown
        size={14}
        className={`text-[var(--admin-text-faint)] transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({
  lq, isAr, selected, onToggle, onInsertOne, inserting, myLibrary = false,
}: {
  lq: LibraryQuestion;
  isAr: boolean;
  selected: boolean;
  onToggle: () => void;
  onInsertOne: () => void;
  inserting: boolean;
  myLibrary?: boolean;
}) {
  const cat      = LIBRARY_CATEGORIES.find((c) => c.value === lq.category)!;
  const style    = CATEGORY_STYLES[lq.category];
  const typeMeta = TYPE_META[lq.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--admin-hover-bg)] transition-colors cursor-pointer ${selected ? "bg-primary-pink/5" : ""}`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selected ? "bg-primary-pink border-primary-pink" : "border-[var(--admin-border)]"}`}>
        {selected && <Check size={10} className="text-white" />}
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
          {myLibrary && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-amber-600 bg-amber-50">
              <Star size={8} className="fill-amber-400" /> My
            </span>
          )}
          {lq.required && <span className="text-[10px] font-medium text-red-500">*</span>}
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

      {/* Quick insert */}
      <button
        onClick={(e) => { e.stopPropagation(); onInsertOne(); }}
        disabled={inserting}
        title={isAr ? "إضافة هذا السؤال فقط" : "Insert this question only"}
        className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-faint)] hover:bg-primary-pink/10 hover:text-primary-pink transition-colors disabled:opacity-50"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
