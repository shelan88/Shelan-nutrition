import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { booking, pricingSection, pricingPlans } from "@/content/content";
import CheckoutModal, { type CheckoutPlan } from "@/components/CheckoutModal";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";
import { getActiveServices } from "@/admin/repositories/services.repository";
import type { Service } from "@/admin/repositories/services.repository";
import { getActiveConsultations } from "@/admin/repositories/consultations.repository";
import type { ConsultationRow } from "@/types/database.types";

// ─── Internal display shape (union of DB and hardcoded plan) ───────────────────
type DisplayPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  duration: string;
  badge: string | null;
  features: string[];
  cta: string;
};

/** Map a DB ConsultationRow → DisplayPlan for the given lang. */
function rowToDisplay(row: ConsultationRow, lang: "en" | "ar"): DisplayPlan {
  const currency = row.currency ?? "$";
  const rawPrice = row.price;

  let priceStr = "";
  if (rawPrice != null) {
    const hasDiscount =
      row.discount_enabled &&
      row.discount_percent != null &&
      row.discount_percent > 0;
    if (hasDiscount) {
      const final = Math.round(rawPrice * (1 - row.discount_percent! / 100) * 100) / 100;
      priceStr = `${currency}${final}`;
    } else {
      priceStr = `${currency}${rawPrice}`;
    }
  }

  return {
    id:       row.id,
    name:     (lang === "ar" ? row.title_ar    : row.title_en)    || row.title_en,
    price:    priceStr,
    period:   (lang === "ar" ? row.period_ar   : row.period_en)   || "",
    duration: (lang === "ar" ? row.duration_ar : row.duration_en) || "",
    badge:    (lang === "ar" ? row.badge_ar    : row.badge_en)    || null,
    features: (lang === "ar" ? row.features_ar : row.features_en) ?? [],
    cta:      (lang === "ar" ? row.cta_text_ar : row.cta_text_en) || (lang === "ar" ? "احجزي الآن" : "Book Now"),
  };
}

export default function Booking() {
  const { lang } = useLanguage();
  const t = booking[lang];
  const p = pricingSection[lang];
  const { user, loading } = useAuth();

  // DB consultations — null = loading, [] = loaded (empty = fall back to hardcoded)
  const [dbPlans, setDbPlans]   = useState<ConsultationRow[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);
  const [pendingPlan,  setPendingPlan]  = useState<CheckoutPlan | null>(null);

  useEffect(() => {
    getActiveConsultations()
      .then(setDbPlans)
      .catch(() => setDbPlans([]));
    getActiveServices()
      .then(setServices)
      .catch(() => {});
  }, []);

  // Promote pending plan to checkout once we know the user is authenticated
  useEffect(() => {
    if (!loading && user && pendingPlan) {
      setCheckoutPlan(pendingPlan);
      setPendingPlan(null);
    }
  }, [loading, user, pendingPlan]);

  // Resolve serviceId by matching plan name against service.name_en
  const resolveServiceId = (planName: string): string | undefined => {
    const normalised = planName.trim().toLowerCase();
    return services.find((s) => s.name_en.trim().toLowerCase() === normalised)?.id;
  };

  const handlePlanClick = (rawPlan: Omit<CheckoutPlan, "serviceId">) => {
    const plan: CheckoutPlan = { ...rawPlan, serviceId: resolveServiceId(rawPlan.name) };
    if (!loading && user) {
      setCheckoutPlan(plan);
    } else {
      setPendingPlan(plan);
    }
  };

  // Use DB plans when loaded and non-empty, otherwise fall back to content.ts
  const plans: DisplayPlan[] =
    dbPlans && dbPlans.length > 0
      ? dbPlans.map((r) => rowToDisplay(r, lang))
      : pricingPlans[lang].map((p, i) => ({ ...p, id: String(i) }));

  return (
    <section id="consultations" className="section-dark py-24 bg-gradient-to-br from-primary-pink via-soft-pink to-soft-purple">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-light-pink mb-3">
            {p.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {p.title}
          </h2>
          <p className="text-body leading-relaxed">{p.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => {
            // A card is "featured" when it carries a badge — admin controls this.
            // Fall back to the centre-card rule when none are badged.
            const anyBadged = plans.some((pl) => pl.badge);
            const isFeatured = anyBadged ? !!plan.badge : i === 1;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className={`relative rounded-[1.75rem] flex flex-col ${
                  isFeatured
                    ? "bg-white text-deep-purple shadow-2xl shadow-deep-purple/40 border-2 border-light-pink lg:-translate-y-3 lg:scale-[1.03] z-10"
                    : "bg-white/10 backdrop-blur-md border border-white/25 text-white"
                } ${plan.badge ? "pt-6 pb-8 px-8" : "p-8"}`}
              >
                {plan.badge && (
                  <div className="flex justify-center mb-5">
                    <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-xs font-bold uppercase tracking-wide shadow-md whitespace-nowrap">
                      <Sparkles size={13} />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <h3 className={`font-heading text-xl font-bold mb-1 ${isFeatured ? "text-deep-purple" : "text-white"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${isFeatured ? "text-deep-purple/60" : "text-white/75"}`}>
                  {plan.duration}
                </p>

                <div className="mb-6">
                  <span className={`font-heading text-4xl font-extrabold ${isFeatured ? "text-primary-pink" : "text-white"}`}>
                    {plan.price}
                  </span>
                  <span className={`ms-2 text-sm ${isFeatured ? "text-deep-purple/50" : "text-white/70"}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        isFeatured ? "bg-primary-pink/15 text-primary-pink" : "bg-white/15 text-white"
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={isFeatured ? "text-deep-purple/80" : "text-white/90"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanClick({ name: plan.name, price: plan.price, period: plan.period })}
                  className={`w-full py-3.5 rounded-full font-semibold transition-colors shadow-lg ${
                    isFeatured
                      ? "bg-gradient-to-r from-primary-pink to-soft-pink text-white hover:from-primary-pink hover:to-lavender-purple shadow-deep-purple/20"
                      : "bg-white text-deep-purple hover:bg-light-pink/40 shadow-deep-purple/20"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-white/80 max-w-lg mx-auto leading-relaxed">{t.description}</p>
        </motion.div>
      </div>

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
