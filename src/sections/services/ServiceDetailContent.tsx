/**
 * ServiceDetailContent — Full reusable service detail template.
 * Every section receives typed props. Zero hardcoded content.
 * CMS-ready: swap service data source in ServiceDetailPage.tsx.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Salad, HeartPulse, Sparkles, Users, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import SectionHeader from "@/components/ui/SectionHeader";
import type { CMSService } from "@/types/cms.types";

const ICONS: Record<string, React.ElementType> = { Salad, HeartPulse, Sparkles };

// ── Who Is It For ─────────────────────────────────────────────────────────────
function WhoIsItFor({ data }: { data: CMSService["whoIsItFor"] }) {
  return (
    <section className="py-20 bg-light-pink/25">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <SectionHeader kicker="" headline={data.headline} centered={false} className="mb-8" />
        <p className="text-body leading-relaxed mb-8 opacity-85">{data.description}</p>
        <ul className="grid sm:grid-cols-2 gap-4">
          {data.points.map((point, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-start gap-3"
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary-pink/15 flex items-center justify-center mt-0.5">
                <Check size={11} className="text-primary-pink" strokeWidth={3} />
              </span>
              <span className="text-body text-sm leading-relaxed">{point}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Benefits ──────────────────────────────────────────────────────────────────
function Benefits({ data }: { data: CMSService["benefits"] }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <SectionHeader kicker="" headline={data.headline} centered={false} className="mb-8" />
        <ul className="space-y-4">
          {data.items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-primary-pink/5 to-lavender-purple/5 border border-soft-purple/10"
            >
              <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center mt-0.5 shadow-md shadow-deep-purple/15">
                <Star size={11} className="text-white" fill="white" />
              </span>
              <span className="text-body leading-relaxed">{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Consultation Steps ────────────────────────────────────────────────────────
function ConsultationSteps({ data }: { data: CMSService["consultation"] }) {
  return (
    <section className="py-20 bg-gradient-to-br from-deep-purple via-soft-purple to-lavender-purple section-dark">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <SectionHeader
          kicker=""
          headline={data.headline}
          centered={false}
          dark
          className="mb-10"
        />
        <div className="space-y-6">
          {data.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: i * 0.09 }}
              className="flex gap-5 items-start"
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center font-heading font-bold text-white text-sm">
                {i + 1}
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-heading font-bold text-white mb-1">{step.title}</h4>
                <p className="text-white/80 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function ServiceFAQ({ faq }: { faq: CMSService["faq"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-light-pink/20">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <SectionHeader kicker="FAQ" headline="Frequently Asked Questions" className="mb-10" />
        <div className="space-y-3">
          {faq.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "bg-white border-primary-pink/30 shadow-lg shadow-deep-purple/10"
                    : "bg-white border-soft-purple/15 hover:border-primary-pink/20"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-start px-6 py-5"
                  aria-expanded={isOpen}
                >
                  <span className={`font-medium leading-snug transition-colors ${isOpen ? "text-primary-pink" : "text-heading"}`}>
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`shrink-0 transition-colors ${isOpen ? "text-primary-pink" : "text-deep-purple/40"}`}
                  >
                    <ChevronDown size={20} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-body text-sm leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Service CTA ───────────────────────────────────────────────────────────────
function ServiceCTA({ cta, bookingHref }: { cta: CMSService["cta"]; bookingHref: string }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {cta.headline}
          </h2>
          <p className="text-body leading-relaxed mb-8 opacity-80">{cta.description}</p>
          <Link
            to={bookingHref}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/25 hover:shadow-xl hover:shadow-deep-purple/35 hover:-translate-y-0.5 transition-all duration-300"
          >
            {cta.buttonLabel}
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  service: CMSService;
}

export default function ServiceDetailContent({ service }: Props) {
  const { lang } = useLanguage();
  const Icon = ICONS[service.iconName] ?? Sparkles;
  const bookingHref = `/booking?service=${service.id}`;

  return (
    <>
      {/* Full description with icon */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[auto_1fr] gap-10 items-start">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${service.accentFrom} ${service.accentTo} flex items-center justify-center shadow-xl shadow-deep-purple/20 shrink-0`}>
              <Icon className="text-white" size={34} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-body leading-relaxed text-lg">{service.fullDescription}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={bookingHref}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold shadow-lg shadow-deep-purple/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 text-sm"
                >
                  {service.cta.buttonLabel}
                  <ArrowRight size={15} className="rtl:rotate-180" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-soft-purple/25 text-deep-purple font-semibold hover:bg-light-pink/30 transition-colors text-sm"
                >
                  <Users size={14} />
                  {lang === "ar" ? "كل الخدمات" : "All Services"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhoIsItFor data={service.whoIsItFor} />
      <Benefits data={service.benefits} />
      <ConsultationSteps data={service.consultation} />
      <ServiceFAQ faq={service.faq} />
      <ServiceCTA cta={service.cta} bookingHref={bookingHref} />
    </>
  );
}
