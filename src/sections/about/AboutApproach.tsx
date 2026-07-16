/**
 * AboutApproach — Numbered approach steps, vertical timeline style.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData } from "@/types/cms.types";

interface Props {
  approach: CMSAboutData["approach"];
}

export default function AboutApproach({ approach }: Props) {
  return (
    <section className="py-24 bg-gradient-to-b from-light-pink/30 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker={approach.kicker}
          headline={approach.headline}
          subtitle={approach.subtitle}
        />

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute start-[2.75rem] sm:start-[3.25rem] top-0 bottom-0 w-px bg-gradient-to-b from-primary-pink/20 via-lavender-purple/40 to-primary-pink/20 hidden sm:block" />

          <div className="space-y-10">
            {approach.steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="flex gap-6 sm:gap-8 items-start"
              >
                {/* Step number badge */}
                <div className="shrink-0 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-lg shadow-deep-purple/20 z-10">
                  <span className="font-heading text-white font-bold text-sm sm:text-base">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2 sm:pt-3.5">
                  <span className="text-xs font-semibold text-primary-pink uppercase tracking-widest mb-1 block">
                    {step.number}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-heading mb-2">
                    {step.title}
                  </h3>
                  <p className="text-body text-sm leading-relaxed opacity-80">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
