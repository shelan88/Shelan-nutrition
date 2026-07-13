import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { booking } from "@/content/content";
import MagneticButton from "@/components/MagneticButton";

export default function Booking() {
  const { lang } = useLanguage();
  const t = booking[lang];

  return (
    <section id="booking" className="section-dark py-24 bg-plum-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2.5rem] bg-gradient-to-br from-plum-800 via-plum-900 to-plum-800 border border-white/10 px-8 py-16 sm:px-16 text-center overflow-hidden"
        >
          <div className="absolute -top-16 -end-16 w-64 h-64 rounded-full bg-rose-600/20 blur-3xl" />
          <div className="absolute -bottom-16 -start-16 w-64 h-64 rounded-full bg-apricot-500/20 blur-3xl" />

          <h2 className="relative font-heading text-3xl sm:text-4xl font-bold text-heading mb-5">
            {t.title}
          </h2>
          <p className="relative text-body leading-relaxed max-w-xl mx-auto mb-10">
            {t.description}
          </p>
          <MagneticButton
            as="a"
            href="#booking"
            className="relative inline-block px-9 py-4 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-500 transition-colors shadow-lg shadow-rose-700/50"
          >
            {t.cta}
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
