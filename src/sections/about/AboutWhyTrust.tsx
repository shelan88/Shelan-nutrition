/**
 * AboutWhyTrust — Trust reasons grid with stats and icons.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import {
  PersonStanding, FlaskConical, Heart, Users, MessageCircle, TrendingUp, Sparkles,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData, CMSTrustReason } from "@/types/cms.types";

const ICONS: Record<string, React.ElementType> = {
  PersonStanding, FlaskConical, Heart, Users, MessageCircle, TrendingUp, Sparkles,
};

const ACCENTS = [
  "from-primary-pink to-soft-pink",
  "from-soft-purple to-lavender-purple",
  "from-lavender-purple to-primary-pink",
  "from-soft-pink to-lavender-purple",
  "from-soft-purple to-soft-pink",
  "from-primary-pink to-lavender-purple",
];

interface Props {
  whyTrust: CMSAboutData["whyTrust"];
}

function TrustCard({ reason, index }: { reason: CMSTrustReason; index: number }) {
  const Icon = ICONS[reason.iconName] ?? Sparkles;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className="bg-white rounded-2xl p-7 border border-soft-purple/10 shadow-md shadow-deep-purple/8 hover:shadow-xl hover:shadow-deep-purple/15 hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-5 shadow-md shadow-deep-purple/15`}>
        <Icon className="text-white" size={22} />
      </div>

      {reason.stat && (
        <p className="text-xs font-bold text-primary-pink uppercase tracking-wider mb-2">
          {reason.stat}
        </p>
      )}

      <h3 className="font-heading text-base font-bold text-heading mb-2">{reason.title}</h3>
      <p className="text-body text-sm leading-relaxed opacity-80">{reason.description}</p>
    </motion.div>
  );
}

export default function AboutWhyTrust({ whyTrust }: Props) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker={whyTrust.kicker}
          headline={whyTrust.headline}
          subtitle={whyTrust.subtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyTrust.reasons.map((reason, i) => (
            <TrustCard key={reason.title} reason={reason} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
