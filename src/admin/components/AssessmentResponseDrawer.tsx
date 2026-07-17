/**
 * AssessmentResponseDrawer — admin slide-over showing full assessment submission.
 *
 * Opens from BookingsAdminPage when the admin clicks the eye icon on a row that
 * has an assessment. Shows booking details + complete questionnaire answers.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ClipboardList, CheckCircle2, Clock, User, Calendar } from "lucide-react";
import { getResponse } from "@/admin/repositories/assessment-responses.repository";
import type { ResponseWithAnswers } from "@/admin/repositories/assessment-responses.repository";
import type { AppointmentRow } from "@/types/database.types";

// ─── Assessment status badge config ──────────────────────────────────────────
const ASSESSMENT_BADGE: Record<string, { cls: string; labelEn: string; labelAr: string }> = {
  awaiting_assessment: {
    cls:     "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    labelEn: "Awaiting Assessment",
    labelAr: "في انتظار الاستبيان",
  },
  assessment_submitted: {
    cls:     "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    labelEn: "Assessment Submitted",
    labelAr: "تم تقديم الاستبيان",
  },
  none: {
    cls:     "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
    labelEn: "No Assessment",
    labelAr: "بدون استبيان",
  },
};

interface Props {
  appt: AppointmentRow | null;
  isAr: boolean;
  onClose: () => void;
}

function formatDate(d: string, isAr: boolean) {
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

// ─── Answer renderer ──────────────────────────────────────────────────────────
function AnswerValue({ answerText, answerJson, questionType, options, isAr }: {
  answerText: string | null;
  answerJson: unknown;
  questionType: string;
  options: Array<{ value: string; label_en: string; label_ar: string | null }>;
  isAr: boolean;
}) {
  if (!answerText && !answerJson) {
    return <span className="text-[var(--admin-text-faint)] italic text-[12px]">{isAr ? "لا توجد إجابة" : "No answer"}</span>;
  }

  // Checkbox / multi-select: render as tags
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

  // Radio / dropdown: resolve option label
  if ((questionType === "single_choice" || questionType === "dropdown") && answerText) {
    const opt = options.find((o) => o.value === answerText);
    const lbl = isAr && opt?.label_ar ? opt.label_ar : (opt?.label_en ?? answerText);
    return <span className="text-[13px] font-semibold text-[var(--admin-text)]">{lbl}</span>;
  }

  // Boolean
  if (questionType === "yes_no") {
    const lbl = answerText === "yes"
      ? (isAr ? "نعم" : "Yes")
      : answerText === "no"
      ? (isAr ? "لا" : "No")
      : answerText;
    return <span className="text-[13px] font-semibold text-[var(--admin-text)]">{lbl}</span>;
  }

  return <span className="text-[13px] text-[var(--admin-text)] whitespace-pre-wrap">{answerText}</span>;
}

// ─── Main drawer ──────────────────────────────────────────────────────────────
export default function AssessmentResponseDrawer({ appt, isAr, onClose }: Props) {
  const [response, setResponse] = useState<ResponseWithAnswers | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!appt?.assessment_response_id) {
      setResponse(null);
      return;
    }
    setLoading(true);
    getResponse(appt.assessment_response_id).then((res) => {
      setResponse(res);
      setLoading(false);
    });
  }, [appt?.assessment_response_id]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const assessmentStatus = (appt?.assessment_status ?? "none") as string;
  const badge = ASSESSMENT_BADGE[assessmentStatus] ?? ASSESSMENT_BADGE.none;

  return (
    <AnimatePresence>
      {appt && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 end-0 z-50 flex flex-col w-full sm:w-[560px] bg-[var(--admin-surface)] shadow-2xl shadow-black/20"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <ClipboardList size={17} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--admin-text)]">
                    {isAr ? "تفاصيل الاستبيان" : "Assessment Details"}
                  </p>
                  <p className="text-[11.5px] text-[var(--admin-text-faint)]">
                    {appt.client_name ?? (isAr ? "غير معروف" : "Unknown client")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* Booking summary */}
                <div className="bg-[var(--admin-hover-bg)] rounded-2xl border border-[var(--admin-border)] p-4 grid grid-cols-2 gap-3">
                  {[
                    { icon: User,     label: isAr ? "العميل"  : "Client",  value: appt.client_name ?? "—" },
                    { icon: Calendar, label: isAr ? "التاريخ" : "Date",    value: formatDate(appt.date, isAr) },
                    { icon: Clock,    label: isAr ? "الوقت"   : "Time",    value: appt.time ?? "—" },
                    { icon: ClipboardList, label: isAr ? "الخدمة" : "Service", value: appt.type ?? "—" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-[var(--admin-surface)] rounded-xl px-3.5 py-3 border border-[var(--admin-border)]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className="text-[var(--admin-text-faint)]" />
                        <p className="text-[10.5px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider">{label}</p>
                      </div>
                      <p className="text-[12.5px] font-semibold text-[var(--admin-text)]">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Assessment status */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                    {isAr ? "حالة الاستبيان:" : "Assessment Status:"}
                  </span>
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                    {isAr ? badge.labelAr : badge.labelEn}
                  </span>
                </div>

                {/* Questionnaire answers */}
                {assessmentStatus === "assessment_submitted" && (
                  <>
                    <div className="border-t border-[var(--admin-border)] pt-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={15} className="text-violet-500" />
                        <h3 className="text-[13px] font-bold text-[var(--admin-text)] uppercase tracking-wider">
                          {isAr ? "إجابات الاستبيان" : "Questionnaire Answers"}
                        </h3>
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 size={24} className="text-primary-pink animate-spin" />
                        </div>
                      ) : response && response.answers.length > 0 ? (
                        <div className="space-y-3">
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
                                    value: o.value,
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
                        <div className="flex flex-col items-center py-8 text-center">
                          <ClipboardList size={24} className="text-[var(--admin-text-faint)] mb-2" />
                          <p className="text-[12.5px] text-[var(--admin-text-faint)]">
                            {isAr ? "لا توجد إجابات مسجلة." : "No answers recorded."}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {assessmentStatus === "awaiting_assessment" && (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Clock size={22} className="text-amber-500" />
                    </div>
                    <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                      {isAr ? "في انتظار إجابة العميل" : "Waiting for client to complete the questionnaire"}
                    </p>
                    <p className="text-[12px] text-[var(--admin-text-faint)] max-w-xs">
                      {isAr
                        ? "تم إرسال رابط الاستبيان للعميل بعد تأكيد الحجز."
                        : "The questionnaire link was sent to the client after booking confirmation."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
