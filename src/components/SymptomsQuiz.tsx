/**
 * SymptomsQuiz — Interactive 3-step symptoms checker for Lipedema.
 * Arabic UI. Yes/No per question → result card with booking CTA.
 * Lightweight, no external dependencies beyond framer-motion.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Question {
  id: number;
  textAr: string;
  textEn: string;
  iconEmoji: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    textAr: "هل تشعرين بثقل أو ألم في الساقين أو الذراعين دون سبب واضح؟",
    textEn: "Do you feel heaviness or pain in your legs or arms without an obvious cause?",
    iconEmoji: "🦵",
  },
  {
    id: 2,
    textAr: "هل تلاحظين تورماً متكرراً في الأطراف لا يتحسن بالراحة أو رفع القدمين؟",
    textEn: "Do you notice recurring swelling in your limbs that doesn't improve with rest or elevation?",
    iconEmoji: "💧",
  },
  {
    id: 3,
    textAr: "هل جربتِ الحمية الغذائية أو الرياضة ولم تلاحظي نتائج ملموسة في مناطق معينة من جسمك؟",
    textEn: "Have you tried dieting or exercise with little to no improvement in specific body areas?",
    iconEmoji: "🥗",
  },
];

type Answer = "yes" | "no" | null;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function SymptomsQuiz() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [step, setStep]       = useState<number>(0);         // 0 = intro, 1-3 = questions, 4 = result
  const [answers, setAnswers] = useState<Answer[]>([null, null, null]);
  const [dir, setDir]         = useState<1 | -1>(1);          // animation direction

  const yesCount = answers.filter((a) => a === "yes").length;
  const highRisk = yesCount >= 2;

  function answer(val: "yes" | "no") {
    const next = [...answers];
    next[step - 1] = val;
    setAnswers(next);
    setDir(isAr ? -1 : 1);
    // Auto-advance
    if (step < 3) {
      setTimeout(() => setStep((s) => s + 1), 260);
    } else {
      setTimeout(() => setStep(4), 260);
    }
  }

  function reset() {
    setDir(isAr ? 1 : -1);
    setAnswers([null, null, null]);
    setTimeout(() => setStep(1), 50);
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  return (
    <section className="py-24 bg-[#F3F4F6] overflow-hidden">
      <div className="max-w-2xl mx-auto px-6 lg:px-10">

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="uppercase tracking-[0.2em] text-xs font-semibold text-primary-pink mb-3">
            {isAr ? "اختبري نفسك" : "Self-Check Tool"}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading">
            {isAr
              ? "هل تعانين من أعراض الليبيديما؟"
              : "Are You Experiencing Lipedema Symptoms?"}
          </h2>
          <p className="mt-4 text-body text-base leading-relaxed max-w-lg mx-auto opacity-75">
            {isAr
              ? "أجيبي على ٣ أسئلة سريعة لتعرفي مدى احتمالية الإصابة"
              : "Answer 3 quick questions to assess your likelihood"}
          </p>
        </motion.div>

        {/* Card */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={dir}>
            {/* ── Intro ── */}
            {step === 0 && (
              <motion.div
                key="intro"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="bg-white rounded-3xl shadow-lg shadow-deep-purple/10 p-8 sm:p-10 text-center"
              >
                <div className="text-5xl mb-5">🔍</div>
                <h3 className="font-heading text-xl font-bold text-heading mb-3">
                  {isAr ? "اختبار سريع — ٣ أسئلة فقط" : "Quick Check — 3 Questions Only"}
                </h3>
                <p className="text-body text-sm leading-relaxed mb-8 opacity-75 max-w-sm mx-auto">
                  {isAr
                    ? "هذا الاختبار ليس تشخيصاً طبياً، لكنه يساعدك على فهم أعراضك وتوجيهك نحو التقييم المناسب."
                    : "This is not a medical diagnosis — it helps you understand your symptoms and guides you toward proper evaluation."}
                </p>
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setDir(isAr ? -1 : 1); setStep(1); }}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md shadow-deep-purple/20 hover:shadow-lg transition-shadow"
                >
                  {isAr ? "ابدئي الاختبار" : "Start the Quiz"}
                  {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </motion.button>
              </motion.div>
            )}

            {/* ── Questions 1–3 ── */}
            {step >= 1 && step <= 3 && (
              <motion.div
                key={`q-${step}`}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="bg-white rounded-3xl shadow-lg shadow-deep-purple/10 p-8 sm:p-10"
              >
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i + 1 <= step
                          ? "bg-gradient-to-r from-primary-pink to-lavender-purple"
                          : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>

                {/* Question */}
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">{QUESTIONS[step - 1].iconEmoji}</div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-pink mb-3">
                    {isAr ? `سؤال ${step} من ${QUESTIONS.length}` : `Question ${step} of ${QUESTIONS.length}`}
                  </p>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-heading leading-snug">
                    {isAr ? QUESTIONS[step - 1].textAr : QUESTIONS[step - 1].textEn}
                  </h3>
                </div>

                {/* Yes / No */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => answer("yes")}
                    className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border-2 border-transparent bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 hover:border-primary-pink/40 hover:from-primary-pink/18 hover:to-lavender-purple/18 transition-all duration-200 group"
                  >
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-heading group-hover:text-primary-pink transition-colors">
                      {isAr ? "نعم" : "Yes"}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => answer("no")}
                    className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border-2 border-transparent bg-gray-50 hover:border-gray-300 hover:bg-gray-100 transition-all duration-200 group"
                  >
                    <span className="text-2xl">❌</span>
                    <span className="font-bold text-heading transition-colors">
                      {isAr ? "لا" : "No"}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Result ── */}
            {step === 4 && (
              <motion.div
                key="result"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className={`rounded-3xl shadow-xl p-8 sm:p-10 text-center overflow-hidden relative ${
                  highRisk
                    ? "bg-gradient-to-br from-deep-purple via-soft-purple to-lavender-purple section-dark"
                    : "bg-white"
                }`}
              >
                {highRisk && (
                  <>
                    <div className="absolute -top-20 -end-20 w-64 h-64 rounded-full bg-primary-pink/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -start-20 w-64 h-64 rounded-full bg-lavender-purple/20 blur-3xl pointer-events-none" />
                  </>
                )}

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                    highRisk
                      ? "bg-white/15"
                      : "bg-green-50"
                  }`}>
                    <CheckCircle2 size={32} className={highRisk ? "text-light-pink" : "text-green-500"} />
                  </div>

                  {/* Result text */}
                  {highRisk ? (
                    <>
                      <h3 className="font-heading text-2xl font-bold text-heading mb-4 leading-snug">
                        {isAr
                          ? "أعراضك تشير إلى احتمالية عالية.."
                          : "Your symptoms suggest a high likelihood.."}
                      </h3>
                      <p className="text-body text-base leading-relaxed mb-8 opacity-85 max-w-sm mx-auto">
                        {isAr
                          ? "احجزي استشارة لتقييم حالتك بدقة والحصول على خطة علاجية مخصصة لكِ"
                          : "Book a consultation for an accurate assessment and a personalised treatment plan."}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => scrollTo("booking")}
                        className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-white text-deep-purple font-semibold text-base shadow-2xl shadow-black/25 hover:shadow-black/35 transition-shadow"
                      >
                        {isAr ? "احجزي الآن" : "Book Now"}
                        {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-heading text-2xl font-bold text-heading mb-4">
                        {isAr ? "الأعراض لا تشير إلى مخاطر عالية" : "Symptoms don't indicate high risk"}
                      </h3>
                      <p className="text-body text-base leading-relaxed mb-8 opacity-75 max-w-sm mx-auto">
                        {isAr
                          ? "يبدو أن أعراضك غير مرتبطة بالليبيديما في الوقت الحالي. إن كنتِ غير متأكدة، لا تترددي في طلب استشارة."
                          : "Your symptoms don't seem Lipedema-related right now. If unsure, feel free to book a consultation."}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => scrollTo("booking")}
                        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md"
                      >
                        {isAr ? "استشيري خبيرة على أي حال" : "Consult an expert anyway"}
                      </motion.button>
                    </>
                  )}

                  {/* Retry */}
                  <button
                    onClick={reset}
                    className={`mt-5 inline-flex items-center gap-1.5 text-sm transition-colors ${
                      highRisk ? "text-white/50 hover:text-white/80" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <RotateCcw size={13} />
                    {isAr ? "إعادة الاختبار" : "Retake quiz"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed max-w-md mx-auto"
        >
          {isAr
            ? "⚠️ هذا الاختبار للتوعية فقط وليس بديلاً عن التشخيص الطبي المتخصص."
            : "⚠️ This quiz is for awareness only and is not a substitute for professional medical diagnosis."}
        </motion.p>
      </div>
    </section>
  );
}
