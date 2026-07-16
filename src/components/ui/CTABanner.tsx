/**
 * CTABanner — Reusable pre-section CTA strip used at the bottom of every page.
 * Zero hardcoded content — all props from CMS data or content.ts.
 */
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface CTABannerProps {
  kicker: string;
  headline: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export default function CTABanner({
  kicker,
  headline,
  description,
  buttonLabel,
  buttonHref,
}: CTABannerProps) {
  const isExternal = buttonHref.startsWith("http");

  return (
    <section className="relative py-24 overflow-hidden section-dark bg-gradient-to-br from-deep-purple via-soft-purple to-lavender-purple">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -start-32 w-[500px] h-[500px] rounded-full bg-primary-pink/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -end-32 w-[400px] h-[400px] rounded-full bg-lavender-purple/25 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65 }}
        >
          <p className="uppercase tracking-[0.22em] text-xs font-semibold text-light-pink mb-4">
            {kicker}
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-heading leading-tight mb-6">
            {headline}
          </h2>
          <p className="text-body text-lg leading-relaxed max-w-2xl mx-auto mb-10 opacity-90">
            {description}
          </p>

          {isExternal ? (
            <motion.a
              href={buttonHref}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-white text-deep-purple font-semibold text-base shadow-2xl shadow-black/25 hover:shadow-black/35 transition-shadow duration-300"
            >
              <Sparkles size={18} className="text-primary-pink" />
              {buttonLabel}
            </motion.a>
          ) : (
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="inline-block"
            >
              <Link
                to={buttonHref}
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-white text-deep-purple font-semibold text-base shadow-2xl shadow-black/25 hover:shadow-black/35 transition-shadow duration-300"
              >
                <Sparkles size={18} className="text-primary-pink" />
                {buttonLabel}
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
