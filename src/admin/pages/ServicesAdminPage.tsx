import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Save, Search } from "lucide-react";
import { getAllServices, createService, updateService, deleteService } from "@/admin/repositories/services.repository";
import type { ServiceRow } from "@/types/database.types";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function toSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const ACCENTS = [
  { label: "Pink → Soft Pink", from: "from-primary-pink", to: "to-soft-pink" },
  { label: "Soft Purple → Lavender", from: "from-soft-purple", to: "to-lavender-purple" },
  { label: "Lavender → Soft Pink", from: "from-lavender-purple", to: "to-soft-pink" },
  { label: "Soft Pink → Lavender", from: "from-soft-pink", to: "to-lavender-purple" },
  { label: "Pink → Lavender", from: "from-primary-pink", to: "to-lavender-purple" },
  { label: "Soft Purple → Pink", from: "from-soft-purple", to: "to-primary-pink" },
];

const ACCENT_PREVIEW: Record<string, string> = {
  "from-primary-pink": "#f472b6",
  "from-soft-purple": "#c084fc",
  "from-lavender-purple": "#a78bfa",
  "from-soft-pink": "#f9a8d4",
  "to-soft-pink": "#f9a8d4",
  "to-lavender-purple": "#a78bfa",
  "to-primary-pink": "#f472b6",
  "to-soft-purple": "#c084fc",
};

const ICON_OPTIONS = ["Salad", "HeartPulse", "Sparkles", "Star", "Heart", "Leaf", "Apple", "Dumbbell", "Brain", "Sun"];

type FormState = {
  name_en: string;
  name_ar: string;
  slug: string;
  short_description_en: string;
  short_description_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  sort_order: number;
  icon: string;
  image_url: string;
  accentFrom: string;
  accentTo: string;
  who_headline_en: string;
  who_headline_ar: string;
  who_desc_en: string;
  who_desc_ar: string;
  who_points_en: string;
  who_points_ar: string;
  ben_headline_en: string;
  ben_headline_ar: string;
  ben_items_en: string;
  ben_items_ar: string;
  cta_headline_en: string;
  cta_headline_ar: string;
  cta_desc_en: string;
  cta_desc_ar: string;
  cta_button_en: string;
  cta_button_ar: string;
};

const EMPTY_FORM: FormState = {
  name_en: "",
  name_ar: "",
  slug: "",
  short_description_en: "",
  short_description_ar: "",
  description_en: "",
  description_ar: "",
  price: 150,
  duration_minutes: 60,
  active: true,
  sort_order: 0,
  icon: "Star",
  image_url: "",
  accentFrom: "from-soft-pink",
  accentTo: "to-primary-pink",
  who_headline_en: "Is This Right for You?",
  who_headline_ar: "هل هذا مناسب لكِ؟",
  who_desc_en: "",
  who_desc_ar: "",
  who_points_en: "",
  who_points_ar: "",
  ben_headline_en: "What You Will Gain",
  ben_headline_ar: "ما ستحصلين عليه",
  ben_items_en: "",
  ben_items_ar: "",
  cta_headline_en: "Ready to Get Started?",
  cta_headline_ar: "مستعدة للبدء؟",
  cta_desc_en: "",
  cta_desc_ar: "",
  cta_button_en: "Book Your Consultation",
  cta_button_ar: "احجزي استشارة",
};

