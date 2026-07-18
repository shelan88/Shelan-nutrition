/**
 * AssessmentTemplatesPage.tsx
 *
 * Full admin UI for creating, editing, and managing assessment templates.
 * Replaces the PlaceholderPage at /admin/assessment-templates.
 *
 * Views:
 *   list → table of all templates with actions
 *   edit → split panel: metadata (left) + question builder (right)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ArrowLeft, Save, X, Copy,
  GripVertical, ChevronDown, ChevronUp, Check, ToggleLeft, ToggleRight,
  AlertCircle, Type, AlignLeft, ToggleRight as YesNoIcon, List,
  CheckSquare, ChevronDown as DropdownIcon, Hash, Calendar as CalendarIcon,
  Paperclip, Image as ImageIcon, ClipboardList, BookOpen, Bookmark,
  Eye, EyeOff,
} from "lucide-react";
import QuestionLibraryDrawer from "../components/QuestionLibraryDrawer";
import type { LibraryQuestion } from "../components/QuestionLibraryDrawer";
import BundlePickerModal from "../components/BundlePickerModal";
import TemplatePreviewOverlay from "../components/TemplatePreviewOverlay";
import type { AssessmentBundle } from "@/admin/data/assessment-bundles";
import {
  saveQuestionToLibrary,
  getMyLibraryFolders,
  LIBRARY_CATEGORIES,
} from "@/admin/repositories/question-library.repository";
import type { LibraryCategory, MyLibraryFolder } from "@/admin/repositories/question-library.repository";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { supabase } from "@/lib/supabase";
import {
  getAllTemplates,
  getTemplateWithDetails,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setTemplateActive,
  duplicateTemplate,
  upsertQuestion,
  deleteQuestion,
  reorderQuestions,
  replaceOptions,
  setServiceAssignments,
  toggleQuestionEnabled,
} from "@/admin/repositories/assessment-templates.repository";
import type {
  TemplateWithDetails,
  QuestionWithOptions,
} from "@/admin/repositories/assessment-templates.repository";
import type { QuestionType } from "@/types/database.types";

// Partial service shape — only the fields we select for assignment UI
interface ServiceSummary {
  id: string;
  name_en: string;
  name_ar: string | null;
  active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const QUESTION_TYPES: { value: QuestionType; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
  { value: "short_text",      labelEn: "Short Text",       labelAr: "نص قصير",       icon: <Type size={13} /> },
  { value: "paragraph",       labelEn: "Paragraph",        labelAr: "فقرة",          icon: <AlignLeft size={13} /> },
  { value: "yes_no",          labelEn: "Yes / No",         labelAr: "نعم / لا",      icon: <YesNoIcon size={13} /> },
  { value: "single_choice",   labelEn: "Single Choice",    labelAr: "اختيار واحد",   icon: <List size={13} /> },
  { value: "multiple_choice", labelEn: "Multiple Choice",  labelAr: "اختيار متعدد",  icon: <CheckSquare size={13} /> },
  { value: "dropdown",        labelEn: "Dropdown",         labelAr: "قائمة منسدلة",  icon: <DropdownIcon size={13} /> },
  { value: "number",          labelEn: "Number",           labelAr: "رقم",           icon: <Hash size={13} /> },
  { value: "date",            labelEn: "Date",             labelAr: "تاريخ",         icon: <CalendarIcon size={13} /> },
  { value: "file_upload",     labelEn: "File Upload",      labelAr: "رفع ملف",       icon: <Paperclip size={13} /> },
  { value: "image_upload",    labelEn: "Image Upload",     labelAr: "رفع صورة",      icon: <ImageIcon size={13} /> },
];

const NEEDS_OPTIONS: QuestionType[] = ["single_choice", "multiple_choice", "dropdown"];

// ─── Shared input className ───────────────────────────────────────────────────
const INPUT = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const LABEL = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

// ─── Template form state ──────────────────────────────────────────────────────
interface TemplateForm {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  active: boolean;
  assignedServiceIds: string[];
}

function blankTemplateForm(): TemplateForm {
  return { name_en: "", name_ar: "", description_en: "", description_ar: "", active: true, assignedServiceIds: [] };
}

// ─── Question form state ──────────────────────────────────────────────────────
interface OptionDraft { label_en: string; label_ar: string; value: string }

interface QuestionForm {
  id?: string;
  type: QuestionType;
  label_en: string;
  label_ar: string;
  placeholder_en: string;
  placeholder_ar: string;
  help_en: string;
  help_ar: string;
  required: boolean;
  options: OptionDraft[];
  conditional_question_id: string;
  conditional_value: string;
}

function blankQuestionForm(templateId: string): QuestionForm & { template_id: string } {
  return {
    template_id: templateId,
    type: "short_text",
    label_en: "",
    label_ar: "",
    placeholder_en: "",
    placeholder_ar: "",
    help_en: "",
    help_ar: "",
    required: false,
    options: [],
    conditional_question_id: "",
    conditional_value: "",
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssessmentTemplatesPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [view, setView] = useState<"list" | "edit">("list");
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithDetails | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(blankTemplateForm());
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [creatingBundle, setCreatingBundle] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllTemplates();
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from("services").select("id, name_en, name_ar, active").eq("active", true).order("sort_order", { ascending: true })
      .then(({ data }) => setServices(data ?? []));
  }, []);

  // ── List actions ─────────────────────────────────────────────────────────

  function openNew() {
    setShowNewModal(true);
  }

  async function handleCreateBlank() {
    setShowNewModal(false);
    setEditingTemplate(null);
    setTemplateForm(blankTemplateForm());
    setQuestions([]);
    setMetaError("");
    setView("edit");
  }

  async function handleCreateFromBundle(bundle: AssessmentBundle) {
    setCreatingBundle(true);
    setShowNewModal(false);

    const created = await createTemplate({
      name_en: bundle.name_en,
      name_ar: bundle.name_ar || null,
      description_en: bundle.description_en || null,
      description_ar: bundle.description_ar || null,
      active: false,
    });
    if (!created) { setCreatingBundle(false); return; }

    // Bulk-insert bundle questions sequentially so sort_order is correct
    for (let i = 0; i < bundle.questions.length; i++) {
      const bq = bundle.questions[i];
      const savedQ = await upsertQuestion({
        template_id: created.id,
        type: bq.type,
        label_en: bq.label_en,
        label_ar: bq.label_ar || null,
        placeholder_en: bq.placeholder_en || null,
        placeholder_ar: bq.placeholder_ar || null,
        help_en: bq.help_en || null,
        help_ar: bq.help_ar || null,
        required: bq.required,
        sort_order: i,
        conditional_question_id: null,
        conditional_value: null,
        enabled: true,
        library_question_id: null,
      });
      if (savedQ && NEEDS_OPTIONS.includes(bq.type) && bq.options.length > 0) {
        await replaceOptions(savedQ.id, bq.options.map((o, idx) => ({ ...o, sort_order: idx })));
      }
    }

    const full = await getTemplateWithDetails(created.id);
    if (full) {
      setEditingTemplate(full);
      setTemplateForm({
        name_en: full.name_en,
        name_ar: full.name_ar ?? "",
        description_en: full.description_en ?? "",
        description_ar: full.description_ar ?? "",
        active: full.active,
        assignedServiceIds: full.assignedServiceIds,
      });
      setQuestions(full.questions);
    }
    await load();
    setCreatingBundle(false);
    setMetaError("");
    setView("edit");
  }

  async function handlePreview(t: TemplateWithDetails) {
    const full = await getTemplateWithDetails(t.id);
    if (full) setPreviewTemplate(full);
  }

  async function openEdit(t: TemplateWithDetails) {
    const full = await getTemplateWithDetails(t.id);
    if (!full) return;
    setEditingTemplate(full);
    setTemplateForm({
      name_en: full.name_en,
      name_ar: full.name_ar ?? "",
      description_en: full.description_en ?? "",
      description_ar: full.description_ar ?? "",
      active: full.active,
      assignedServiceIds: full.assignedServiceIds,
    });
    setQuestions(full.questions);
    setMetaError("");
    setView("edit");
  }

  async function handleToggleActive(t: TemplateWithDetails) {
    setTogglingId(t.id);
    await setTemplateActive(t.id, !t.active);
    await load();
    setTogglingId(null);
  }

  async function handleDuplicate(t: TemplateWithDetails) {
    setDuplicatingId(t.id);
    await duplicateTemplate(t.id);
    await load();
    setDuplicatingId(null);
  }

  async function handleDelete(t: TemplateWithDetails) {
    const msg = isAr
      ? `هل أنت متأكد من حذف "${t.name_en}"؟ سيتم حذف جميع الأسئلة.`
      : `Delete "${t.name_en}"? All questions will be permanently removed.`;
    if (!window.confirm(msg)) return;
    setDeletingId(t.id);
    await deleteTemplate(t.id);
    await load();
    setDeletingId(null);
  }

  // ── Editor — metadata save ────────────────────────────────────────────────

  async function handleMetaSave() {
    if (!templateForm.name_en.trim()) {
      setMetaError(isAr ? "الاسم الإنجليزي مطلوب." : "English name is required.");
      return;
    }
    setMetaSaving(true);
    setMetaError("");

    const payload = {
      name_en: templateForm.name_en.trim(),
      name_ar: templateForm.name_ar.trim() || null,
      description_en: templateForm.description_en.trim() || null,
      description_ar: templateForm.description_ar.trim() || null,
      active: templateForm.active,
    };

    let templateId = editingTemplate?.id;

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, payload);
    } else {
      const created = await createTemplate(payload);
      if (!created) { setMetaError(isAr ? "فشل الحفظ." : "Save failed."); setMetaSaving(false); return; }
      templateId = created.id;
      const full = await getTemplateWithDetails(created.id);
      if (full) setEditingTemplate(full);
    }

    if (templateId) {
      await setServiceAssignments(templateId, templateForm.assignedServiceIds);
    }

    await load();
    setMetaSaving(false);
  }

  function cancelEdit() {
    setView("list");
    setEditingTemplate(null);
  }

  // ── Breadcrumbs ───────────────────────────────────────────────────────────

  const breadcrumbs =
    view === "list"
      ? [{ label: isAr ? "الإدارة" : "Admin", href: "/admin" }, { label: isAr ? "نماذج التقييم" : "Assessment Templates" }]
      : [
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "نماذج التقييم" : "Assessment Templates", href: "/admin/assessment-templates" },
          { label: editingTemplate ? (isAr ? "تعديل" : "Edit") : (isAr ? "جديد" : "New") },
        ];

  return (
    <div>
      <PageHeader
        title={isAr ? "نماذج التقييم" : "Assessment Templates"}
        description={
          isAr
            ? "تصميم وإدارة استبيانات الصحة الديناميكية لتدفق تقييم العملاء."
            : "Design and manage dynamic health questionnaires that power the client assessment flow."
        }
        breadcrumbs={breadcrumbs}
      />

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <TemplateList
              isAr={isAr}
              templates={templates}
              loading={loading}
              deletingId={deletingId}
              togglingId={togglingId}
              duplicatingId={duplicatingId}
              onNew={openNew}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onDuplicate={handleDuplicate}
              onPreview={handlePreview}
            />
          </motion.div>
        ) : (
          <motion.div key="edit" {...fadeUp()}>
            <TemplateEditor
              isAr={isAr}
              editingTemplate={editingTemplate}
              templateForm={templateForm}
              setTemplateForm={setTemplateForm}
              questions={questions}
              setQuestions={setQuestions}
              services={services}
              metaSaving={metaSaving}
              metaError={metaError}
              onSaveMeta={handleMetaSave}
              onCancel={cancelEdit}
              onPreview={editingTemplate ? () => handlePreview(editingTemplate) : undefined}
              onReloadTemplate={async () => {
                if (editingTemplate) {
                  const full = await getTemplateWithDetails(editingTemplate.id);
                  if (full) { setEditingTemplate(full); setQuestions(full.questions); }
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bundle picker modal */}
      <BundlePickerModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onBlank={handleCreateBlank}
        onBundle={handleCreateFromBundle}
        creating={creatingBundle}
        isAr={isAr}
      />

      {/* Full-screen preview overlay */}
      {previewTemplate && (
        <TemplatePreviewOverlay
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          isAr={isAr}
        />
      )}
    </div>
  );
}

