/**
 * NavigationFooter — previous / next navigation bar for the assessment wizard.
 * Shows a back button, step counter, and primary action button.
 * Reusable for any step-based wizard.
 */
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface NavigationFooterProps {
  /** 0-based index of the current question step */
  currentStepIndex: number;
  totalSteps: number;
  canProceed: boolean;
  isLastStep: boolean;
  isSummary?: boolean;
  backLabel: string;
  nextLabel: string;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
}

export default function NavigationFooter({
  currentStepIndex,
  totalSteps,
  canProceed,
  isLastStep,
  isSummary = false,
  backLabel,
  nextLabel,
  submitLabel,
  onBack,
  onNext,
}: NavigationFooterProps) {
  const isFirst = currentStepIndex === 0 && !isSummary;

  return (
    <div className="flex items-center justify-between mt-8 gap-4">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="flex items-center gap-2 px-5 py-3 rounded-full border border-soft-purple/20 text-deep-purple text-sm font-semibold hover:bg-light-pink/30 disabled:opacity-0 disabled:pointer-events-none transition-all"
        aria-label={backLabel}
      >
        <ChevronLeft size={15} className="rtl:rotate-180 shrink-0" />
        <span className="hidden sm:inline">{backLabel}</span>
      </button>

      {/* Step counter — desktop */}
      {!isSummary && (
        <p className="hidden sm:block text-xs text-deep-purple/35 font-medium tabular-nums">
          {currentStepIndex + 1} / {totalSteps}
        </p>
      )}

      {/* Next / Submit */}
      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        whileHover={canProceed ? { scale: 1.02, y: -1 } : {}}
        whileTap={canProceed ? { scale: 0.97 } : {}}
        className={`flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-semibold shadow-md shadow-deep-purple/18 transition-all ${
          canProceed
            ? "bg-gradient-to-r from-primary-pink to-lavender-purple hover:shadow-lg hover:shadow-deep-purple/25"
            : "bg-soft-purple/20 cursor-not-allowed shadow-none"
        }`}
        aria-label={isSummary || isLastStep ? submitLabel : nextLabel}
      >
        {isSummary || isLastStep ? (
          <>
            {submitLabel}
            <Send size={14} className="rtl:rotate-180 shrink-0" />
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight size={15} className="rtl:rotate-180 shrink-0" />
          </>
        )}
      </motion.button>
    </div>
  );
}
