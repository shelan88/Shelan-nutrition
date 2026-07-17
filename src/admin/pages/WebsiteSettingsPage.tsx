/**
 * WebsiteSettingsPage — Tab-based settings editor for website_settings key-value table.
 * Tabs: Hero · About · Contact · Navigation
 */
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { getSetting, setSetting } from "@/admin/repositories/settings.repository";
import FileUploadField from "../components/FileUploadField";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Tab = "hero" | "about" | "contact" | "nav";

// ─── Field helpers ─────────────────────────────────────────────────────────────

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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

// ─── Default states ────────────────────────────────────────────────────────────

const defaultHero = {
  kicker_en: "", kicker_ar: "",
  heading_en: "", heading_ar: "",
  subheading_en: "", subheading_ar: "",
  cta_primary_label_en: "", cta_primary_label_ar: "", cta_primary_href: "",
  cta_secondary_label_en: "", cta_secondary_label_ar: "", cta_secondary_href: "",
};

const defaultAbout = {
  name_en: "", name_ar: "",
  title_en: "", title_ar: "",
  bio_en: "", bio_ar: "",
  portrait_url: "",
};

const defaultContact = {
  phone: "", whatsapp: "", email: "",
  address_en: "", address_ar: "",
  hours_en: "", hours_ar: "",
  map_url: "",
};

// ─── Public Navigation Items ───────────────────────────────────────────────────

type NavItem = {
  id: string;
  label_en: string;
  label_ar: string;
  href: string;
  visible: boolean;
  order: number;
  cta?: boolean;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "home",            label_en: "Home",            label_ar: "الرئيسية",        href: "/",                visible: true,  order: 0 },
  { id: "about",           label_en: "About",           label_ar: "من أنا",          href: "/about",           visible: true,  order: 1 },
  { id: "services",        label_en: "Services",        label_ar: "الخدمات",         href: "/services",        visible: true,  order: 2 },
  { id: "programs",        label_en: "Programs",        label_ar: "البرامج",         href: "/programs",        visible: true,  order: 3 },
  { id: "success-stories", label_en: "Success Stories", label_ar: "قصص النجاح",     href: "/success-stories", visible: true,  order: 4 },
  { id: "testimonials",    label_en: "Testimonials",    label_ar: "الشهادات",        href: "/testimonials",    visible: true,  order: 5 },
  { id: "blog",            label_en: "Blog",            label_ar: "المدونة",         href: "/blog",            visible: true,  order: 6 },
  { id: "faq",             label_en: "FAQ",             label_ar: "الأسئلة الشائعة", href: "/faq",             visible: true,  order: 7 },
  { id: "contact",         label_en: "Contact",         label_ar: "تواصلي معي",      href: "/contact",         visible: true,  order: 8 },
  { id: "booking",         label_en: "Book Now",        label_ar: "احجزي الآن",      href: "/booking",         visible: true,  order: 9, cta: true },
];

// ─── SaveBar ──────────────────────────────────────────────────────────────────

