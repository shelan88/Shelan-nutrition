/**
 * AboutPhilosophy — Philosophy pillars grid.
 * Icons resolved from string names to avoid `import *`.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import {
  Heart, Microscope, Leaf, RefreshCw, Users, Sparkles,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData, CMSPhilosophyPillar } from "@/types/cms.types";

const ICONS: Record<string, React.ElementType> = {
  Heart, Microscope, Leaf, RefreshCw, Users, Sparkles,
};

const ACCENTS = [
  "from-primary-pink to-soft-pink",
  "from-soft-purple to-lavender-purple",
  "from-soft-pink to-lavender-purple",
  "from-lavender-purple to-soft-purple",
  "from-soft-purple to-primary-pink",
  "from-primary-pink to-lavender-purple",
];

interface Props {
  philosophy: CMSAboutData["philosophy"];
}

function PillarCard({ pillar, index }: { pillar: CMSPhilosophyPillar; index: number }) {
  const Icon = ICONS[pillar.iconName] ?? Sparkles;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * 0.09 }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 360, damping: 22 } }}
      className="bg-white rounded-2xl p-7 border border-soft-purple/10 shadow-md shadow-deep-purple/8 hover:shadow-xl hover:shadow-deep-purple/15 transition-shadow duration-300 group"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-5 shadow-md shadow-deep-purple/15 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={22} />
      </div>
      <h3 className="font-heading text-base font-bold text-heading mb-2">{pillar.title}</h3>
      <p className="text-body text-sm leading-relaxed opacity-80">{pillar.description}</p>
    </motion.div>
  );
}

export default function AboutPhilosophy({ philosophy }: Props) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker={philosophy.kicker}
          headline={philosophy.headline}
          subtitle={philosophy.subtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {philosophy.pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
