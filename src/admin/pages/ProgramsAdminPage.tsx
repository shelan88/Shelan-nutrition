import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X } from "lucide-react";
import {
  getAllPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/admin/repositories/programs.repository";
import type { ProgramRow } from "@/types/database.types";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const ICON_OPTIONS = ["Salad", "HeartPulse", "Sparkles", "Star", "Heart", "Leaf", "Apple", "Dumbbell", "Brain", "Sun"];

type Row = ProgramRow;

function initForm(): Omit<Row, "id" | "created_at" | "updated_at"> {
  return {
    name_en: "",
    name_ar: "",
    short_description_en: "",
    short_description_ar: "",
    full_description_en: "",
    full_description_ar: "",
    icon: "Leaf",
    price: 0,
    duration_weeks: 4,
    features_en: [],
    features_ar: [],
    active: false,
    sort_order: 0,
    image_url: "",
  };
}

export default function ProgramsAdminPage() {
  const { language } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(initForm());
  const [featuresEnText, setFeaturesEnText] = useState("");
  const [featuresArText, setFeaturesArText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllPrograms();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    const f = initForm();
    setForm(f);
    setFeaturesEnText("");
    setFeaturesArText("");
    setView("edit");
  }

  function openEdit(row: Row) {
    setEditing(row);
    setForm({
      name_en: row.name_en ?? "",
      name_ar: row.name_ar ?? "",
      short_description_en: row.short_description_en ?? "",
      short_description_ar: row.short_description_ar ?? "",
      full_description_en: row.full_description_en ?? "",
      full_description_ar: row.full_description_ar ?? "",
      icon: row.icon ?? "Leaf",
      price: row.price ?? 0,
      duration_weeks: row.duration_weeks ?? 4,
      features_en: row.features_en ?? [],
      features_ar: row.features_ar ?? [],
      active: row.active ?? false,
      sort_order: row.sort_order ?? 0,
      image_url: row.image_url ?? "",
    });
    setFeaturesEnText((row.features_en ?? []).join("\n"));
    setFeaturesArText((row.features_ar ?? []).join("\n"));
    setView("edit");
  }

  function cancel() {
    setView("list");
    setEditing(null);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      features_en: featuresEnText.split("\n").filter(Boolean),
      features_ar: featuresArText.split("\n").filter(Boolean),
    };
    if (editing) {
      await updateProgram(editing.id, payload);
    } else {
      await createProgram(payload);
    }
    await load();
    setSaving(false);
    setView("list");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this program?")) return;
    setDeletingId(id);
    await deleteProgram(id);
    await load();
    setDeletingId(null);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Manage nutrition and wellness programs offered to clients."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Programs" }]}
      />

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" {...fadeUp()}>
            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <p className="text-[13px] text-[var(--admin-text-muted)]">
                  {rows.length} program{rows.length !== 1 ? "s" : ""}
                </p>
                <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Plus size={15} />
                  New Program
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[var(--admin-text-muted)]">No programs yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--admin-hover-bg)]">
                      <tr>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Name</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Price</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Duration</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            <p className="font-medium">{row.name_en}</p>
                            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{row.name_ar}</p>
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.price != null ? `$${row.price}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                            {row.duration_weeks != null ? `${row.duration_weeks} wks` : "—"}
                          </td>
                          <td className="py-3 px-4 text-[13px]">
                            {row.active ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">Active</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">Inactive</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(row)} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors flex items-center gap-1">
                                <Pencil size={12} /> Edit
                              </button>
                              <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1">
                                <Trash2 size={12} /> {deletingId === row.id ? "…" : "Delete"}
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
            <div className="flex items-center justify-between mb-6">
              <button onClick={cancel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                <ArrowLeft size={13} /> Back
              </button>
              <div className="flex items-center gap-2">
                <button onClick={cancel} className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
                  <X size={13} className="inline mr-1" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
                  <Save size={14} />
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Program"}
                </button>
              </div>
            </div>

            <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
                <h2 className="text-[13px] font-bold text-[var(--admin-text)]">
                  {editing ? "Edit Program" : "New Program"}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Name (EN)</label>
                    <input
                      value={form.name_en}
                      onChange={(e) => set("name_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="Program name in English"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Name (AR)</label>
                    <input
                      dir="rtl"
                      value={form.name_ar}
                      onChange={(e) => set("name_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      placeholder="اسم البرنامج بالعربية"
                    />
                  </div>
                </div>

                {/* Short desc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Short Description (EN)</label>
                    <textarea
                      rows={2}
                      value={form.short_description_en}
                      onChange={(e) => set("short_description_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Brief summary in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Short Description (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={2}
                      value={form.short_description_ar}
                      onChange={(e) => set("short_description_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="وصف مختصر بالعربية…"
                    />
                  </div>
                </div>

                {/* Full desc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Full Description (EN)</label>
                    <textarea
                      rows={5}
                      value={form.full_description_en}
                      onChange={(e) => set("full_description_en", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="Full program description in English…"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Full Description (AR)</label>
                    <textarea
                      dir="rtl"
                      rows={5}
                      value={form.full_description_ar}
                      onChange={(e) => set("full_description_ar", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder="وصف كامل بالعربية…"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Features (EN)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">One feature per line</p>
                    <textarea
                      rows={5}
                      value={featuresEnText}
                      onChange={(e) => setFeaturesEnText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder={"Personalized meal plan\nWeekly check-ins\nProgress tracking"}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Features (AR)</label>
                    <p className="text-[11px] text-[var(--admin-text-faint)] mb-1.5">One feature per line</p>
                    <textarea
                      dir="rtl"
                      rows={5}
                      value={featuresArText}
                      onChange={(e) => setFeaturesArText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      placeholder={"خطة وجبات مخصصة\nمتابعة أسبوعية\nتتبع التقدم"}
                    />
                  </div>
                </div>

                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* Icon */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Icon</label>
                      <select
                        value={form.icon ?? "Leaf"}
                        onChange={(e) => set("icon", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer"
                      >
                        {ICON_OPTIONS.map((ic) => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Price ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.price ?? 0}
                        onChange={(e) => set("price", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Duration (Weeks)</label>
                      <input
                        type="number"
                        min={1}
                        value={form.duration_weeks ?? 4}
                        onChange={(e) => set("duration_weeks", Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
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

                    {/* Image URL */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Image URL</label>
                      <FileUploadField
                        value={form.image_url ?? ""}
                        onChange={(url) => set("image_url", url)}
                        folder="programs"
                      />
                    </div>

                    {/* Active */}
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        id="prog-active"
                        type="checkbox"
                        checked={form.active ?? false}
                        onChange={(e) => set("active", e.target.checked)}
                        className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor="prog-active" className="text-[13px] text-[var(--admin-text)] cursor-pointer select-none">
                        Active (visible on site)
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
