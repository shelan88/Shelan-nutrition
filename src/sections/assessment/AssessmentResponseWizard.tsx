/**
 * AssessmentResponseWizard — questionnaire UI for a specific assessment template.
 *
 * - One question per screen with direction-aware animated transitions.
 * - Auto-saves answers to localStorage (keyed by appointmentId) on every change.
 * - Progress bar shows answered / total visible questions.
 * - Applies conditional visibility rules (hides questions whose condition is unmet).
 * - On submit: upserts all answers then calls submitResponse.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { saveAnswer, submitResponse, markResponseInProgress } from "@/admin/repositories/assessment-responses.repository";
import type { TemplateWithDetails, QuestionWithOptions } from "@/admin/repositories/assessment-templates.repository";

// ─── Variants ────────────────────────────────────────────────────────────────
const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32 }),
};
const trans = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

// ─── Types ───────────────────────────────────────────────────────────────────
type AnswerMap = Record<string, string | string[]>;

interface Props {
  template: TemplateWithDetails;
  responseId: string;
  appointmentId: string;
  isAr: boolean;
  onSubmitted: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lsKey(appointmentId: string) {
  return `shelan_assessment_${appointmentId}`;
}

function loadFromLS(appointmentId: string): AnswerMap {
  try {
    const raw = localStorage.getItem(lsKey(appointmentId));
    return raw ? (JSON.parse(raw) as AnswerMap) : {};
  } catch {
    return {};
  }
}

function saveToLS(appointmentId: string, answers: AnswerMap) {
  try {
    localStorage.setItem(lsKey(appointmentId), JSON.stringify(answers));
  } catch { /* ignore */ }
}

