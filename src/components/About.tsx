import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { about } from "@/content/content";

export default function About() {
  const { lang } = useLanguage();
  const t = about[lang];

  return (
    <section id="about" className="py-24 bg-gradient-to-b from-sage-100 via-sage-50 to-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-2 lg:order-1"
        >
          <div className="aspect-[4/5] max-w-md rounded-[2rem] bg-gradient-to-br from-peach-100 via-lavender-50 to-lavender-100 flex items-center justify-center shadow-md">
            <span
              className="text-lavender-500/60 font-heading text-sm text-center px-8"
              role="img"
              aria-label={t.imageAlt}
            >
              {t.imageAlt}
              <br />
              <span className="text-xs opacity-70">(photo placeholder)</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-1 lg:order-2"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-rose-600 mb-6">
            {t.title}
          </h2>
          <div className="space-y-4 mb-8">
            {t.bio.map((p: string, i: number) => (
              <p key={i} className="text-stone-600 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <p className="text-sm font-semibold text-lavender-700 mb-3">
            {t.credentialsLabel}
          </p>
          <ul className="space-y-2">
            {t.credentials.map((c: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-stone-700">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-500 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
