/**
 * AboutMissionVision — Mission & Vision split cards.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import { Target, Eye } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData } from "@/types/cms.types";

interface Props {
  missionVision: CMSAboutData["missionVision"];
}

export default function AboutMissionVision({ missionVision }: Props) {
  const cards = [
    {
      label: missionVision.missionLabel,
      text: missionVision.missionText,
      Icon: Target,
      gradient: "bg-gradient-to-br from-soft-pink to-primary-pink",
    },
    {
      label: missionVision.visionLabel,
      text: missionVision.visionText,
      Icon: Eye,
      gradient: "bg-gradient-to-br from-soft-purple to-lavender-purple",
    },
  ];

  return (
    <section className="py-24 bg-light-pink/25">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader kicker={missionVision.kicker} headline={missionVision.headline} />

        <div className="grid md:grid-cols-2 gap-8">
          {cards.map(({ label, text, Icon, gradient }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`${gradient} rounded-3xl p-10 shadow-xl shadow-deep-purple/20 section-dark`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <Icon className="text-white" size={26} />
              </div>
              <h3 className="font-heading text-xl font-bold text-heading mb-4">{label}</h3>
              <p className="text-body leading-relaxed opacity-90">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
