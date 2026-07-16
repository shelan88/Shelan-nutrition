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

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    client_name_en: "",
    client_name_ar: "",
    story_en: "",
    story_ar: "",
    before_description_en: "",
    before_description_ar: "",
    result_description_en: "",
    result_description_ar: "",
    image_url: "",
    published: false,
    sort_order: 0,
  };
}

export default function SuccessStoriesAdminPage() {
  const { lang } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(initForm());
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
      client_name_en: row.client_name_en ?? "",
      client_name_ar: row.client_name_ar ?? "",
      story_en: row.story_en ?? "",
      story_ar: row.story_ar ?? "",
      before_description_en: row.before_description_en ?? "",
      before_description_ar: row.before_description_ar ?? "",
      result_description_en: row.result_description_en ?? "",
      result_description_ar: row.result_description_ar ?? "",
      image_url: row.image_url ?? "",
      published: row.published ?? false,
      sort_order: row.sort_order ?? 0,
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
    if (!window.confirm("Delete this success story?")) return;
    setDeletingId(id);
    await deleteStory(id);
    await load();
    setDeletingId(null);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "قصص النجاح" : "Success Stories"}
        description={lang === "ar" ? "إدارة قصص نجاح العملاء وأبرز التحولات." : "Manage client success stories and transformation highlights."}
        breadcrumbs={[{ label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" }, { label: lang === "ar" ? "قصص النجاح" : "Success Stories" }]}
      />

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {lang === "ar" ? `${rows.length} قصة` : `${rows.length} stor${rows.length !== 1 ? "ies" : "y"}`}
              </p>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                <Plus size={15} />
                {lang === "ar" ? "إضافة قصة" : "New Story"}
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{lang === "ar" ? "لا توجد قصص بعد." : "No success stories yet."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((row, i) => (
                  <motion.div key={row.id} {...fadeUp(i * 0.05)}>
                    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
                      {/* Image or gradient placeholder */}
                      {row.image_url ? (
                        <img
                          src={row.image_url}
                          alt={row.client_name_en ?? "Story"}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-primary-pink/20 to-lavender-purple/20 flex items-center justify-center">
                          <span className="text-[13px] text-[var(--admin-text-faint)] italic">No image</span>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        {/* Name + badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--admin-text)] truncate">
                              {row.client_name_en || <span className="italic text-[var(--admin-text-faint)]">Unnamed</span>}
                            </p>
                            <p className="text-[11px] text-[var(--admin-text-muted)] truncate mt-0.5" dir="rtl">
                              {row.client_name_ar}
                            </p>
                          </div>
                          {row.published ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shrink-0">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)] shrink-0">
                              Draft
                            </span>
                          )}
                        </div>

                        {/* Story preview */}
                        {row.story_en && (
                          <p className="text-[12px] text-[var(--admin-text-muted)] line-clamp-2 leading-relaxed">
                            {row.story_en}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[var(--admin-border)]">
                          <button
                            onClick={() => openEdit(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            disabled={deletingId === row.id}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} /> {deletingId === row.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="edit" {...fadeUp()}>
            {/* Edit toolbar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={cancel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                <ArrowLeft size={13} className="rtl:rotate-180" /> {lang === "ar" ? "رجوع" : "Back"}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={13} className="inline mr-1" /> {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Save size={14} />
                  {saving ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : editing ? (lang === "ar" ? "حفظ التغييرات" : "Save Changes") : (lang === "ar" ? "إنشاء قصة" : "Create Story")}
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing ? "Edit Success Story" : "New Success Story"}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Client Name (EN)</label>
                    <input
                      value={form.client_name_en}
                      onChange={(e) => set("client_name_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="Sarah Ahmed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Client Name (AR)</label>
                    <input
                      dir="rtl"
                      value={form.client_name_ar}
                      onChange={(e) => set("client_name_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="سارة أحمد"
                    />
                  </div>
                </div>

                {/* Story */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Story (EN)</label>
                    <textarea
                      rows={5}
                      value={form.story_en}
                      onChange={(e) => set("story_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Write the client's story in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Story (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={5}
                      value={form.story_ar}
                      onChange={(e) => set("story_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="اكتب قصة العميل بالعربية…"
                    />
                  </div>
                </div>

                {/* Before description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Before — What They Experienced (EN)</label>
                    <textarea
                      rows={3}
                      value={form.before_description_en}
                      onChange={(e) => set("before_description_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Describe the client's situation before…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Before — What They Experienced (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={3}
                      value={form.before_description_ar}
                      onChange={(e) => set("before_description_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="صف حالة العميل قبل البرنامج…"
                    />
                  </div>
                </div>

                {/* Result description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Result — The Transformation (EN)</label>
                    <textarea
                      rows={3}
                      value={form.result_description_en}
                      onChange={(e) => set("result_description_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Describe the transformation achieved…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Result — The Transformation (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={3}
                      value={form.result_description_ar}
                      onChange={(e) => set("result_description_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="صف التحول الذي تم تحقيقه…"
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* Image URL */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Image URL</label>
                      <FileUploadField
                        value={form.image_url ?? ""}
                        onChange={(url) => set("image_url", url)}
                        folder="success-stories"
                      />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Sort Order</label>
                      <input
                        type="number"
                        min={0}
                        value={form.sort_order ?? 0}
                        onChange={(e) => set("sort_order", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      />
                    </div>

                    {/* Published */}
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id="story-published"
                        type="checkbox"
                        checked={form.published ?? false}
                        onChange={(e) => set("published", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor="story-published" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        Published (visible on site)
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
