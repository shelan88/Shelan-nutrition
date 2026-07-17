import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { testimonialsSection, testimonials as staticTestimonials } from "@/content/content";
import { getPublishedTestimonials } from "@/admin/repositories/testimonials.repository";
import type { TestimonialRow } from "@/types/database.types";

const accents = [
  { card: "bg-soft-pink",  chip: "bg-white/25", icon: "text-white", body: "text-white/90" },
  { card: "bg-soft-purple", chip: "bg-white/20", icon: "text-white", body: "text-white/90" },
  { card: "bg-gradient-to-br from-primary-pink to-lavender-purple", chip: "bg-white/25", icon: "text-white", body: "text-white/90" },
];

interface QuoteItem {
  content: string;
  authorName?: string;
  role?: string;
  avatarUrl?: string;
  rating?: number;
  initials?: string;
}

function mapDbRow(row: TestimonialRow, lang: "en" | "ar"): QuoteItem {
  const name = (lang === "ar" ? row.client_name_ar : row.client_name) || row.client_name || "";
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  return {
    content:    (lang === "ar" ? row.content_ar : row.content_en) || row.content_en,
    authorName: name,
    role:       (lang === "ar" ? row.role_ar    : row.role_en)    || undefined,
    avatarUrl:  row.avatar_url || undefined,
    rating:     row.rating ?? undefined,
    initials,
  };
}

export default function Testimonials() {
  const { lang, dir } = useLanguage();
  const t = testimonialsSection[lang];
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [quotes, setQuotes] = useState<QuoteItem[]>(() =>
    staticTestimonials[lang].map((c) => ({ content: c }))
  );

  useEffect(() => {
    getPublishedTestimonials()
      .then((rows) => {
        if (rows.length > 0) {
          setQuotes(rows.map((r) => mapDbRow(r, lang)));
        } else {
          setQuotes(staticTestimonials[lang].map((c) => ({ content: c })));
        }
      })
      .catch(() => {
        setQuotes(staticTestimonials[lang].map((c) => ({ content: c })));
      });
  }, [lang]);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrolled = Math.abs(el.scrollLeft);
    setAtStart(scrolled <= 4);
    setAtEnd(scrolled >= maxScroll - 4);
  }, []);

  useEffect(() => {
    updateEdges();
  }, [lang, quotes, updateEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? 320) + 24;
    const signedStep = dir === "rtl" ? -direction * step : direction * step;
    el.scrollBy({ left: signedStep, behavior: "smooth" });
  };

  return (
    <section id="testimonials" className="py-24 bg-light-pink/25 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
              {t.kicker}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
              {t.title}
            </h2>
            <p className="text-body leading-relaxed">{t.subtitle}</p>
          </div>

          <div className="hidden sm:flex gap-3 shrink-0">
            <button
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Previous testimonials"
              className="w-12 h-12 rounded-full border border-soft-purple/25 flex items-center justify-center text-deep-purple hover:bg-primary-pink/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Next testimonials"
              className="w-12 h-12 rounded-full border border-soft-purple/25 flex items-center justify-center text-deep-purple hover:bg-primary-pink/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-7xl mx-auto"
      >
        <div className="pointer-events-none absolute inset-y-0 start-0 w-10 sm:w-24 z-10 bg-gradient-to-r from-light-pink/25 to-transparent backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-10 sm:w-24 z-10 bg-gradient-to-l from-light-pink/25 to-transparent backdrop-blur-[2px]" />

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-10 pb-4 scroll-smooth"
        >
          {quotes.map((quote, i) => {
            const accent = accents[i % accents.length];
            const hasAuthor = !!quote.authorName;
            return (
              <div
                key={i}
                data-card
                className={`snap-start shrink-0 w-[280px] sm:w-[340px] ${accent.card} rounded-2xl p-6 shadow-lg shadow-deep-purple/15 hover:shadow-xl hover:shadow-deep-purple/25 hover:-translate-y-1 transition-all duration-300 flex flex-col`}
              >
                <div className={`w-10 h-10 rounded-xl ${accent.chip} flex items-center justify-center mb-4`}>
                  <Quote className={accent.icon} size={18} />
                </div>

                <p className={`${accent.body} leading-relaxed text-sm flex-1`}>
                  {quote.content}
                </p>

                {/* Star rating */}
                {quote.rating != null && (
                  <div className="flex gap-0.5 mt-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={13}
                        className={s < quote.rating! ? "text-amber-300 fill-amber-300" : "text-white/30 fill-transparent"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                )}

                {/* Author info */}
                {hasAuthor && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/15">
                    {quote.avatarUrl ? (
                      <img
                        src={quote.avatarUrl}
                        alt={quote.authorName}
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white/20"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {quote.initials ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-[12.5px] font-semibold leading-none truncate">
                        {quote.authorName}
                      </p>
                      {quote.role && (
                        <p className="text-white/60 text-[11px] mt-0.5 truncate">{quote.role}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
