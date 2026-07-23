import { useLanguage } from "@/context/LanguageContext";
import { useAdminLabels } from "@/admin/hooks/useAdminLabels";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, ArrowLeft, Save, X, GripVertical,
  Award, Eye, EyeOff, Upload, ImageOff,
} from "lucide-react";
import {
  getQualifications, createQualification, updateQualification,
  deleteQualification, reorderQualifications,
  getExpertise, createExpertise, updateExpertise,
  deleteExpertise, reorderExpertise,
  getCertifications, createCertification, updateCertification,
  deleteCertification, reorderCertifications,
  getCertSettings, updateCertSettings,
  getSectionSettings, updateSectionVisible,
  uploadCertLogo, deleteCertLogo,
} from "@/admin/repositories/aboutCms.repository";
import type {
  QualificationRow, ExpertiseRow, CertificationRow, CertSettingsRow,
  SectionSettingsRow,
} from "@/admin/repositories/aboutCms.repository";

// ── Style constants ──────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const lbl = "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

// ── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ── Tab config ───────────────────────────────────────────────────────────────
type TabId = "qualifications" | "expertise" | "certifications" | "settings";

// ── Text-item form (shared by Qualifications and Expertise) ──────────────────
interface TextItemForm {
  text_en: string;
  text_ar: string;
  active: boolean;
}

function initTextForm(): TextItemForm {
  return { text_en: "", text_ar: "", active: true };
}

// ── Certification form ───────────────────────────────────────────────────────
interface CertForm {
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  display_mode: "logo" | "initials";
  initials: string;
  logo_url: string;
  active: boolean;
}

function initCertForm(): CertForm {
  return {
    title_en: "", title_ar: "",
    subtitle_en: "", subtitle_ar: "",
    display_mode: "initials",
    initials: "",
    logo_url: "",
    active: true,
  };
}

// ── Settings form ─────────────────────────────────────────────────────────────
interface SettingsForm {
  visible: boolean;
  heading_en: string;
  heading_ar: string;
  description_en: string;
  description_ar: string;
  bg_color: string;
  note_en: string;
  note_ar: string;
}

