import { motion } from "framer-motion";
import { Salad, HeartPulse, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { services } from "@/content/content";

const icons = [Salad, HeartPulse, Sparkles];
const accents = [
  { chip: "bg-orchid-500/15", icon: "text-orchid-300", border: "border-white/10" },
  { chip: "bg-rosegold-500/15", icon: "text-rosegold-400", border: "border-white/10" },
  { chip: "bg-blush-400/15", icon: "text-blush-300", border: "border-white/10" },
];

export default function Services() {
  const { lang } = useLanguage();
  const t = services[lang];

  return (
    <section id="services" className="section-dark py-24 bg-plum-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-orchid-300 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {t.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.items.map((item: (typeof t.items)[number], i: number) => {
            const Icon = icons[i % icons.length];
            const accent = accents[i % accents.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`bg-plum-800 rounded-3xl p-8 shadow-lg shadow-black/30 border ${accent.border} hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-2xl ${accent.chip} flex items-center justify-center mb-6`}>
                  <Icon className={accent.icon} size={26} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-heading mb-3">
                  {item.title}
                </h3>
                <p className="text-body leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
