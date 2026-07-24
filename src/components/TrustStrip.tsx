/**
 * TrustStrip — Credentials & certifications section.
 * DB-driven: reads from about_certifications + about_certifications_settings.
 * Each card shows either an uploaded logo image OR styled initials badge,
 * controlled by display_mode field set in the admin CMS.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import {
  getActiveCertifications,
  getCertSettings,
  type CertificationRow,
  type CertSettingsRow,
} from "@/admin/repositories/aboutCms.repository";

// Palette for initials badges — cycles through these based on index
const BADGE_PALETTE = [
  "from-primary-pink/20 to-lavender-purple/20 text-primary-pink",
  "from-lavender-purple/20 to-deep-purple/20 text-lavender-purple",
  "from-soft-pink/30 to-primary-pink/20 text-primary-pink",
  "from-deep-purple/15 to-lavender-purple/20 text-deep-purple",
  "from-primary-pink/15 to-soft-pink/25 text-primary-pink",
  "from-lavender-purple/15 to-soft-purple/20 text-lavender-purple",
];

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  cert:   CertificationRow;
  index:  number;
  isAr:   boolean;
}

function CertCard({ cert, index, isAr }: CardProps) {
  const palette = BADGE_PALETTE[index % BADGE_PALETTE.length];
  const name    = isAr ? cert.title_ar : cert.title_en;
  const showLogo = cert.display_mode === "logo" && !!cert.logo_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className="group flex flex-col items-center gap-2.5 cursor-default"
    >
      {/* Logo or initials box */}
      <div className="w-[80px] h-[52px] sm:w-[100px] sm:h-[64px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-gray-300 group-hover:shadow-sm">
        {showLogo ? (
          <img
            src={cert.logo_url!}
            alt={name}
            className="w-full h-full object-contain p-1.5"
            style={{ imageRendering: "crisp-edges" }}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${palette} flex items-center justify-center`}
          >
            <span className="text-[12px] sm:text-[13px] font-black tracking-wide select-none">
              {cert.initials ?? "—"}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium text-center leading-tight max-w-[90px] group-hover:text-gray-500 transition-colors">
        {name}
      </span>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function TrustStrip() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [certs,    setCerts]    = useState<CertificationRow[] | null>(null);
  const [settings, setSettings] = useState<CertSettingsRow   | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getActiveCertifications(), getCertSettings()])
      .then(([rows, cfg]) => { setCerts(rows); setSettings(cfg); })
      .catch(() => { setCerts([]); setSettings(null); })
      .finally(() => setLoading(false));
  }, []);

  // Don't render anything while loading (parent already shows section optimistically)
  if (loading) return null;

  // If DB returned empty list, hide entirely
  if (!certs || certs.length === 0) return null;

  const heading = isAr
    ? (settings?.heading_ar || "الشهادات والانتماءات المهنية")
    : (settings?.heading_en || "Credentials & Professional Affiliations");

  return (
    <section className="py-14 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-8"
        >
          {heading}
        </motion.p>

        {/* Cards */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 lg:gap-12">
          {certs.map((cert, idx) => (
            <CertCard key={cert.id} cert={cert} index={idx} isAr={isAr} />
          ))}
        </div>

      </div>
    </section>
  );
}
