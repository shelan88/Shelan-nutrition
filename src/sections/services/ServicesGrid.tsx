/**
 * ServicesGrid — Premium service cards grid linking to detail pages.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import { Salad, HeartPulse, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { CMSService } from "@/types/cms.types";

const ICONS: Record<string, React.ElementType> = {
  Salad, HeartPulse, Sparkles,
};

interface Props {
  services: CMSService[];
  learnMoreLabel: string;
}

export default function ServicesGrid({ services, learnMoreLabel }: Props) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, i) => {
            const Icon = ICONS[service.iconName] ?? Sparkles;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-white rounded-3xl overflow-hidden border border-soft-purple/12 shadow-lg shadow-deep-purple/8 hover:shadow-2xl hover:shadow-deep-purple/18 hover:-translate-y-2 transition-all duration-300"
              >
                {/* Gradient image area */}
                <div
                  className={`relative h-52 bg-gradient-to-br ${service.accentFrom} ${service.accentTo} flex items-center justify-center overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/5" />
                  <div className="absolute -bottom-8 -end-8 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute -top-4 -start-4 w-24 h-24 rounded-full bg-white/10" />
                  <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-white" size={32} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-7">
                  <h3 className="font-heading text-xl font-bold text-heading mb-3">
                    {service.title}
                  </h3>
                  <p className="text-body text-sm leading-relaxed mb-6 opacity-80">
                    {service.shortDescription}
                  </p>
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-pink hover:text-deep-purple transition-colors group/link"
                  >
                    {learnMoreLabel}
                    <ArrowRight
                      size={15}
                      className="group-hover/link:translate-x-1 rtl:rotate-180 rtl:group-hover/link:-translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
