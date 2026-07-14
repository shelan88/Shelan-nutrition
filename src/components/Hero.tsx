import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { hero } from "@/content/content";
import MagneticButton from "@/components/MagneticButton";
import heroIllustration from "@/assets/images/hero-illustration.webp";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  const { lang } = useLanguage();
  const t = hero[lang];

  return (
    <section
      id="top"
      className="section-dark relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-gradient-to-b from-soft-purple via-primary-pink to-soft-pink"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-deep-purple/60 via-primary-pink/70 to-soft-pink/80" />
      <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-light-pink/25 blur-3xl" />
      <div className="absolute top-40 -start-32 w-80 h-80 rounded-full bg-deep-purple/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] items-center gap-10 lg:gap-8">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="order-1 max-w-2xl lg:order-none"
          >
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-light-pink mb-4">
              {t.eyebrow}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-heading mb-6">
              {t.headline}
            </h1>
            <p className="text-lg text-body leading-relaxed mb-9 max-w-xl">
              {t.subheadline}
            </p>
            <div className="hidden lg:flex flex-wrap gap-4">
              <MagneticButton
                onClick={() => scrollTo("booking")}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/30"
              >
                {t.ctaPrimary}
              </MagneticButton>
              <MagneticButton
                onClick={() => scrollTo("info-hub")}
                className="px-7 py-3.5 rounded-full border border-white/40 text-ivory font-medium hover:bg-white/15 transition-colors"
              >
                {t.ctaSecondary}
              </MagneticButton>
            </div>
          </motion.div>

          {/* Illustration column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="order-2 relative flex justify-center lg:justify-end lg:order-none"
          >
            <div className="relative w-full max-w-[220px] lg:max-w-[420px] aspect-square flex items-center justify-center">
              {/* Soft radial glow behind the illustration */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-light-pink/50 via-soft-purple/40 to-transparent blur-2xl scale-90" />
              <img
                src={heroIllustration}
                alt={t.imageAlt}
                width={420}
                height={420}
                className="relative z-10 w-full h-auto max-h-[220px] lg:max-h-none object-contain drop-shadow-[0_20px_45px_rgba(91,33,182,0.35)]"
              />
            </div>
          </motion.div>

          {/* Mobile/tablet CTA buttons — after the illustration for quick access */}
          <div className="order-3 flex flex-wrap gap-4 lg:hidden">
            <MagneticButton
              onClick={() => scrollTo("booking")}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/30"
            >
              {t.ctaPrimary}
            </MagneticButton>
            <MagneticButton
              onClick={() => scrollTo("info-hub")}
              className="px-7 py-3.5 rounded-full border border-white/40 text-ivory font-medium hover:bg-white/15 transition-colors"
            >
              {t.ctaSecondary}
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
