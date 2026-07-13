import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { successStoriesSection, successStories } from "@/content/content";

const accents = [
  { chip: "bg-rose-600/15", icon: "text-rose-300", border: "border-white/10" },
  { chip: "bg-apricot-500/15", icon: "text-apricot-300", border: "border-white/10" },
  { chip: "bg-nude-500/15", icon: "text-nude-300", border: "border-white/10" },
];

// Deterministic bento pattern: every 6th card is a wide "feature" card, every
// 4th (offset) is a tall card — creates an asymmetrical, editorial rhythm
// without any layout randomness between renders.
function bentoSpan(i: number) {
  if (i % 6 === 0) return "sm:col-span-2";
  if (i % 5 === 3) return "lg:row-span-2";
  return "";
}

export default function SuccessStories() {
  const { lang } = useLanguage();
  const t = successStoriesSection[lang];
  const stories = successStories[lang];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  const active = activeIndex !== null ? stories[activeIndex] : null;
  const activeAccent = activeIndex !== null ? accents[activeIndex % accents.length] : accents[0];

  return (
    <section
      id="success-stories"
      className="section-dark py-24 bg-plum-950"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-300 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {t.title}
          </h2>
          <p className="text-body leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[200px]">
          {stories.map((item, i) => {
            const accent = accents[i % accents.length];
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative text-start bg-plum-800 rounded-2xl border ${accent.border} shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/50 hover:border-white/20 transition-shadow duration-300 p-6 flex flex-col overflow-hidden ${bentoSpan(i)}`}
              >
                <div className={`w-10 h-10 rounded-xl ${accent.chip} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <Quote className={accent.icon} size={18} />
                </div>
                <p className="font-medium text-heading leading-snug line-clamp-3">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-body-muted leading-relaxed line-clamp-2 flex-1">
                  {item.content}
                </p>
                <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-nude-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {lang === "ar" ? "اقرأي القصة كاملة" : "Read full story"}
                </span>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-plum-800 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/60"
            >
              <button
                onClick={() => setActiveIndex(null)}
                aria-label="Close"
                className="absolute top-5 end-5 w-9 h-9 rounded-full flex items-center justify-center text-ivory-muted hover:bg-white/10 hover:text-ivory transition-colors"
              >
                <X size={18} />
              </button>
              <div className={`w-11 h-11 rounded-xl ${activeAccent.chip} flex items-center justify-center mb-6`}>
                <Quote className={activeAccent.icon} size={20} />
              </div>
              <h3 className="font-heading text-2xl font-bold text-heading mb-4 leading-snug">
                {active.title}
              </h3>
              <p className="text-body leading-relaxed">{active.content}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
