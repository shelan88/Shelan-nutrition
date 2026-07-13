import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { hero } from "@/content/content";
import MagneticButton from "@/components/MagneticButton";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  const { lang } = useLanguage();
  const t = hero[lang];

  return (
    <section
      id="top"
      className="section-dark relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-950"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
      <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="absolute top-40 -start-32 w-80 h-80 rounded-full bg-lavender-500/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-300 mb-4">
            {t.eyebrow}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-heading mb-6">
            {t.headline}
          </h1>
          <p className="text-lg text-body leading-relaxed mb-9 max-w-xl">
            {t.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <MagneticButton
              onClick={() => scrollTo("booking")}
              className="px-7 py-3.5 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/50"
            >
              {t.ctaPrimary}
            </MagneticButton>
            <MagneticButton
              onClick={() => scrollTo("info-hub")}
              className="px-7 py-3.5 rounded-full border border-white/20 text-ivory font-medium hover:bg-white/10 transition-colors"
            >
              {t.ctaSecondary}
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
