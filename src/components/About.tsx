import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { about } from "@/content/content";
import { getSetting } from "@/admin/repositories/settings.repository";
import {
  getActiveQualifications,
  getActiveExpertise,
  type QualificationRow,
  type ExpertiseRow,
} from "@/admin/repositories/aboutCms.repository";

interface AboutSetting {
  name_en?: string;
  name_ar?: string;
  title_en?: string;
  title_ar?: string;
  bio_en?: string;
  bio_ar?: string;
  portrait_url?: string;
}

export default function About() {
  const { lang } = useLanguage();
  const t = about[lang];
  const isAr = lang === "ar";

  const [dbAbout,         setDbAbout]         = useState<AboutSetting | null>(null);
  const [qualifications,  setQualifications]  = useState<QualificationRow[] | null>(null);
  const [expertise,       setExpertise]       = useState<ExpertiseRow[] | null>(null);

  useEffect(() => {
    // Load all three sources in parallel
    Promise.all([
      getSetting("site.about"),
      getActiveQualifications(),
      getActiveExpertise(),
    ]).then(([aboutVal, quals, exp]) => {
      if (aboutVal && typeof aboutVal === "object" && !Array.isArray(aboutVal)) {
        setDbAbout(aboutVal as AboutSetting);
      }
      setQualifications(quals.length > 0 ? quals : null);
      setExpertise(exp.length > 0 ? exp : null);
    }).catch(() => {/* silent fallback to content.ts */});
  }, []);

  // Resolve values: prefer DB, fall back to content.ts
  const title      = (isAr ? dbAbout?.title_ar    : dbAbout?.title_en)    || t.title;
  const bioRaw     = isAr  ? dbAbout?.bio_ar       : dbAbout?.bio_en;
  const bioParas: string[] = bioRaw
    ? bioRaw.split(/\n\n+/).filter(Boolean)
    : t.bio;
  const portraitSrc = dbAbout?.portrait_url || "/portrait.jpg";

  // Qualifications: DB rows → or fall back to content.ts credentials
  const qualItems: string[] = qualifications
    ? qualifications.map(q => isAr ? q.text_ar : q.text_en)
    : t.credentials;

  // Expertise: DB rows → or fall back to an empty list (section hidden if empty)
  const expItems: string[] = expertise
    ? expertise.map(e => isAr ? e.text_ar : e.text_en)
    : [];

  return (
    <section id="about" className="section-dark py-24 bg-gradient-to-b from-soft-pink via-primary-pink to-soft-purple">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, x: isAr ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-2 lg:order-1"
        >
          <div className="relative max-w-md">
            <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-primary-pink/30 via-light-pink/20 to-lavender-purple/30 -z-10" />
            <img
              src={portraitSrc}
              alt={t.imageAlt}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              className="protected-image w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl shadow-deep-purple/30"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: isAr ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-1 lg:order-2"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-light-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-6">
            {title}
          </h2>
          <div className="space-y-4 mb-8">
            {bioParas.map((p: string, i: number) => (
              <p key={i} className="text-body leading-relaxed">{p}</p>
            ))}
          </div>

          {/* Qualifications */}
          {qualItems.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-light-pink mb-3">
                {isAr ? "المؤهلات" : t.credentialsLabel}
              </p>
              <ul className="space-y-2">
                {qualItems.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 text-body">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-pink shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas of Expertise (only shown when DB has items) */}
          {expItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-light-pink mb-3">
                {isAr ? "مجالات التخصص" : "Areas of Expertise"}
              </p>
              <ul className="space-y-2">
                {expItems.map((e, i) => (
                  <li key={i} className="flex items-center gap-3 text-body">
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender-purple shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
