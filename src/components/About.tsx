import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { about } from "@/content/content";

export default function About() {
  const { lang } = useLanguage();
  const t = about[lang];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="order-2 lg:order-1"
        >
          <div className="relative max-w-md">
            <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-purple-secondary/25 via-pink-accent/20 to-pink-blush/30 -z-10" />
            <img
              src="/portrait.jpg"
              alt={t.imageAlt}
              className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl shadow-purple-primary/20"
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
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-pink-accent mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-6">
            {t.title}
          </h2>
          <div className="space-y-4 mb-8">
            {t.bio.map((p: string, i: number) => (
              <p key={i} className="text-body leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          <p className="text-sm font-semibold text-purple-secondary mb-3">
            {t.credentialsLabel}
          </p>
          <ul className="space-y-2">
            {t.credentials.map((c: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-body">
                <span className="w-1.5 h-1.5 rounded-full bg-peach-warm shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