function formFromRow(row: ServiceRow): FormState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (row.details ?? {}) as any;
  const who = d.whoIsItFor ?? {};
  const ben = d.benefits ?? {};
  const cta = d.cta ?? {};
  return {
    name_en: row.name_en ?? "",
    name_ar: row.name_ar ?? "",
    slug: row.slug ?? "",
    short_description_en: row.short_description_en ?? "",
    short_description_ar: row.short_description_ar ?? "",
    description_en: row.description_en ?? "",
    description_ar: row.description_ar ?? "",
    price: row.price ?? 150,
    duration_minutes: row.duration_minutes ?? 60,
    active: row.active ?? true,
    sort_order: row.sort_order ?? 0,
    icon: row.icon ?? "Star",
    image_url: row.image_url ?? "",
    accentFrom: d.accentFrom ?? "from-soft-pink",
    accentTo: d.accentTo ?? "to-primary-pink",
    who_headline_en: who.headline ?? "Is This Right for You?",
    who_headline_ar: who.headlineAr ?? "هل هذا مناسب لكِ؟",
    who_desc_en: who.description ?? "",
    who_desc_ar: who.descriptionAr ?? "",
    who_points_en: (who.points ?? []).join("\n"),
    who_points_ar: (who.pointsAr ?? []).join("\n"),
    ben_headline_en: ben.headline ?? "What You Will Gain",
    ben_headline_ar: ben.headlineAr ?? "ما ستحصلين عليه",
    ben_items_en: (ben.items ?? []).join("\n"),
    ben_items_ar: (ben.itemsAr ?? []).join("\n"),
    cta_headline_en: cta.headline ?? "Ready to Get Started?",
    cta_headline_ar: cta.headlineAr ?? "مستعدة للبدء؟",
    cta_desc_en: cta.description ?? "",
    cta_desc_ar: cta.descriptionAr ?? "",
    cta_button_en: cta.buttonLabel ?? "Book Your Consultation",
    cta_button_ar: cta.buttonLabelAr ?? "احجزي استشارة",
  };
}

