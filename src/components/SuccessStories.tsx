import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { successStoriesSection, successStories } from "@/content/content";

const accents = [
  { border: "border-sage-200", icon: "text-sage-500", ring: "shadow-sage-300/20" },
  { border: "border-peach-200", icon: "text-peach-500", ring: "shadow-peach-300/20" },
  { border: "border-lavender-200", icon: "text-lavender-500", ring: "shadow-lavender-300/20" },
];

export default function SuccessStories() {
  const { lang } = useLanguage();
  const t = successStoriesSection[lang];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="success-stories"
      className="py-24 bg-gradient-to-b from-cream-50 via-peach-50 to-lavender-50"
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-rose-600 mb-4">
            {t.title}
          </h2>
          <p className="text-stone-600 leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          {successStories.map((item, i) => {
            const isOpen = openIndex === i;
            const accent = accents[i % accents.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                className={`bg-white rounded-2xl border ${accent.border} shadow-sm ${accent.ring} overflow-hidden`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-start sm:items-center justify-between gap-4 text-start px-6 py-5"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-start gap-3">
                    <Quote className={`shrink-0 mt-0.5 ${accent.icon}`} size={18} />
                    <span className="font-medium text-rose-600 leading-snug">
                      {item.title}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0 text-sage-600 mt-1 sm:mt-0"
                  >
                    <ChevronDown size={20} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-stone-600 leading-relaxed">
                        {item.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
