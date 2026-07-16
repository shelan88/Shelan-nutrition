/**
 * AboutCertifications — Credential card grid with year badges.
 * Props-only, CMS-ready.
 */
import { motion } from "framer-motion";
import { Award, BadgeCheck, Stethoscope, Microscope, BookOpen, Leaf } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData, CMSCertification } from "@/types/cms.types";

const ICONS: Record<string, React.ElementType> = {
  Award, BadgeCheck, Stethoscope, Microscope, BookOpen, Leaf,
};

interface Props {
  certifications: CMSAboutData["certifications"];
}

function CertCard({ cert, index }: { cert: CMSCertification; index: number }) {
  const Icon = ICONS[cert.iconName] ?? Award;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative bg-white rounded-2xl border border-soft-purple/12 p-6 shadow-sm hover:shadow-lg hover:shadow-deep-purple/10 hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Year badge */}
      <span className="absolute top-4 end-4 text-[0.65rem] font-bold text-primary-pink bg-primary-pink/10 rounded-full px-2 py-0.5">
        {cert.year}
      </span>

      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center mb-4 group-hover:from-primary-pink/25 group-hover:to-lavender-purple/25 transition-colors duration-300">
        <Icon className="text-primary-pink" size={20} />
      </div>

      <h3 className="font-heading text-sm font-bold text-heading mb-1 leading-snug pr-8">
        {cert.title}
      </h3>
      <p className="text-xs text-deep-purple/50 font-medium">{cert.issuer}</p>
    </motion.div>
  );
}

export default function AboutCertifications({ certifications }: Props) {
  return (
    <section className="py-24 bg-light-pink/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker={certifications.kicker}
          headline={certifications.headline}
          subtitle={certifications.subtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certifications.items.map((cert, i) => (
            <CertCard key={cert.title} cert={cert} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
