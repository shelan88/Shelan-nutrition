/**
 * AboutStory — Two-column narrative section.
 * Props-only, no hardcoded content. CMS-ready.
 */
import { motion } from "framer-motion";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSAboutData } from "@/types/cms.types";

interface Props {
  story: CMSAboutData["story"];
}

export default function AboutStory({ story }: Props) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 lg:order-1"
        >
          <div className="relative max-w-md">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary-pink/25 via-light-pink/15 to-lavender-purple/25 -z-10 blur-sm" />
            <img
              src={story.imageUrl}
              alt={story.imageAlt}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
              className="protected-image w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl shadow-deep-purple/25"
            />
            {/* Floating accent card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-5 -end-5 bg-white rounded-2xl px-5 py-4 shadow-xl shadow-deep-purple/15 border border-soft-purple/10"
            >
              <p className="text-2xl font-heading font-bold text-primary-pink">5+</p>
              <p className="text-xs text-deep-purple/60 font-medium mt-0.5">Years of Practice</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2"
        >
          <SectionHeader
            kicker={story.kicker}
            headline={story.headline}
            centered={false}
            className="mb-8"
          />

          <div className="space-y-5">
            {story.paragraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-body leading-relaxed"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
