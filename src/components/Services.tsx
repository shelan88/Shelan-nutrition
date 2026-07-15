import { motion } from "framer-motion";
import { Salad, HeartPulse, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { services } from "@/content/content";

const icons = [Salad, HeartPulse, Sparkles];
const accents = [
  {
    card: "bg-soft-pink",
    chip: "bg-white/25",
    icon: "text-white",
    glow: "rgba(248,142,184,0.45)",
  },
  {
    card: "bg-soft-purple",
    chip: "bg-white/20",
    icon: "text-white",
    glow: "rgba(141,95,211,0.45)",
  },
  {
    card: "bg-gradient-to-br from-primary-pink to-lavender-purple",
    chip: "bg-white/25",
    icon: "text-white",
    glow: "rgba(243,94,152,0.45)",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }),
};

export default function Services() {
  const { lang } = useLanguage();
  const t = services[lang];

  return (
    <section id="services" className="py-24 bg-light-pink/25">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {t.title}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.items.map((item: (typeof t.items)[number], i: number) => {
            const Icon = icons[i % icons.length];
            const accent = accents[i % accents.length];
            return (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                whileHover={{
                  y: -8,
                  boxShadow: `0 24px 48px ${accent.glow}`,
                  transition: { type: "spring", stiffness: 350, damping: 22 },
                }}
                viewport={{ once: true, amount: 0.25 }}
                variants={cardVariants}
                className={`${accent.card} rounded-3xl p-8 shadow-lg shadow-deep-purple/15 transition-shadow duration-300 cursor-default group relative overflow-hidden`}
              >
                {/* Subtle inner highlight on hover */}
                <div className="absolute inset-0 rounded-3xl bg-white/0 group-hover:bg-white/8 transition-colors duration-300 pointer-events-none" />

                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                  className={`relative w-14 h-14 rounded-2xl ${accent.chip} flex items-center justify-center mb-6`}
                >
                  <Icon className={accent.icon} size={26} />
                </motion.div>

                <h3 className="relative font-heading text-xl font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="relative text-white/90 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
