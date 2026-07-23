/**
 * ProgramDetailPage — Full program detail fetched from Supabase by ID.
 * Linked from program cards on the home page via /programs/:id.
 * Graceful 404 if not found or inactive.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Tag,
  Salad, HeartPulse, Sparkles, Star, Heart, Leaf, Apple, Dumbbell, Brain, Sun,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getProgramById } from "@/admin/repositories/programs.repository";
import type { ProgramRow } from "@/types/database.types";
import PageHero from "@/components/ui/PageHero";

const PROGRAM_ICONS: Record<string, React.ElementType> = {
  Salad, HeartPulse, Sparkles, Star, Heart, Leaf, Apple, Dumbbell, Brain, Sun,
};

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, dir } = useLanguage();

  const [program, setProgram] = useState<ProgramRow | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    getProgramById(id).then((row) => {
      if (!row) setNotFound(true);
      else setProgram(row);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (program) {
      const name = lang === "ar" ? (program.name_ar ?? program.name_en) : program.name_en;
      document.title = `${name} | SHELAN Nutrition`;
    } else if (notFound) {
      document.title = "Program Not Found | SHELAN Nutrition";
    }
  }, [program, notFound, lang]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !program) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center py-32">
        <p className="text-6xl font-heading font-bold text-primary-pink">404</p>
        <h1 className="font-heading text-2xl font-bold text-heading">
          {lang === "ar" ? "البرنامج غير موجود" : "Program Not Found"}
        </h1>
        <p className="text-body opacity-70">
          {lang === "ar"
            ? "هذا البرنامج غير متاح أو تمت إزالته."
            : "This program doesn't exist or has been removed."}
        </p>
        <Link
          to="/#programs"
          className="px-7 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          {lang === "ar" ? "عرض البرامج" : "View Programs"}
        </Link>
      </div>
    );
  }

  const name         = (lang === "ar" ? program.name_ar      : program.name_en)      ?? program.name_en;
  const subtitle     = (lang === "ar" ? program.subtitle_ar  : program.subtitle_en)  ?? null;
  const shortDesc    = (lang === "ar" ? program.short_description_ar : program.short_description_en) ?? null;
  const fullDesc     = (lang === "ar" ? program.full_description_ar  : program.full_description_en)  ?? null;
  const features: string[] = (lang === "ar" ? program.features_ar : program.features_en) ?? [];
  const ctaText      = (lang === "ar" ? program.cta_text_ar  : program.cta_text_en)  ?? (lang === "ar" ? "احجزي الآن" : "Book Now");
  const currency     = program.currency ?? "$";

  const iconGradient = program.gradient
    ? `bg-gradient-to-br ${program.gradient}`
    : "bg-gradient-to-br from-soft-pink to-soft-purple";

  const hasDiscount =
    !!(program.discount_enabled &&
      program.discount_percent != null &&
      program.discount_percent > 0 &&
      program.price != null);
  const discountedPrice = hasDiscount
    ? Math.round(program.price! * (1 - program.discount_percent! / 100) * 100) / 100
    : null;

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home",     href: "/" },
    { label: lang === "ar" ? "البرامج"  : "Programs",  href: "/#programs" },
    { label: name },
  ];

  return (
    <div dir={dir}>
      <PageHero
        kicker={lang === "ar" ? "تفاصيل البرنامج" : "Program Details"}
        headline={name}
        subheadline={subtitle ?? shortDesc ?? undefined}
        breadcrumbs={breadcrumbs}
      />

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">

          {/* Icon + meta strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            {program.icon && PROGRAM_ICONS[program.icon] && (() => {
              const Icon = PROGRAM_ICONS[program.icon!];
              return (
                <div className={`w-14 h-14 rounded-2xl ${iconGradient} flex items-center justify-center shrink-0`}>
                  <Icon size={26} strokeWidth={1.8} className="text-white" />
                </div>
              );
            })()}

            <div className="flex flex-wrap gap-2">
              {program.price != null && (
                <span className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full bg-primary-pink/10 text-primary-pink" dir="ltr">
                  <Tag size={13} strokeWidth={2} />
                  {hasDiscount ? (
                    <>
                      <span className="line-through opacity-50 font-normal">{currency}{program.price}</span>
                      <span>{currency}{discountedPrice}</span>
                    </>
                  ) : (
                    <span>{currency}{program.price}</span>
                  )}
                </span>
              )}
              {program.duration_weeks != null && (
                <span className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600" dir="ltr">
                  <Clock size={13} strokeWidth={2} />
                  <span dir={dir}>{program.duration_weeks}{lang === "ar" ? " أسابيع" : " weeks"}</span>
                </span>
              )}
              {(program.badge_en || program.badge_ar) && (
                <span className="inline-block text-[12px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white shadow-sm">
                  {lang === "ar" ? (program.badge_ar ?? program.badge_en) : program.badge_en}
                </span>
              )}
            </div>
          </motion.div>

          {/* Full description */}
          {(fullDesc || shortDesc) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10"
            >
              <h2 className="font-heading text-xl font-bold text-heading mb-4 text-start">
                {lang === "ar" ? "عن البرنامج" : "About This Program"}
              </h2>
              <p className="text-body leading-relaxed whitespace-pre-line text-start">
                {fullDesc || shortDesc}
              </p>
            </motion.div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-10"
            >
              <h2 className="font-heading text-xl font-bold text-heading mb-5 text-start">
                {lang === "ar" ? "ما يشمله البرنامج" : "What's Included"}
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-body text-start">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-primary-pink" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-gray-100"
          >
            <Link
              to={`/booking?program=${program.id}`}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all text-center"
            >
              {ctaText}
            </Link>
            <Link
              to="/#programs"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-gray-200 text-body font-medium text-base hover:bg-gray-50 transition-colors text-center"
            >
              {lang === "ar" ? "عرض البرامج ←" : "← Back to Programs"}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
