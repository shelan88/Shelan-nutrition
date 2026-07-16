/**
 * SectionHeader — Consistent section kicker + headline + optional subtitle.
 * Used by all section components. Zero hardcoded content.
 */
import { motion } from "framer-motion";

interface SectionHeaderProps {
  kicker: string;
  headline: string;
  subtitle?: string;
  /** Center-align the text (default: true) */
  centered?: boolean;
  /** Use light colors for dark backgrounds */
  dark?: boolean;
  className?: string;
}

export default function SectionHeader({
  kicker,
  headline,
  subtitle,
  centered = true,
  dark = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className={`${centered ? "text-center mx-auto" : ""} max-w-2xl mb-14 ${className}`}
    >
      <p
        className={`uppercase tracking-[0.22em] text-xs font-semibold mb-3 ${
          dark ? "text-light-pink" : "text-primary-pink"
        }`}
      >
        {kicker}
      </p>
      <h2
        className={`font-heading text-3xl sm:text-4xl font-bold text-heading ${
          subtitle ? "mb-4" : ""
        }`}
      >
        {headline}
      </h2>
      {subtitle && (
        <p className={`leading-relaxed ${dark ? "text-body opacity-85" : "text-body"}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
