import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { testimonialsSection, testimonials } from "@/content/content";

const accents = [
  { chip: "bg-sage-100", icon: "text-sage-600", border: "border-sage-200" },
  { chip: "bg-peach-100", icon: "text-peach-600", border: "border-peach-200" },
  { chip: "bg-lavender-100", icon: "text-lavender-600", border: "border-lavender-200" },
];

export default function Testimonials() {
  const { lang } = useLanguage();
  const t = testimonialsSection[lang];

  return (
    <section
      id="testimonials"
      className="py-24 bg-gradient-to-b from-lavender-100 via-sage-50 to-cream-50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {t.title}
          </h2>
          <p className="text-body leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((quote, i) => {
            const accent = accents[i % accents.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                className={`bg-white rounded-2xl p-6 border ${accent.border} shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col`}
              >
                <div className={`w-10 h-10 rounded-xl ${accent.chip} flex items-center justify-center mb-4`}>
                  <Quote className={accent.icon} size={18} />
                </div>
                <p className="text-body leading-relaxed text-sm flex-1">
                  {quote}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
