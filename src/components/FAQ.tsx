import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { faq } from "@/content/content";

export default function FAQ() {
  const { lang } = useLanguage();
  const t = faq[lang];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-light-pink/25">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {t.title}
          </h2>
        </div>

        <div className="space-y-4">
          {t.items.map((item: { question: string; answer: string }, i: number) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-soft-purple/15 shadow-md shadow-deep-purple/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-start px-6 py-5"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-heading">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0 text-primary-pink"
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
                      <p className="px-6 pb-5 text-body leading-relaxed">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
