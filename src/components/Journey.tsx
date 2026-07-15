import { motion } from "framer-motion";
import { Calendar, ClipboardList, FileText, RefreshCw, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { journey } from "@/content/content";

const stepIcons = [Calendar, ClipboardList, FileText, RefreshCw, Star];

const iconAccents = [
  "from-primary-pink to-soft-pink",
  "from-soft-purple to-lavender-purple",
  "from-primary-pink to-lavender-purple",
  "from-soft-purple to-primary-pink",
  "from-lavender-purple to-soft-pink",
];

export default function Journey() {
  const { lang } = useLanguage();
  const t = journey[lang];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 lg:mb-20"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {t.title}
          </h2>
          <p className="text-body leading-relaxed">{t.subtitle}</p>
        </motion.div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block">
          {/* Connector line */}
          <div className="relative mb-6">
            <div className="absolute top-10 inset-x-[10%] h-px bg-gradient-to-r from-primary-pink/20 via-lavender-purple/40 to-primary-pink/20" />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
              className="absolute top-10 inset-x-[10%] h-px bg-gradient-to-r from-primary-pink via-lavender-purple to-soft-purple origin-left"
            />
          </div>

          <div className="grid grid-cols-5 gap-4">
            {t.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.55, delay: i * 0.12 }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Icon circle */}
                  <motion.div
                    whileHover={{ scale: 1.1, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${iconAccents[i]} flex items-center justify-center mb-5 shadow-lg shadow-deep-purple/20 group-hover:shadow-xl group-hover:shadow-deep-purple/30 transition-shadow duration-300`}
                  >
                    <Icon size={28} className="text-white" strokeWidth={1.75} />
                    {/* Step number badge */}
                    <span className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-white border-2 border-primary-pink text-primary-pink text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </motion.div>

                  <h3 className="font-heading text-base font-bold text-heading mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-body text-sm leading-relaxed opacity-80">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden relative">
          {/* Vertical line */}
          <div className="absolute start-9 top-0 bottom-0 w-px bg-gradient-to-b from-primary-pink/20 via-lavender-purple/40 to-primary-pink/20" />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
            className="absolute start-9 top-0 bottom-0 w-px bg-gradient-to-b from-primary-pink via-lavender-purple to-soft-purple origin-top"
          />

          <div className="space-y-8">
            {t.steps.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  {/* Icon */}
                  <div className={`relative shrink-0 w-[4.5rem] h-[4.5rem] rounded-full bg-gradient-to-br ${iconAccents[i]} flex items-center justify-center shadow-lg shadow-deep-purple/20 z-10`}>
                    <Icon size={22} className="text-white" strokeWidth={1.75} />
                    <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-white border-2 border-primary-pink text-primary-pink text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {i + 1}
                    </span>
                  </div>

                  <div className="pt-3 flex-1">
                    <h3 className="font-heading text-base font-bold text-heading mb-1">
                      {step.title}
                    </h3>
                    <p className="text-body text-sm leading-relaxed opacity-80">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
