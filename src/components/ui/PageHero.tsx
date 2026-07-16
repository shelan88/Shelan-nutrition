/**
 * PageHero — Full-width gradient hero for all inner pages.
 * Accepts typed props only; no hardcoded content.
 * CMS-ready: swap prop values for Supabase field values in the page component.
 */
import { motion } from "framer-motion";
import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb";

interface PageHeroProps {
  kicker: string;
  headline: string;
  subheadline?: string;
  breadcrumbs?: BreadcrumbItem[];
  /** Override gradient. Defaults to the site's primary pink→purple gradient. */
  gradientClass?: string;
  /** Optional right-side image for split-layout heroes */
  image?: { src: string; alt: string };
  children?: React.ReactNode;
}

export default function PageHero({
  kicker,
  headline,
  subheadline,
  breadcrumbs,
  gradientClass = "bg-gradient-to-br from-deep-purple via-soft-purple to-lavender-purple",
  image,
  children,
}: PageHeroProps) {
  return (
    <section
      className={`section-dark relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden ${gradientClass}`}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-primary-pink/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -start-32 w-80 h-80 rounded-full bg-lavender-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 end-1/4 w-64 h-64 rounded-full bg-soft-pink/15 blur-2xl pointer-events-none" />

      <div className={`relative max-w-7xl mx-auto px-6 lg:px-10 ${image ? "grid lg:grid-cols-2 gap-12 items-center" : ""}`}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-6" dark />}

          <p className="uppercase tracking-[0.22em] text-xs font-semibold text-light-pink mb-4">
            {kicker}
          </p>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-heading mb-5 whitespace-pre-line">
            {headline}
          </h1>

          {subheadline && (
            <p className="text-lg text-body leading-relaxed max-w-xl opacity-90">
              {subheadline}
            </p>
          )}

          {children && <div className="mt-8">{children}</div>}
        </motion.div>

        {image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="hidden lg:block"
          >
            <div className="relative max-w-md ms-auto">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary-pink/30 to-lavender-purple/30 blur-md -z-10" />
              <img
                src={image.src}
                alt={image.alt}
                className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-2xl shadow-black/30"
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
