/**
 * QuestionLibraryPage — v2
 *
 * Two-tab interface:
 *   📚 System Library  — 44 read-only default questions; "Customize" clones to My Library
 *   ⭐ My Library      — Admin-created questions with folder organisation and full CRUD
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, Copy, X, Save,
  BookOpen, Star, Wand2, FolderPlus, Folder, FolderOpen,
  Type, AlignLeft, ToggleRight, List, CheckSquare,
  ChevronDown, Hash, Calendar, Paperclip, Image as ImageIcon,
  Filter, Check, MoveRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import {
  getSystemLibraryQuestions,
  getMyLibraryQuestions,
  getMyLibraryFolders,
  addMyLibraryQuestion,
  updateMyLibraryQuestion,
  deleteMyLibraryQuestion,
  duplicateMyLibraryQuestion,
  moveQuestionToFolder,
  addMyLibraryFolder,
  updateMyLibraryFolder,
  deleteMyLibraryFolder,
  LIBRARY_CATEGORIES,
  CATEGORY_STYLES,
} from "@/admin/repositories/question-library.repository";
import {
  countTemplateUsesOfLibraryQuestion,
  updateTemplateQuestionsFromLibrary,
} from "@/admin/repositories/assessment-templates.repository";
import type {
  LibraryQuestion,
  LibraryCategory,
  MyLibraryFolder,
} from "@/admin/repositories/question-library.repository";
import type { QuestionType } from "@/types/database.types";

// ─── Shared constants ─────────────────────────────────────────────────────────

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

const INPUT  = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const LABEL  = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

// ─── Form types ───────────────────────────────────────────────────────────────

interface QuestionFormState {
  category: LibraryCategory;
  folderId: string;
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

function blankForm(folderId = ""): QuestionFormState {
  return {
    category: "basic_info", folderId, type: "short_text",
    label_en: "", label_ar: "", placeholder_en: "", placeholder_ar: "",
    help_en: "", help_ar: "", required: false, validation_note: "", options: [],
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuestionLibraryPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [tab, setTab] = useState<"system" | "my">("system");

  // ── System Library state
  const [sysQuestions] = useState<LibraryQuestion[]>(() => getSystemLibraryQuestions());
  const [sysSearch, setSysSearch]         = useState("");
  const [sysCat, setSysCat]               = useState<LibraryCategory | "all">("all");
  const [sysType, setSysType]             = useState<QuestionType | "all">("all");
  const [customizingQ, setCustomizingQ]   = useState<LibraryQuestion | null>(null);

  // ── My Library state
  const [myQuestions, setMyQuestions]     = useState<LibraryQuestion[]>([]);
  const [myFolders, setMyFolders]         = useState<MyLibraryFolder[]>([]);
  const [myLoading, setMyLoading]         = useState(false);
  const [mySearch, setMySearch]           = useState("");
  const [myFolderFilter, setMyFolderFilter] = useState<string>("all");
  const [myType, setMyType]               = useState<QuestionType | "all">("all");

  // ── Form (create / edit / customize)
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [form, setForm]                   = useState<QuestionFormState>(blankForm());
  const [saving, setSaving]               = useState(false);

  // ── Folder management
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderAr, setNewFolderAr]     = useState("");
  const [renamingId, setRenamingId]       = useState<string | null>(null);
  const [renameName, setRenameName]       = useState("");
  const [renameAr, setRenameAr]           = useState("");

  // ── Moving question to folder
  const [movingId, setMovingId]           = useState<string | null>(null);

  // ── Safety guardrail: warn when editing a My Library question used in templates
  const [safetyDialog, setSafetyDialog]   = useState<{ count: number; payload: Record<string, unknown> } | null>(null);
  const [safetyChoosing, setSafetyChoosing] = useState(false);

  // ── Inline toast
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ── Load My Library
  const loadMy = useCallback(async () => {
    setMyLoading(true);
    const [qs, folders] = await Promise.all([getMyLibraryQuestions(), getMyLibraryFolders()]);
    setMyQuestions(qs);
    setMyFolders(folders);
    setMyLoading(false);
  }, []);

  useEffect(() => { loadMy(); }, [loadMy]);

  // ── System Library filtered
  const sysFiltered = useMemo(() => {
    const q = sysSearch.toLowerCase().trim();
    return sysQuestions.filter((lq) => {
      const mc = sysCat === "all" || lq.category === sysCat;
      const mt = sysType === "all" || lq.type === sysType;
      const ms = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return mc && mt && ms;
    });
  }, [sysQuestions, sysSearch, sysCat, sysType]);

  const sysCounts = useMemo(() => {
    const c: Record<string, number> = { all: sysQuestions.length };
    for (const q of sysQuestions) c[q.category] = (c[q.category] ?? 0) + 1;
    return c;
  }, [sysQuestions]);

  // ── My Library filtered
  const myFiltered = useMemo(() => {
    const q = mySearch.toLowerCase().trim();
    return myQuestions.filter((lq) => {
      const mf = myFolderFilter === "all"
        ? true
        : myFolderFilter === "uncategorised"
        ? !lq.folderId
        : lq.folderId === myFolderFilter;
      const mt = myType === "all" || lq.type === myType;
      const ms = !q || lq.label_en.toLowerCase().includes(q) || lq.label_ar.includes(q);
      return mf && mt && ms;
    });
  }, [myQuestions, mySearch, myFolderFilter, myType]);

  const myFolderCounts = useMemo(() => {
    const c: Record<string, number> = { all: myQuestions.length, uncategorised: 0 };
    for (const q of myQuestions) {
      if (!q.folderId) c.uncategorised++;
      else c[q.folderId] = (c[q.folderId] ?? 0) + 1;
    }
    return c;
  }, [myQuestions]);

  // ─── Form helpers ─────────────────────────────────────────────────────────

  function setF<K extends keyof QuestionFormState>(key: K, value: QuestionFormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addOption() {
    setF("options", [...form.options, { label_en: "", label_ar: "", value: "" }]);
  }

  function removeOption(i: number) {
    setF("options", form.options.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, field: "label_en" | "label_ar" | "value", val: string) {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: val };
    if (field === "label_en" && !opts[i].value) {
      opts[i].value = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }
    setF("options", opts);
  }

  // ─── Actions — System Library ─────────────────────────────────────────────

  function startCustomize(q: LibraryQuestion) {
    setCustomizingQ(q);
    setEditingId(null);
    setForm({
      category: q.category,
      folderId: "",
      type: q.type,
      label_en: q.label_en,
      label_ar: q.label_ar,
      placeholder_en: q.placeholder_en,
      placeholder_ar: q.placeholder_ar,
      help_en: q.help_en,
      help_ar: q.help_ar,
      required: q.required,
      validation_note: q.validation_note,
      options: q.options.map((o) => ({ ...o })),
    });
    setTab("my");
    setShowForm(true);
  }

  // ─── Actions — My Library ────────────────────────────────────────────────

  function openNew() {
    setEditingId(null);
    setCustomizingQ(null);
    setForm(blankForm(myFolderFilter !== "all" && myFolderFilter !== "uncategorised" ? myFolderFilter : ""));
    setShowForm(true);
  }

  function openEdit(q: LibraryQuestion) {
    setEditingId(q.id);
    setCustomizingQ(null);
    setForm({
      category: q.category,
      folderId: q.folderId ?? "",
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
    setCustomizingQ(null);
  }

  async function handleSave() {
    if (!form.label_en.trim()) return;
    setSaving(true);
    const payload = {
      category: form.category,
      folderId: form.folderId || undefined,
      type: form.type,
      label_en: form.label_en,
      label_ar: form.label_ar,
      placeholder_en: form.placeholder_en,
      placeholder_ar: form.placeholder_ar,
      help_en: form.help_en,
      help_ar: form.help_ar,
      required: form.required,
      validation_note: form.validation_note,
      options: form.options,
    };
    if (customizingQ) {
      // Save the edited payload (not the original system question) into My Library
      await addMyLibraryQuestion({ ...payload, isDefault: false });
      showToast(isAr ? "تم حفظ نسختك في مكتبتي" : "Personal copy saved to My Library");
    } else if (editingId) {
      // ── Safety guardrail: check how many template questions came from this library question
      const usedCount = await countTemplateUsesOfLibraryQuestion(editingId);
      if (usedCount > 0) {
        setSafetyDialog({ count: usedCount, payload: payload as Record<string, unknown> });
        setSaving(false);
        return; // halt — user must choose in the dialog
      }
      await updateMyLibraryQuestion(editingId, payload);
      showToast(isAr ? "تم تحديث السؤال" : "Question updated");
    } else {
      await addMyLibraryQuestion(payload);
      showToast(isAr ? "تمت إضافة السؤال" : "Question added to My Library");
    }
    await loadMy();
    setSaving(false);
    closeForm();
  }

  async function handleSafetyConfirm(updateTemplates: boolean) {
    if (!safetyDialog || !editingId) return;
    setSafetyChoosing(true);
    const payload = safetyDialog.payload;
    await updateMyLibraryQuestion(editingId, payload as Parameters<typeof updateMyLibraryQuestion>[1]);
    if (updateTemplates) {
      await updateTemplateQuestionsFromLibrary(editingId, {
        type: payload.type as Parameters<typeof updateTemplateQuestionsFromLibrary>[1]["type"],
        label_en: payload.label_en as string,
        label_ar: (payload.label_ar as string) || null,
        placeholder_en: (payload.placeholder_en as string) || null,
        placeholder_ar: (payload.placeholder_ar as string) || null,
        help_en: (payload.help_en as string) || null,
        help_ar: (payload.help_ar as string) || null,
        required: payload.required as boolean,
      });
      showToast(isAr ? "تم تحديث السؤال وجميع القوالب المرتبطة" : "Question and all linked templates updated");
    } else {
      showToast(isAr ? "تم تحديث السؤال — القوالب الموجودة لم تتغير" : "Question updated — existing templates unchanged");
    }
    setSafetyDialog(null);
    setSafetyChoosing(false);
    await loadMy();
    closeForm();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isAr ? "حذف هذا السؤال من مكتبتي؟" : "Delete this question from My Library?")) return;
    await deleteMyLibraryQuestion(id);
    await loadMy();
    showToast(isAr ? "تم الحذف" : "Deleted", true);
  }

  async function handleDuplicate(id: string) {
    await duplicateMyLibraryQuestion(id);
    await loadMy();
    showToast(isAr ? "تم النسخ" : "Duplicated");
  }

  async function handleMove(questionId: string, folderId: string | undefined) {
    await moveQuestionToFolder(questionId, folderId);
    setMovingId(null);
    await loadMy();
    showToast(isAr ? "تم النقل" : "Moved");
  }

  // ─── Folder actions ───────────────────────────────────────────────────────

  async function handleAddFolder() {
    if (!newFolderName.trim()) return;
    await addMyLibraryFolder(newFolderName.trim(), newFolderAr.trim());
    setNewFolderName(""); setNewFolderAr(""); setShowNewFolder(false);
    await loadMy();
    showToast(isAr ? "تمت إضافة المجلد" : "Folder created");
  }

  async function handleRenameFolder(id: string) {
    if (!renameName.trim()) return;
    await updateMyLibraryFolder(id, { name: renameName.trim(), nameAr: renameAr.trim() });
    setRenamingId(null);
    await loadMy();
    showToast(isAr ? "تمت إعادة التسمية" : "Folder renamed");
  }

  async function handleDeleteFolder(id: string) {
    if (!window.confirm(isAr ? "حذف هذا المجلد؟ ستبقى الأسئلة بدون مجلد." : "Delete this folder? Questions inside will become uncategorised.")) return;
    if (myFolderFilter === id) setMyFolderFilter("all");
    await deleteMyLibraryFolder(id);
    await loadMy();
    showToast(isAr ? "تم حذف المجلد" : "Folder deleted");
  }

  const typeOf = (t: QuestionType) => QUESTION_TYPES.find((x) => x.value === t);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed top-4 right-4 z-[999] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium text-white ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}
          >
            <Check size={14} /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safety guardrail dialog */}
      <AnimatePresence>
        {safetyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[998] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-[var(--admin-surface)] rounded-2xl border border-amber-200 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[var(--admin-text)]">
                    {isAr ? "هذا السؤال مستخدم في قوالب" : "This question is used in templates"}
                  </h3>
                  <p className="text-[12px] text-[var(--admin-text-muted)] mt-1">
                    {isAr
                      ? `هذا السؤال مُستورد في ${safetyDialog.count} سؤال${safetyDialog.count > 1 ? "" : ""} داخل قوالب تقييم موجودة. ماذا تريدين أن تفعلي؟`
                      : `This question was imported into ${safetyDialog.count} existing template question${safetyDialog.count !== 1 ? "s" : ""}. What would you like to do?`}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <button
                  onClick={() => handleSafetyConfirm(true)}
                  disabled={safetyChoosing}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-primary-pink/3 transition-all text-start disabled:opacity-60"
                >
                  <span className="text-sm mt-0.5">🔄</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                      {isAr ? "تحديث جميع القوالب" : "Update all templates"}
                    </p>
                    <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                      {isAr ? "ستنعكس التغييرات على جميع نسخ هذا السؤال في القوالب." : "Your changes will be reflected in all template copies of this question."}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleSafetyConfirm(false)}
                  disabled={safetyChoosing}
                  className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--admin-border)] hover:border-[var(--admin-text-muted)]/40 hover:bg-[var(--admin-hover-bg)] transition-all text-start disabled:opacity-60"
                >
                  <span className="text-sm mt-0.5">🔒</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                      {isAr ? "إبقاء القوالب الموجودة كما هي" : "Keep existing templates unchanged"}
                    </p>
                    <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                      {isAr ? "يتم تحديث نسختك في مكتبتي فقط. القوالب تبقى بلا تغيير." : "Only your My Library copy is updated. Templates remain as-is."}
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setSafetyDialog(null)}
                disabled={safetyChoosing}
                className="w-full py-2 rounded-xl border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors disabled:opacity-60"
              >
                {safetyChoosing ? "…" : (isAr ? "إلغاء" : "Cancel")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title={isAr ? "مكتبة الأسئلة" : "Question Library"}
        description={isAr
          ? "مكتبة نظام للقراءة فقط + مكتبتك الخاصة القابلة للتعديل."
          : "System questions (read-only) plus your own editable My Library."}
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "مكتبة الأسئلة" : "Question Library" },
        ]}
        actions={
          tab === "my" ? (
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              <Plus size={15} />
              {isAr ? "سؤال جديد" : "New Question"}
            </button>
          ) : undefined
        }
      />

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-[var(--admin-hover-bg)] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("system")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
            tab === "system"
              ? "bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <BookOpen size={14} />
          {isAr ? "مكتبة النظام" : "System Library"}
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--admin-border)] text-[var(--admin-text-muted)]">
            {sysQuestions.length}
          </span>
        </button>
        <button
          onClick={() => setTab("my")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
            tab === "my"
              ? "bg-gradient-to-r from-primary-pink/10 to-lavender-purple/10 text-primary-pink shadow-sm"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
          }`}
        >
          <Star size={14} className={tab === "my" ? "fill-primary-pink" : ""} />
          {isAr ? "مكتبتي" : "My Library"}
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--admin-border)] text-[var(--admin-text-muted)]">
            {myQuestions.length}
          </span>
        </button>
      </div>

      {/* ── System Library tab ────────────────────────────────────────────────── */}
      {tab === "system" && (
        <SystemLibraryTab
          isAr={isAr}
          questions={sysFiltered}
          allCount={sysQuestions.length}
          search={sysSearch} setSearch={setSysSearch}
          cat={sysCat} setCat={setSysCat}
          type={sysType} setType={setSysType}
          catCounts={sysCounts}
          onCustomize={startCustomize}
          typeOf={typeOf}
        />
      )}

      {/* ── My Library tab ────────────────────────────────────────────────────── */}
      {tab === "my" && (
        <MyLibraryTab
          isAr={isAr}
          questions={myFiltered}
          allCount={myQuestions.length}
          folders={myFolders}
          folderCounts={myFolderCounts}
          loading={myLoading}
          search={mySearch} setSearch={setMySearch}
          folderFilter={myFolderFilter} setFolderFilter={setMyFolderFilter}
          type={myType} setType={setMyType}
          movingId={movingId} setMovingId={setMovingId}
          showNewFolder={showNewFolder} setShowNewFolder={setShowNewFolder}
          newFolderName={newFolderName} setNewFolderName={setNewFolderName}
          newFolderAr={newFolderAr} setNewFolderAr={setNewFolderAr}
          renamingId={renamingId} setRenamingId={setRenamingId}
          renameName={renameName} setRenameName={setRenameName}
          renameAr={renameAr} setRenameAr={setRenameAr}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMove={handleMove}
          onAddFolder={handleAddFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          typeOf={typeOf}
        />
      )}

      {/* ── Create / Edit / Customize slide-in panel ──────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={closeForm}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-[var(--admin-surface)] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
                <div>
                  <h2 className="text-[14px] font-bold text-[var(--admin-text)]">
                    {customizingQ
                      ? (isAr ? "تخصيص سؤال النظام" : "Customize System Question")
                      : editingId
                      ? (isAr ? "تعديل السؤال" : "Edit Question")
                      : (isAr ? "سؤال جديد" : "New Question")}
                  </h2>
                  {customizingQ && (
                    <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                      {isAr
                        ? "سيتم حفظ نسخة منه في مكتبتك — الأصل لن يتغير."
                        : "A personal copy will be saved to My Library — the original stays unchanged."}
                    </p>
                  )}
                </div>
                <button onClick={closeForm} className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <QuestionFormFields
                  isAr={isAr}
                  form={form}
                  folders={myFolders}
                  onChange={setF}
                  onAddOption={addOption}
                  onRemoveOption={removeOption}
                  onUpdateOption={updateOption}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--admin-border)] shrink-0 bg-[var(--admin-surface)]">
                <button onClick={closeForm} className="px-4 py-2 rounded-lg border border-[var(--admin-border)] text-[13px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.label_en.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                  {customizingQ ? <Wand2 size={14} /> : <Save size={14} />}
                  {saving
                    ? (isAr ? "جارٍ الحفظ…" : "Saving…")
                    : customizingQ
                    ? (isAr ? "حفظ في مكتبتي" : "Save to My Library")
                    : editingId
                    ? (isAr ? "حفظ التغييرات" : "Save Changes")
                    : (isAr ? "إضافة إلى مكتبتي" : "Add to My Library")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── System Library Tab ───────────────────────────────────────────────────────

function SystemLibraryTab({
  isAr, questions, allCount, search, setSearch, cat, setCat, type, setType,
  catCounts, onCustomize, typeOf,
}: {
  isAr: boolean;
  questions: LibraryQuestion[];
  allCount: number;
  search: string; setSearch: (v: string) => void;
  cat: LibraryCategory | "all"; setCat: (v: LibraryCategory | "all") => void;
  type: QuestionType | "all"; setType: (v: QuestionType | "all") => void;
  catCounts: Record<string, number>;
  onCustomize: (q: LibraryQuestion) => void;
  typeOf: (t: QuestionType) => { label: string; labelAr: string; icon: React.ReactNode } | undefined;
}) {
  return (
    <div>
      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 mb-5 text-[12px] text-blue-700">
        <BookOpen size={15} className="mt-0.5 shrink-0" />
        <span>
          {isAr
            ? "هذه الأسئلة محمية ولا يمكن تعديلها. استخدم \"تخصيص\" لإنشاء نسخة قابلة للتعديل في مكتبتك."
            : "These questions are protected and cannot be modified. Use \"Customize\" to create an editable copy in My Library."}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث…" : "Search system questions…"}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] pointer-events-none" />
          <select value={cat} onChange={(e) => setCat(e.target.value as LibraryCategory | "all")}
            className="pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer appearance-none">
            <option value="all">{isAr ? "كل الفئات" : "All Categories"} ({catCounts.all ?? 0})</option>
            {LIBRARY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn} ({catCounts[c.value] ?? 0})</option>
            ))}
          </select>
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as QuestionType | "all")}
          className="px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer">
          <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setCat("all")}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${cat === "all" ? "bg-primary-pink text-white shadow-sm" : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]"}`}>
          {isAr ? "الكل" : "All"} · {allCount}
        </button>
        {LIBRARY_CATEGORIES.map((c) => {
          const s = CATEGORY_STYLES[c.value];
          const active = cat === c.value;
          return (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium ring-1 transition-all ${active ? `${s.bg} ${s.text} ${s.ring} shadow-sm` : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"}`}>
              {isAr ? c.labelAr : c.labelEn} · {catCounts[c.value] ?? 0}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {questions.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen size={32} className="mx-auto text-[var(--admin-text-faint)] mb-3" />
          <p className="text-[13px] text-[var(--admin-text-muted)]">{isAr ? "لا توجد نتائج" : "No questions match"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {questions.map((lq) => (
            <QuestionCard key={lq.id} lq={lq} isAr={isAr} typeOf={typeOf} isSystem>
              <button onClick={() => onCustomize(lq)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-primary-pink bg-primary-pink/8 hover:bg-primary-pink/15 transition-colors">
                <Wand2 size={12} />
                {isAr ? "تخصيص" : "Customize"}
              </button>
            </QuestionCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Library Tab ───────────────────────────────────────────────────────────

function MyLibraryTab({
  isAr, questions, allCount, folders, folderCounts, loading,
  search, setSearch, folderFilter, setFolderFilter, type, setType,
  movingId, setMovingId,
  showNewFolder, setShowNewFolder, newFolderName, setNewFolderName, newFolderAr, setNewFolderAr,
  renamingId, setRenamingId, renameName, setRenameName, renameAr, setRenameAr,
  onNew, onEdit, onDelete, onDuplicate, onMove,
  onAddFolder, onRenameFolder, onDeleteFolder,
  typeOf,
}: {
  isAr: boolean;
  questions: LibraryQuestion[];
  allCount: number;
  folders: MyLibraryFolder[];
  folderCounts: Record<string, number>;
  loading: boolean;
  search: string; setSearch: (v: string) => void;
  folderFilter: string; setFolderFilter: (v: string) => void;
  type: QuestionType | "all"; setType: (v: QuestionType | "all") => void;
  movingId: string | null; setMovingId: (v: string | null) => void;
  showNewFolder: boolean; setShowNewFolder: (v: boolean) => void;
  newFolderName: string; setNewFolderName: (v: string) => void;
  newFolderAr: string; setNewFolderAr: (v: string) => void;
  renamingId: string | null; setRenamingId: (v: string | null) => void;
  renameName: string; setRenameName: (v: string) => void;
  renameAr: string; setRenameAr: (v: string) => void;
  onNew: () => void;
  onEdit: (q: LibraryQuestion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (questionId: string, folderId: string | undefined) => void;
  onAddFolder: () => void;
  onRenameFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  typeOf: (t: QuestionType) => { label: string; labelAr: string; icon: React.ReactNode } | undefined;
}) {
  const uncatCount = folderCounts["uncategorised"] ?? 0;

  return (
    <div>
      {/* Empty state */}
      {!loading && allCount === 0 && (
        <div className="py-12 text-center mb-6 bg-[var(--admin-hover-bg)] rounded-2xl border-2 border-dashed border-[var(--admin-border)]">
          <Star size={32} className="mx-auto text-[var(--admin-text-faint)] mb-3" />
          <p className="text-[14px] font-semibold text-[var(--admin-text)] mb-1">
            {isAr ? "مكتبتي فارغة" : "My Library is empty"}
          </p>
          <p className="text-[12px] text-[var(--admin-text-muted)] mb-4">
            {isAr
              ? "أضف أسئلتك الخاصة أو انقر \"تخصيص\" على أي سؤال في مكتبة النظام."
              : "Add your own questions or click \"Customize\" on any System Library question."}
          </p>
          <button onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold">
            <Plus size={14} /> {isAr ? "إضافة سؤال" : "Add Question"}
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في مكتبتي…" : "Search My Library…"}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as QuestionType | "all")}
          className="px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 transition-colors cursor-pointer">
          <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
          ))}
        </select>
      </div>

      {/* Folder pills row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* All pill */}
        <button onClick={() => setFolderFilter("all")}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${folderFilter === "all" ? "bg-primary-pink text-white shadow-sm" : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]"}`}>
          {isAr ? "الكل" : "All"} · {allCount}
        </button>

        {/* Folder pills */}
        {folders.map((folder) => {
          const active = folderFilter === folder.id;
          const count  = folderCounts[folder.id] ?? 0;
          return (
            <div key={folder.id} className="relative group flex items-center">
              {renamingId === folder.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    placeholder="EN"
                    autoFocus
                    className="w-24 px-2 py-1 rounded-lg border border-primary-pink text-[12px] bg-[var(--admin-surface)] text-[var(--admin-text)] focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && onRenameFolder(folder.id)}
                  />
                  <input
                    value={renameAr}
                    onChange={(e) => setRenameAr(e.target.value)}
                    placeholder="AR"
                    dir="rtl"
                    className="w-20 px-2 py-1 rounded-lg border border-[var(--admin-border)] text-[12px] bg-[var(--admin-surface)] text-[var(--admin-text)] focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && onRenameFolder(folder.id)}
                  />
                  <button onClick={() => onRenameFolder(folder.id)} className="p-1 rounded text-emerald-500 hover:bg-emerald-50 transition-colors"><Check size={12} /></button>
                  <button onClick={() => setRenamingId(null)} className="p-1 rounded text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"><X size={12} /></button>
                </div>
              ) : (
                <>
                  <button onClick={() => setFolderFilter(folder.id)}
                    className={`pl-3 pr-2 py-1.5 rounded-full text-[12px] font-medium ring-1 transition-all flex items-center gap-1.5 ${active ? "bg-violet-100 text-violet-700 ring-violet-300 shadow-sm" : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"}`}>
                    <Folder size={11} className={active ? "text-violet-500" : ""} />
                    {isAr ? folder.nameAr : folder.name} · {count}
                  </button>
                  {/* Hover actions */}
                  <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5 z-10">
                    <button onClick={() => { setRenamingId(folder.id); setRenameName(folder.name); setRenameAr(folder.nameAr); }}
                      className="w-4 h-4 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink transition-colors shadow-sm">
                      <Pencil size={8} />
                    </button>
                    <button onClick={() => onDeleteFolder(folder.id)}
                      className="w-4 h-4 rounded-full bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-faint)] hover:text-red-500 transition-colors shadow-sm">
                      <X size={8} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Uncategorised */}
        {uncatCount > 0 && (
          <button onClick={() => setFolderFilter("uncategorised")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium ring-1 transition-all flex items-center gap-1.5 ${folderFilter === "uncategorised" ? "bg-[var(--admin-hover-bg)] text-[var(--admin-text)] ring-[var(--admin-border)] shadow-sm" : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"}`}>
            <FolderOpen size={11} /> {isAr ? "بدون مجلد" : "Uncategorised"} · {uncatCount}
          </button>
        )}

        {/* Add folder */}
        {showNewFolder ? (
          <div className="flex items-center gap-1.5">
            <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              className="w-28 px-2 py-1 rounded-lg border border-primary-pink text-[12px] bg-[var(--admin-surface)] text-[var(--admin-text)] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && onAddFolder()}
            />
            <input value={newFolderAr} onChange={(e) => setNewFolderAr(e.target.value)}
              placeholder="اسم المجلد"
              dir="rtl"
              className="w-24 px-2 py-1 rounded-lg border border-[var(--admin-border)] text-[12px] bg-[var(--admin-surface)] text-[var(--admin-text)] focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && onAddFolder()}
            />
            <button onClick={onAddFolder} className="p-1 rounded text-emerald-500 hover:bg-emerald-50 transition-colors"><Check size={12} /></button>
            <button onClick={() => setShowNewFolder(false)} className="p-1 rounded text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"><X size={12} /></button>
          </div>
        ) : (
          <button onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-[var(--admin-text-faint)] border border-dashed border-[var(--admin-border)] hover:border-primary-pink/50 hover:text-primary-pink transition-colors">
            <FolderPlus size={11} /> {isAr ? "مجلد جديد" : "New Folder"}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : questions.length === 0 && allCount > 0 ? (
        <div className="py-12 text-center">
          <Star size={28} className="mx-auto text-[var(--admin-text-faint)] mb-2" />
          <p className="text-[13px] text-[var(--admin-text-muted)]">{isAr ? "لا توجد نتائج مطابقة" : "No questions match"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {questions.map((lq) => {
            const folder = folders.find((f) => f.id === lq.folderId);
            return (
              <QuestionCard key={lq.id} lq={lq} isAr={isAr} typeOf={typeOf}>
                {/* Folder badge */}
                {folder && (
                  <div className="flex items-center gap-1 text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full ring-1 ring-violet-200 w-fit">
                    <Folder size={9} />
                    {isAr ? folder.nameAr : folder.name}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--admin-border)]">
                  <button onClick={() => onEdit(lq)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors">
                    <Pencil size={12} /> {isAr ? "تعديل" : "Edit"}
                  </button>
                  <button onClick={() => onDuplicate(lq.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors">
                    <Copy size={12} /> {isAr ? "نسخ" : "Duplicate"}
                  </button>
                  {/* Move to folder dropdown */}
                  <div className="relative">
                    <button onClick={() => setMovingId(movingId === lq.id ? null : lq.id)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                      <MoveRight size={12} />
                    </button>
                    <AnimatePresence>
                      {movingId === lq.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                          className="absolute bottom-full left-0 mb-1 w-48 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          <p className="px-3 py-1.5 text-[10px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wide">
                            {isAr ? "نقل إلى مجلد" : "Move to folder"}
                          </p>
                          <button onClick={() => onMove(lq.id, undefined)}
                            className="w-full text-start flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                            <FolderOpen size={12} /> {isAr ? "بدون مجلد" : "No folder"}
                          </button>
                          {folders.map((f) => (
                            <button key={f.id} onClick={() => onMove(lq.id, f.id)}
                              className={`w-full text-start flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${lq.folderId === f.id ? "text-violet-600 bg-violet-50 font-medium" : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"}`}>
                              <Folder size={12} className={lq.folderId === f.id ? "text-violet-500" : ""} />
                              {isAr ? f.nameAr : f.name}
                              {lq.folderId === f.id && <Check size={10} className="ml-auto text-violet-500" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={() => onDelete(lq.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto">
                    <Trash2 size={12} /> {isAr ? "حذف" : "Delete"}
                  </button>
                </div>
              </QuestionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Question Card (shared) ───────────────────────────────────────────────────

function QuestionCard({
  lq, isAr, typeOf, isSystem = false, children,
}: {
  lq: LibraryQuestion;
  isAr: boolean;
  typeOf: (t: QuestionType) => { label: string; labelAr: string; icon: React.ReactNode } | undefined;
  isSystem?: boolean;
  children?: React.ReactNode;
}) {
  const cat      = LIBRARY_CATEGORIES.find((c) => c.value === lq.category)!;
  const catStyle = CATEGORY_STYLES[lq.category];
  const type     = typeOf(lq.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-4 hover:shadow-md transition-shadow flex flex-col gap-3 ${isSystem ? "ring-1 ring-blue-100" : ""}`}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${catStyle.bg} ${catStyle.text} ${catStyle.ring}`}>
          {isAr ? cat.labelAr : cat.labelEn}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)]">
          {type?.icon} {isAr ? type?.labelAr : type?.label}
        </span>
        {lq.required && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 ring-1 ring-red-200">
            {isAr ? "إلزامي" : "Required"}
          </span>
        )}
        {isSystem && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200 ml-auto">
            <BookOpen size={9} /> {isAr ? "نظام" : "System"}
          </span>
        )}
      </div>

      {/* Labels */}
      <div className="flex-1 min-h-0">
        <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-snug line-clamp-2">
          {lq.label_en}
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
            {lq.options.slice(0, 4).map((o, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] border border-[var(--admin-border)]">
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

      {children}
    </motion.div>
  );
}

// ─── Question Form Fields (shared for create / edit / customize) ──────────────

function QuestionFormFields({
  isAr, form, folders, onChange, onAddOption, onRemoveOption, onUpdateOption,
}: {
  isAr: boolean;
  form: QuestionFormState;
  folders: MyLibraryFolder[];
  onChange: <K extends keyof QuestionFormState>(key: K, value: QuestionFormState[K]) => void;
  onAddOption: () => void;
  onRemoveOption: (i: number) => void;
  onUpdateOption: (i: number, field: "label_en" | "label_ar" | "value", val: string) => void;
}) {
  const showOptions = NEEDS_OPTIONS.includes(form.type);

  return (
    <>
      {/* Category + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>{isAr ? "الفئة" : "Category"} *</label>
          <select value={form.category} onChange={(e) => onChange("category", e.target.value as LibraryCategory)} className={INPUT}>
            {LIBRARY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>{isAr ? "نوع السؤال" : "Question Type"} *</label>
          <select value={form.type} onChange={(e) => onChange("type", e.target.value as QuestionType)} className={INPUT}>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Folder */}
      {folders.length > 0 && (
        <div>
          <label className={LABEL}>
            <span className="inline-flex items-center gap-1"><Folder size={10} /> {isAr ? "المجلد" : "Folder"}</span>
          </label>
          <select value={form.folderId} onChange={(e) => onChange("folderId", e.target.value)} className={INPUT}>
            <option value="">{isAr ? "بدون مجلد" : "No folder"}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{isAr ? f.nameAr : f.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Labels */}
      <div>
        <label className={LABEL}>Label (EN) *</label>
        <input value={form.label_en} onChange={(e) => onChange("label_en", e.target.value)}
          placeholder="Question label in English" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Label (AR)</label>
        <input dir="rtl" value={form.label_ar} onChange={(e) => onChange("label_ar", e.target.value)}
          placeholder="نص السؤال بالعربية" className={INPUT} />
      </div>

      {/* Placeholders */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Placeholder (EN)</label>
          <input value={form.placeholder_en} onChange={(e) => onChange("placeholder_en", e.target.value)}
            placeholder="Hint text…" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Placeholder (AR)</label>
          <input dir="rtl" value={form.placeholder_ar} onChange={(e) => onChange("placeholder_ar", e.target.value)}
            placeholder="نص تلميحي…" className={INPUT} />
        </div>
      </div>

      {/* Help text */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Help Text (EN)</label>
          <textarea rows={2} value={form.help_en} onChange={(e) => onChange("help_en", e.target.value)}
            placeholder="Additional guidance…" className={`${INPUT} resize-none`} />
        </div>
        <div>
          <label className={LABEL}>Help Text (AR)</label>
          <textarea dir="rtl" rows={2} value={form.help_ar} onChange={(e) => onChange("help_ar", e.target.value)}
            placeholder="إرشادات إضافية…" className={`${INPUT} resize-none`} />
        </div>
      </div>

      {/* Validation note */}
      <div>
        <label className={LABEL}>{isAr ? "ملاحظة التحقق" : "Validation Note"}</label>
        <input value={form.validation_note} onChange={(e) => onChange("validation_note", e.target.value)}
          placeholder="e.g. 0–10, min 2 characters" className={INPUT} />
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange("required", !form.required)}
          className="relative w-10 rounded-full transition-colors shrink-0"
          style={{ height: "22px", backgroundColor: form.required ? "#f472b6" : "var(--admin-border)" }}>
          <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
            style={{ width: "18px", height: "18px", left: "2px", transform: form.required ? "translateX(18px)" : "translateX(0)" }} />
        </button>
        <span className="text-[13px] text-[var(--admin-text)]">
          {form.required ? (isAr ? "إلزامي" : "Required") : (isAr ? "اختياري" : "Optional")}
        </span>
      </div>

      {/* Options for choice types */}
      {showOptions && (
        <div className="border border-[var(--admin-border)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide">
              {isAr ? "الخيارات" : "Answer Options"}
            </label>
            <button type="button" onClick={onAddOption}
              className="flex items-center gap-1 text-[11px] font-medium text-primary-pink hover:text-primary-pink/70 transition-colors">
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
              <input value={opt.label_en} onChange={(e) => onUpdateOption(i, "label_en", e.target.value)}
                placeholder={`Option ${i + 1} EN`} className={INPUT} />
              <input dir="rtl" value={opt.label_ar} onChange={(e) => onUpdateOption(i, "label_ar", e.target.value)}
                placeholder={`الخيار ${i + 1} AR`} className={INPUT} />
              <button type="button" onClick={() => onRemoveOption(i)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
