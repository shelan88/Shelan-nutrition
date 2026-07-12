import { motion } from "framer-motion";
import { Salad, HeartPulse, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { services } from "@/content/content";

const icons = [Salad, HeartPulse, Sparkles];

export default function Services() {
  const { lang } = useLanguage();
  const t = services[lang];

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-lavender-100/80 via-lavender-50 to-lavender-100/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-rose-500 mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">
            {t.title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.items.map((item: (typeof t.items)[number], i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-lavender-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-6">
                  <Icon className="text-rose-500" size={26} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