export default function ServicesAdminPage() {
  const { lang } = useLanguage();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    const data = await getAllServices();
    setServices(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setView("edit");
  };

  const openEdit = (row: ServiceRow) => {
    setEditing(row);
    setForm(formFromRow(row));
    setSlugTouched(true);
    setView("edit");
  };

  const handleNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      name_en: val,
      slug: slugTouched ? f.slug : toSlug(val),
    }));
  };

  const handleToggleActive = async (row: ServiceRow) => {
    await updateService(row.id, { active: !row.active });
    await loadServices();
  };

  const handleDelete = async (row: ServiceRow) => {
    if (!window.confirm(`Delete "${row.name_en}"? This cannot be undone.`)) return;
    await deleteService(row.id);
    await loadServices();
  };

  const handleSave = async () => {
    setSaving(true);
    const details = {
      accentFrom: form.accentFrom,
      accentTo: form.accentTo,
      whoIsItFor: {
        headline: form.who_headline_en,
        headlineAr: form.who_headline_ar,
        description: form.who_desc_en,
        descriptionAr: form.who_desc_ar,
        points: form.who_points_en.split("\n").filter(Boolean),
        pointsAr: form.who_points_ar.split("\n").filter(Boolean),
      },
      benefits: {
        headline: form.ben_headline_en,
        headlineAr: form.ben_headline_ar,
        items: form.ben_items_en.split("\n").filter(Boolean),
        itemsAr: form.ben_items_ar.split("\n").filter(Boolean),
      },
      cta: {
        headline: form.cta_headline_en,
        headlineAr: form.cta_headline_ar,
        description: form.cta_desc_en,
        descriptionAr: form.cta_desc_ar,
        buttonLabel: form.cta_button_en,
        buttonLabelAr: form.cta_button_ar,
      },
    };

    const payload = {
      name_en: form.name_en,
      name_ar: form.name_ar || null,
      slug: form.slug || null,
      short_description_en: form.short_description_en || null,
      short_description_ar: form.short_description_ar || null,
      description_en: form.description_en || null,
      description_ar: form.description_ar || null,
      price: form.price || null,
      duration_minutes: form.duration_minutes || null,
      active: form.active,
      sort_order: form.sort_order,
      icon: form.icon || null,
      image_url: form.image_url || null,
      details,
    };

    if (editing) {
      await updateService(editing.id, payload);
    } else {
      await createService(payload);
    }
    setSaving(false);
    setView("list");
    await loadServices();
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name_en.toLowerCase().includes(q) ||
      (s.slug ?? "").toLowerCase().includes(q)
    );
  });

  if (view === "edit") {
    return (
      <div>
        {/* Edit Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-2 text-[13px] font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {lang === "ar" ? "رجوع إلى الخدمات" : "Back to Services"}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("list")}
              className="px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…") : (lang === "ar" ? "حفظ الخدمة" : "Save Service")}
            </button>
          </div>
        </div>

        <motion.div {...fadeUp(0)} className="space-y-5">
          <h2 className="text-[18px] font-bold text-[var(--admin-text)]">
            {editing ? (lang === "ar" ? "تعديل الخدمة" : "Edit Service") : (lang === "ar" ? "خدمة جديدة" : "New Service")}
          </h2>

          {/* Bilingual content */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <span className="text-[13px] font-bold text-[var(--admin-text)]">{lang === "ar" ? "محتوى الخدمة (ثنائي اللغة)" : "Service Content (Bilingual)"}</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EN Column */}
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">English</p>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Name EN</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.name_en}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Service name in English"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Slug</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.slug}
                      onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Short Description EN</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.short_description_en}
                      onChange={(e) => setForm((f) => ({ ...f, short_description_en: e.target.value }))}
                      placeholder="Brief one-liner in English"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Full Description EN</label>
                    <textarea
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.description_en}
                      onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                      placeholder="Full service description in English…"
                    />
                  </div>
                </div>

                {/* AR Column */}
                <div className="space-y-4" dir="rtl">
                  <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">العربية</p>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Name AR</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                      value={form.name_ar}
                      onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                      placeholder="اسم الخدمة بالعربية"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Icon</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors cursor-pointer"
                      value={form.icon}
                      onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                      dir="ltr"
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Short Description AR</label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.short_description_ar}
                      onChange={(e) => setForm((f) => ({ ...f, short_description_ar: e.target.value }))}
                      placeholder="وصف مختصر بالعربية"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Full Description AR</label>
                    <textarea
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                      value={form.description_ar}
                      onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                      placeholder="وصف الخدمة الكامل بالعربية…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared fields */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <span className="text-[13px] font-bold text-[var(--admin-text)]">{lang === "ar" ? "السعر والعرض" : "Pricing & Display"}</span>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Price</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 rounded accent-pink-400"
                    />
                    <span className="text-[13px] font-medium text-[var(--admin-text)]">{lang === "ar" ? "نشطة" : "Active"}</span>
                  </label>
                </div>
              </div>

              {/* Accent selector */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Accent Gradient</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => {
                    const selected = form.accentFrom === a.from && form.accentTo === a.to;
                    return (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, accentFrom: a.from, accentTo: a.to }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${selected ? "border-primary-pink/60 bg-primary-pink/5 text-[var(--admin-text)]" : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ background: `linear-gradient(to right, ${ACCENT_PREVIEW[a.from]}, ${ACCENT_PREVIEW[a.to]})` }}
                        />
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Image URL</label>
                <FileUploadField
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="services"
                />
              </div>
            </div>
          </div>

          {/* Content Details */}
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--admin-border)]">
              <span className="text-[13px] font-bold text-[var(--admin-text)]">{lang === "ar" ? "تفاصيل المحتوى" : "Content Details"}</span>
            </div>
            <div className="p-5 space-y-8">

              {/* Who Is It For */}
              <div>
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{lang === "ar" ? "لمن هذه الخدمة" : "Who Is It For"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline EN</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.who_headline_en}
                        onChange={(e) => setForm((f) => ({ ...f, who_headline_en: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Description EN</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.who_desc_en}
                        onChange={(e) => setForm((f) => ({ ...f, who_desc_en: e.target.value }))}
                        placeholder="Describe who this service is for…"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Points EN (one per line)</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.who_points_en}
                        onChange={(e) => setForm((f) => ({ ...f, who_points_en: e.target.value }))}
                        placeholder={"Point one\nPoint two\nPoint three"}
                      />
                    </div>
                  </div>
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline AR</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.who_headline_ar}
                        onChange={(e) => setForm((f) => ({ ...f, who_headline_ar: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Description AR</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.who_desc_ar}
                        onChange={(e) => setForm((f) => ({ ...f, who_desc_ar: e.target.value }))}
                        placeholder="اكتبي وصفاً لمن تناسبها هذه الخدمة…"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Points AR (one per line)</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.who_points_ar}
                        onChange={(e) => setForm((f) => ({ ...f, who_points_ar: e.target.value }))}
                        placeholder={"النقطة الأولى\nالنقطة الثانية\nالنقطة الثالثة"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                {/* Benefits */}
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{lang === "ar" ? "الفوائد" : "Benefits"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline EN</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.ben_headline_en}
                        onChange={(e) => setForm((f) => ({ ...f, ben_headline_en: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Items EN (one per line)</label>
                      <textarea
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.ben_items_en}
                        onChange={(e) => setForm((f) => ({ ...f, ben_items_en: e.target.value }))}
                        placeholder={"Benefit one\nBenefit two\nBenefit three"}
                      />
                    </div>
                  </div>
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline AR</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.ben_headline_ar}
                        onChange={(e) => setForm((f) => ({ ...f, ben_headline_ar: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Items AR (one per line)</label>
                      <textarea
                        rows={5}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.ben_items_ar}
                        onChange={(e) => setForm((f) => ({ ...f, ben_items_ar: e.target.value }))}
                        placeholder={"الفائدة الأولى\nالفائدة الثانية\nالفائدة الثالثة"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                {/* CTA */}
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{lang === "ar" ? "الدعوة للتصرف" : "Call to Action"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline EN</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.cta_headline_en}
                        onChange={(e) => setForm((f) => ({ ...f, cta_headline_en: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Description EN</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.cta_desc_en}
                        onChange={(e) => setForm((f) => ({ ...f, cta_desc_en: e.target.value }))}
                        placeholder="Supporting CTA description…"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Button Label EN</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.cta_button_en}
                        onChange={(e) => setForm((f) => ({ ...f, cta_button_en: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4" dir="rtl">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Headline AR</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.cta_headline_ar}
                        onChange={(e) => setForm((f) => ({ ...f, cta_headline_ar: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Description AR</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
                        value={form.cta_desc_ar}
                        onChange={(e) => setForm((f) => ({ ...f, cta_desc_ar: e.target.value }))}
                        placeholder="وصف داعم للدعوة إلى الإجراء…"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">Button Label AR</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                        value={form.cta_button_ar}
                        onChange={(e) => setForm((f) => ({ ...f, cta_button_ar: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "الخدمات" : "Services"}
        description={lang === "ar" ? "إدارة جميع الخدمات المقدمة على المنصة." : "Manage all services offered on the SHELAN platform."}
        breadcrumbs={[{ label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" }, { label: lang === "ar" ? "الخدمات" : "Services" }]}
      />

      <motion.div {...fadeUp(0)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors w-56"
              placeholder={lang === "ar" ? "ابحث عن خدمة…" : "Search services…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all">
            <Plus size={14} />
            {lang === "ar" ? "إضافة خدمة" : "New Service"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--admin-hover-bg)]">
              <tr>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "الاسم" : "Name"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "السعر" : "Price"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "الترتيب" : "Sort"}</th>
                <th className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-[var(--admin-text-faint)]">{lang === "ar" ? "جارٍ التحميل…" : "Loading services…"}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-[var(--admin-text-faint)]">{lang === "ar" ? "لا توجد خدمات." : "No services found."}</td>
                </tr>
              ) : (
                filtered.map((service) => (
                  <tr key={service.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      <div className="font-medium">{service.name_en}</div>
                      {service.name_ar && (
                        <div className="text-[12px] text-[var(--admin-text-muted)] mt-0.5" dir="rtl">{service.name_ar}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      {service.price != null ? `${service.price} SAR` : "—"}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">
                      {service.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {lang === "ar" ? "نشطة" : "Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-text-faint)]" />
                          {lang === "ar" ? "غير نشطة" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--admin-text)]">{service.sort_order ?? "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(service)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(service)}
                          title={service.active ? "Deactivate" : "Activate"}
                          className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                        >
                          {service.active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          title="Delete"
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