function SaveBar({ saved, saving, onSave, lang }: { saved: boolean; saving: boolean; onSave: () => void; lang: "en" | "ar" }) {
  return (
    <div className="flex items-center justify-end px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
      >
        <Save size={14} />
        {saving
          ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…")
          : saved
          ? (lang === "ar" ? "تم الحفظ ✓" : "Saved! ✓")
          : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WebsiteSettingsPage() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("hero");

  // Per-tab form state
  const [hero,    setHero]    = useState({ ...defaultHero });
  const [about,   setAbout]   = useState({ ...defaultAbout });
  const [contact, setContact] = useState({ ...defaultContact });
  const [navItems, setNavItems] = useState<NavItem[]>([...DEFAULT_NAV_ITEMS]);

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const keyMap: Record<Tab, string> = {
    hero: "site.hero", about: "site.about", contact: "site.contact", nav: "site.nav",
  };

  const setterMap: Record<Tab, (v: any) => void> = {
    hero: setHero, about: setAbout, contact: setContact, nav: () => {},
  };

  const defaultMap: Record<Tab, object> = {
    hero: defaultHero, about: defaultAbout, contact: defaultContact, nav: {},
  };

  const getterMap: Record<Tab, object> = {
    hero, about, contact, nav: {},
  };

  // Load on tab switch
  useEffect(() => {
    (async () => {
      const val = await getSetting(keyMap[tab]);

      if (tab === "nav") {
        if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).items)) {
          setNavItems((val as any).items as NavItem[]);
        } else {
          setNavItems([...DEFAULT_NAV_ITEMS]);
        }
        return;
      }

      if (val && typeof val === "object" && !Array.isArray(val)) {
        setterMap[tab]({ ...defaultMap[tab], ...(val as object) });
      } else {
        setterMap[tab]({ ...defaultMap[tab] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const key = keyMap[tab];
    const value = tab === "nav" ? { items: navItems } : getterMap[tab];
    const ok = await setSetting(key, value as any);
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, hero, about, contact, navItems]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "hero",    label: lang === "ar" ? "الرئيسية"     : "Hero" },
    { key: "about",   label: lang === "ar" ? "من أنا"      : "About" },
    { key: "contact", label: lang === "ar" ? "التواصل"     : "Contact" },
    { key: "nav",     label: lang === "ar" ? "قائمة التنقل" : "Navigation" },
  ];

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "إعدادات الموقع" : "Website Settings"}
        description={lang === "ar" ? "إدارة محتوى الموقع العام المخزّن في قاعدة البيانات." : "Manage public-facing website content stored in Supabase."}
        breadcrumbs={[{ label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" }, { label: lang === "ar" ? "إعدادات الموقع" : "Website Settings" }]}
      />

      {/* Tab Switcher */}
      <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSaved(false); }}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              tab === t.key
                ? "bg-gradient-to-r from-primary-pink to-lavender-purple text-white shadow-sm"
                : "border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
        >

          {/* ── HERO TAB ─────────────────────────────────────────────────────── */}
          {tab === "hero" && (
            <div>
              <div className="px-5 py-5 space-y-5">
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Hero Section</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Kicker (EN)">
                    <Input value={hero.kicker_en} onChange={e => setHero(p => ({ ...p, kicker_en: e.target.value }))} placeholder="e.g. Holistic Nutrition" />
                  </Field>
                  <Field label="Kicker (AR)">
                    <Input dir="rtl" value={hero.kicker_ar} onChange={e => setHero(p => ({ ...p, kicker_ar: e.target.value }))} placeholder="مثال: التغذية الشمولية" />
                  </Field>
                  <Field label="Heading (EN)">
                    <Input value={hero.heading_en} onChange={e => setHero(p => ({ ...p, heading_en: e.target.value }))} placeholder="Main headline in English" />
                  </Field>
                  <Field label="Heading (AR)">
                    <Input dir="rtl" value={hero.heading_ar} onChange={e => setHero(p => ({ ...p, heading_ar: e.target.value }))} placeholder="العنوان الرئيسي بالعربية" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Subheading (EN)">
                    <Textarea rows={3} value={hero.subheading_en} onChange={e => setHero(p => ({ ...p, subheading_en: e.target.value }))} placeholder="Supporting text in English" />
                  </Field>
                  <Field label="Subheading (AR)">
                    <Textarea dir="rtl" rows={3} value={hero.subheading_ar} onChange={e => setHero(p => ({ ...p, subheading_ar: e.target.value }))} placeholder="النص الداعم بالعربية" />
                  </Field>
                </div>
                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Primary CTA</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Label (EN)"><Input value={hero.cta_primary_label_en} onChange={e => setHero(p => ({ ...p, cta_primary_label_en: e.target.value }))} placeholder="Book Now" /></Field>
                    <Field label="Label (AR)"><Input dir="rtl" value={hero.cta_primary_label_ar} onChange={e => setHero(p => ({ ...p, cta_primary_label_ar: e.target.value }))} placeholder="احجزي الآن" /></Field>
                    <Field label="Link (href)"><Input value={hero.cta_primary_href} onChange={e => setHero(p => ({ ...p, cta_primary_href: e.target.value }))} placeholder="/booking" /></Field>
                  </div>
                </div>
                <div className="border-t border-[var(--admin-border)] pt-6 mt-6">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Secondary CTA</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Label (EN)"><Input value={hero.cta_secondary_label_en} onChange={e => setHero(p => ({ ...p, cta_secondary_label_en: e.target.value }))} placeholder="Learn More" /></Field>
                    <Field label="Label (AR)"><Input dir="rtl" value={hero.cta_secondary_label_ar} onChange={e => setHero(p => ({ ...p, cta_secondary_label_ar: e.target.value }))} placeholder="اعرفي المزيد" /></Field>
                    <Field label="Link (href)"><Input value={hero.cta_secondary_href} onChange={e => setHero(p => ({ ...p, cta_secondary_href: e.target.value }))} placeholder="/about" /></Field>
                  </div>
                </div>
              </div>
              <SaveBar lang={lang} saved={saved} saving={saving} onSave={handleSave} />
            </div>
          )}

          {/* ── ABOUT TAB ────────────────────────────────────────────────────── */}
          {tab === "about" && (
            <div>
              <div className="px-5 py-5 space-y-5">
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">About / Nutritionist Profile</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Name (EN)"><Input value={about.name_en} onChange={e => setAbout(p => ({ ...p, name_en: e.target.value }))} placeholder="Shelan" /></Field>
                  <Field label="Name (AR)"><Input dir="rtl" value={about.name_ar} onChange={e => setAbout(p => ({ ...p, name_ar: e.target.value }))} placeholder="شيلان" /></Field>
                  <Field label="Title (EN)"><Input value={about.title_en} onChange={e => setAbout(p => ({ ...p, title_en: e.target.value }))} placeholder="Certified Holistic Nutritionist" /></Field>
                  <Field label="Title (AR)"><Input dir="rtl" value={about.title_ar} onChange={e => setAbout(p => ({ ...p, title_ar: e.target.value }))} placeholder="أخصائية تغذية شمولية معتمدة" /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Bio (EN)"><Textarea rows={5} value={about.bio_en} onChange={e => setAbout(p => ({ ...p, bio_en: e.target.value }))} placeholder="Write bio in English…" /></Field>
                  <Field label="Bio (AR)"><Textarea dir="rtl" rows={5} value={about.bio_ar} onChange={e => setAbout(p => ({ ...p, bio_ar: e.target.value }))} placeholder="اكتبي السيرة بالعربية…" /></Field>
                </div>
                <Field label="Portrait Image URL">
                  <FileUploadField value={about.portrait_url} onChange={(url) => setAbout(p => ({ ...p, portrait_url: url }))} folder="about" lang={lang} />
                  <p className="mt-1 text-[11px] text-[var(--admin-text-faint)]">Upload or paste a URL for the portrait image</p>
                </Field>
              </div>
              <SaveBar lang={lang} saved={saved} saving={saving} onSave={handleSave} />
            </div>
          )}

          {/* ── CONTACT TAB ──────────────────────────────────────────────────── */}
          {tab === "contact" && (
            <div>
              <div className="px-5 py-5 space-y-5">
                <p className="text-[13px] font-bold text-[var(--admin-text)] mb-4">Contact Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Phone"><Input type="tel" value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} placeholder="+966 5x xxx xxxx" /></Field>
                  <Field label="WhatsApp"><Input type="tel" value={contact.whatsapp} onChange={e => setContact(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+966 5x xxx xxxx" /></Field>
                  <Field label="Email"><Input type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} placeholder="hello@shelan.com" /></Field>
                  <Field label="Google Maps URL"><Input value={contact.map_url} onChange={e => setContact(p => ({ ...p, map_url: e.target.value }))} placeholder="https://maps.google.com/…" /></Field>
                  <Field label="Address (EN)"><Input value={contact.address_en} onChange={e => setContact(p => ({ ...p, address_en: e.target.value }))} placeholder="Riyadh, Saudi Arabia" /></Field>
                  <Field label="Address (AR)"><Input dir="rtl" value={contact.address_ar} onChange={e => setContact(p => ({ ...p, address_ar: e.target.value }))} placeholder="الرياض، المملكة العربية السعودية" /></Field>
                  <Field label="Business Hours (EN)"><Input value={contact.hours_en} onChange={e => setContact(p => ({ ...p, hours_en: e.target.value }))} placeholder="Sun–Thu, 9 AM – 6 PM" /></Field>
                  <Field label="Business Hours (AR)"><Input dir="rtl" value={contact.hours_ar} onChange={e => setContact(p => ({ ...p, hours_ar: e.target.value }))} placeholder="الأحد – الخميس، ٩ ص – ٦ م" /></Field>
                </div>
              </div>
              <SaveBar lang={lang} saved={saved} saving={saving} onSave={handleSave} />
            </div>
          )}

          {/* ── NAVIGATION TAB ───────────────────────────────────────────────── */}
          {tab === "nav" && (
            <div>
              <div className="px-5 py-5 space-y-3">
                <div className="mb-4">
                  <p className="text-[13px] font-bold text-[var(--admin-text)]">
                    {lang === "ar" ? "قائمة تنقل الموقع العام" : "Public Website Navigation"}
                  </p>
                  <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">
                    {lang === "ar"
                      ? "تحكم في الصفحات الظاهرة بالقائمة، وترتيبها، وتسمياتها."
                      : "Control which pages appear in the menu, their order, and their labels."}
                  </p>
                </div>

                {/* Nav item rows */}
                <div className="space-y-2">
                  {[...navItems].sort((a, b) => a.order - b.order).map((item, idx, arr) => (
                    <div key={item.id} className={`rounded-xl border p-3 transition-colors ${item.visible ? "border-[var(--admin-border)] bg-[var(--admin-hover-bg)]/30" : "border-[var(--admin-border)] bg-[var(--admin-hover-bg)]/10 opacity-60"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {/* Reorder */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => setNavItems(prev => {
                              const s = [...prev].sort((a, b) => a.order - b.order).map((l, i) => ({ ...l, order: i }));
                              const a2 = s[idx], b2 = s[idx - 1];
                              s[idx] = { ...a2, order: b2.order };
                              s[idx - 1] = { ...b2, order: a2.order };
                              return s;
                            })}
                            className="w-6 h-6 flex items-center justify-center rounded border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp size={11} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => setNavItems(prev => {
                              const s = [...prev].sort((a, b) => a.order - b.order).map((l, i) => ({ ...l, order: i }));
                              const a2 = s[idx], b2 = s[idx + 1];
                              s[idx] = { ...a2, order: b2.order };
                              s[idx + 1] = { ...b2, order: a2.order };
                              return s;
                            })}
                            className="w-6 h-6 flex items-center justify-center rounded border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown size={11} />
                          </button>
                        </div>

                        {/* Visibility */}
                        <button
                          type="button"
                          onClick={() => setNavItems(prev => prev.map(n => n.id === item.id ? { ...n, visible: !n.visible } : n))}
                          title={item.visible ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "إظهار" : "Show")}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shrink-0 ${item.visible ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-[var(--admin-border)] text-[var(--admin-text-faint)]"}`}
                        >
                          {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>

                        {/* Route badge */}
                        <span className="text-[11px] font-mono text-[var(--admin-text-faint)] bg-[var(--admin-hover-bg)] px-2 py-0.5 rounded-md border border-[var(--admin-border)] shrink-0">
                          {item.href}
                        </span>

                        {/* CTA badge */}
                        {item.cta && (
                          <span className="text-[10px] font-bold text-primary-pink border border-primary-pink/30 bg-primary-pink/5 px-1.5 py-0.5 rounded-full shrink-0">CTA</span>
                        )}
                      </div>

                      {/* Label inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wide mb-1">Label (EN)</label>
                          <input
                            value={item.label_en}
                            onChange={e => setNavItems(prev => prev.map(n => n.id === item.id ? { ...n, label_en: e.target.value } : n))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                            placeholder="English label"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wide mb-1">Label (AR)</label>
                          <input
                            dir="rtl"
                            value={item.label_ar}
                            onChange={e => setNavItems(prev => prev.map(n => n.id === item.id ? { ...n, label_ar: e.target.value } : n))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
                            placeholder="التسمية بالعربية"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <SaveBar lang={lang} saved={saved} saving={saving} onSave={handleSave} />
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
