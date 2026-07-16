import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X } from "lucide-react";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/admin/repositories/testimonials.repository";
import type { TestimonialRow } from "@/types/database.types";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Row = TestimonialRow;

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    client_name: "",
    client_name_ar: "",
    content_en: "",
    content_ar: "",
    rating: 5,
    published: false,
    avatar_url: "",
    role_en: "",
    role_ar: "",
  };
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
        >
          <span
            className={
              star <= (hovered || value)
                ? "text-yellow-400"
                : "text-[var(--admin-border)]"
            }
          >
            ★
          </span>
        </button>
      ))}
      <span className="ml-2 text-[12px] text-[var(--admin-text-muted)]">
        {value} / 5
      </span>
    </div>
  );
}

export default function TestimonialsAdminPage() {
  const { language } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllTestimonials();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(initForm());
    setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      client_name: row.client_name ?? "",
      client_name_ar: row.client_name_ar ?? "",
      content_en: row.content_en ?? "",
      content_ar: row.content_ar ?? "",
      rating: row.rating ?? 5,
      published: row.published ?? false,
      avatar_url: row.avatar_url ?? "",
      role_en: row.role_en ?? "",
      role_ar: row.role_ar ?? "",
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
      await updateTestimonial(editing.id, form);
    } else {
      await createTestimonial(form);
    }
    await load();
    setSaving(false);
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this testimonial?")) return;
    setDeletingId(id);
    await deleteTestimonial(id);
    await load();
    setDeletingId(null);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Manage client testimonials shown on the website."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Testimonials" }]}
      />

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-[var(--admin-text-muted)]">
                {rows.length} testimonial{rows.length !== 1 ? "s" : ""}
              </p>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                <Plus size={15} />
                New Testimonial
              </button>
            </div>

            {loading ? (
              <div className="text-[13px] text-[var(--admin-text-muted)] py-12 text-center">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-[13px] text-[var(--admin-text-muted)] py-12 text-center">No testimonials yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map((row, i) => (
                  <motion.div key={row.id} {...fadeUp(i * 0.04)}>
                    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden p-5 flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                          {row.client_name ? initials(row.client_name) : "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate">
                            {row.client_name || <span className="italic text-[var(--admin-text-faint)]">Unnamed</span>}
                          </p>
                          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">{row.role_en}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {row.published ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={s <= (row.rating ?? 0) ? "text-yellow-400 text-sm" : "text-[var(--admin-border)] text-sm"}>★</span>
                        ))}
                      </div>

                      {/* Content preview */}
                      <p className="text-[12px] text-[var(--admin-text-muted)] line-clamp-3 leading-relaxed">
                        {row.content_en}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[var(--admin-border)]">
                        <button
                          onClick={() => openEdit(row)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} className="inline mr-1" />
                          {deletingId === row.id ? "Deleting…" : "Delete"}
                        </button>
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
                <ArrowLeft size={13} />
                Back
              </button>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={13} className="inline mr-1" />
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Save size={14} />
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Testimonial"}
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing ? "Edit Testimonial" : "New Testimonial"}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Bilingual row 1: Client Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Client Name (EN)</label>
                    <input
                      value={form.client_name}
                      onChange={(e) => set("client_name", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Client Name (AR)</label>
                    <input
                      dir="rtl"
                      value={form.client_name_ar}
                      onChange={(e) => set("client_name_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="جين دو"
                    />
                  </div>
                </div>

                {/* Bilingual row 2: Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Role (EN)</label>
                    <input
                      value={form.role_en}
                      onChange={(e) => set("role_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="Wellness Client"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Role (AR)</label>
                    <input
                      dir="rtl"
                      value={form.role_ar}
                      onChange={(e) => set("role_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="عميل صحة"
                    />
                  </div>
                </div>

                {/* Bilingual row 3: Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Content (EN)</label>
                    <textarea
                      rows={4}
                      value={form.content_en}
                      onChange={(e) => set("content_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Write testimonial content in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Content (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={4}
                      value={form.content_ar}
                      onChange={(e) => set("content_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="اكتب المحتوى بالعربية…"
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Settings</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rating */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Rating</label>
                      <StarSelector value={form.rating ?? 5} onChange={(v) => set("rating", v)} />
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Avatar URL</label>
                      <input
                        value={form.avatar_url ?? ""}
                        onChange={(e) => set("avatar_url", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        placeholder="https://…"
                      />
                    </div>

                    {/* Published */}
                    <div className="flex items-center gap-3">
                      <input
                        id="t-published"
                        type="checkbox"
                        checked={form.published ?? false}
                        onChange={(e) => set("published", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor="t-published" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
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
