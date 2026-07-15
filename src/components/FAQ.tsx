import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { faq } from "@/content/content";

export default function FAQ() {
  const { lang } = useLanguage();
  const t = faq[lang];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="py-24 bg-light-pink/25">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {t.title}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {t.items.map((item: { question: string; answer: string }, i: number) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "bg-white border-primary-pink/30 shadow-lg shadow-deep-purple/12"
                    : "bg-white border-soft-purple/15 shadow-sm shadow-deep-purple/8 hover:border-primary-pink/20 hover:shadow-md"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 text-start px-6 py-5 group"
                  aria-expanded={isOpen}
                >
                  {/* Active accent bar */}
                  <span className="flex items-center gap-3 flex-1 min-w-0">
                    <motion.span
                      animate={{ opacity: isOpen ? 1 : 0, scaleY: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 w-[3px] h-5 rounded-full bg-gradient-to-b from-primary-pink to-lavender-purple origin-center"
                    />
                    <span
                      className={`font-medium leading-snug transition-colors duration-200 ${
                        isOpen ? "text-primary-pink" : "text-heading group-hover:text-primary-pink"
                      }`}
                    >
                      {item.question}
                    </span>
                  </span>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`shrink-0 transition-colors duration-200 ${
                      isOpen ? "text-primary-pink" : "text-deep-purple/40 group-hover:text-primary-pink"
                    }`}
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
                      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-body leading-relaxed ps-[calc(1.5rem+11px)]">
                        {item.answer}
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
