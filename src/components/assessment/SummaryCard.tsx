/**
 * SummaryCard — displays a step's answered questions in the summary view.
 * Shows the step title, all answered questions with human-readable labels,
 * and an edit button to jump back to that step.
 * Reusable for any assessment type.
 */
import { Pencil } from "lucide-react";
import type { CMSAssessmentStep, CMSAssessmentQuestion } from "@/types/cms.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveLabel(
  question: CMSAssessmentQuestion,
  answer: string | string[] | undefined,
  noneLabel: string
): string {
  if (!answer || (Array.isArray(answer) && answer.length === 0)) return noneLabel;

  // For options-based questions, resolve value(s) to label(s)
  if (question.options && question.options.length > 0) {
    const values = Array.isArray(answer) ? answer : [answer];
    const labels = values
      .map((v) => question.options!.find((o) => o.value === v)?.label ?? v)
      .filter(Boolean);
    return labels.join(", ");
  }

  // For range questions, append unit
  if (question.type === "range" && question.unit) {
    return `${Array.isArray(answer) ? answer[0] : answer} ${question.unit}`;
  }

  return Array.isArray(answer) ? answer.join(", ") : answer;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SummaryCardProps {
  step: CMSAssessmentStep;
  questions: CMSAssessmentQuestion[];
  answers: Record<string, string | string[]>;
  editLabel: string;
  noneSelectedLabel: string;
  onEdit: () => void;
}

export default function SummaryCard({
  step,
  questions,
  answers,
  editLabel,
  noneSelectedLabel,
  onEdit,
}: SummaryCardProps) {
  // Only show questions that have answers OR are required
  const visibleQuestions = questions.filter(
    (q) => answers[q.id] !== undefined || q.required
  );

  return (
    <div className="bg-white rounded-2xl border border-soft-purple/12 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-light-pink/30 to-white border-b border-soft-purple/8">
        <h3 className="font-heading font-bold text-base text-heading">{step.title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-pink hover:text-deep-purple transition-colors group"
          aria-label={`${editLabel} ${step.title}`}
        >
          <Pencil size={12} className="group-hover:scale-110 transition-transform" />
          {editLabel}
        </button>
      </div>

      {/* Answers */}
      <ul className="divide-y divide-soft-purple/6">
        {visibleQuestions.map((q) => {
          const raw = answers[q.id];
          const label = resolveLabel(q, raw, noneSelectedLabel);
          const isEmpty = !raw || (Array.isArray(raw) && raw.length === 0);

          return (
            <li key={q.id} className="flex gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-deep-purple/45 font-medium mb-0.5 leading-snug">
                  {q.title}
                </p>
                <p
                  className={`text-sm font-semibold leading-relaxed ${
                    isEmpty ? "text-deep-purple/30 italic" : "text-heading"
                  }`}
                >
                  {label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
