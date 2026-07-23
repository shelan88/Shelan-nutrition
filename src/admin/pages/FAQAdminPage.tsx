import { useLanguage } from "@/context/LanguageContext";
import { useAdminLabels } from "@/admin/hooks/useAdminLabels";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, Search } from "lucide-react";
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "@/admin/repositories/faqs.repository";
import type { FAQRow } from "@/types/database.types";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Row = FAQRow;

const CATEGORIES = ["general", "lipedema", "nutrition", "wellness", "booking"] as const;
type Category = (typeof CATEGORIES)[number];

function initForm(): Omit<Row, "id" | "created_at"> {
  return {
    question_en: "",
    question_ar: "",
    answer_en: "",
    answer_ar: "",
    category: "general",
    sort_order: 0,
    published: false,
  };
}

export default function FAQAdminPage() {
  const { lang } = useLanguage();
  const fl = useAdminLabels();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllFAQs();
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
      question_en: row.question_en ?? "",
      question_ar: row.question_ar ?? "",
      answer_en: row.answer_en ?? "",
      answer_ar: row.answer_ar ?? "",
      category: row.category ?? "general",
      sort_order: row.sort_order ?? 0,
      published: row.published ?? false,
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
      await updateFAQ(editing.id, form);
    } else {
      await createFAQ(form);
    }
    await load();
    setSaving(false);
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this FAQ?")) return;
    setDeletingId(id);
    await deleteFAQ(id);
    await load();
    setDeletingId(null);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const filtered = rows.filter((r) => {
    const matchCat = categoryFilter === "all" || r.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (r.question_en ?? "").toLowerCase().includes(q) || (r.question_ar ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الأسئلة الشائعة" : "FAQs"}
        description={lang === "ar" ? "إدارة الأسئلة الشائعة المعروضة على الموقع." : "Manage frequently asked questions displayed on the website."}
        breadcrumbs={[{ label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" }, { label: lang === "ar" ? "الأسئلة الشائعة" : "FAQs" }]}
        actions={
          view === "list" ? (
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap">
              <Plus size={15} />
              {lang === "ar" ? "إضافة سؤال" : "New FAQ"}
            </button>
          ) : undefined
        }
      />

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[var(--admin-border)]">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={lang === "ar" ? "ابحث عن سؤال…" : "Search questions…"}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                  />
                </div>
                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as "all" | Category)}
                  className="px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer shrink-0"
                >
                  <option value="all">{lang === "ar" ? "كل الفئات" : "All Categories"}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">{lang === "ar" ? "لا توجد أسئلة." : "No FAQs found."}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--admin-hover-bg)]">
                      <tr>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">#</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "السؤال" : "Question"}</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "الفئة" : "Category"}</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "الحالة" : "Status"}</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row, i) => (
                        <tr key={row.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text-muted)]">{row.sort_order ?? i + 1}</td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)] max-w-[260px]">
                            <p className="line-clamp-2 font-medium break-words">{row.question_en}</p>
                            <p className="line-clamp-1 text-[11px] text-[var(--admin-text-muted)] mt-0.5 break-words" dir="rtl">{row.question_ar}</p>
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)] capitalize">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[13px]">
                            {row.published ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">{lang === "ar" ? "منشور" : "Published"}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">{lang === "ar" ? "مسودة" : "Draft"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(row)} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1">
                                <Pencil size={12} /> {lang === "ar" ? "تعديل" : "Edit"}
                              </button>
                              <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1">
                                <Trash2 size={12} /> {deletingId === row.id ? "…" : (lang === "ar" ? "حذف" : "Delete")}
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
          <motion.div key="edit" {...fadeUp()}>
            {/* Edit toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <button onClick={cancel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors shrink-0">
                <ArrowLeft size={13} className="rtl:rotate-180" /> {lang === "ar" ? "رجوع" : "Back"}
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={cancel} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors whitespace-nowrap">
                  <X size={13} className="inline mr-1" /> {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all whitespace-nowrap">
                  <Save size={14} />
                  {saving ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : editing ? (lang === "ar" ? "حفظ التغييرات" : "Save Changes") : (lang === "ar" ? "إنشاء سؤال" : "Create FAQ")}
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing ? (lang === "ar" ? "تعديل السؤال" : "Edit FAQ") : (lang === "ar" ? "سؤال جديد" : "New FAQ")}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Question bilingual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("question")} (EN)</label>
                    <textarea
                      rows={2}
                      value={form.question_en}
                      onChange={(e) => set("question_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Type the question in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("question")} (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={2}
                      value={form.question_ar ?? ""}
                      onChange={(e) => set("question_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="اكتب السؤال بالعربية…"
                    />
                  </div>
                </div>

                {/* Answer bilingual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("answer")} (EN)</label>
                    <textarea
                      rows={4}
                      value={form.answer_en}
                      onChange={(e) => set("answer_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Write the answer in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("answer")} (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={4}
                      value={form.answer_ar ?? ""}
                      onChange={(e) => set("answer_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="اكتب الإجابة بالعربية…"
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{lang === "ar" ? "الإعدادات" : "Settings"}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("category")}</label>
                      <select
                        value={form.category ?? "general"}
                        onChange={(e) => set("category", e.target.value as Category)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">{fl("sortOrder")}</label>
                      <input
                        type="number"
                        value={form.sort_order ?? 0}
                        onChange={(e) => set("sort_order", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        min={0}
                      />
                    </div>

                    {/* Published */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">
                        Status
                      </label>
                      <div className="flex items-center gap-3 h-[38px]">
                        <input
                          id="faq-published"
                          type="checkbox"
                          checked={form.published ?? false}
                          onChange={(e) => set("published", e.target.checked)}
                          className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                        />
                        <label htmlFor="faq-published" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                          {lang === "ar" ? "منشور (مرئي على الموقع)" : "Published (visible on site)"}
                        </label>
                      </div>
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
