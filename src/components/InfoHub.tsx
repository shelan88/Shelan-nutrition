import { motion } from "framer-motion";
import { BookOpen, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { infoHub } from "@/content/content";

const icons = [BookOpen, Activity];
const accents = [
  { chip: "bg-lavender-100", icon: "text-lavender-600", border: "border-lavender-200", dot: "bg-lavender-400" },
  { chip: "bg-sage-100", icon: "text-sage-600", border: "border-sage-200", dot: "bg-sage-400" },
];

export default function InfoHub() {
  const { lang } = useLanguage();
  const t = infoHub[lang];

  return (
    <section id="info-hub" className="py-24 bg-gradient-to-b from-cream-50 via-lavender-50/60 to-cream-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-rose-600">
            {t.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {t.sections.map((section: (typeof t.sections)[number], i: number) => {
            const Icon = icons[i % icons.length];
            const accent = accents[i % accents.length];
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`rounded-3xl p-9 bg-gradient-to-br ${accent.chip} to-cream-50 border ${accent.border}`}
              >
                <div className={`w-14 h-14 rounded-2xl ${accent.chip} flex items-center justify-center mb-6`}>
                  <Icon className={accent.icon} size={26} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-rose-600 mb-3">
                  {section.title}
                </h3>
                <p className="text-stone-600 leading-relaxed mb-6">
                  {section.description}
                </p>
                <ul className="space-y-2.5">
                  {section.points.map((point: string, j: number) => (
                    <li key={j} className="flex items-start gap-3 text-stone-700 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${accent.dot} shrink-0 mt-1.5`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
