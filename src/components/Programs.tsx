import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Tag,
  Salad, HeartPulse, Sparkles, Star, Heart, Leaf, Apple, Dumbbell, Brain, Sun,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getActivePrograms } from "@/admin/repositories/programs.repository";
import type { ProgramRow } from "@/types/database.types";

const PROGRAM_ICONS: Record<string, React.ElementType> = {
  Salad, HeartPulse, Sparkles, Star, Heart, Leaf, Apple, Dumbbell, Brain, Sun,
};

const cardAccents = [
  { border: "border-primary-pink/20",   badge: "bg-primary-pink/10 text-primary-pink",    dot: "bg-primary-pink" },
  { border: "border-lavender-purple/20", badge: "bg-lavender-purple/10 text-lavender-purple", dot: "bg-lavender-purple" },
  { border: "border-soft-purple/30",    badge: "bg-soft-purple/20 text-deep-purple",      dot: "bg-soft-purple" },
];

export default function Programs() {
  const { lang } = useLanguage();
  const [programs, setPrograms] = useState<ProgramRow[] | null>(null); // null = loading

  useEffect(() => {
    getActivePrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, []);

  // Hide section entirely while loading or when no active programs
  if (programs === null || programs.length === 0) return null;

  return (
    <section id="programs" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {lang === "ar" ? "برامجنا" : "Our Programs"}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {lang === "ar" ? "البرامج المتاحة" : "Available Programs"}
          </h2>
          <p className="text-body leading-relaxed">
            {lang === "ar"
              ? "برامج تغذية متخصصة مصممة لتناسب احتياجاتك الفريدة."
              : "Specialized nutrition programs designed to fit your unique needs."}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog, i) => {
            const accent = cardAccents[i % cardAccents.length];
            const name = (lang === "ar" ? prog.name_ar : prog.name_en) || prog.name_en;
            const shortDesc = (lang === "ar" ? prog.short_description_ar : prog.short_description_en) || prog.short_description_en;
            const features: string[] = (lang === "ar" ? prog.features_ar : prog.features_en) ?? [];

            return (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className={`group relative bg-white border-2 ${accent.border} rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-deep-purple/10 transition-all duration-300 flex flex-col`}
              >
                {/* Icon */}
                {prog.icon && PROGRAM_ICONS[prog.icon] && (() => {
                  const Icon = PROGRAM_ICONS[prog.icon!];
                  return (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-soft-pink to-soft-purple flex items-center justify-center mb-4">
                      <Icon size={22} strokeWidth={1.8} className="text-white" />
                    </div>
                  );
                })()}

                <h3 className="font-heading text-lg font-bold text-heading mb-2 leading-snug">
                  {name}
                </h3>

                {shortDesc && (
                  <p className="text-body text-sm leading-relaxed mb-4 flex-1">
                    {shortDesc}
                  </p>
                )}

                {/* Meta: price + duration */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {prog.price != null && (
                    <span className={`flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full ${accent.badge}`}>
                      <Tag size={11} strokeWidth={2} />
                      ${prog.price}
                    </span>
                  )}
                  {prog.duration_weeks != null && (
                    <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      <Clock size={11} strokeWidth={2} />
                      {prog.duration_weeks}
                      {lang === "ar" ? " أسابيع" : " weeks"}
                    </span>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <ul className="space-y-1.5 border-t border-gray-100 pt-4">
                    {features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-[13px] text-body">
                        <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${accent.dot.replace("bg-", "text-")}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
