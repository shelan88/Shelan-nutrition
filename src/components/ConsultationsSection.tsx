/**
 * ConsultationsSection — Consultations & Follow-up Packages
 *
 * Reads active consultations from the DB, groups them by subtitle_en,
 * and renders a premium SHELAN-style section.
 *
 * Section visibility is gated by `section_visibility.consultations`
 * stored in website_settings (admin-controlled global toggle).
 *
 * Booking uses the existing CheckoutModal → Stripe → assessment flow.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import CheckoutModal, { type CheckoutPlan } from "@/components/CheckoutModal";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";
import { getActiveConsultations } from "@/admin/repositories/consultations.repository";
import type { ConsultationRow } from "@/types/database.types";
import { getSetting } from "@/admin/repositories/settings.repository";

// ─── Group ordering ────────────────────────────────────────────────────────────
const KNOWN_GROUP_ORDER = [
  "Introductory Session",
  "Weekly Follow-up",
  "Intensive Daily Follow-up",
];

// ─── Professional notice ───────────────────────────────────────────────────────
const NOTICE = {
  en: {
    title: "Professional Notice",
    paragraphs: [
      "SHELAN Circle services are provided within the scope of nutrition, wellness, and dietary consultations, including needs and goals assessment, development of personalized nutrition and wellness plans, and follow-up and guidance within the nutritionist's scope of practice.",
      "These services do not include diagnosing diseases or prescribing medications, and do not replace medical care when needed. In cases requiring medical diagnosis or treatment, consultation with a physician or qualified healthcare provider is advised.",
      "Plans and recommendations are designed according to each client's individual needs, goals, and the information provided, and results may vary from person to person.",
    ],
  },
  ar: {
    title: "تنبيه مهني",
    paragraphs: [
      "تُقدَّم خدمات SHELAN Circle في إطار التغذية والعافية والاستشارات الغذائية، وتشمل تقييم الاحتياجات والأهداف، وإعداد خطط تغذية وعافية شخصية، والمتابعة والتوجيه ضمن نطاق ممارسة أخصائية التغذية.",
      "هذه الخدمات لا تشمل تشخيص الأمراض أو وصف الأدوية، ولا تستبدل الرعاية الطبية عند الحاجة. وفي الحالات التي تتطلب تشخيصًا أو علاجًا طبيًا، يُنصح بالمتابعة مع الطبيب أو مقدم الرعاية الصحية المختص.",
      "تُصمم الخطط والتوصيات وفق احتياجات وأهداف كل عميلة والمعلومات التي تقدمها، وقد تختلف النتائج من شخص لآخر.",
    ],
  },
};

// ─── Row → CheckoutPlan ────────────────────────────────────────────────────────
function toCheckout(row: ConsultationRow, lang: "en" | "ar"): CheckoutPlan {
  const cur     = row.currency ?? "$";
  const hasDisc = !!(row.discount_enabled && row.discount_percent != null && row.discount_percent > 0 && row.price != null);
  const final   = hasDisc
    ? Math.round(row.price! * (1 - row.discount_percent! / 100) * 100) / 100
    : row.price;
  return {
    name:              (lang === "ar" ? row.title_ar : row.title_en) || row.title_en,
    price:             final != null ? `${cur}${final}` : "",
    period:            (lang === "ar" ? row.period_ar : row.period_en) || "",
    consultationId:    row.id,
    assessmentEnabled: row.assessment_enabled ?? false,
  };
}

// ─── Group shape ───────────────────────────────────────────────────────────────
interface Group {
  key:     string;
  labelEn: string;
  labelAr: string;
  items:   ConsultationRow[];
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ConsultationsSection() {
  const { lang, dir } = useLanguage();
  const isAr          = lang === "ar";
  const { user, loading } = useAuth();

  const [rows,         setRows]         = useState<ConsultationRow[] | null>(null);
  const [sectionOn,    setSectionOn]    = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);
  const [pendingPlan,  setPendingPlan]  = useState<CheckoutPlan | null>(null);

  useEffect(() => {
    getActiveConsultations().then(setRows).catch(() => setRows([]));
    getSetting("section_visibility").then((val) => {
      if (val && typeof val === "object" && !Array.isArray(val) && "consultations" in (val as object)) {
        setSectionOn((val as { consultations: boolean }).consultations !== false);
      }
    }).catch(() => {});
  }, []);

  // Promote pending plan → checkout once authenticated
  useEffect(() => {
    if (!loading && user && pendingPlan) {
      setCheckoutPlan(pendingPlan);
      setPendingPlan(null);
    }
  }, [loading, user, pendingPlan]);

  // Group rows by subtitle_en (admin-set group label)
  const groups: Group[] = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const map: Record<string, Group> = {};
    for (const row of rows) {
      const key = row.subtitle_en || "Other";
      if (!map[key]) {
        map[key] = { key, labelEn: key, labelAr: row.subtitle_ar || key, items: [] };
      }
      map[key].items.push(row);
    }
    return [
      ...KNOWN_GROUP_ORDER.filter((k) => map[k]).map((k) => map[k]),
      ...Object.values(map).filter((g) => !KNOWN_GROUP_ORDER.includes(g.key)),
    ];
  }, [rows]);

  if (!sectionOn || rows === null || groups.length === 0) return null;

  function handleBook(row: ConsultationRow) {
    const plan = toCheckout(row, lang as "en" | "ar");
    if (!loading && user) setCheckoutPlan(plan);
    else setPendingPlan(plan);
  }

  return (
    <section
      id="consultations"
      className="section-dark py-24 bg-gradient-to-br from-primary-pink via-soft-pink to-soft-purple"
      dir={dir}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── Section header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-white/70 mb-3">
            {isAr ? "خدماتنا" : "Our Services"}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
            {isAr ? "الاستشارات وباقات المتابعة" : "Consultations & Follow-up Packages"}
          </h2>
          <p className="text-white/75 leading-relaxed">
            {isAr
              ? "خطط تغذية وعافية شخصية مصممة لاحتياجاتكِ، مع متابعة مستمرة لضمان النتائج."
              : "Personalized nutrition and wellness plans designed for your needs, with continuous follow-up to ensure results."}
          </p>
        </motion.div>

        {/* ── Package groups ──────────────────────────────────────────────── */}
        <div className="space-y-14">
          {groups.map((group, gi) => (
            <div key={group.key}>

              {/* Group divider */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55 whitespace-nowrap px-1">
                  {isAr ? group.labelAr : group.labelEn}
                </span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              {/* Cards */}
              <div className={`grid gap-6 ${
                group.items.length === 1
                  ? "max-w-sm mx-auto grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}>
                {group.items.map((row, ci) => {
                  const name     = (isAr ? row.title_ar    : row.title_en)    || row.title_en;
                  const dur      = (isAr ? row.duration_ar : row.duration_en) || "";
                  const desc     = (isAr ? row.description_ar : row.description_en) || "";
                  const features = (isAr ? row.features_ar : row.features_en) ?? [];
                  const badge    = (isAr ? row.badge_ar    : row.badge_en)    || null;
                  const cta      = (isAr ? row.cta_text_ar : row.cta_text_en) || (isAr ? "احجزي الآن" : "Book Now");
                  const cur      = row.currency ?? "$";
                  const hasDisc  = !!(row.discount_enabled && row.discount_percent != null && row.discount_percent > 0 && row.price != null);
                  const dispPx   = hasDisc
                    ? Math.round(row.price! * (1 - row.discount_percent! / 100) * 100) / 100
                    : row.price;
                  const isFeat   = !!badge;

                  return (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.5, delay: ci * 0.08 + gi * 0.04 }}
                      className={`relative rounded-[1.75rem] flex flex-col transition-all duration-300 ${
                        isFeat
                          ? "bg-white border-2 border-white shadow-2xl shadow-deep-purple/40 ring-4 ring-white/20"
                          : "bg-white/10 backdrop-blur-md border border-white/25"
                      } ${badge ? "pt-7 pb-8 px-8" : "p-8"}`}
                    >
                      {/* Badge */}
                      {badge && (
                        <div className="flex justify-center mb-5">
                          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-xs font-bold uppercase tracking-wide shadow-md whitespace-nowrap">
                            <Sparkles size={13} />
                            {badge}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className={`font-heading text-xl font-bold mb-2 ${isFeat ? "text-deep-purple" : "text-white"}`}>
                        {name}
                      </h3>

                      {/* Duration */}
                      {dur && (
                        <div className={`flex items-center gap-1.5 text-sm mb-4 ${isFeat ? "text-deep-purple/60" : "text-white/65"}`}>
                          <Clock size={14} strokeWidth={2} className="shrink-0" />
                          {dur}
                        </div>
                      )}

                      {/* Price */}
                      {dispPx != null && (
                        <div className="mb-6" dir="ltr">
                          {hasDisc && (
                            <span className={`text-xl line-through opacity-40 me-2 font-normal ${isFeat ? "text-deep-purple" : "text-white"}`}>
                              {cur}{row.price}
                            </span>
                          )}
                          <span className={`font-heading text-4xl font-extrabold ${isFeat ? "text-primary-pink" : "text-white"}`}>
                            {cur}{dispPx}
                          </span>
                        </div>
                      )}

                      {/* Description paragraphs — intro session (no features) */}
                      {desc && features.length === 0 && (
                        <div className="flex-1 mb-6 space-y-3">
                          {desc.split("\n\n").map((para, pi) => (
                            <p
                              key={pi}
                              className={`text-sm leading-relaxed ${
                                pi > 0
                                  ? `pt-3 border-t italic text-[12.5px] ${isFeat ? "border-deep-purple/10 text-deep-purple/50" : "border-white/15 text-white/50"}`
                                  : isFeat ? "text-deep-purple/75" : "text-white/80"
                              }`}
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Features list */}
                      {features.length > 0 && (
                        <ul className="space-y-2.5 mb-7 flex-1">
                          {features.map((f, fi) => (
                            <li
                              key={fi}
                              className={`flex items-start gap-2.5 text-sm ${isFeat ? "text-deep-purple/80" : "text-white/85"}`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 flex-none ${
                                isFeat ? "bg-primary-pink/15 text-primary-pink" : "bg-white/15 text-white"
                              }`}>
                                <Check size={11} strokeWidth={3} />
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={() => handleBook(row)}
                        className={`mt-auto w-full py-3.5 rounded-full font-semibold transition-all shadow-lg ${
                          isFeat
                            ? "bg-gradient-to-r from-primary-pink to-lavender-purple text-white hover:opacity-90 shadow-deep-purple/25"
                            : "bg-white text-deep-purple hover:bg-white/95 shadow-black/15"
                        }`}
                      >
                        {cta}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Professional Notice ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6"
        >
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle size={17} className="text-white/50 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-white/75">
              {NOTICE[lang as "en" | "ar"].title}
            </p>
          </div>
          <div className={`ms-8 space-y-2.5 ${isAr ? "text-right" : "text-left"}`}>
            {NOTICE[lang as "en" | "ar"].paragraphs.map((p, i) => (
              <p key={i} className="text-[12.5px] text-white/50 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pendingPlan && !user && (
          <AuthRequiredDialog
            onClose={() => setPendingPlan(null)}
            onAuthenticated={() => {
              setCheckoutPlan(pendingPlan);
              setPendingPlan(null);
            }}
          />
        )}
        {checkoutPlan && user && (
          <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
