/**
 * SEOPage — Admin SEO settings editor.
 * All fields are stored as a single JSONB value under key "site.seo"
 * in the website_settings table.
 */
import { useState, useEffect, useCallback } from "react";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import FileUploadField from "../components/FileUploadField";
import { getSetting, setSetting } from "@/admin/repositories/settings.repository";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Shared field primitives (match WebsiteSettingsPage exactly) ──────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1.5">
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors resize-y"
  />
);

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label>{label}</Label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-[var(--admin-text-faint)]">{hint}</p>}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">{children}</p>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
  labelOn,
  labelOff,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors w-fit ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[var(--admin-border)] bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)]"
      }`}
    >
      {value ? (
        <ToggleRight size={18} className="text-emerald-500" />
      ) : (
        <ToggleLeft size={18} className="text-[var(--admin-text-faint)]" />
      )}
      {value ? labelOn : labelOff}
    </button>
  );
}

// ─── SaveBar ──────────────────────────────────────────────────────────────────

function SaveBar({
  saved,
  saving,
  onSave,
  lang,
}: {
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  lang: "en" | "ar";
}) {
  return (
    <div className="flex items-center justify-end px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
      >
        <Save size={14} />
        {saving
          ? lang === "ar" ? "جارٍ الحفظ…" : "Saving…"
          : saved
          ? lang === "ar" ? "تم الحفظ ✓" : "Saved! ✓"
          : lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Default state ────────────────────────────────────────────────────────────

const defaultSEO = {
  site_title: "",
  meta_description: "",
  keywords: "",
  og_image_url: "",
  favicon_url: "",
  robots_index: true,
  google_analytics_id: "",
  search_console_verification: "",
};

type SEOState = typeof defaultSEO;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SEOPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [seo, setSEO] = useState<SEOState>({ ...defaultSEO });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    getSetting("site.seo").then((val) => {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        setSEO({ ...defaultSEO, ...(val as object) });
      }
    });
  }, []);

  const patch = (key: keyof SEOState) => (value: string | boolean) =>
    setSEO((prev) => ({ ...prev, [key]: value }));

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await setSetting("site.seo", seo as unknown as Record<string, unknown>);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [seo]);

  return (
    <div>
      <PageHeader
        title={isAr ? "إعدادات SEO" : "SEO Settings"}
        description={
          isAr
            ? "إدارة عنوان الموقع، والوصف، والوسوم الوصفية، ومعرّفات التحليلات."
            : "Manage site title, meta description, social sharing tags, and analytics identifiers."
        }
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "إعدادات SEO" : "SEO Settings" },
        ]}
      />

      <motion.div
        {...fadeUp(0)}
        className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
      >
        <div className="px-5 py-5 space-y-8">

          {/* ── Basic SEO ──────────────────────────────────────────────────── */}
          <section>
            <SectionTitle>{isAr ? "SEO الأساسي" : "Basic SEO"}</SectionTitle>
            <div className="space-y-4">
              <Field
                label={isAr ? "عنوان الموقع" : "Website Title"}
                hint={isAr ? "يظهر في تبويب المتصفح ونتائج البحث." : "Shown in the browser tab and search engine results."}
              >
                <Input
                  value={seo.site_title}
                  onChange={(e) => patch("site_title")(e.target.value)}
                  placeholder={isAr ? "SHELAN — أخصائية تغذية" : "SHELAN — Nutritionist & Lipedema Specialist"}
                  maxLength={70}
                />
              </Field>

              <Field
                label={isAr ? "الوصف التعريفي" : "Meta Description"}
                hint={isAr ? "ملخص قصير يظهر أسفل العنوان في نتائج البحث (160 حرفًا كحد أقصى)." : "Short summary shown below the title in search results. Keep it under 160 characters."}
              >
                <Textarea
                  rows={3}
                  value={seo.meta_description}
                  onChange={(e) => patch("meta_description")(e.target.value)}
                  placeholder={isAr ? "أخصائية تغذية شمولية ومتخصصة في الليبيديما…" : "Evidence-based nutrition plans and specialized Lipedema management…"}
                  maxLength={160}
                />
              </Field>

              <Field
                label={isAr ? "الكلمات المفتاحية" : "Keywords"}
                hint={isAr ? "كلمات مفتاحية مفصولة بفواصل." : "Comma-separated keywords."}
              >
                <Input
                  value={seo.keywords}
                  onChange={(e) => patch("keywords")(e.target.value)}
                  placeholder={isAr ? "تغذية، ليبيديما، صحة شمولية" : "nutrition, lipedema, holistic health, nutritionist"}
                />
              </Field>
            </div>
          </section>

          {/* ── Social Sharing ─────────────────────────────────────────────── */}
          <section className="border-t border-[var(--admin-border)] pt-6">
            <SectionTitle>{isAr ? "مشاركة اجتماعية (Open Graph)" : "Social Sharing (Open Graph)"}</SectionTitle>
            <div className="space-y-4">
              <Field
                label={isAr ? "صورة Open Graph" : "Open Graph Image"}
                hint={isAr ? "الصورة التي تظهر عند مشاركة الموقع على وسائل التواصل الاجتماعي (1200×630 بكسل)." : "Image shown when the site is shared on social media. Recommended: 1200×630 px."}
              >
                <FileUploadField
                  value={seo.og_image_url}
                  onChange={(url) => patch("og_image_url")(url)}
                  folder="seo"
                  lang={lang}
                  placeholder="https://…/og-image.png"
                />
              </Field>

              <Field
                label={isAr ? "الأيقونة المفضلة (Favicon)" : "Favicon"}
                hint={isAr ? "أيقونة الموقع التي تظهر في المتصفح (.ico أو .png بحجم 32×32 أو 64×64)." : "Site icon shown in the browser tab. Use .ico or a 32×32 / 64×64 .png."}
              >
                <FileUploadField
                  value={seo.favicon_url}
                  onChange={(url) => patch("favicon_url")(url)}
                  folder="seo"
                  lang={lang}
                  accept="image/*"
                  placeholder="https://…/favicon.ico"
                />
              </Field>
            </div>
          </section>

          {/* ── Indexing ───────────────────────────────────────────────────── */}
          <section className="border-t border-[var(--admin-border)] pt-6">
            <SectionTitle>{isAr ? "فهرسة محركات البحث" : "Search Engine Indexing"}</SectionTitle>
            <div className="space-y-2">
              <Label>{isAr ? "السماح لمحركات البحث بالفهرسة" : "Allow Search Engine Indexing"}</Label>
              <Toggle
                value={seo.robots_index}
                onChange={(v) => patch("robots_index")(v)}
                labelOn={isAr ? "مفعّل — الموقع مفهرس" : "On — site is indexed"}
                labelOff={isAr ? "معطّل — الموقع محظور من الفهرسة" : "Off — site is blocked from indexing"}
              />
              <p className="text-[11px] text-[var(--admin-text-faint)]">
                {isAr
                  ? "عند التعطيل، يُضاف <meta name=\"robots\" content=\"noindex, nofollow\"> لكل صفحة."
                  : 'When off, adds <meta name="robots" content="noindex, nofollow"> to every page.'}
              </p>
            </div>
          </section>

          {/* ── Analytics & Verification ───────────────────────────────────── */}
          <section className="border-t border-[var(--admin-border)] pt-6">
            <SectionTitle>{isAr ? "التحليلات والتحقق (اختياري)" : "Analytics & Verification (optional)"}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label={isAr ? "معرّف Google Analytics" : "Google Analytics ID"}
                hint={isAr ? "مثال: G-XXXXXXXXXX" : "Example: G-XXXXXXXXXX"}
              >
                <Input
                  value={seo.google_analytics_id}
                  onChange={(e) => patch("google_analytics_id")(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>

              <Field
                label={isAr ? "رمز التحقق من Google Search Console" : "Google Search Console Verification"}
                hint={isAr ? "القيمة من الوسم <meta name=\"google-site-verification\" …>" : 'The content value from <meta name="google-site-verification" …>'}
              >
                <Input
                  value={seo.search_console_verification}
                  onChange={(e) => patch("search_console_verification")(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
            </div>
          </section>

        </div>

        <SaveBar lang={lang} saved={saved} saving={saving} onSave={handleSave} />
      </motion.div>
    </div>
  );
}