function initSettingsForm(): SettingsForm {
  return {
    visible: true,
    heading_en: "", heading_ar: "",
    description_en: "", description_ar: "",
    bg_color: "#ffffff",
    note_en: "", note_ar: "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT ITEM LIST+EDIT (used for both Qualifications and Expertise tabs)
// ─────────────────────────────────────────────────────────────────────────────
type TextRow = QualificationRow | ExpertiseRow;

interface TextItemSectionProps {
  items: TextRow[];
  setItems: (items: TextRow[]) => void;
  loading: boolean;
  onReload: () => Promise<void>;
  onCreate: (patch: Pick<TextRow, "text_en" | "text_ar" | "active" | "sort_order">) => Promise<TextRow | null>;
  onUpdate: (id: string, patch: Partial<Omit<TextRow, "id" | "created_at" | "updated_at">>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorder: (items: Array<{ id: string; sort_order: number }>) => Promise<void>;
  singularEN: string;
  singularAR: string;
  L: (en: string, ar: string) => string;
  fl: (key: string) => string;
}

function TextItemSection({
  items, setItems, loading, onReload,
  onCreate, onUpdate, onDelete, onReorder,
  singularEN, singularAR, L, fl,
}: TextItemSectionProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<TextRow | null>(null);
  const [form, setFormState] = useState<TextItemForm>(initTextForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function set<K extends keyof TextItemForm>(k: K, v: TextItemForm[K]) {
    setFormState((p) => ({ ...p, [k]: v }));
  }

  function openNew() {
    setEditing(null);
    setFormState(initTextForm());
    setSaveError(null);
    setView("edit");
  }

  function openEdit(row: TextRow) {
    setEditing(row);
    setFormState({ text_en: row.text_en, text_ar: row.text_ar, active: row.active });
    setSaveError(null);
    setView("edit");
  }

  function cancel() { setView("list"); setEditing(null); setSaveError(null); }

  async function handleSave() {
    if (!form.text_en.trim() && !form.text_ar.trim()) {
      setSaveError(L("Please enter some text.", "يرجى إدخال نص."));
      return;
    }
    setSaving(true); setSaveError(null);
    let ok: boolean;
    if (editing) {
      ok = await onUpdate(editing.id, { text_en: form.text_en, text_ar: form.text_ar, active: form.active });
    } else {
      const created = await onCreate({
        text_en: form.text_en, text_ar: form.text_ar,
        active: form.active, sort_order: items.length,
      });
      ok = created !== null;
    }
    setSaving(false);
    if (!ok) { setSaveError(L("Save failed. Please try again.", "فشل الحفظ. يرجى المحاولة مرة أخرى.")); return; }
    await onReload();
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(L(`Delete this ${singularEN}?`, `حذف هذا العنصر؟`))) return;
    setDeletingId(id);
    await onDelete(id);
    await onReload();
    setDeletingId(null);
  }

  async function handleToggleActive(row: TextRow) {
    const updated = items.map((it) => it.id === row.id ? { ...it, active: !it.active } : it) as TextRow[];
    setItems(updated);
    await onUpdate(row.id, { active: !row.active });
  }

  return (
    <AnimatePresence mode="wait">
      {view === "list" ? (
        <motion.div key="list" {...fadeUp()}>
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {items.length} {L("items", "عناصر")}
              </p>
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Plus size={15} />
                {L(`Add ${singularEN}`, `إضافة ${singularAR}`)}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("Loading…", "جارٍ التحميل…")}</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {L(`No ${singularEN.toLowerCase()}s yet. Click "Add ${singularEN}" to get started.`, `لا توجد عناصر بعد. اضغط "إضافة ${singularAR}" للبدء.`)}
              </div>
            ) : (
              <div className="divide-y divide-[var(--admin-border)]">
                {items.map((row, i) => (
                  <div
                    key={row.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === i) return;
                      const reordered = [...items];
                      const [moved] = reordered.splice(dragIndex, 1);
                      reordered.splice(i, 0, moved);
                      const withOrder = reordered.map((item, idx) => ({ ...item, sort_order: idx })) as TextRow[];
                      setItems(withOrder);
                      onReorder(withOrder.map((item) => ({ id: item.id, sort_order: item.sort_order })));
                      setDragIndex(null); setDragOverIndex(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      dragIndex === i ? "opacity-50" : ""
                    } ${dragOverIndex === i && dragIndex !== i ? "bg-primary-pink/5 border-l-2 border-primary-pink" : "hover:bg-[var(--admin-hover-bg)]"}`}
                  >
                    {/* Drag handle */}
                    <div className="cursor-grab text-[var(--admin-text-faint)] hover:text-[var(--admin-text-muted)] shrink-0">
                      <GripVertical size={16} />
                    </div>

                    {/* Text preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--admin-text)] truncate">{row.text_en || <span className="italic opacity-40">(no EN text)</span>}</p>
                      <p className="text-[11px] text-[var(--admin-text-muted)] truncate mt-0.5" dir="rtl">{row.text_ar || <span className="italic opacity-40">(لا يوجد نص)</span>}</p>
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(row)}
                      className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        row.active
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100"
                          : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"
                      }`}
                    >
                      {row.active ? L("Active", "نشط") : L("Inactive", "معطّل")}
                    </button>

                    {/* Actions */}
                    <button
                      onClick={() => openEdit(row)}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-faint)] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div key="edit" {...fadeUp()}>
          {/* Action row */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={cancel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            >
              <ArrowLeft size={13} className="rtl:rotate-180" /> {L("Back", "رجوع")}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={cancel}
                className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <X size={13} className="inline me-1" /> {L("Cancel", "إلغاء")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? L("Saving…", "جارٍ الحفظ…") : editing ? L("Save Changes", "حفظ التغييرات") : L(`Add ${singularEN}`, `إضافة ${singularAR}`)}
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
                {editing ? L(`Edit ${singularEN}`, `تعديل العنصر`) : L(`New ${singularEN}`, `${singularAR} جديد`)}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* EN text */}
              <div>
                <label className={lbl}>{fl("text")} (EN)</label>
                <textarea
                  rows={2}
                  value={form.text_en}
                  onChange={(e) => set("text_en", e.target.value)}
                  className={`${inp} resize-y`}
                  placeholder={L("Enter text in English…", "أدخل النص بالإنجليزية…")}
                />
              </div>
              {/* AR text */}
              <div>
                <label className={lbl}>{fl("text")} (AR)</label>
                <textarea
                  dir="rtl"
                  rows={2}
                  value={form.text_ar}
                  onChange={(e) => set("text_ar", e.target.value)}
                  className={`${inp} resize-y`}
                  placeholder="أدخل النص بالعربية…"
                />
              </div>
              {/* Active */}
              <div className="flex items-center gap-3">
                <input
                  id="item-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
                <label htmlFor="item-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                  {L("Active (visible on site)", "نشط (مرئي على الموقع)")}
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
interface CertSectionProps {
  items: CertificationRow[];
  setItems: (items: CertificationRow[]) => void;
  loading: boolean;
  onReload: () => Promise<void>;
  L: (en: string, ar: string) => string;
  fl: (key: string) => string;
}

function CertSection({ items, setItems, loading, onReload, L, fl }: CertSectionProps) {
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<CertificationRow | null>(null);
  const [form, setFormState] = useState<CertForm>(initCertForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof CertForm>(k: K, v: CertForm[K]) {
    setFormState((p) => ({ ...p, [k]: v }));
  }

  function openNew() {
    setEditing(null);
    setFormState(initCertForm());
    setSaveError(null);
    setView("edit");
  }

  function openEdit(row: CertificationRow) {
    setEditing(row);
    setFormState({
      title_en: row.title_en,
      title_ar: row.title_ar,
      subtitle_en: row.subtitle_en ?? "",
      subtitle_ar: row.subtitle_ar ?? "",
      display_mode: row.display_mode,
      initials: row.initials ?? "",
      logo_url: row.logo_url ?? "",
      active: row.active,
    });
    setSaveError(null);
    setView("edit");
  }

  function cancel() { setView("list"); setEditing(null); setSaveError(null); }

  async function handleUpload(file: File) {
    setUploading(true);
    // Use a temp UUID for new items, or editing.id for existing
    const certId = editing ? editing.id : crypto.randomUUID();
    const url = await uploadCertLogo(certId, file);
    setUploading(false);
    if (url) {
      set("logo_url", url);
    }
  }

  async function handleRemoveLogo() {
    if (editing) {
      await deleteCertLogo(editing.id);
    }
    set("logo_url", "");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!form.title_en.trim() && !form.title_ar.trim()) {
      setSaveError(L("Please enter a title.", "يرجى إدخال عنوان."));
      return;
    }
    setSaving(true); setSaveError(null);
    const patch = {
      title_en: form.title_en,
      title_ar: form.title_ar,
      subtitle_en: form.subtitle_en || null,
      subtitle_ar: form.subtitle_ar || null,
      display_mode: form.display_mode,
      initials: form.display_mode === "initials" ? form.initials.toUpperCase() || null : null,
      logo_url: form.display_mode === "logo" ? form.logo_url || null : null,
      active: form.active,
    };
    let ok: boolean;
    if (editing) {
      ok = await updateCertification(editing.id, patch);
    } else {
      const created = await createCertification({
        ...patch,
        sort_order: items.length,
      });
      ok = created !== null;
    }
    setSaving(false);
    if (!ok) { setSaveError(L("Save failed. Please try again.", "فشل الحفظ. يرجى المحاولة مرة أخرى.")); return; }
    await onReload();
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(L("Delete this certification?", "حذف هذا الاعتماد؟"))) return;
    setDeletingId(id);
    await deleteCertification(id);
    await onReload();
    setDeletingId(null);
  }

  async function handleToggleActive(row: CertificationRow) {
    const updated = items.map((it) => it.id === row.id ? { ...it, active: !it.active } : it);
    setItems(updated);
    await updateCertification(row.id, { active: !row.active });
  }

  // Preview component
  function CertPreview() {
    const showLogo = form.display_mode === "logo" && form.logo_url;
    const showInitials = form.display_mode === "initials" && form.initials;
    return (
      <div className="mt-6 border-t border-[var(--admin-border)] pt-6">
        <p className={lbl}>{L("Card Preview", "معاينة البطاقة")}</p>
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover-bg)] max-w-xs">
          {showLogo ? (
            <img src={form.logo_url} alt="logo" className="w-10 h-10 object-contain rounded-lg bg-white p-0.5" />
          ) : showInitials ? (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-[11px] font-bold tracking-wide shrink-0">
              {form.initials.toUpperCase()}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)] flex items-center justify-center shrink-0">
              <Award size={18} className="text-[var(--admin-text-faint)]" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate">
              {form.title_en || <span className="italic opacity-40">{L("Title…", "العنوان…")}</span>}
            </p>
            {form.subtitle_en && (
              <p className="text-[11px] text-[var(--admin-text-muted)] truncate mt-0.5">{form.subtitle_en}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === "list" ? (
        <motion.div key="list" {...fadeUp()}>
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {items.length} {L("certifications", "اعتمادات")}
              </p>
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Plus size={15} />
                {L("Add Card", "إضافة بطاقة")}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{L("Loading…", "جارٍ التحميل…")}</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {L(`No certifications yet. Click "Add Card" to get started.`, `لا توجد اعتمادات بعد. اضغط "إضافة بطاقة" للبدء.`)}
              </div>
            ) : (
              <div className="divide-y divide-[var(--admin-border)]">
                {items.map((row, i) => (
                  <div
                    key={row.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === i) return;
                      const reordered = [...items];
                      const [moved] = reordered.splice(dragIndex, 1);
                      reordered.splice(i, 0, moved);
                      const withOrder = reordered.map((item, idx) => ({ ...item, sort_order: idx }));
                      setItems(withOrder);
                      reorderCertifications(withOrder.map((item) => ({ id: item.id, sort_order: item.sort_order })));
                      setDragIndex(null); setDragOverIndex(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      dragIndex === i ? "opacity-50" : ""
                    } ${dragOverIndex === i && dragIndex !== i ? "bg-primary-pink/5 border-l-2 border-primary-pink" : "hover:bg-[var(--admin-hover-bg)]"}`}
                  >
                    {/* Drag handle */}
                    <div className="cursor-grab text-[var(--admin-text-faint)] hover:text-[var(--admin-text-muted)] shrink-0">
                      <GripVertical size={16} />
                    </div>

                    {/* Logo/initials preview */}
                    {row.display_mode === "logo" && row.logo_url ? (
                      <img src={row.logo_url} alt={row.title_en} className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-[var(--admin-border)] shrink-0" />
                    ) : row.initials ? (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-[10px] font-bold tracking-wide shrink-0">
                        {row.initials}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)] flex items-center justify-center shrink-0">
                        <Award size={16} className="text-[var(--admin-text-faint)]" />
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--admin-text)] truncate">{row.title_en}</p>
                      {row.subtitle_en && (
                        <p className="text-[11px] text-[var(--admin-text-muted)] truncate mt-0.5">{row.subtitle_en}</p>
                      )}
                    </div>

                    {/* Display mode badge */}
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                      {row.display_mode === "logo" ? L("Logo", "شعار") : L("Initials", "أحرف")}
                    </span>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(row)}
                      className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        row.active
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100"
                          : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"
                      }`}
                    >
                      {row.active ? L("Active", "نشط") : L("Inactive", "معطّل")}
                    </button>

                    {/* Edit / Delete */}
                    <button
                      onClick={() => openEdit(row)}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--admin-text-faint)] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div key="edit" {...fadeUp()}>
          {/* Action row */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={cancel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            >
              <ArrowLeft size={13} className="rtl:rotate-180" /> {L("Back", "رجوع")}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={cancel}
                className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <X size={13} className="inline me-1" /> {L("Cancel", "إلغاء")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? L("Saving…", "جارٍ الحفظ…") : editing ? L("Save Changes", "حفظ التغييرات") : L("Add Card", "إضافة بطاقة")}
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
                {editing ? L("Edit Certification", "تعديل الاعتماد") : L("New Certification", "اعتماد جديد")}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Titles — 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>{fl("title")} (EN)</label>
                  <input
                    value={form.title_en}
                    onChange={(e) => set("title_en", e.target.value)}
                    className={inp}
                    placeholder={L("Title in English", "العنوان بالإنجليزية")}
                  />
                </div>
                <div>
                  <label className={lbl}>{fl("title")} (AR)</label>
                  <input
                    dir="rtl"
                    value={form.title_ar}
                    onChange={(e) => set("title_ar", e.target.value)}
                    className={inp}
                    placeholder="العنوان بالعربية"
                  />
                </div>
              </div>

              {/* Subtitles — 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>
                    {fl("subtitle")} (EN){" "}
                    <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
                  </label>
                  <input
                    value={form.subtitle_en}
                    onChange={(e) => set("subtitle_en", e.target.value)}
                    className={inp}
                    placeholder={L("e.g. Certified Nutrition Specialist", "مثال: أخصائي تغذية معتمد")}
                  />
                </div>
                <div>
                  <label className={lbl}>
                    {fl("subtitle")} (AR){" "}
                    <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
                  </label>
                  <input
                    dir="rtl"
                    value={form.subtitle_ar}
                    onChange={(e) => set("subtitle_ar", e.target.value)}
                    className={inp}
                    placeholder="مثال: أخصائي تغذية معتمد"
                  />
                </div>
              </div>

              {/* Display mode */}
              <div>
                <label className={lbl}>{L("Display Mode", "طريقة العرض")}</label>
                <div className="flex gap-3 mt-1">
                  {([
                    { value: "logo", labelEN: "Upload Logo Image", labelAR: "رفع صورة الشعار" },
                    { value: "initials", labelEN: "Show Initials", labelAR: "عرض الأحرف الأولى" },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors text-[13px] ${
                        form.display_mode === opt.value
                          ? "border-primary-pink/40 bg-primary-pink/5 text-[var(--admin-text)]"
                          : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="display_mode"
                        value={opt.value}
                        checked={form.display_mode === opt.value}
                        onChange={() => set("display_mode", opt.value)}
                        className="accent-pink-500"
                      />
                      {L(opt.labelEN, opt.labelAR)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Logo upload */}
              {form.display_mode === "logo" && (
                <div>
                  <label className={lbl}>{L("Logo Image", "صورة الشعار")}</label>
                  {form.logo_url ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
                      <img
                        src={form.logo_url}
                        alt="logo preview"
                        className="w-16 h-16 object-contain rounded-lg bg-white p-1 border border-[var(--admin-border)]"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] text-[var(--admin-text-muted)]">{L("Current logo", "الشعار الحالي")}</p>
                        <button
                          onClick={handleRemoveLogo}
                          className="mt-1 text-[12px] font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                          <ImageOff size={12} /> {L("Remove", "إزالة")}
                        </button>
                      </div>
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-colors">
                        <Upload size={12} /> {L("Replace", "استبدال")}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-[var(--admin-border)] cursor-pointer hover:border-primary-pink/40 hover:bg-primary-pink/5 transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                      {uploading ? (
                        <p className="text-[13px] text-[var(--admin-text-muted)]">{L("Uploading…", "جارٍ الرفع…")}</p>
                      ) : (
                        <>
                          <Upload size={24} className="text-[var(--admin-text-faint)]" />
                          <p className="text-[13px] text-[var(--admin-text-muted)]">{L("Click to upload logo image", "اضغط لرفع صورة الشعار")}</p>
                          <p className="text-[11px] text-[var(--admin-text-faint)]">PNG, JPG, WEBP, SVG</p>
                        </>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Initials */}
              {form.display_mode === "initials" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className={lbl}>
                      {L("Initials", "الأحرف الأولى")}{" "}
                      <span className="font-normal normal-case opacity-60">{L("(max 6 chars)", "(حد أقصى 6 أحرف)")}</span>
                    </label>
                    <input
                      value={form.initials}
                      onChange={(e) => set("initials", e.target.value.toUpperCase().slice(0, 6))}
                      className={inp}
                      maxLength={6}
                      placeholder="e.g. ACHS, IIN, CNS"
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--admin-text-faint)]">
                      {L("Abbreviation that will show on the card", "الاختصار الذي سيظهر على البطاقة")}
                    </p>
                  </div>
                  <div>
                    <label className={lbl}>{L("Initials Preview", "معاينة الأحرف")}</label>
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white font-bold text-[14px] tracking-wider shadow-sm">
                      {form.initials || "??"}
                    </div>
                  </div>
                </div>
              )}

              {/* Active */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  id="cert-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                />
                <label htmlFor="cert-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                  {L("Active (visible on site)", "نشط (مرئي على الموقع)")}
                </label>
              </div>

              {/* Live preview */}
              <CertPreview />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION SETTINGS TAB
// Manages visibility for all three About page sections plus certifications
// detailed settings (heading, description, bg, note).
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsSectionProps {
  L: (en: string, ar: string) => string;
  fl: (key: string) => string;
}

function SettingsSection({ L, fl }: SettingsSectionProps) {
  // ── Certifications detailed settings ─────────────────────────────────────
  const [certRow, setCertRow] = useState<CertSettingsRow | null>(null);
  const [form, setFormState]  = useState<SettingsForm>(initSettingsForm());

  // ── Section-level visibility (qualifications / expertise) ─────────────────
  const [qualVisible, setQualVisible] = useState(true);
  const [expVisible,  setExpVisible]  = useState(true);

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);

  function set<K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) {
    setFormState((p) => ({ ...p, [k]: v }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [certSettings, qualSettings, expSettings] = await Promise.all([
      getCertSettings(),
      getSectionSettings("qualifications"),
      getSectionSettings("expertise"),
    ]);

    setCertRow(certSettings);
    if (certSettings) {
      setFormState({
        visible:        certSettings.visible,
        heading_en:     certSettings.heading_en,
        heading_ar:     certSettings.heading_ar,
        description_en: certSettings.description_en ?? "",
        description_ar: certSettings.description_ar ?? "",
        bg_color:       certSettings.bg_color,
        note_en:        certSettings.note_en ?? "",
        note_ar:        certSettings.note_ar ?? "",
      });
    }

    setQualVisible(qualSettings?.visible ?? true);
    setExpVisible(expSettings?.visible ?? true);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true); setSaveError(null); setSaved(false);

    const results = await Promise.all([
      // Section visibility flags
      updateSectionVisible("qualifications", qualVisible),
      updateSectionVisible("expertise",      expVisible),
      // Certifications detailed settings
      certRow
        ? updateCertSettings(certRow.id, {
            visible:        form.visible,
            heading_en:     form.heading_en,
            heading_ar:     form.heading_ar,
            description_en: form.description_en || null,
            description_ar: form.description_ar || null,
            bg_color:       form.bg_color,
            note_en:        form.note_en || null,
            note_ar:        form.note_ar || null,
          })
        : Promise.resolve(false),
    ]);

    setSaving(false);
    const allOk = results.every(Boolean);
    if (!allOk) {
      setSaveError(L("Save failed. Please try again.", "فشل الحفظ. يرجى المحاولة مرة أخرى."));
      return;
    }
    setSaved(true);
    await load();
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
        {L("Loading…", "جارٍ التحميل…")}
      </div>
    );
  }

  // ── Shared toggle button renderer ─────────────────────────────────────────
  function VisibilityToggle({
    visible,
    onToggle,
  }: {
    visible: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
          visible
            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100"
            : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)] hover:bg-[var(--admin-border)]"
        }`}
      >
        {visible ? <Eye size={13} /> : <EyeOff size={13} />}
        {visible ? L("Visible", "مرئي") : L("Hidden", "مخفي")}
      </button>
    );
  }

  return (
    <motion.div {...fadeUp()} className="space-y-6">
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px]">
          <span className="font-semibold">⚠</span> {saveError}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px]">
          <span className="font-semibold">✓</span> {L("Settings saved successfully.", "تم حفظ الإعدادات بنجاح.")}
        </div>
      )}

      {/* ── Section Visibility Card ─────────────────────────────────────── */}
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--admin-border)]">
          <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
            {L("Section Visibility", "ظهور الأقسام")}
          </h2>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            {L(
              "Show or hide each section on the public About page. Hidden sections leave no empty space.",
              "تحكم في ظهور كل قسم على صفحة من نحن. الأقسام المخفية لا تترك فراغاً."
            )}
          </p>
        </div>
        <div className="divide-y divide-[var(--admin-border)]">

          {/* Qualifications row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {L("Qualifications", "المؤهلات والخبرات")}
              </p>
              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                {L(
                  "Credential bullet list shown in the About section",
                  "قائمة المؤهلات المعروضة في قسم من نحن"
                )}
              </p>
            </div>
            <VisibilityToggle
              visible={qualVisible}
              onToggle={() => setQualVisible((v) => !v)}
            />
          </div>

          {/* Expertise row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {L("Areas of Expertise", "مجالات التخصص")}
              </p>
              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                {L(
                  "Specialisation bullet list shown below qualifications",
                  "قائمة التخصصات المعروضة أسفل المؤهلات"
                )}
              </p>
            </div>
            <VisibilityToggle
              visible={expVisible}
              onToggle={() => setExpVisible((v) => !v)}
            />
          </div>

          {/* Certifications row */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {L("Certifications & Associations", "الشهادات والاعتمادات")}
              </p>
              <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                {L(
                  "Full credential cards grid at the bottom of the About page",
                  "شبكة بطاقات الاعتمادات في أسفل صفحة من نحن"
                )}
              </p>
            </div>
            <VisibilityToggle
              visible={form.visible}
              onToggle={() => set("visible", !form.visible)}
            />
          </div>
        </div>
      </div>

      {/* ── Certifications Detailed Settings ───────────────────────────── */}
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--admin-border)]">
          <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
            {L("Certifications Section Settings", "إعدادات قسم الشهادات والاعتمادات")}
          </h2>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
            {L("Heading, description, background colour, and optional note for the cards grid.", "عنوان القسم والوصف ولون الخلفية والملاحظة الاختيارية لشبكة البطاقات.")}
          </p>
        </div>
        <div className="p-6 space-y-6">

          {/* Headings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>{fl("heading")} (EN)</label>
              <input
                value={form.heading_en}
                onChange={(e) => set("heading_en", e.target.value)}
                className={inp}
                placeholder={L("Section heading in English", "عنوان القسم بالإنجليزية")}
              />
            </div>
            <div>
              <label className={lbl}>{fl("heading")} (AR)</label>
              <input
                dir="rtl"
                value={form.heading_ar}
                onChange={(e) => set("heading_ar", e.target.value)}
                className={inp}
                placeholder="عنوان القسم بالعربية"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>
                {fl("description")} (EN){" "}
                <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
              </label>
              <textarea
                rows={3}
                value={form.description_en}
                onChange={(e) => set("description_en", e.target.value)}
                className={`${inp} resize-y`}
                placeholder={L("Section description in English…", "وصف القسم بالإنجليزية…")}
              />
            </div>
            <div>
              <label className={lbl}>
                {fl("description")} (AR){" "}
                <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
              </label>
              <textarea
                dir="rtl"
                rows={3}
                value={form.description_ar}
                onChange={(e) => set("description_ar", e.target.value)}
                className={`${inp} resize-y`}
                placeholder="وصف القسم بالعربية…"
              />
            </div>
          </div>

          {/* Background color */}
          <div>
            <label className={lbl}>{L("Background Color", "لون الخلفية")}</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={form.bg_color}
                onChange={(e) => set("bg_color", e.target.value)}
                className="w-10 h-10 rounded-lg border border-[var(--admin-border)] cursor-pointer p-0.5 bg-[var(--admin-surface)]"
              />
              <input
                value={form.bg_color}
                onChange={(e) => set("bg_color", e.target.value)}
                className={`${inp} w-36 font-mono`}
                placeholder="#ffffff"
              />
              <div
                className="w-10 h-10 rounded-lg border border-[var(--admin-border)] shrink-0"
                style={{ backgroundColor: form.bg_color }}
              />
              <p className="text-[11px] text-[var(--admin-text-faint)]">
                {L("Background colour behind the certification cards", "لون الخلفية خلف بطاقات الاعتمادات")}
              </p>
            </div>
          </div>

          {/* Note below cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>
                {L("Note Below Cards", "ملاحظة أسفل البطاقات")} (EN){" "}
                <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
              </label>
              <textarea
                rows={2}
                value={form.note_en}
                onChange={(e) => set("note_en", e.target.value)}
                className={`${inp} resize-y`}
                placeholder={L("Small note displayed below the cards…", "ملاحظة صغيرة تظهر أسفل البطاقات…")}
              />
            </div>
            <div>
              <label className={lbl}>
                {L("Note Below Cards", "ملاحظة أسفل البطاقات")} (AR){" "}
                <span className="font-normal normal-case opacity-60">— {L("optional", "اختياري")}</span>
              </label>
              <textarea
                dir="rtl"
                rows={2}
                value={form.note_ar}
                onChange={(e) => set("note_ar", e.target.value)}
                className={`${inp} resize-y`}
                placeholder="ملاحظة صغيرة تظهر أسفل البطاقات…"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="border-t border-[var(--admin-border)] pt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? L("Saving…", "جارٍ الحفظ…") : L("Save All Settings", "حفظ جميع الإعدادات")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AboutAdminPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const fl = useAdminLabels();
  const L = (en: string, arStr: string) => ar ? arStr : en;

  const [activeTab, setActiveTab] = useState<TabId>("qualifications");

  // Data
  const [qualifications, setQualifications] = useState<QualificationRow[]>([]);
  const [expertise, setExpertise] = useState<ExpertiseRow[]>([]);
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);
  const [qualLoading, setQualLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(true);
  const [certLoading, setCertLoading] = useState(true);

  const loadQualifications = useCallback(async () => {
    setQualLoading(true);
    setQualifications(await getQualifications());
    setQualLoading(false);
  }, []);

  const loadExpertise = useCallback(async () => {
    setExpLoading(true);
    setExpertise(await getExpertise());
    setExpLoading(false);
  }, []);

  const loadCertifications = useCallback(async () => {
    setCertLoading(true);
    setCertifications(await getCertifications());
    setCertLoading(false);
  }, []);

  useEffect(() => { loadQualifications(); }, [loadQualifications]);
  useEffect(() => { loadExpertise(); }, [loadExpertise]);
  useEffect(() => { loadCertifications(); }, [loadCertifications]);

  const TABS: { id: TabId; labelEN: string; labelAR: string }[] = [
    { id: "qualifications",  labelEN: "Qualifications",       labelAR: "أهلية ومؤهلات" },
    { id: "expertise",       labelEN: "Areas of Expertise",   labelAR: "مجالات التخصص" },
    { id: "certifications",  labelEN: "Certifications",       labelAR: "الشهادات والاعتمادات" },
    { id: "settings",        labelEN: "Section Settings",     labelAR: "إعدادات القسم" },
  ];

  return (
    <div>
      <PageHeader
        title={L("About Page CMS", "إدارة صفحة من نحن")}
        description={L(
          "Manage qualifications, expertise, certifications, and section settings for the About page.",
          "أدِر المؤهلات ومجالات التخصص والشهادات وإعدادات قسم صفحة من نحن."
        )}
        breadcrumbs={[
          { label: L("Admin", "الإدارة"), href: "/admin" },
          { label: L("About CMS", "صفحة من نحن") },
        ]}
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 p-1 rounded-xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm border border-[var(--admin-border)]"
                : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface)]/50"
            }`}
          >
            {ar ? tab.labelAR : tab.labelEN}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "qualifications" && (
          <motion.div key="qualifications" {...fadeUp()}>
            <TextItemSection
              items={qualifications}
              setItems={(items) => setQualifications(items as QualificationRow[])}
              loading={qualLoading}
              onReload={loadQualifications}
              onCreate={(patch) => createQualification(patch as Pick<QualificationRow, "text_en" | "text_ar" | "active" | "sort_order">)}
              onUpdate={(id, patch) => updateQualification(id, patch)}
              onDelete={(id) => deleteQualification(id)}
              onReorder={(items) => reorderQualifications(items)}
              singularEN="Qualification"
              singularAR="مؤهل"
              L={L}
              fl={fl}
            />
          </motion.div>
        )}

        {activeTab === "expertise" && (
          <motion.div key="expertise" {...fadeUp()}>
            <TextItemSection
              items={expertise}
              setItems={(items) => setExpertise(items as ExpertiseRow[])}
              loading={expLoading}
              onReload={loadExpertise}
              onCreate={(patch) => createExpertise(patch as Pick<ExpertiseRow, "text_en" | "text_ar" | "active" | "sort_order">)}
              onUpdate={(id, patch) => updateExpertise(id, patch)}
              onDelete={(id) => deleteExpertise(id)}
              onReorder={(items) => reorderExpertise(items)}
              singularEN="Expertise"
              singularAR="تخصص"
              L={L}
              fl={fl}
            />
          </motion.div>
        )}

        {activeTab === "certifications" && (
          <motion.div key="certifications" {...fadeUp()}>
            <CertSection
              items={certifications}
              setItems={setCertifications}
              loading={certLoading}
              onReload={loadCertifications}
              L={L}
              fl={fl}
            />
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div key="settings" {...fadeUp()}>
            <SettingsSection L={L} fl={fl} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
