import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { successStoriesSection } from "@/content/content";
import { getPublishedStories } from "@/admin/repositories/success_stories.repository";
import type { SuccessStoryRow } from "@/types/database.types";

const accents = [
  { card: "bg-soft-pink",  chip: "bg-white/25", icon: "text-white", title: "text-white", body: "text-white/85", label: "text-white/90" },
  { card: "bg-soft-purple", chip: "bg-white/20", icon: "text-white", title: "text-white", body: "text-white/85", label: "text-light-pink" },
  { card: "bg-gradient-to-br from-primary-pink to-lavender-purple", chip: "bg-white/25", icon: "text-white", title: "text-white", body: "text-white/85", label: "text-white/90" },
];

function bentoSpan(i: number) {
  if (i % 6 === 0) return "sm:col-span-2";
  if (i % 5 === 3) return "lg:row-span-2";
  return "";
}

const INITIAL_COUNT = 4;

interface StoryItem {
  title: string;
  content: string;
  beforeImage?: string | null;
  afterImage?: string | null;
  clientName?: string | null;
  publishDate?: string | null;
}

function mapDbRow(row: SuccessStoryRow, lang: "en" | "ar"): StoryItem {
  return {
    title:       (lang === "ar" ? row.title_ar       : row.title_en)       || (lang === "ar" ? row.title_en       : row.title_ar       || ""),
    content:     (lang === "ar" ? row.story_ar       : row.story_en)       || (lang === "ar" ? row.story_en       : row.story_ar       || ""),
    clientName:  (lang === "ar" ? row.client_name_ar : row.client_name_en) || row.client_name_en,
    beforeImage: row.before_image_url,
    afterImage:  row.after_image_url,
    publishDate: row.publish_date,
  };
}

export default function SuccessStories() {
  const { lang } = useLanguage();
  const t = successStoriesSection[lang];

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getPublishedStories()
      .then((rows) => {
        setStories(rows.map((r) => mapDbRow(r, lang)));
      })
      .catch(() => {
        setStories([]);
      });
  }, [lang]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex]);

  const active = activeIndex !== null ? stories[activeIndex] : null;
  const activeAccent = activeIndex !== null ? accents[activeIndex % accents.length] : accents[0];
  const hasImages = active && (active.beforeImage || active.afterImage);

  const StoryCard = ({ item, i, motionProps }: {
    item: StoryItem;
    i: number;
    motionProps: Record<string, unknown>;
  }) => {
    const accent = accents[i % accents.length];
    const hasBefore = !!item.beforeImage;
    return (
      <motion.button
        type="button"
        onClick={() => setActiveIndex(i)}
        whileHover={{ y: -4, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        {...motionProps}
        className={`group relative text-start rounded-2xl shadow-lg shadow-deep-purple/15 hover:shadow-xl hover:shadow-deep-purple/25 transition-shadow duration-300 p-6 flex flex-col overflow-hidden ${bentoSpan(i)} ${hasBefore ? "" : accent.card}`}
        style={hasBefore ? { backgroundImage: `url(${item.beforeImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {hasBefore && (
          <div className="absolute inset-0 bg-gradient-to-t from-deep-purple/80 via-deep-purple/40 to-transparent" />
        )}
        <div className={`relative w-10 h-10 rounded-xl ${accent.chip} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
          <Quote className={accent.icon} size={18} />
        </div>
        <p className={`relative font-medium ${accent.title} leading-snug line-clamp-3`}>
          {item.title}
        </p>
        <p className={`relative mt-2 text-sm ${accent.body} leading-relaxed line-clamp-2 flex-1`}>
          {item.content}
        </p>
        <span className={`relative mt-3 text-xs font-semibold uppercase tracking-wide ${accent.label} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          {lang === "ar" ? "اقرأي القصة كاملة" : "Read full story"}
        </span>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    );
  };

  return (
    <section id="success-stories" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading mb-4">
            {t.title}
          </h2>
          <p className="text-body leading-relaxed">{t.subtitle}</p>
        </div>

        {stories.length === 0 ? null : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[200px]">
              {stories.slice(0, INITIAL_COUNT).map((item, i) => (
                <StoryCard
                  key={i}
                  item={item}
                  i={i}
                  motionProps={{
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.2 },
                    transition: { duration: 0.5, delay: (i % 6) * 0.05 },
                  }}
                />
              ))}

              <AnimatePresence>
                {expanded &&
                  stories.slice(INITIAL_COUNT).map((item, idx) => {
                    const i = idx + INITIAL_COUNT;
                    return (
                      <StoryCard
                        key={i}
                        item={item}
                        i={i}
                        motionProps={{
                          initial: { opacity: 0, y: 28 },
                          animate: { opacity: 1, y: 0 },
                          exit:    { opacity: 0, y: 14 },
                          transition: { duration: 0.45, delay: idx * 0.05, ease: "easeOut" },
                        }}
                      />
                    );
                  })}
              </AnimatePresence>
            </div>

            {stories.length > INITIAL_COUNT && (
              <div className="flex justify-center mt-12">
                <motion.button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  animate={expanded ? { scale: 1 } : { scale: [1, 1.05, 1] }}
                  transition={
                    expanded
                      ? { duration: 0.3, ease: "easeInOut" }
                      : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }
                  whileHover={{ scale: expanded ? 1.03 : undefined }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold shadow-lg shadow-deep-purple/30 hover:from-primary-pink hover:to-lavender-purple transition-colors"
                >
                  {expanded ? t.showLessCta : t.loadMoreCta}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Story modal */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-deep-purple/70 backdrop-blur-sm"
            onClick={() => setActiveIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="section-dark relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-gradient-to-br from-primary-pink via-lavender-purple to-deep-purple border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-deep-purple/60"
            >
              <button
                onClick={() => setActiveIndex(null)}
                aria-label="Close"
                className="absolute top-5 end-5 w-9 h-9 rounded-full flex items-center justify-center text-ivory-muted hover:bg-white/10 hover:text-ivory transition-colors"
              >
                <X size={18} />
              </button>

              <div className={`w-11 h-11 rounded-xl ${activeAccent.chip} flex items-center justify-center mb-6`}>
                <Quote className={activeAccent.icon} size={20} />
              </div>

              {/* Before / After images */}
              {hasImages && (
                <div className={`grid gap-3 mb-6 ${active.beforeImage && active.afterImage ? "grid-cols-2" : "grid-cols-1"}`}>
                  {active.beforeImage && (
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                      <img src={active.beforeImage} alt={lang === "ar" ? "قبل" : "Before"} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 start-2 text-[11px] font-bold text-white bg-black/50 rounded-full px-2 py-0.5">
                        {lang === "ar" ? "قبل" : "Before"}
                      </span>
                    </div>
                  )}
                  {active.afterImage && (
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                      <img src={active.afterImage} alt={lang === "ar" ? "بعد" : "After"} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 start-2 text-[11px] font-bold text-white bg-black/50 rounded-full px-2 py-0.5">
                        {lang === "ar" ? "بعد" : "After"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <h3 className="font-heading text-2xl font-bold text-heading mb-4 leading-snug">
                {active.title}
              </h3>
              {active.clientName && (
                <p className="text-sm font-semibold text-white/70 mb-3">— {active.clientName}</p>
              )}
              <p className="text-body leading-relaxed">{active.content}</p>
              {active.publishDate && (
                <p className="mt-4 text-xs text-white/50">{active.publishDate}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
