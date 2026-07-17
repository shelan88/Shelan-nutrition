import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { about } from "@/content/content";
import { getSetting } from "@/admin/repositories/settings.repository";

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

  const [dbAbout, setDbAbout] = useState<AboutSetting | null>(null);

  useEffect(() => {
    getSetting("site.about")
      .then((val) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          setDbAbout(val as AboutSetting);
        }
      })
      .catch(() => {/* silently fall back to content.ts */});
  }, []);

  // Resolve values: prefer DB, fall back to content.ts
  const title = (lang === "ar" ? dbAbout?.title_ar : dbAbout?.title_en) || t.title;
  const bioRaw = lang === "ar" ? dbAbout?.bio_ar : dbAbout?.bio_en;
  const bioParas: string[] = bioRaw
    ? bioRaw.split(/\n\n+/).filter(Boolean)
    : t.bio;
  const portraitSrc = dbAbout?.portrait_url || "/portrait.jpg";

  return (
    <section id="about" className="section-dark py-24 bg-gradient-to-b from-soft-pink via-primary-pink to-soft-purple">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
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

        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
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
              <p key={i} className="text-body leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <p className="text-sm font-semibold text-light-pink mb-3">
            {t.credentialsLabel}
          </p>
          <ul className="space-y-2">
            {t.credentials.map((c: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-body">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-pink shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
