/**
 * AboutCertifications — DB-driven credential card grid.
 *
 * Loads from about_certifications + about_certifications_settings.
 * Each card shows either an uploaded logo image OR styled initials.
 * Falls back to hardcoded data when DB returns nothing.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  getActiveCertifications,
  getCertSettings,
  type CertificationRow,
  type CertSettingsRow,
} from "@/admin/repositories/aboutCms.repository";
import type { CMSAboutData } from "@/types/cms.types";

// ── Fallback (shown while loading or if DB is empty) ──────────────────────────

const FALLBACK_ITEMS = [
  { title_en: "Certified Holistic Nutritionist",     title_ar: "أخصائية تغذية شمولية معتمدة",    subtitle_en: "American College of Healthcare Sciences", subtitle_ar: "American College of Healthcare Sciences", initials: "ACHS", display_mode: "initials" as const },
  { title_en: "Master Health Consultant",            title_ar: "كبير مستشاري الصحة",             subtitle_en: "Institute for Integrative Nutrition",    subtitle_ar: "Institute for Integrative Nutrition",    initials: "IIN",  display_mode: "initials" as const },
  { title_en: "Lipedema Nutrition Specialist",       title_ar: "متخصصة في تغذية الليبيديما",     subtitle_en: "Lipedema Foundation",                    subtitle_ar: "Lipedema Foundation",                    initials: "LF",   display_mode: "initials" as const },
  { title_en: "Gut Health & Microbiome Certificate", title_ar: "شهادة صحة الأمعاء والميكروبيوم", subtitle_en: "AFPA Nutrition",                          subtitle_ar: "AFPA Nutrition",                          initials: "AFPA", display_mode: "initials" as const },
  { title_en: "Functional Nutrition Alliance",       title_ar: "تحالف التغذية الوظيفية",          subtitle_en: "Full Body Systems Program",               subtitle_ar: "Full Body Systems Program",               initials: "FNA",  display_mode: "initials" as const },
  { title_en: "Anti-Inflammatory Nutrition",         title_ar: "التغذية المضادة للالتهابات",       subtitle_en: "Precision Nutrition",                     subtitle_ar: "Precision Nutrition",                     initials: "PN",   display_mode: "initials" as const },
];

// Palette for initials badges — cycles through these based on index
const INITIALS_PALETTE = [
  "from-primary-pink/20 to-lavender-purple/20 text-primary-pink",
  "from-lavender-purple/20 to-deep-purple/20 text-lavender-purple",
  "from-soft-pink/30 to-primary-pink/20 text-primary-pink",
  "from-deep-purple/15 to-lavender-purple/20 text-deep-purple",
  "from-primary-pink/15 to-soft-pink/25 text-primary-pink",
  "from-lavender-purple/15 to-soft-purple/20 text-lavender-purple",
];

// ── Card component ─────────────────────────────────────────────────────────────

interface CardData {
  title:    string;
  subtitle: string | null;
  logoUrl:  string | null;
  initials: string | null;
  mode:     "logo" | "initials";
}

function CertCard({ card, index }: { card: CardData; index: number }) {
  const palette = INITIALS_PALETTE[index % INITIALS_PALETTE.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="relative bg-white rounded-2xl border border-soft-purple/12 p-6 shadow-sm hover:shadow-lg hover:shadow-deep-purple/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
    >
      {/* Logo or initials badge */}
      <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center mb-4 shrink-0">
        {card.mode === "logo" && card.logoUrl ? (
          <img
            src={card.logoUrl}
            alt={card.title}
            className="w-full h-full object-contain"
            style={{ imageRendering: "crisp-edges" }}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${palette} flex items-center justify-center group-hover:opacity-90 transition-opacity`}
          >
            <span className="font-heading font-black text-[0.7rem] tracking-wider select-none">
              {card.initials ?? "—"}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <h3 className="font-heading text-sm font-bold text-heading mb-1 leading-snug flex-1">
        {card.title}
      </h3>
      {card.subtitle && (
        <p className="text-xs text-deep-purple/50 font-medium leading-relaxed">
          {card.subtitle}
        </p>
      )}
    </motion.div>
  );
}

// ── Section component (also accepts legacy props for /about page) ─────────────

interface LegacyProps {
  certifications?: CMSAboutData["certifications"];
}

export default function AboutCertifications({ certifications: legacyData }: LegacyProps = {}) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [items,    setItems]    = useState<CertificationRow[] | null>(null);
  const [settings, setSettings] = useState<CertSettingsRow | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getActiveCertifications(), getCertSettings()])
      .then(([certs, cfg]) => { setItems(certs); setSettings(cfg); })
      .catch(() => { setItems(null); setSettings(null); })
      .finally(() => setLoading(false));
  }, []);

  // Section hidden by admin setting
  if (!loading && settings && !settings.visible) return null;

  // Heading / description: prefer DB settings, fall back to legacy prop, then hardcoded
  const heading = isAr
    ? (settings?.heading_ar     || legacyData?.headline || "التدريب والشهادات")
    : (settings?.heading_en     || legacyData?.headline || "Training & Certifications");

  const description = isAr
    ? (settings?.description_ar ?? legacyData?.subtitle ?? "")
    : (settings?.description_en ?? legacyData?.subtitle ?? "");

  const note = isAr ? settings?.note_ar : settings?.note_en;

  // Resolve background color
  const bgStyle = settings?.bg_color
    ? { backgroundColor: settings.bg_color }
    : undefined;
  const bgClass = settings?.bg_color ? "" : "bg-light-pink/20";

  // Build display cards: prefer DB, fall back to legacy, then hardcoded fallback
  const displayCards: CardData[] = (() => {
    if (items && items.length > 0) {
      return items.map(row => ({
        title:   isAr ? row.title_ar   : row.title_en,
        subtitle: isAr ? row.subtitle_ar : row.subtitle_en,
        logoUrl:  row.logo_url,
        initials: row.initials,
        mode:     row.display_mode as "logo" | "initials",
      }));
    }
    if (legacyData?.items && legacyData.items.length > 0) {
      return legacyData.items.map(item => ({
        title:   item.title,
        subtitle: item.issuer,
        logoUrl:  null,
        initials: (item.issuer?.match(/\b([A-Z])/g) ?? []).join("").slice(0, 4) || "—",
        mode:     "initials" as const,
      }));
    }
    return FALLBACK_ITEMS.map(f => ({
      title:   isAr ? f.title_ar   : f.title_en,
      subtitle: isAr ? f.subtitle_ar : f.subtitle_en,
      logoUrl:  null,
      initials: f.initials,
      mode:     f.display_mode,
    }));
  })();

  return (
    <section
      className={`py-24 ${bgClass}`}
      style={bgStyle}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker={isAr ? "المؤهلات" : "Credentials"}
          headline={heading}
          subtitle={description || undefined}
        />

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-gray-100 mb-4" />
                <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Cards grid */}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayCards.map((card, i) => (
              <CertCard key={`${card.title}-${i}`} card={card} index={i} />
            ))}
          </div>
        )}

        {/* Optional note below cards */}
        {!loading && note && (
          <p className="mt-8 text-center text-sm text-deep-purple/50 max-w-xl mx-auto leading-relaxed">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
