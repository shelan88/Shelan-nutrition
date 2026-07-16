/**
 * ProgressStepper — animated step indicator for multi-step assessment flows.
 * Shows numbered steps with connecting lines; done/active/future visual states.
 * Reusable: accepts any CMSAssessmentStep array.
 */
import { Check } from "lucide-react";
import type { CMSAssessmentStep } from "@/types/cms.types";

interface ProgressStepperProps {
  steps: CMSAssessmentStep[];
  /** Index of the currently active step (0-based) */
  currentIndex: number;
}

export default function ProgressStepper({ steps, currentIndex }: ProgressStepperProps) {
  return (
    <nav aria-label="Assessment progress" className="mb-10">
      {/* Mobile: compact progress bar + label */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary-pink uppercase tracking-widest">
            {steps[currentIndex]?.title ?? ""}
          </span>
          <span className="text-xs text-deep-purple/45 font-medium">
            {currentIndex + 1} / {steps.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-soft-purple/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step dots */}
      <ol className="hidden sm:flex items-center justify-center gap-0">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={active ? "step" : undefined}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    done
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/20"
                      : active
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-lg shadow-deep-purple/25 scale-110 ring-4 ring-primary-pink/15"
                      : "bg-white border-2 border-soft-purple/20 text-deep-purple/35"
                  }`}
                >
                  {done ? <Check size={15} strokeWidth={2.5} /> : i + 1}
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap transition-colors duration-300 max-w-[68px] text-center leading-tight ${
                    active ? "text-primary-pink" : done ? "text-deep-purple/45" : "text-deep-purple/25"
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={`w-12 lg:w-16 h-px mx-1.5 mb-5 transition-all duration-500 ${
                    done ? "bg-primary-pink" : "bg-soft-purple/15"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
