/**
 * AssessmentCompareModal
 *
 * Side-by-side (two-column) diff view for two assessment responses.
 * Questions where the answer changed are highlighted in amber.
 * Renders as a full-screen overlay above the ClientDrawer.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import {
  getResponse,
} from "@/admin/repositories/assessment-responses.repository";
import type {
  ResponseWithAnswers,
  AnswerWithQuestion,
} from "@/admin/repositories/assessment-responses.repository";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseAnswer(ans: AnswerWithQuestion | undefined): string {
  if (!ans) return "";
  if (Array.isArray(ans.answer_json)) return (ans.answer_json as string[]).join(", ");
  return ans.answer_text ?? "";
}

function formatDate(iso: string | null, isAr: boolean): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idA: string;
  idB: string;
  templateNameEn: string;
  templateNameAr: string | null;
  isAr: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessmentCompareModal({
  idA,
  idB,
  templateNameEn,
  templateNameAr,
  isAr,
  onClose,
}: Props) {
  const [respA, setRespA] = useState<ResponseWithAnswers | null>(null);
  const [respB, setRespB] = useState<ResponseWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getResponse(idA), getResponse(idB)]).then(([a, b]) => {
      setRespA(a);
      setRespB(b);
      setLoading(false);
    });
  }, [idA, idB]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Build unified question list ordered by sort_order
  const questions = (() => {
    if (!respA && !respB) return [];
    const map = new Map<string, AnswerWithQuestion["question"]>();
    for (const r of [respA, respB]) {
      if (!r) continue;
      for (const ans of r.answers) {
        if (!map.has(ans.question_id)) map.set(ans.question_id, ans.question);
      }
    }
    return [...map.values()].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  })();

  const ansMapA = new Map(respA?.answers.map((a) => [a.question_id, a]) ?? []);
  const ansMapB = new Map(respB?.answers.map((a) => [a.question_id, a]) ?? []);

  const changedCount = questions.filter((q) => {
    const a = normaliseAnswer(ansMapA.get(q.id));
    const b = normaliseAnswer(ansMapB.get(q.id));
    return a !== b;
  }).length;

  const templateName = isAr && templateNameAr ? templateNameAr : templateNameEn;

  return (
    <AnimatePresence>
      <motion.div
        key="compare-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <motion.div
        key="compare-panel"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-4 inset-y-6 sm:inset-x-8 sm:inset-y-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[780px] z-[70] flex flex-col bg-[var(--admin-surface)] rounded-2xl shadow-2xl shadow-black/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={14} className="text-primary-pink" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-[var(--admin-text)] truncate">
                {isAr ? "مقارنة الإجابات" : "Compare Answers"}
              </p>
              <p className="text-[11px] text-[var(--admin-text-faint)] truncate">{templateName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!loading && changedCount > 0 && (
              <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                {isAr
                  ? `${changedCount} تغيير`
                  : `${changedCount} change${changedCount !== 1 ? "s" : ""}`}
              </span>
            )}
            {!loading && changedCount === 0 && !loading && questions.length > 0 && (
              <span className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={11} />
                {isAr ? "لا تغييرات" : "No changes"}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Column headers ───────────────────────────────────────────── */}
        {!loading && respA && respB && (
          <div className="shrink-0 grid grid-cols-[200px_1fr_1fr] border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
            <div className="px-4 py-2.5 border-e border-[var(--admin-border)]">
              <p className="text-[10.5px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
                {isAr ? "السؤال" : "Question"}
              </p>
            </div>
            <div className="px-4 py-2.5 border-e border-[var(--admin-border)]">
              <p className="text-[10.5px] font-bold text-lavender-purple uppercase tracking-wider">
                {isAr ? "إجابة أ" : "Response A"}
              </p>
              <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">
                {formatDate(respA.submitted_at, isAr)}
              </p>
            </div>
            <div className="px-4 py-2.5">
              <p className="text-[10.5px] font-bold text-primary-pink uppercase tracking-wider">
                {isAr ? "إجابة ب" : "Response B"}
              </p>
              <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">
                {formatDate(respB.submitted_at, isAr)}
              </p>
            </div>
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center px-6">
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {isAr ? "لا توجد إجابات مسجلة" : "No answers recorded"}
              </p>
              <p className="text-[12px] text-[var(--admin-text-faint)]">
                {isAr
                  ? "لم يتم تسجيل أي إجابات في هذين الاستبيانين."
                  : "Neither response contains recorded answers."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--admin-border)]">
              {questions.map((q, i) => {
                const ansA = ansMapA.get(q.id);
                const ansB = ansMapB.get(q.id);
                const textA = normaliseAnswer(ansA);
                const textB = normaliseAnswer(ansB);
                const changed = textA !== textB;
                const qLabel = isAr && q.label_ar ? q.label_ar : q.label_en;

                return (
                  <div
                    key={q.id}
                    className={`grid grid-cols-[200px_1fr_1fr] min-h-[48px] ${
                      changed ? "bg-amber-50/60" : ""
                    }`}
                  >
                    {/* Question label */}
                    <div className="px-4 py-3 border-e border-[var(--admin-border)] flex items-start gap-1.5">
                      {changed && (
                        <span className="mt-[3px] w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <p className={`text-[11.5px] font-semibold leading-snug ${changed ? "text-amber-800" : "text-[var(--admin-text-muted)]"}`}>
                        Q{i + 1}. {qLabel}
                      </p>
                    </div>

                    {/* Answer A */}
                    <div className={`px-4 py-3 border-e border-[var(--admin-border)] ${changed ? "border-amber-100" : ""}`}>
                      {textA ? (
                        <p className={`text-[12.5px] leading-relaxed ${changed ? "text-amber-900 font-medium" : "text-[var(--admin-text)]"}`}>
                          {textA}
                        </p>
                      ) : (
                        <p className="text-[12px] text-[var(--admin-text-faint)] italic">—</p>
                      )}
                    </div>

                    {/* Answer B */}
                    <div className="px-4 py-3">
                      {textB ? (
                        <p className={`text-[12.5px] leading-relaxed ${changed ? "text-amber-900 font-medium" : "text-[var(--admin-text)]"}`}>
                          {textB}
                        </p>
                      ) : (
                        <p className="text-[12px] text-[var(--admin-text-faint)] italic">—</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {!loading && questions.length > 0 && (
          <div className="shrink-0 px-5 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)] flex items-center justify-between">
            <p className="text-[11px] text-[var(--admin-text-faint)]">
              {isAr
                ? `${questions.length} سؤال · ${changedCount} تغيير`
                : `${questions.length} question${questions.length !== 1 ? "s" : ""} · ${changedCount} changed`}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-[var(--admin-text-muted)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface)] transition-colors"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