// ─── Question input components ───────────────────────────────────────────────
function QuestionInput({
  question,
  value,
  onChange,
  isAr,
}: {
  question: QuestionWithOptions;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  isAr: boolean;
}) {
  const label = isAr && question.label_ar ? question.label_ar : question.label_en;
  const placeholder = isAr ? (question.placeholder_ar ?? question.placeholder_en ?? "") : (question.placeholder_en ?? "");
  const help = isAr ? (question.help_ar ?? question.help_en) : question.help_en;

  const inputCls = "w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all";
  const optionBase = "flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all cursor-pointer text-sm font-medium";

  switch (question.type) {
    case "short_text":
      return (
        <input
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      );

    case "paragraph":
      return (
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={`${inputCls} resize-none`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputCls} max-w-xs`}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} max-w-xs`}
        />
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { val: "yes", labelEn: "Yes", labelAr: "نعم" },
            { val: "no",  labelEn: "No",  labelAr: "لا"  },
          ].map((opt) => {
            const selected = value === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => onChange(opt.val)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  selected
                    ? "bg-gradient-to-r from-primary-pink to-lavender-purple text-white border-transparent shadow-md shadow-deep-purple/20"
                    : "bg-white text-deep-purple border-soft-purple/25 hover:border-primary-pink/40 hover:bg-light-pink/20"
                }`}
              >
                {isAr ? opt.labelAr : opt.labelEn}
              </button>
            );
          })}
        </div>
      );

    case "scale": {
      const numVal = value as string;
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => {
            const selected = numVal === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border-2 ${
                  selected
                    ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white border-transparent shadow-md"
                    : "bg-white text-deep-purple/70 border-soft-purple/20 hover:border-primary-pink/40 hover:bg-light-pink/20"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      );
    }

    case "single_choice":
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const optLabel = isAr && opt.label_ar ? opt.label_ar : opt.label_en;
            const selected = value === opt.value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`${optionBase} ${
                  selected
                    ? "bg-gradient-to-r from-primary-pink/10 to-lavender-purple/10 border-primary-pink/50 text-heading"
                    : "bg-white border-soft-purple/20 text-body hover:border-primary-pink/30 hover:bg-light-pink/10"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                  selected ? "border-primary-pink bg-primary-pink" : "border-soft-purple/40"
                }`}>
                  {selected && <span className="block w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
                </span>
                {optLabel}
              </button>
            );
          })}
        </div>
      );

    case "multiple_choice": {
      const checked = Array.isArray(value) ? value : (value ? [value] : []);
      return (
        <div className="flex flex-col gap-2">
          {question.options.map((opt) => {
            const optLabel = isAr && opt.label_ar ? opt.label_ar : opt.label_en;
            const isChecked = checked.includes(opt.value);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (isChecked) onChange(checked.filter((v) => v !== opt.value));
                  else onChange([...checked, opt.value]);
                }}
                className={`${optionBase} ${
                  isChecked
                    ? "bg-gradient-to-r from-primary-pink/10 to-lavender-purple/10 border-primary-pink/50 text-heading"
                    : "bg-white border-soft-purple/20 text-body hover:border-primary-pink/30 hover:bg-light-pink/10"
                }`}
              >
                <span className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isChecked ? "border-primary-pink bg-primary-pink" : "border-soft-purple/40"
                }`}>
                  {isChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {optLabel}
              </button>
            );
          })}
        </div>
      );
    }

    case "dropdown":
      return (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} max-w-xs cursor-pointer`}
        >
          <option value="">{isAr ? "— اختاري —" : "— Select —"}</option>
          {question.options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {isAr && opt.label_ar ? opt.label_ar : opt.label_en}
            </option>
          ))}
        </select>
      );

    case "file_upload":
    case "image_upload":
      return (
        <div>
          <input
            type="file"
            accept={question.type === "image_upload" ? "image/*" : undefined}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file.name);
            }}
            className="block w-full text-sm text-deep-purple/60 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-primary-pink/10 file:to-lavender-purple/10 file:text-primary-pink hover:file:from-primary-pink/20 file:cursor-pointer"
          />
          {value && (
            <p className="mt-2 text-xs text-body opacity-60">
              {isAr ? "الملف المحدد:" : "Selected:"} {value as string}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }

  // unreachable but keeps TS happy
  void label;
  void help;
  void placeholder;
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function AssessmentResponseWizard({
  template,
  responseId,
  appointmentId,
  isAr,
  onSubmitted,
}: Props) {
  const [answers,     setAnswers]     = useState<AnswerMap>(() => loadFromLS(appointmentId));
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [direction,   setDirection]   = useState(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sorted questions
  const allQuestions = useMemo(
    () => [...template.questions].sort((a, b) => a.sort_order - b.sort_order),
    [template.questions]
  );

  // Conditionally visible questions (also exclude disabled questions)
  const visibleQuestions = useMemo<QuestionWithOptions[]>(() => {
    return allQuestions.filter((q) => {
      // Skip questions explicitly disabled by the admin
      if (q.enabled === false) return false;
      if (!q.conditional_question_id) return true;
      const dep = answers[q.conditional_question_id];
      if (Array.isArray(dep)) return dep.includes(q.conditional_value ?? "");
      return dep === q.conditional_value;
    });
  }, [allQuestions, answers]);

  const currentQuestion = visibleQuestions[currentIdx] ?? null;
  const isLastQuestion  = currentIdx === visibleQuestions.length - 1;

  // Progress: answered / total
  const answeredCount = useMemo(
    () => visibleQuestions.filter((q) => {
      const v = answers[q.id];
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === "string" && v.trim() !== "";
    }).length,
    [visibleQuestions, answers]
  );
  const progressPct = visibleQuestions.length > 0
    ? Math.round((answeredCount / visibleQuestions.length) * 100)
    : 0;

  // Auto-save to localStorage on every change
  useEffect(() => {
    saveToLS(appointmentId, answers);
  }, [answers, appointmentId]);

  // Mark response as in_progress when wizard starts
  useEffect(() => {
    markResponseInProgress(responseId);
  }, [responseId]);

  // Fix currentIdx if visibleQuestions shrinks (conditional hides current question)
  useEffect(() => {
    if (currentIdx >= visibleQuestions.length && visibleQuestions.length > 0) {
      setCurrentIdx(visibleQuestions.length - 1);
    }
  }, [visibleQuestions.length, currentIdx]);

  function currentValue(): string | string[] {
    if (!currentQuestion) return "";
    const v = answers[currentQuestion.id];
    if (currentQuestion.type === "multiple_choice") return Array.isArray(v) ? v : (v ? [v] : []);
    return typeof v === "string" ? v : "";
  }

  function handleChange(v: string | string[]) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }));
  }

  function goNext() {
    setDirection(1);
    setCurrentIdx((i) => Math.min(i + 1, visibleQuestions.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setDirection(-1);
    setCurrentIdx((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function canProceed(): boolean {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;
    const v = currentValue();
    if (Array.isArray(v)) return v.length > 0;
    return v.trim() !== "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      // Save all answers
      await Promise.all(
        visibleQuestions.map(async (q) => {
          const raw = answers[q.id];
          if (raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) return;
          const answerText = Array.isArray(raw) ? raw.join(", ") : raw;
          const answerJson = Array.isArray(raw) ? raw : null;
          await saveAnswer(responseId, q.id, answerText, answerJson);
        })
      );
      const ok = await submitResponse(responseId, appointmentId);
      if (!ok) throw new Error("submit failed");
      // Clear localStorage draft
      try { localStorage.removeItem(lsKey(appointmentId)); } catch { /* ignore */ }
      onSubmitted();
    } catch {
      setSubmitError(isAr ? "حدث خطأ أثناء الإرسال. حاولي مرة أخرى." : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (visibleQuestions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-soft-purple/12 shadow-xl shadow-deep-purple/10 px-8 py-12 text-center">
        <p className="text-body opacity-60">
          {isAr ? "لا توجد أسئلة في هذا الاستبيان." : "No questions in this questionnaire."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-deep-purple/50 uppercase tracking-wide">
            {isAr
              ? `السؤال ${currentIdx + 1} من ${visibleQuestions.length}`
              : `Question ${currentIdx + 1} of ${visibleQuestions.length}`}
          </span>
          <span className="text-xs font-bold text-primary-pink">{progressPct}%</span>
        </div>
        <div className="h-2 bg-soft-purple/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-pink to-lavender-purple rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {visibleQuestions.map((q, i) => {
            const answered = (() => {
              const v = answers[q.id];
              if (Array.isArray(v)) return v.length > 0;
              return typeof v === "string" && v.trim() !== "";
            })();
            return (
              <div
                key={q.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? "w-6 bg-primary-pink"
                    : answered
                    ? "w-3 bg-lavender-purple/60"
                    : "w-3 bg-soft-purple/20"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-soft-purple/12 shadow-xl shadow-deep-purple/10 overflow-hidden min-h-[360px]">
        <AnimatePresence mode="wait" custom={direction}>
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={trans}
              className="px-7 py-10 sm:px-10 sm:py-12"
            >
              {/* Required badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-deep-purple/30">
                  {isAr ? `السؤال ${currentIdx + 1}` : `Question ${currentIdx + 1}`}
                </span>
                {currentQuestion.required && (
                  <span className="text-[10px] font-semibold text-primary-pink bg-primary-pink/8 px-2 py-0.5 rounded-full">
                    {isAr ? "مطلوب" : "Required"}
                  </span>
                )}
              </div>

              {/* Question label */}
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-heading mb-3 leading-snug">
                {isAr && currentQuestion.label_ar ? currentQuestion.label_ar : currentQuestion.label_en}
              </h2>

              {/* Help text */}
              {(isAr ? (currentQuestion.help_ar || currentQuestion.help_en) : currentQuestion.help_en) && (
                <p className="text-sm text-body opacity-60 mb-5">
                  {isAr ? (currentQuestion.help_ar || currentQuestion.help_en) : currentQuestion.help_en}
                </p>
              )}

              {/* Input */}
              <div className="mt-6">
                <QuestionInput
                  question={currentQuestion}
                  value={currentValue()}
                  onChange={handleChange}
                  isAr={isAr}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {submitError && (
        <p className="mt-3 text-sm text-red-500 text-center">{submitError}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goBack}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-soft-purple/20 text-sm font-semibold text-deep-purple/60 hover:border-primary-pink/30 hover:text-primary-pink hover:bg-light-pink/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {isAr ? "السابق" : "Back"}
        </button>

        <div className="flex items-center gap-2">
          {/* Skip — only for non-required questions */}
          {currentQuestion && !currentQuestion.required && !isLastQuestion && (
            <button
              onClick={goNext}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-deep-purple/40 hover:text-primary-pink transition-colors"
            >
              {isAr ? "تخطى" : "Skip"}
            </button>
          )}

          {isLastQuestion ? (
            <motion.button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isAr ? "جارٍ الإرسال…" : "Submitting…"}
                </>
              ) : (
                isAr ? "إرسال الاستبيان" : "Submit Questionnaire"
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={goNext}
              disabled={currentQuestion?.required && !canProceed()}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md shadow-deep-purple/15 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAr ? "التالي" : "Next"}
              {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
