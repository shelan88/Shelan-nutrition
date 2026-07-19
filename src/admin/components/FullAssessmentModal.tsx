/**
 * FullAssessmentModal — complete assessment view opened from the Client Profile tab.
 *
 * Opened when the admin clicks "View Full Assessment" on a client's profile card.
 * Receives a responseId + template name, fetches the full ResponseWithAnswers
 * from Supabase, and renders:
 *   1. Score arc (0–100) with colour coding
 *   2. Risk level badge + percentage
 *   3. Diagnosis category (EN/AR)
 *   4. Every questionnaire answer with proper option-label resolution
 *
 * Sits above the ClientDrawer (z-[70]) with its own backdrop (z-[60]).
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, ClipboardList, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { getResponse } from "@/admin/repositories/assessment-responses.repository";
import type { ResponseWithAnswers } from "@/admin/repositories/assessment-responses.repository";

// ─── Answer renderer ──────────────────────────────────────────────────────────
function AnswerValue({ answerText, answerJson, questionType, options, isAr }: {
  answerText: string | null;
  answerJson: unknown;
  questionType: string;
  options: Array<{ value: string; label_en: string; label_ar: string | null }>;
  isAr: boolean;
}) {
  if (!answerText && !answerJson) {
    return (
      <span className="text-[var(--admin-text-faint)] italic text-[12px]">
        {isAr ? "لا توجد إجابة" : "No answer"}
      </span>
    );
  }

  // Multiple-choice → tag pills
  if (questionType === "multiple_choice" && Array.isArray(answerJson)) {
    const vals = answerJson as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {vals.map((v) => {
          const opt = options.find((o) => o.value === v);
          const lbl = isAr && opt?.label_ar ? opt.label_ar : (opt?.label_en ?? v);
          return (
            <span key={v} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200">
              {lbl}
            </span>
          );
        })}
      </div>
    );
  }

  // Single-choice / dropdown → resolve label
  if ((questionType === "single_choice" || questionType === "dropdown") && answerText) {
    const opt = options.find((o) => o.value === answerText);
    const lbl = isAr && opt?.label_ar ? opt.label_ar : (opt?.label_en ?? answerText);
    return <span className="text-[13px] font-semibold text-[var(--admin-text)]">{lbl}</span>;
  }

  // Yes / No
  if (questionType === "yes_no") {
    const lbl = answerText === "yes"
      ? (isAr ? "نعم" : "Yes")
      : answerText === "no"
      ? (isAr ? "لا" : "No")
      : answerText;
    return <span className="text-[13px] font-semibold text-[var(--admin-text)]">{lbl}</span>;
  }

  // Text / number / range
  return <span className="text-[13px] text-[var(--admin-text)] whitespace-pre-wrap">{answerText}</span>;
}

// ─── Score arc (matches ClientDrawer's ScoreArc) ──────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--admin-border)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <span className="absolute text-[22px] font-bold text-[var(--admin-text)]">{score}</span>
    </div>
  );
}

// ─── Risk badge config ────────────────────────────────────────────────────────
const RISK_BADGE: Record<string, { cls: string; labelEn: string; labelAr: string }> = {
  Low:      { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", labelEn: "Low Risk",     labelAr: "خطر منخفض" },
  Medium:   { cls: "bg-amber-50   text-amber-700   ring-1 ring-amber-200",   labelEn: "Medium Risk",  labelAr: "خطر متوسط" },
  High:     { cls: "bg-orange-50  text-orange-700  ring-1 ring-orange-200",  labelEn: "High Risk",    labelAr: "خطر مرتفع" },
  Critical: { cls: "bg-red-50     text-red-700     ring-1 ring-red-200",     labelEn: "Critical Risk",labelAr: "خطر حرج"   },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  responseId:     string;
  templateNameEn: string;
  templateNameAr: string | null;
  isAr:           boolean;
  onClose:        () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FullAssessmentModal({
  responseId,
  templateNameEn,
  templateNameAr,
  isAr,
  onClose,
}: Props) {
  const [response, setResponse] = useState<ResponseWithAnswers | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    getResponse(responseId).then((res) => {
      setResponse(res);
      setLoading(false);
    });
  }, [responseId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const templateName   = isAr && templateNameAr ? templateNameAr : templateNameEn;
  const submittedDate  = response?.submitted_at
    ? new Date(response.submitted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";
  const riskKey        = response?.risk_level ?? "";
  const riskBadge      = RISK_BADGE[riskKey] ?? null;
  const diagnosisLabel = (isAr && response?.diagnosis_category_ar)
    ? response.diagnosis_category_ar
    : response?.diagnosis_category ?? "";

  const hasScoringSummary =
    response !== null &&
    (response.score !== null ||
     response.risk_level !== null ||
     response.diagnosis_category !== null ||
     response.diagnosis_category_ar !== null);

  return (
    <AnimatePresence>
      {/* Backdrop — sits above the ClientDrawer backdrop (z-40) */}
      <motion.div
        key="full-assessment-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Modal panel */}
      <motion.div
        key="full-assessment-panel"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 14 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="
          fixed inset-x-4 inset-y-6
          sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px]
          z-[70] flex flex-col
          bg-[var(--admin-surface)] rounded-2xl
          shadow-2xl shadow-black/30 overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <ClipboardList size={17} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--admin-text)]">
                {isAr ? "التقييم الكامل" : "Full Assessment"}
              </p>
              <p className="text-[11.5px] text-[var(--admin-text-faint)] truncate">{templateName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-primary-pink animate-spin" />
            </div>
          ) : !response ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center px-6">
              <ClipboardList size={28} className="text-[var(--admin-text-faint)] mb-1" />
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {isAr ? "لا يمكن تحميل التقييم" : "Could not load assessment"}
              </p>
              <p className="text-[12px] text-[var(--admin-text-faint)]">
                {isAr ? "تحقق من الاتصال وأعد المحاولة." : "Check your connection and try again."}
              </p>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-5">

              {/* ── 1. Score · Risk · Diagnosis ────────────────────────── */}
              {hasScoringSummary && (
                <div className="bg-gradient-to-br from-[#fef0f6] to-[#f0eaff] rounded-2xl border border-[var(--admin-border)] p-5">
                  <div className="flex items-center gap-5">

                    {/* Score arc */}
                    {response.score !== null && (
                      <div className="flex flex-col items-center shrink-0">
                        <ScoreArc score={response.score} />
                        <p className="text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider mt-1">
                          {isAr ? "النتيجة" : "Score"}
                        </p>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-2">

                      {/* Submitted date */}
                      {submittedDate && (
                        <p className="text-[11px] text-[var(--admin-text-faint)]">
                          {isAr ? `تاريخ الإرسال: ${submittedDate}` : `Submitted: ${submittedDate}`}
                        </p>
                      )}

                      {/* Risk level + percentage */}
                      {riskBadge && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${riskBadge.cls}`}>
                            <AlertTriangle size={10} strokeWidth={2.5} />
                            {isAr ? riskBadge.labelAr : riskBadge.labelEn}
                          </span>
                          {response.risk_percentage !== null && (
                            <span className="text-[11px] text-[var(--admin-text-muted)] font-semibold">
                              {response.risk_percentage}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Diagnosis category */}
                      {diagnosisLabel && (
                        <div>
                          <p className="text-[10px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-0.5">
                            {isAr ? "التشخيص" : "Diagnosis"}
                          </p>
                          <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                            {diagnosisLabel}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2. All Q&A ─────────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-violet-500 shrink-0" strokeWidth={2} />
                  <h3 className="text-[12px] font-bold text-[var(--admin-text)] uppercase tracking-wider">
                    {isAr ? "إجابات الاستبيان" : "Questionnaire Answers"}
                    {response.answers.length > 0 && (
                      <span className="ms-2 text-[11px] font-normal text-[var(--admin-text-faint)] normal-case tracking-normal">
                        ({response.answers.length} {isAr ? "إجابة" : response.answers.length === 1 ? "answer" : "answers"})
                      </span>
                    )}
                  </h3>
                </div>

                {response.answers.length > 0 ? (
                  <div className="space-y-2.5">
                    {response.answers.map((ans, idx) => {
                      const q = ans.question;
                      const qLabel = isAr && q.label_ar ? q.label_ar : q.label_en;
                      return (
                        <div
                          key={ans.id}
                          className="bg-[var(--admin-hover-bg)] rounded-xl border border-[var(--admin-border)] px-4 py-3.5"
                        >
                          <p className="text-[10.5px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1.5">
                            Q{idx + 1}. {qLabel}
                          </p>
                          <AnswerValue
                            answerText={ans.answer_text}
                            answerJson={ans.answer_json}
                            questionType={q.type}
                            options={q.options.map((o) => ({
                              value:    o.value,
                              label_en: o.label_en,
                              label_ar: o.label_ar,
                            }))}
                            isAr={isAr}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center border border-dashed border-[var(--admin-border)] rounded-xl">
                    <ClipboardList size={22} className="text-[var(--admin-text-faint)] mb-2" />
                    <p className="text-[12.5px] text-[var(--admin-text-faint)]">
                      {isAr ? "لا توجد إجابات مسجلة." : "No answers recorded."}
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
