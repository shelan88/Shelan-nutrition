/**
 * TrustStrip — Credentials & certifications section.
 * Grayscale logo slots for universities, medical associations, certifications.
 * Placed directly after the About section to build authority.
 */
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface Credential {
  id: number;
  nameAr: string;
  nameEn: string;
  initial: string;
}

const credentials: Credential[] = [
  { id: 1, nameAr: "جامعة العلوم الطبية",           nameEn: "Medical Sciences University",   initial: "MSU" },
  { id: 2, nameAr: "الجمعية الطبية الدولية",         nameEn: "International Medical Assoc.",  initial: "IMA" },
  { id: 3, nameAr: "معهد التغذية العلاجية",           nameEn: "Clinical Nutrition Institute",  initial: "CNI" },
  { id: 4, nameAr: "رابطة أخصائيي الليبيديما",       nameEn: "Lipedema Specialists Board",   initial: "LSB" },
  { id: 5, nameAr: "شهادة التميز الطبي الخليجي",     nameEn: "Gulf Medical Excellence Cert.", initial: "GME" },
];

export default function TrustStrip() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <section className="py-14 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-8"
        >
          {isAr
            ? "الشهادات والانتماءات المهنية"
            : "Credentials & Professional Affiliations"}
        </motion.p>

        {/* Logo slots */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 lg:gap-12">
          {credentials.map((cred, idx) => (
            <motion.div
              key={cred.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: idx * 0.07 }}
              className="group flex flex-col items-center gap-2.5 cursor-default"
            >
              {/* Placeholder logo box */}
              <div className="w-[80px] h-[52px] sm:w-[100px] sm:h-[64px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center transition-all duration-300 group-hover:border-gray-300 group-hover:bg-gray-100 group-hover:shadow-sm">
                <span className="text-[13px] sm:text-[15px] font-bold text-gray-400 tracking-wide group-hover:text-gray-500 transition-colors">
                  {cred.initial}
                </span>
              </div>
              {/* Name */}
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium text-center leading-tight max-w-[90px] group-hover:text-gray-500 transition-colors">
                {isAr ? cred.nameAr : cred.nameEn}
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
