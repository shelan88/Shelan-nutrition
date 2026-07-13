import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { hero } from "@/content/content";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  const { lang } = useLanguage();
  const t = hero[lang];

  return (
    <section
      id="top"
      className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-lavender-100 via-peach-50 to-cream-50"
    >
      <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-peach-300/50 blur-3xl" />
      <div className="absolute top-40 -start-32 w-80 h-80 rounded-full bg-lavender-200/60 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-4">
            {t.eyebrow}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-rose-600 mb-6">
            {t.headline}
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed mb-9 max-w-xl">
            {t.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo("booking")}
              className="px-7 py-3.5 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-md shadow-rose-300/40"
            >
              {t.ctaPrimary}
            </button>
            <button
              onClick={() => scrollTo("info-hub")}
              className="px-7 py-3.5 rounded-full border border-sage-300 text-rose-600 font-medium hover:bg-sage-50 transition-colors"
            >
              {t.ctaSecondary}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <div className="aspect-[4/5] rounded-[2rem] bg-gradient-to-br from-lavender-200 via-lavender-100 to-peach-100 flex items-center justify-center overflow-hidden shadow-lg shadow-lavender-200/40">
            <span
              className="text-lavender-500/60 font-heading text-sm tracking-wide text-center px-8"
              role="img"
              aria-label={t.imageAlt}
            >
              {t.imageAlt}
              <br />
              <span className="text-xs opacity-70">(photo placeholder)</span>
            </span>
          </div>
          <div className="absolute -bottom-6 -start-6 bg-white rounded-2xl shadow-md px-6 py-4 border border-sage-200">
            <p className="font-heading font-bold text-2xl text-rose-600">10+</p>
            <p className="text-xs text-stone-500">
              {lang === "en" ? "Years of Experience" : "سنوات من الخبرة"}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
