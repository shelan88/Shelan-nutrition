/**
 * TemplatePreviewOverlay
 *
 * Full-screen read-only preview of a template as the client would see it.
 * Mirrors the AssessmentResponseWizard UI with:
 *   - One question per screen
 *   - Conditional visibility
 *   - Disabled questions filtered out
 *   - "This is a preview" banner
 *   - Navigation (Prev / Next)
 *   - Non-submittable
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { TemplateWithDetails, QuestionWithOptions } from "@/admin/repositories/assessment-templates.repository";

// ─── Variants ────────────────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
};
const trans = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

// ─── Read-only question display ───────────────────────────────────────────────

function PreviewInput({ question, isAr }: { question: QuestionWithOptions; isAr: boolean }) {
  const label = isAr && question.label_ar ? question.label_ar : question.label_en;
  const placeholder = isAr ? (question.placeholder_ar ?? question.placeholder_en ?? "") : (question.placeholder_en ?? "");

  const inputCls = "w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white/60 text-heading text-sm placeholder:text-deep-purple/35 cursor-not-allowed opacity-80";
  const optionBase = "flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-soft-purple/20 text-sm font-medium text-body opacity-80 cursor-not-allowed";

  void label; // shown in parent

  switch (question.type) {
    case "short_text":
      return <input readOnly value="" placeholder={placeholder} className={inputCls} />;
    case "paragraph":
      return <textarea readOnly value="" placeholder={placeholder} rows={4} className={`${inputCls} resize-none`} />;
    case "number":
      return <input readOnly type="number" value="" placeholder={placeholder} className={`${inputCls} max-w-xs`} />;
    case "date":
      return <input readOnly type="date" value="" className={`${inputCls} max-w-xs`} />;
    case "yes_no":
      return (
        <div className="flex gap-3">
          {[{ v: "yes", en: "Yes", ar: "نعم" }, { v: "no", en: "No", ar: "لا" }].map((o) => (
            <div key={o.v}
              className="flex-1 py-3 rounded-xl border-2 border-soft-purple/25 bg-white text-deep-purple text-sm font-semibold text-center opacity-70 cursor-not-allowed">
              {isAr ? o.ar : o.en}
            </div>
          ))}
        </div>
      );
    case "single_choice":
    case "dropdown":
    case "multiple_choice":
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => (
            <div key={opt.id} className={optionBase}>
              <span className={`w-4 h-4 rounded-${question.type === "multiple_choice" ? "md" : "full"} border-2 border-soft-purple/40 shrink-0`} />
              {isAr && opt.label_ar ? opt.label_ar : opt.label_en}
            </div>
          ))}
        </div>
      );
    case "file_upload":
    case "image_upload":
      return (
        <div className="px-4 py-3 rounded-xl border border-soft-purple/20 bg-white/60 text-sm text-deep-purple/50 opacity-80 cursor-not-allowed">
          {isAr ? "رفع ملف (معطّل في وضع المعاينة)" : "File upload (disabled in preview)"}
        </div>
      );
    default:
      return null;
  }
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

interface Props {
  template: TemplateWithDetails;
  onClose: () => void;
  isAr: boolean;
}

export default function TemplatePreviewOverlay({ template, onClose, isAr }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection]   = useState(1);

  // Sorted, enabled-only, no conditional filtering (preview shows all structure)
  const questions = useMemo<QuestionWithOptions[]>(
    () => [...template.questions]
      .filter((q) => q.enabled !== false)
      .sort((a, b) => a.sort_order - b.sort_order),
    [template.questions]
  );

  const current     = questions[currentIdx] ?? null;
  const isFirst     = currentIdx === 0;
  const isLast      = currentIdx === questions.length - 1;
  const progressPct = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  function go(delta: number) {
    setDirection(delta);
    setCurrentIdx((i) => Math.max(0, Math.min(questions.length - 1, i + delta)));
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
          <Eye size={32} className="mx-auto text-deep-purple/30 mb-3" />
          <p className="text-[14px] font-semibold text-heading mb-2">
            {isAr ? "لا توجد أسئلة مفعّلة" : "No enabled questions"}
          </p>
          <p className="text-[12px] text-body mb-5">
            {isAr ? "فعّل بعض الأسئلة لرؤية المعاينة." : "Enable some questions to see the preview."}
          </p>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold">
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Background (client questionnaire style) */}
      <div className="absolute inset-0 bg-gradient-to-br from-light-pink via-white to-soft-purple/10" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-soft-purple/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <Eye size={13} className="text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
              {isAr ? "وضع المعاينة" : "Preview Mode"}
            </span>
          </div>
          <span className="text-[12px] text-deep-purple/50 hidden sm:block">
            {isAr ? "هذا ما سيراه العميل — النموذج غير قابل للإرسال" : "This is what clients see — not submittable"}
          </span>
        </div>
        <button onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--admin-border)] bg-white text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors">
          <X size={13} /> {isAr ? "إغلاق المعاينة" : "Close Preview"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-1 bg-soft-purple/10">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-pink to-lavender-purple"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        {/* Template title */}
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold text-primary-pink/70 uppercase tracking-widest mb-2">
            {isAr ? (template.name_ar ?? template.name_en) : template.name_en}
          </p>
          <p className="text-[12px] text-deep-purple/50">
            {isAr
              ? `السؤال ${currentIdx + 1} من ${questions.length}`
              : `Question ${currentIdx + 1} of ${questions.length}`}
          </p>
        </div>

        {/* Question card */}
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            {current && (
              <motion.div
                key={current.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={trans}
                className="bg-white rounded-3xl shadow-lg shadow-deep-purple/8 p-8"
              >
                {/* Question label */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-heading leading-snug" dir={isAr ? "rtl" : "ltr"}>
                    {isAr && current.label_ar ? current.label_ar : current.label_en}
                    {current.required && <span className="ml-1 text-primary-pink">*</span>}
                  </h2>
                  {(isAr ? current.help_ar : current.help_en) && (
                    <p className="text-sm text-body mt-2 opacity-70" dir={isAr ? "rtl" : "ltr"}>
                      {isAr ? current.help_ar : current.help_en}
                    </p>
                  )}
                </div>

                {/* Input */}
                <PreviewInput question={current} isAr={isAr} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => go(-1)}
            disabled={isFirst}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-soft-purple/20 bg-white text-sm font-semibold text-deep-purple hover:bg-light-pink/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft size={16} className={isAr ? "rotate-180" : ""} />
            {isAr ? "السابق" : "Previous"}
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > currentIdx ? 1 : -1); setCurrentIdx(i); }}
                className={`rounded-full transition-all ${i === currentIdx ? "w-6 h-2 bg-primary-pink" : "w-2 h-2 bg-soft-purple/30 hover:bg-primary-pink/40"}`}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            disabled={isLast}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {isAr ? "التالي" : "Next"}
            <ChevronRight size={16} className={isAr ? "rotate-180" : ""} />
          </button>
        </div>

        {isLast && (
          <p className="mt-4 text-[11px] text-deep-purple/40 text-center">
            {isAr ? "نهاية المعاينة — لا يمكن الإرسال في وضع المعاينة" : "End of preview — submission is disabled in preview mode"}
          </p>
        )}
      </div>
    </div>
  );
}
