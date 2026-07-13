import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { booking } from "@/content/content";

export default function Booking() {
  const { lang } = useLanguage();
  const t = booking[lang];

  return (
    <section id="booking" className="py-24 bg-cream-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2.5rem] bg-gradient-to-br from-lavender-200 via-lavender-100 to-peach-100 px-8 py-16 sm:px-16 text-center overflow-hidden"
        >
          <div className="absolute -top-16 -end-16 w-64 h-64 rounded-full bg-peach-200/40 blur-3xl" />
          <div className="absolute -bottom-16 -start-16 w-64 h-64 rounded-full bg-lavender-200/50 blur-3xl" />

          <h2 className="relative font-heading text-3xl sm:text-4xl font-bold text-rose-600 mb-5">
            {t.title}
          </h2>
          <p className="relative text-stone-600 leading-relaxed max-w-xl mx-auto mb-10">
            {t.description}
          </p>
          <a
            href="#booking"
            className="relative inline-block px-9 py-4 rounded-full bg-peach-300 text-rose-700 font-semibold hover:bg-peach-400 transition-colors shadow-md shadow-peach-300/50"
          >
            {t.cta}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
