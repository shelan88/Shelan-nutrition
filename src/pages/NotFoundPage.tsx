/**
 * NotFoundPage — 404 fallback for unmatched routes.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { notFound } from "@/content/content";

export default function NotFoundPage() {
  const { lang } = useLanguage();
  const t = notFound[lang];

  useEffect(() => {
    document.title = `${t.headline} | SHELAN Nutrition`;
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-7 px-6 text-center bg-gradient-to-b from-light-pink/30 to-white py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-heading text-8xl font-extrabold text-primary-pink/20 mb-4 leading-none select-none">
          {t.kicker}
        </p>
        <h1 className="font-heading text-3xl font-bold text-heading mb-3">{t.headline}</h1>
        <p className="text-body opacity-70 max-w-sm mx-auto mb-8">{t.description}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl hover:shadow-deep-purple/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          {t.buttonLabel}
        </Link>
      </motion.div>
    </div>
  );
}