// ─── Template List ────────────────────────────────────────────────────────────

function TemplateList({
  isAr, templates, loading,
  deletingId, togglingId, duplicatingId,
  onNew, onEdit, onDelete, onToggleActive, onDuplicate, onPreview,
}: {
  isAr: boolean;
  templates: TemplateWithDetails[];
  loading: boolean;
  deletingId: string | null;
  togglingId: string | null;
  duplicatingId: string | null;
  onNew: () => void;
  onEdit: (t: TemplateWithDetails) => void;
  onDelete: (t: TemplateWithDetails) => void;
  onToggleActive: (t: TemplateWithDetails) => void;
  onDuplicate: (t: TemplateWithDetails) => void;
  onPreview: (t: TemplateWithDetails) => void;
}) {
  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
        <p className="text-[13px] text-[var(--admin-text-muted)]">
          {isAr ? `${templates.length} قالب` : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={15} />
          {isAr ? "قالب جديد" : "New Template"}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-[var(--admin-text-muted)]">
          {isAr ? "جارٍ التحميل…" : "Loading…"}
        </div>
      ) : templates.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <ClipboardList size={40} className="text-[var(--admin-text-faint)]" />
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[var(--admin-text)]">
              {isAr ? "لا توجد قوالب بعد" : "No templates yet"}
            </p>
            <p className="text-[12px] text-[var(--admin-text-muted)] mt-1">
              {isAr ? "أنشئ قالبك الأول لبدء تقييم العملاء." : "Create your first template to start assessing clients."}
            </p>
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold"
          >
            <Plus size={14} /> {isAr ? "إنشاء قالب" : "Create Template"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--admin-hover-bg)]">
              <tr>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">{isAr ? "الاسم" : "Name"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">{isAr ? "الأسئلة" : "Questions"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">{isAr ? "الخدمات" : "Services"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">{isAr ? "الحالة" : "Status"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-[13px] font-medium text-[var(--admin-text)]">{t.name_en}</p>
                    {t.name_ar && <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{t.name_ar}</p>}
                    {t.description_en && <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5 max-w-xs truncate">{t.description_en}</p>}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-200">
                      {t.questionCount} {isAr ? "سؤال" : "Q"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-[var(--admin-text-muted)]">
                    {t.assignedServiceIds.length === 0
                      ? <span className="text-[var(--admin-text-faint)]">—</span>
                      : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200">{t.assignedServiceIds.length}</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    {t.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {isAr ? "نشط" : "Active"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                        {isAr ? "غير نشط" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onPreview(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                        title={isAr ? "معاينة" : "Preview"}
                      >
                        <Eye size={11} /> {isAr ? "معاينة" : "Preview"}
                      </button>
                      <button
                        onClick={() => onEdit(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                      >
                        <Pencil size={11} /> {isAr ? "تعديل" : "Edit"}
                      </button>
                      <button
                        onClick={() => onToggleActive(t)}
                        disabled={togglingId === t.id}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                      >
                        {t.active ? <ToggleLeft size={11} /> : <ToggleRight size={11} />}
                        {togglingId === t.id ? "…" : (t.active ? (isAr ? "تعطيل" : "Deactivate") : (isAr ? "تفعيل" : "Activate"))}
                      </button>
                      <button
                        onClick={() => onDuplicate(t)}
                        disabled={duplicatingId === t.id}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                      >
                        <Copy size={11} /> {duplicatingId === t.id ? "…" : (isAr ? "نسخ" : "Duplicate")}
                      </button>
                      <button
                        onClick={() => onDelete(t)}
                        disabled={deletingId === t.id}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={11} /> {deletingId === t.id ? "…" : (isAr ? "حذف" : "Delete")}
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
  );
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({
  isAr, editingTemplate, templateForm, setTemplateForm,
  questions, setQuestions, services,
  metaSaving, metaError, onSaveMeta, onCancel, onReloadTemplate, onPreview,
}: {
  isAr: boolean;
  editingTemplate: TemplateWithDetails | null;
  templateForm: TemplateForm;
  setTemplateForm: (f: TemplateForm) => void;
  questions: QuestionWithOptions[];
  setQuestions: (q: QuestionWithOptions[]) => void;
  services: ServiceSummary[];
  metaSaving: boolean;
  metaError: string;
  onSaveMeta: () => void;
  onCancel: () => void;
  onReloadTemplate: () => Promise<void>;
  onPreview?: () => void;
}) {
  function setField<K extends keyof TemplateForm>(k: K, v: TemplateForm[K]) {
    setTemplateForm({ ...templateForm, [k]: v });
  }

  function toggleService(id: string) {
    const ids = templateForm.assignedServiceIds.includes(id)
      ? templateForm.assignedServiceIds.filter((s) => s !== id)
      : [...templateForm.assignedServiceIds, id];
    setField("assignedServiceIds", ids);
  }

  return (
    <div>
      {/* Back + Save bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
        >
          <ArrowLeft size={13} className="rtl:rotate-180" />
          {isAr ? "رجوع" : "Back to Templates"}
        </button>

        <div className="flex items-center gap-2">
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              title={isAr ? "معاينة القالب كما يراه العميل" : "Preview as the client sees it"}
            >
              <Eye size={12} /> {isAr ? "معاينة" : "Preview"}
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
          >
            <X size={12} /> {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={onSaveMeta}
            disabled={metaSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            <Save size={14} />
            {metaSaving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : (editingTemplate ? (isAr ? "حفظ التغييرات" : "Save Changes") : (isAr ? "إنشاء القالب" : "Create Template"))}
          </button>
        </div>
      </div>

      {metaError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          <AlertCircle size={14} /> {metaError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Metadata panel (left, 2 cols) ── */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                {isAr ? "معلومات القالب" : "Template Info"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Names */}
              <div>
                <label className={LABEL}>Name (EN) *</label>
                <input
                  value={templateForm.name_en}
                  onChange={(e) => setField("name_en", e.target.value)}
                  placeholder="e.g. Initial Health Assessment"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Name (AR)</label>
                <input
                  dir="rtl"
                  value={templateForm.name_ar}
                  onChange={(e) => setField("name_ar", e.target.value)}
                  placeholder="مثال: تقييم الصحة الأولي"
                  className={INPUT}
                />
              </div>

              {/* Descriptions */}
              <div>
                <label className={LABEL}>Description (EN)</label>
                <textarea
                  rows={2}
                  value={templateForm.description_en}
                  onChange={(e) => setField("description_en", e.target.value)}
                  placeholder="Brief description for admin reference…"
                  className={`${INPUT} resize-y`}
                />
              </div>
              <div>
                <label className={LABEL}>Description (AR)</label>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={templateForm.description_ar}
                  onChange={(e) => setField("description_ar", e.target.value)}
                  placeholder="وصف مختصر للمرجع الإداري…"
                  className={`${INPUT} resize-y`}
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setField("active", !templateForm.active)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${templateForm.active ? "bg-emerald-500" : "bg-[var(--admin-border)]"}`}
                  style={{ height: "22px" }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${templateForm.active ? "translate-x-4.5" : ""}`}
                    style={{ width: "18px", height: "18px", transform: templateForm.active ? "translateX(18px)" : "translateX(0)" }}
                  />
                </button>
                <span className="text-[13px] text-[var(--admin-text)]">
                  {templateForm.active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                </span>
              </div>
            </div>
          </div>

          {/* Service assignment */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                {isAr ? "ربط بالخدمات" : "Assign to Services"}
              </h2>
              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                {isAr ? "عند الحجز يتلقى العميل هذا النموذج." : "Clients booking these services will receive this questionnaire."}
              </p>
            </div>
            <div className="p-5 space-y-2">
              {services.length === 0 ? (
                <p className="text-[12px] text-[var(--admin-text-faint)]">
                  {isAr ? "لا توجد خدمات نشطة." : "No active services found."}
                </p>
              ) : services.map((svc) => {
                const checked = templateForm.assignedServiceIds.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-start transition-all ${checked ? "border-primary-pink/40 bg-primary-pink/5" : "border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)]"}`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? "bg-primary-pink border-primary-pink" : "border-[var(--admin-border)]"}`}>
                      {checked && <Check size={10} className="text-white" />}
                    </span>
                    <span className="text-[12px] text-[var(--admin-text)] font-medium">{isAr ? (svc.name_ar ?? svc.name_en) : svc.name_en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Question builder (right, 3 cols) ── */}
        <div className="xl:col-span-3">
          {editingTemplate ? (
            <QuestionBuilder
              isAr={isAr}
              templateId={editingTemplate.id}
              questions={questions}
              setQuestions={setQuestions}
              onReload={onReloadTemplate}
            />
          ) : (
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-8 text-center">
              <ClipboardList size={32} className="mx-auto text-[var(--admin-text-faint)] mb-3" />
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {isAr ? "احفظ القالب أولاً لإضافة الأسئلة" : "Save the template first to add questions"}
              </p>
              <p className="text-[12px] text-[var(--admin-text-muted)] mt-1">
                {isAr ? "بعد الحفظ ستظهر هنا أداة بناء الأسئلة." : "The question builder will appear here after saving."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Question Builder ─────────────────────────────────────────────────────────

function QuestionBuilder({
  isAr, templateId, questions, setQuestions, onReload,
}: {
  isAr: boolean;
  templateId: string;
  questions: QuestionWithOptions[];
  setQuestions: (q: QuestionWithOptions[]) => void;
  onReload: () => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  // ── Library ────────────────────────────────────────────────────────────
  const [showLibrary, setShowLibrary] = useState(false);
  const [saveToLibraryQ, setSaveToLibraryQ] = useState<QuestionWithOptions | null>(null);
  const [saveToLibCat, setSaveToLibCat] = useState<LibraryCategory>("basic_info");
  const [saveToLibFolder, setSaveToLibFolder] = useState<string>("");
  const [saveToLibFolders, setSaveToLibFolders] = useState<MyLibraryFolder[]>([]);
  const [savingToLib, setSavingToLib] = useState(false);

  // ── Drag-to-reorder ────────────────────────────────────────────────────

  function handleDragStart(idx: number) { dragItem.current = idx; }
  function handleDragEnter(idx: number) { dragOver.current = idx; }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return;
    }
    const reordered = [...questions];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null; dragOver.current = null;
    setQuestions(reordered);
    await reorderQuestions(templateId, reordered.map((q) => q.id));
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDelete(q: QuestionWithOptions) {
    if (!window.confirm(isAr ? "حذف هذا السؤال؟" : "Delete this question?")) return;
    setDeletingId(q.id);
    await deleteQuestion(q.id);
    await onReload();
    setDeletingId(null);
    setExpandedId(null);
  }

  // ── Save question ──────────────────────────────────────────────────────

  async function handleSaveQuestion(
    form: QuestionForm & { template_id: string },
    questionId: string | undefined
  ) {
    setSavingId(questionId ?? "__new__");
    const saved = await upsertQuestion({
      id: questionId,
      template_id: form.template_id,
      type: form.type,
      label_en: form.label_en,
      label_ar: form.label_ar || null,
      placeholder_en: form.placeholder_en || null,
      placeholder_ar: form.placeholder_ar || null,
      help_en: form.help_en || null,
      help_ar: form.help_ar || null,
      required: form.required,
      sort_order: questionId ? questions.find((q) => q.id === questionId)?.sort_order ?? questions.length : questions.length,
      conditional_question_id: form.conditional_question_id || null,
      conditional_value: form.conditional_value || null,
      // preserve existing enabled & library_question_id on edit
      enabled: questionId ? (questions.find((q) => q.id === questionId)?.enabled ?? true) : true,
      library_question_id: questionId ? (questions.find((q) => q.id === questionId)?.library_question_id ?? null) : null,
    });

    if (saved && NEEDS_OPTIONS.includes(form.type)) {
      await replaceOptions(saved.id, form.options.map((o, i) => ({ ...o, sort_order: i })));
    }

    await onReload();
    setSavingId(null);
    setExpandedId(null);
    setAddingNew(false);
  }

  // ── Insert from Library ────────────────────────────────────────────────

  async function handleInsertFromLibrary(libraryQuestions: LibraryQuestion[]) {
    if (!libraryQuestions.length) return;
    setSavingId("__library__");
    const startLen = questions.length;
    for (let i = 0; i < libraryQuestions.length; i++) {
      const lq = libraryQuestions[i];
      const saved = await upsertQuestion({
        template_id: templateId,
        type: lq.type,
        label_en: lq.label_en,
        label_ar: lq.label_ar || null,
        placeholder_en: lq.placeholder_en || null,
        placeholder_ar: lq.placeholder_ar || null,
        help_en: lq.help_en || null,
        help_ar: lq.help_ar || null,
        required: lq.required,
        sort_order: startLen + i,
        conditional_question_id: null,
        conditional_value: null,
        enabled: true,
        library_question_id: lq.source === "my" ? lq.id : null,
      });
      if (saved && NEEDS_OPTIONS.includes(lq.type) && lq.options?.length) {
        await replaceOptions(saved.id, lq.options.map((o, idx) => ({ ...o, sort_order: idx })));
      }
    }
    await onReload();
    setSavingId(null);
  }

  // ── Enable / Disable toggle ─────────────────────────────────────────────

  const [togglingEnabledId, setTogglingEnabledId] = useState<string | null>(null);

  async function handleToggleEnabled(q: QuestionWithOptions) {
    const newEnabled = !(q.enabled ?? true);
    // Optimistic update
    setQuestions(questions.map((x) => x.id === q.id ? { ...x, enabled: newEnabled } : x));
    setTogglingEnabledId(q.id);
    const ok = await toggleQuestionEnabled(q.id, newEnabled);
    if (!ok) {
      // Revert on failure
      setQuestions(questions.map((x) => x.id === q.id ? { ...x, enabled: !newEnabled } : x));
    }
    setTogglingEnabledId(null);
  }

  // ── Save to Library ────────────────────────────────────────────────────

  async function openSaveToLibrary(q: QuestionWithOptions) {
    setSaveToLibraryQ(q);
    setSaveToLibFolder("");
    const folders = await getMyLibraryFolders();
    setSaveToLibFolders(folders);
  }

  async function handleConfirmSaveToLibrary() {
    if (!saveToLibraryQ) return;
    setSavingToLib(true);
    await saveQuestionToLibrary(
      {
        category: saveToLibCat,
        type: saveToLibraryQ.type,
        label_en: saveToLibraryQ.label_en,
        label_ar: saveToLibraryQ.label_ar ?? "",
        placeholder_en: saveToLibraryQ.placeholder_en ?? "",
        placeholder_ar: saveToLibraryQ.placeholder_ar ?? "",
        help_en: saveToLibraryQ.help_en ?? "",
        help_ar: saveToLibraryQ.help_ar ?? "",
        required: saveToLibraryQ.required,
        validation_note: "",
        options: saveToLibraryQ.options.map((o) => ({
          label_en: o.label_en,
          label_ar: o.label_ar ?? "",
          value: o.value,
        })),
      },
      saveToLibFolder || undefined,
    );
    setSavingToLib(false);
    setSaveToLibraryQ(null);
  }

  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
        <div>
          <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
            {isAr ? "الأسئلة" : "Questions"}
          </h2>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            {isAr ? "اسحب للترتيب • اضغط لتعديل" : "Drag to reorder • Click to edit"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
          >
            <BookOpen size={13} /> {isAr ? "من المكتبة" : "From Library"}
          </button>
          <button
            onClick={() => { setAddingNew(true); setExpandedId(null); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[12px] font-semibold"
          >
            <Plus size={13} /> {isAr ? "إضافة سؤال" : "Add Question"}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[var(--admin-border)]">
        {/* Existing questions */}
        {questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            isAr={isAr}
            question={q}
            idx={idx}
            expanded={expandedId === q.id}
            allQuestions={questions}
            saving={savingId === q.id}
            deleting={deletingId === q.id}
            togglingEnabled={togglingEnabledId === q.id}
            onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
            onDelete={() => handleDelete(q)}
            onSave={(form) => handleSaveQuestion(form, q.id)}
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onSaveToLibrary={() => { openSaveToLibrary(q); setSaveToLibCat("basic_info"); }}
            onToggleEnabled={() => handleToggleEnabled(q)}
          />
        ))}

        {/* New question form */}
        {addingNew && (
          <div className="p-5">
            <p className="text-[12px] font-bold text-[var(--admin-text)] mb-4">
              {isAr ? "سؤال جديد" : "New Question"}
            </p>
            <QuestionForm
              isAr={isAr}
              initial={blankQuestionForm(templateId)}
              allQuestions={questions}
              saving={savingId === "__new__"}
              onSave={(form) => handleSaveQuestion(form, undefined)}
              onCancel={() => setAddingNew(false)}
            />
          </div>
        )}

        {questions.length === 0 && !addingNew && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-[var(--admin-text-muted)]">
              {isAr ? "لا توجد أسئلة بعد. أضف سؤالاً للبدء." : "No questions yet. Add a question to get started."}
            </p>
            <button
              onClick={() => setShowLibrary(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            >
              <BookOpen size={13} /> {isAr ? "استعرضي مكتبة الأسئلة" : "Browse the question library"}
            </button>
          </div>
        )}
      </div>

      {/* ── Library Drawer ──────────────────────────────────────────────────── */}
      <QuestionLibraryDrawer
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onInsert={handleInsertFromLibrary}
        isAr={isAr}
      />

      {/* ── Save to Library modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {saveToLibraryQ && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSaveToLibraryQ(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <Bookmark size={15} className="text-primary-pink" />
                <h3 className="text-[14px] font-bold text-[var(--admin-text)]">
                  {isAr ? "حفظ في المكتبة" : "Save to Library"}
                </h3>
              </div>
              <p className="text-[12px] text-[var(--admin-text-muted)] mb-4 line-clamp-2 ml-5">
                {saveToLibraryQ.label_en}
              </p>
              <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">
                {isAr ? "الفئة" : "Category"}
              </label>
              <select
                value={saveToLibCat}
                onChange={(e) => setSaveToLibCat(e.target.value as LibraryCategory)}
                className="w-full px-3 py-2 mb-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
              >
                {LIBRARY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
                ))}
              </select>
              {saveToLibFolders.length > 0 && (
                <>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">
                    {isAr ? "المجلد (اختياري)" : "Folder (optional)"}
                  </label>
                  <select
                    value={saveToLibFolder}
                    onChange={(e) => setSaveToLibFolder(e.target.value)}
                    className="w-full px-3 py-2 mb-5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                  >
                    <option value="">{isAr ? "بدون مجلد" : "No folder"}</option>
                    {saveToLibFolders.map((f) => (
                      <option key={f.id} value={f.id}>{isAr ? f.nameAr : f.name}</option>
                    ))}
                  </select>
                </>
              )}
              {saveToLibFolders.length === 0 && <div className="mb-5" />}
              <div className="flex gap-2">
                <button
                  onClick={() => setSaveToLibraryQ(null)}
                  className="flex-1 py-2 rounded-lg border border-[var(--admin-border)] text-[13px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleConfirmSaveToLibrary}
                  disabled={savingToLib}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold disabled:opacity-60 transition-all"
                >
                  {savingToLib ? "…" : (isAr ? "حفظ" : "Save to Library")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Question Row (collapsed + expanded) ─────────────────────────────────────

function QuestionRow({
  isAr, question, idx, expanded, allQuestions, saving, deleting, togglingEnabled,
  onToggle, onDelete, onSave, onDragStart, onDragEnter, onDragEnd, onSaveToLibrary, onToggleEnabled,
}: {
  isAr: boolean;
  question: QuestionWithOptions;
  idx: number;
  expanded: boolean;
  allQuestions: QuestionWithOptions[];
  saving: boolean;
  deleting: boolean;
  togglingEnabled: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (form: QuestionForm & { template_id: string }) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onSaveToLibrary?: () => void;
  onToggleEnabled: () => void;
}) {
  const typeInfo = QUESTION_TYPES.find((t) => t.value === question.type);

  const initial: QuestionForm & { template_id: string } = {
    id: question.id,
    template_id: question.template_id,
    type: question.type,
    label_en: question.label_en,
    label_ar: question.label_ar ?? "",
    placeholder_en: question.placeholder_en ?? "",
    placeholder_ar: question.placeholder_ar ?? "",
    help_en: question.help_en ?? "",
    help_ar: question.help_ar ?? "",
    required: question.required,
    options: question.options.map((o) => ({ label_en: o.label_en, label_ar: o.label_ar ?? "", value: o.value })),
    conditional_question_id: question.conditional_question_id ?? "",
    conditional_value: question.conditional_value ?? "",
  };

  const isEnabled = question.enabled !== false;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      className={`group ${isEnabled ? "" : "opacity-55"}`}
    >
      {/* Collapsed row */}
      <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--admin-hover-bg)] transition-colors cursor-pointer ${expanded ? "bg-[var(--admin-hover-bg)]" : ""}`}>
        <span className="text-[var(--admin-text-faint)] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} />
        </span>
        <span className="text-[11px] font-bold text-[var(--admin-text-faint)] w-5 text-center">{idx + 1}</span>
        <span className={isEnabled ? "text-[var(--admin-text-muted)]" : "text-[var(--admin-text-faint)]"}>{typeInfo?.icon}</span>
        <div className="flex-1 min-w-0" onClick={onToggle}>
          <p className="text-[13px] font-medium text-[var(--admin-text)] truncate">
            {question.label_en || <span className="text-[var(--admin-text-faint)] italic">{isAr ? "بدون عنوان" : "Untitled"}</span>}
            {!isEnabled && (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-text-faint)] bg-[var(--admin-hover-bg)] px-1.5 py-0.5 rounded">
                {isAr ? "معطّل" : "Disabled"}
              </span>
            )}
          </p>
          <p className="text-[11px] text-[var(--admin-text-muted)]">
            {isAr ? typeInfo?.labelAr : typeInfo?.labelEn}
            {question.required && <span className="ml-2 text-red-400">*</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Enable/Disable toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleEnabled(); }}
            disabled={togglingEnabled}
            title={isEnabled ? (isAr ? "تعطيل السؤال" : "Disable question") : (isAr ? "تفعيل السؤال" : "Enable question")}
            className={`p-1.5 rounded-lg transition-colors ${isEnabled ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600" : "text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-emerald-500"}`}
          >
            {isEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          {onSaveToLibrary && (
            <button
              onClick={(e) => { e.stopPropagation(); onSaveToLibrary(); }}
              title={isAr ? "حفظ في المكتبة" : "Save to Library"}
              className="p-1.5 rounded-lg text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-primary-pink transition-colors"
            >
              <Bookmark size={12} />
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <button onClick={onToggle} className="p-1 text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--admin-border)]"
          >
            <div className="p-5 bg-[var(--admin-hover-bg)]">
              <QuestionForm
                isAr={isAr}
                initial={initial}
                allQuestions={allQuestions.filter((q) => q.id !== question.id)}
                saving={saving}
                onSave={onSave}
                onCancel={onToggle}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Question Form ────────────────────────────────────────────────────────────

function QuestionForm({
  isAr, initial, allQuestions, saving, onSave, onCancel,
}: {
  isAr: boolean;
  initial: QuestionForm & { template_id: string };
  allQuestions: QuestionWithOptions[];
  saving: boolean;
  onSave: (form: QuestionForm & { template_id: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<QuestionForm & { template_id: string }>(initial);

  function set<K extends keyof QuestionForm>(k: K, v: QuestionForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function addOption() {
    set("options", [...form.options, { label_en: "", label_ar: "", value: "" }]);
  }

  function removeOption(i: number) {
    set("options", form.options.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, field: keyof OptionDraft, val: string) {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: val };
    // auto-fill value from label_en if empty
    if (field === "label_en" && !opts[i].value) {
      opts[i].value = val.toLowerCase().replace(/\s+/g, "_");
    }
    set("options", opts);
  }

  const showOptions = NEEDS_OPTIONS.includes(form.type);

  return (
    <div className="space-y-4">
      {/* Type + required row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>{isAr ? "نوع السؤال" : "Question Type"}</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as QuestionType)}
            className={INPUT}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {isAr ? t.labelAr : t.labelEn}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => set("required", e.target.checked)}
              className="w-4 h-4 accent-pink-500 rounded"
            />
            <span className="text-[13px] text-[var(--admin-text)]">
              {isAr ? "إلزامي" : "Required"}
            </span>
          </label>
        </div>
      </div>

      {/* Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Label (EN) *</label>
          <input value={form.label_en} onChange={(e) => set("label_en", e.target.value)} placeholder="Question label in English" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Label (AR)</label>
          <input dir="rtl" value={form.label_ar} onChange={(e) => set("label_ar", e.target.value)} placeholder="نص السؤال بالعربية" className={INPUT} />
        </div>
      </div>

      {/* Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Placeholder (EN)</label>
          <input value={form.placeholder_en} onChange={(e) => set("placeholder_en", e.target.value)} placeholder="Hint text in English…" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Placeholder (AR)</label>
          <input dir="rtl" value={form.placeholder_ar} onChange={(e) => set("placeholder_ar", e.target.value)} placeholder="نص تلميحي بالعربية…" className={INPUT} />
        </div>
      </div>

      {/* Help text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Help Text (EN)</label>
          <input value={form.help_en} onChange={(e) => set("help_en", e.target.value)} placeholder="Additional guidance in English…" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Help Text (AR)</label>
          <input dir="rtl" value={form.help_ar} onChange={(e) => set("help_ar", e.target.value)} placeholder="إرشادات إضافية بالعربية…" className={INPUT} />
        </div>
      </div>

      {/* Options (choice types) */}
      {showOptions && (
        <div className="border border-[var(--admin-border)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className={`${LABEL} mb-0`}>{isAr ? "الخيارات" : "Options"}</label>
            <button type="button" onClick={addOption} className="flex items-center gap-1 text-[11px] font-medium text-primary-pink hover:text-primary-pink/80 transition-colors">
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
              <button type="button" onClick={() => removeOption(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Conditional visibility */}
      {allQuestions.length > 0 && (
        <div className="border border-[var(--admin-border)] rounded-xl p-4 space-y-3">
          <label className={`${LABEL} mb-0`}>{isAr ? "الظهور المشروط (اختياري)" : "Conditional Visibility (optional)"}</label>
          <p className="text-[11px] text-[var(--admin-text-faint)]">
            {isAr ? "اعرض هذا السؤال فقط إذا كانت إجابة سؤال آخر تساوي قيمة معينة." : "Show this question only when another question's answer equals a specific value."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{isAr ? "إذا كان السؤال" : "If Question"}</label>
              <select
                value={form.conditional_question_id}
                onChange={(e) => set("conditional_question_id", e.target.value)}
                className={INPUT}
              >
                <option value="">{isAr ? "— لا يوجد —" : "— None —"}</option>
                {allQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label_en || "(untitled)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>{isAr ? "يساوي" : "Equals"}</label>
              <input
                value={form.conditional_value}
                onChange={(e) => set("conditional_value", e.target.value)}
                placeholder={isAr ? "القيمة المتوقعة…" : "Expected value…"}
                className={INPUT}
                disabled={!form.conditional_question_id}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
        >
          {isAr ? "إلغاء" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.label_en.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[12px] font-semibold disabled:opacity-60 transition-all"
        >
          <Save size={12} />
          {saving ? (isAr ? "جارٍ الحفظ…" : "Saving…") : (isAr ? "حفظ السؤال" : "Save Question")}
        </button>
      </div>
    </div>
  );
}
