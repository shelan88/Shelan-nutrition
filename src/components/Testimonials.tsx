import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { testimonialsSection, testimonials } from "@/content/content";

const accents = [
  { card: "bg-soft-pink", chip: "bg-white/25", icon: "text-white", body: "text-white/90" },
  { card: "bg-soft-purple", chip: "bg-white/20", icon: "text-white", body: "text-white/90" },
  { card: "bg-gradient-to-br from-primary-pink to-lavender-purple", chip: "bg-white/25", icon: "text-white", body: "text-white/90" },
];

export default function Testimonials() {
  const { lang, dir } = useLanguage();
  const t = testimonialsSection[lang];
  const quotes = testimonials[lang];
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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
  }, [lang, updateEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? 320) + 24;
    // In RTL the physical scroll direction is mirrored, so flip the sign.
    const signedStep = dir === "rtl" ? -direction * step : direction * step;
    el.scrollBy({ left: signedStep, behavior: "smooth" });
  };

  return (
    <section
      id="testimonials"
      className="py-24 bg-light-pink/25 overflow-hidden"
    >
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
        {/* Edge blur overlays give the slider a premium sense of depth —
            content fades into the background rather than cutting off. */}
        <div className="pointer-events-none absolute inset-y-0 start-0 w-10 sm:w-24 z-10 bg-gradient-to-r from-light-pink/25 to-transparent backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-10 sm:w-24 z-10 bg-gradient-to-l from-light-pink/25 to-transparent backdrop-blur-[2px]" />

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 lg:px-10 pb-4 scroll-smooth"
        >
          {quotes.map((quote, i) => {
            const accent = accents[i % accents.length];
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
                  {quote}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
