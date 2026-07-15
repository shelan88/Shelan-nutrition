import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { stats } from "@/content/content";

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1800;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const { lang } = useLanguage();
  const t = stats[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20 bg-gradient-to-br from-deep-purple via-soft-purple to-lavender-purple section-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-light-pink mb-3">
            {t.kicker}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {t.title}
          </h2>
        </motion.div>

        <div
          ref={ref}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {t.items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center p-6 lg:p-8 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/15 hover:border-white/25 transition-all duration-300 group"
            >
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative font-heading text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight tabular-nums">
                <AnimatedCounter value={item.value} suffix={item.suffix} inView={inView} />
              </span>
              <span className="relative text-sm font-medium text-white/70 leading-snug">
                {item.label}
              </span>

              {/* Bottom accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                className="relative mt-4 h-[2px] w-10 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple origin-center"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
