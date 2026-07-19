import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X } from "lucide-react";
import {
  getAllStories,
  createStory,
  updateStory,
  deleteStory,
} from "@/admin/repositories/success_stories.repository";
import type { SuccessStoryRow } from "@/types/database.types";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Row = SuccessStoryRow;
type FormData = Omit<Row, "id" | "created_at" | "updated_at">;

function initForm(): FormData {
  return {
    title_en: "",
    title_ar: "",
    client_name_en: "",
    client_name_ar: "",
    story_en: "",
    story_ar: "",
    before_image_url: "",
    after_image_url: "",
    publish_date: null,
    published: false,
    sort_order: 0,
  };
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors";
const labelCls =
  "block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5";

export default function SuccessStoriesAdminPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<FormData>(initForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllStories();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(initForm());
    setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      title_en:         row.title_en         ?? "",
      title_ar:         row.title_ar         ?? "",
      client_name_en:   row.client_name_en   ?? "",
      client_name_ar:   row.client_name_ar   ?? "",
      story_en:         row.story_en         ?? "",
      story_ar:         row.story_ar         ?? "",
      before_image_url: row.before_image_url ?? "",
      after_image_url:  row.after_image_url  ?? "",
      publish_date:     row.publish_date     ?? null,
      published:        row.published        ?? false,
      sort_order:       row.sort_order       ?? 0,
    });
    setView("edit");
  }

  function cancel() {
    setView("list");
    setEditing(null);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await updateStory(editing.id, form);
    } else {
      await createStory(form);
    }
    await load();
    setSaving(false);
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm(isAr ? "هل تريدين حذف هذه القصة؟" : "Delete this success story?")) return;
    setDeletingId(id);
    await deleteStory(id);
    await load();
    setDeletingId(null);
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <div>
      <PageHeader
        title={t("Success Stories", "قصص النجاح")}
        description={t(
          "Manage client success stories and transformation highlights.",
          "إدارة قصص نجاح العملاء وأبرز التحولات.",
        )}
        breadcrumbs={[
          { label: t("Admin", "الإدارة"), href: "/admin" },
          { label: t("Success Stories", "قصص النجاح") },
        ]}
      />

      <AnimatePresence mode="wait">
        {/* ─── List view ─────────────────────────────────────────────────── */}
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {isAr
                  ? `${rows.length} قصة`
                  : `${rows.length} stor${rows.length !== 1 ? "ies" : "y"}`}
              </p>
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Plus size={15} />
                {t("New Story", "إضافة قصة")}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {t("Loading…", "جارٍ التحميل…")}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">
                {t("No success stories yet.", "لا توجد قصص بعد.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((row, i) => {
                  // Language-aware display values — prefer active language, fall back to other.
                  const displayTitle = isAr
                    ? (row.title_ar || row.title_en || "")
                    : (row.title_en || row.title_ar || "");
                  const displayClientName = isAr
                    ? (row.client_name_ar || row.client_name_en || "")
                    : (row.client_name_en || row.client_name_ar || "");
                  const displayStory = isAr
                    ? (row.story_ar || row.story_en || "")
                    : (row.story_en || row.story_ar || "");
                  // Secondary caption: show the other language as a subtle hint.
                  const secondaryTitle = isAr
                    ? (row.title_en || "")
                    : (row.title_ar || "");

                  const hasBoth = !!(row.before_image_url && row.after_image_url);
                  const singleImg = row.before_image_url || row.after_image_url || null;

                  return (
                    <motion.div key={row.id} {...fadeUp(i * 0.05)}>
                      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
                        {/* Image preview */}
                        {hasBoth ? (
                          <div className="grid grid-cols-2 gap-px">
                            <div className="relative">
                              <img
                                src={row.before_image_url!}
                                alt={t("Before", "قبل")}
                                className="w-full h-36 object-cover"
                              />
                              <span className="absolute bottom-1 start-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white">
                                {t("Before", "قبل")}
                              </span>
                            </div>
                            <div className="relative">
                              <img
                                src={row.after_image_url!}
                                alt={t("After", "بعد")}
                                className="w-full h-36 object-cover"
                              />
                              <span className="absolute bottom-1 start-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white">
                                {t("After", "بعد")}
                              </span>
                            </div>
                          </div>
                        ) : singleImg ? (
                          <img
                            src={singleImg}
                            alt={displayTitle || displayClientName || t("Story", "قصة")}
                            className="w-full h-36 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
                            <span className="text-[12px] text-[var(--admin-text-faint)] italic">
                              {t("No image yet", "لا توجد صورة")}
                            </span>
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          {/* Title + badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className="text-[14px] font-semibold text-[var(--admin-text)] truncate"
                                dir={isAr ? "rtl" : "ltr"}
                              >
                                {displayTitle || displayClientName || (
                                  <span className="italic text-[var(--admin-text-faint)]">
                                    {t("Untitled", "بدون عنوان")}
                                  </span>
                                )}
                              </p>
                              {/* Show the other language's title as a subtle secondary label */}
                              {secondaryTitle && (
                                <p
                                  className="text-[11px] text-[var(--admin-text-muted)] truncate mt-0.5"
                                  dir={isAr ? "ltr" : "rtl"}
                                >
                                  {secondaryTitle}
                                </p>
                              )}
                              {row.publish_date && (
                                <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">
                                  {new Date(row.publish_date).toLocaleDateString(
                                    isAr ? "ar-SA" : "en-US",
                                    { year: "numeric", month: "short" },
                                  )}
                                </p>
                              )}
                            </div>
                            {row.published ? (
                              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shrink-0">
                                {t("Published", "منشور")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)] shrink-0">
                                {t("Draft", "مسودة")}
                              </span>
                            )}
                          </div>

                          {/* Story preview */}
                          {displayStory && (
                            <p
                              className="text-[12px] text-[var(--admin-text-muted)] line-clamp-2 leading-relaxed"
                              dir={isAr ? "rtl" : "ltr"}
                            >
                              {displayStory}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-[var(--admin-border)]">
                            <button
                              onClick={() => openEdit(row)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                            >
                              <Pencil size={12} />
                              {t("Edit", "تعديل")}
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              disabled={deletingId === row.id}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              {deletingId === row.id
                                ? t("Deleting…", "جارٍ الحذف…")
                                : t("Delete", "حذف")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

        ) : (
          /* ─── Edit / Create view ───────────────────────────────────────── */
          <motion.div key="edit" {...fadeUp()}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={cancel}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <ArrowLeft size={13} className="rtl:rotate-180" />
                {t("Back", "رجوع")}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancel}
                  className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1"
                >
                  <X size={13} />
                  {t("Cancel", "إلغاء")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-70"
                >
                  <Save size={14} />
                  {saving
                    ? t("Saving…", "جارٍ الحفظ…")
                    : editing
                    ? t("Save Changes", "حفظ التغييرات")
                    : t("Create Story", "إنشاء قصة")}
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing
                    ? t("Edit Success Story", "تعديل قصة النجاح")
                    : t("New Success Story", "قصة نجاح جديدة")}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Title (EN)", "العنوان (EN)")}</label>
                    <input
                      value={form.title_en ?? ""}
                      onChange={(e) => setField("title_en", e.target.value)}
                      className={inputCls}
                      placeholder="Lost 18 kg in 3 months"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Title (AR)", "العنوان (AR)")}</label>
                    <input
                      dir="rtl"
                      value={form.title_ar ?? ""}
                      onChange={(e) => setField("title_ar", e.target.value)}
                      className={inputCls}
                      placeholder="خسرت ١٨ كجم في ٣ أشهر"
                    />
                  </div>
                </div>

                {/* Client Name — optional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      {t("Client Name (EN) — optional", "اسم العميل (EN) — اختياري")}
                    </label>
                    <input
                      value={form.client_name_en ?? ""}
                      onChange={(e) => setField("client_name_en", e.target.value)}
                      className={inputCls}
                      placeholder="Sarah A."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {t("Client Name (AR) — optional", "اسم العميل (AR) — اختياري")}
                    </label>
                    <input
                      dir="rtl"
                      value={form.client_name_ar ?? ""}
                      onChange={(e) => setField("client_name_ar", e.target.value)}
                      className={inputCls}
                      placeholder="سارة أ."
                    />
                  </div>
                </div>

                {/* Story text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t("Story (EN)", "القصة (EN)")}</label>
                    <textarea
                      rows={5}
                      value={form.story_en ?? ""}
                      onChange={(e) => setField("story_en", e.target.value)}
                      className={`${inputCls} resize-y`}
                      placeholder="Write the client's transformation story in English…"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("Story (AR)", "القصة (AR)")}</label>
                    <textarea
                      dir="rtl"
                      rows={5}
                      value={form.story_ar ?? ""}
                      onChange={(e) => setField("story_ar", e.target.value)}
                      className={`${inputCls} resize-y`}
                      placeholder="اكتب قصة تحول العميل بالعربية…"
                    />
                  </div>
                </div>

                {/* Before / After images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>{t("Before Photo", "صورة قبل")}</label>
                    <FileUploadField
                      value={form.before_image_url ?? ""}
                      onChange={(url) => setField("before_image_url", url)}
                      folder="success-stories"
                      lang={lang}
                      placeholder="https://… or upload"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{t("After Photo", "صورة بعد")}</label>
                    <FileUploadField
                      value={form.after_image_url ?? ""}
                      onChange={(url) => setField("after_image_url", url)}
                      folder="success-stories"
                      lang={lang}
                      placeholder="https://… or upload"
                    />
                  </div>
                </div>

                {/* Settings row */}
                <div className="border-t border-[var(--admin-border)] pt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">
                    {t("Settings", "الإعدادات")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Publish Date */}
                    <div>
                      <label className={labelCls}>
                        {t("Publish Date (optional)", "تاريخ النشر (اختياري)")}
                      </label>
                      <input
                        type="date"
                        value={form.publish_date ?? ""}
                        onChange={(e) =>
                          setField("publish_date", e.target.value || null)
                        }
                        className={inputCls}
                      />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className={labelCls}>
                        {t("Sort Order", "ترتيب العرض")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.sort_order ?? 0}
                        onChange={(e) => setField("sort_order", Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>

                    {/* Published */}
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id="story-published"
                        type="checkbox"
                        checked={form.published ?? false}
                        onChange={(e) => setField("published", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label
                        htmlFor="story-published"
                        className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none"
                      >
                        {t("Published (visible on site)", "منشور (مرئي على الموقع)")}
                      </label>
                    </div>
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
