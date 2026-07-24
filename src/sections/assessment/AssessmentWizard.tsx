/**
 * AssessmentWizard — multi-step health assessment flow.
 *
 * Flow:
 *   welcome → step[0..N-1] (question steps) → summary → success
 *
 * Architecture:
 *   - Question rendering is fully data-driven: the wizard never hard-codes
 *     step semantics. It only knows about question types via AssessmentInput.
 *   - Auto-saves draft to localStorage on every answer change.
 *   - Animated transitions via Framer Motion (direction-aware).
 *   - All content via typed props — CMS-ready.
 *
 * To connect Supabase:
 *   - Replace localStorage draft with supabase.from('assessment_drafts').upsert(...)
 *   - On submit: supabase.from('assessments').insert({ answers, submittedAt })
 *   - Both changes are isolated to the two TODO comments below.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import { debugLog } from "@/shared/debug/logger";

import ProgressStepper from "@/components/assessment/ProgressStepper";
import QuestionCard from "@/components/assessment/QuestionCard";
import AssessmentInput from "@/components/assessment/AssessmentInput";
import SummaryCard from "@/components/assessment/SummaryCard";
import NavigationFooter from "@/components/assessment/NavigationFooter";

import type { CMSAssessmentData, CMSAssessmentQuestion } from "@/types/cms.types";

// ─── Admin data layer ──────────────────────────────────────────────────────────
import { calculateAssessment } from "@/admin/services/assessment.service";
import {
  findClientByEmail,
  findClientByPhone,
  createClient,
  saveAssessment,
  appendTimelineEvent,
} from "@/admin/repositories/clients.repository";
import {
  addAssessmentEntry,
  incrementAssessmentRequests,
  incrementClients,
  updateRiskCounters,
} from "@/admin/repositories/dashboard.repository";

const LS_KEY = "shelan_assessment_draft";

// ─── Animation variants ────────────────────────────────────────────────────────
const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};
const transition = { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };

// ─── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({
  data,
  onStart,
}: {
  data: CMSAssessmentData["welcome"];
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center py-4"
    >
      {/* Illustration */}
      <div className="relative mb-10 w-56 h-56 flex items-center justify-center">
        {/* Layered decorative circles */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-light-pink/60 to-lavender-purple/20 blur-2xl" />
        <div className="absolute w-44 h-44 rounded-full bg-gradient-to-br from-primary-pink/15 to-soft-purple/10 border border-primary-pink/20" />
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary-pink/20 to-lavender-purple/20" />
        {/* Central icon composition */}
        <div className="relative flex flex-col items-center gap-1.5 z-10">
          {/* Top row */}
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-deep-purple/12 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f35e98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-deep-purple/12 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8d5fd3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
          </div>
          {/* Middle */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-pink to-lavender-purple shadow-lg shadow-deep-purple/25 flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          {/* Bottom row */}
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-deep-purple/12 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b889f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white shadow-md shadow-deep-purple/12 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f35e98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Kicker */}
      <p className="uppercase tracking-[0.22em] text-[10px] font-semibold text-primary-pink mb-3">
        {data.kicker}
      </p>

      {/* Headline */}
      <h2 className="font-heading text-4xl sm:text-5xl font-bold text-heading leading-tight mb-4 whitespace-pre-line">
        {data.headline}
      </h2>

      {/* Subheadline */}
      <p className="text-body text-base leading-relaxed max-w-md opacity-75 mb-8">
        {data.subheadline}
      </p>

      {/* Estimated time */}
      <div className="flex items-center gap-2 text-xs font-medium text-deep-purple/45 bg-light-pink/30 px-4 py-2 rounded-full mb-10">
        <Clock size={13} />
        <span>{data.estimatedTimeLabel}: <strong className="text-deep-purple/70 font-semibold">{data.estimatedTime}</strong></span>
      </div>

      {/* CTA */}
      <motion.button
        type="button"
        onClick={onStart}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="px-10 py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold text-base shadow-lg shadow-deep-purple/25 hover:shadow-xl hover:shadow-deep-purple/30 transition-shadow"
      >
        {data.startLabel}
      </motion.button>
    </motion.div>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: CMSAssessmentData["submission"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center py-6"
    >
      {/* Success illustration */}
      <div className="relative mb-10 w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-light-pink/70 to-lavender-purple/25 blur-2xl" />
        <div className="absolute w-36 h-36 rounded-full bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 border border-primary-pink/20" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple shadow-xl shadow-deep-purple/30 flex items-center justify-center z-10">
          <CheckCircle2 size={42} className="text-white" strokeWidth={2} />
        </div>
        {/* Floating sparkle dots */}
        {(
          [
            { top: "6%",  left: "18%",  size: 8, color: "#f35e98" },
            { top: "10%", right: "16%", size: 6, color: "#b889f5" },
            { bottom: "8%",  left: "14%",  size: 6, color: "#8d5fd3" },
            { bottom: "12%", right: "20%", size: 8, color: "#f88eb8" },
          ] as Array<{
            top?: string; bottom?: string;
            left?: string; right?: string;
            size: number; color: string;
          }>
        ).map((dot, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              background: dot.color,
              top: dot.top,
              bottom: dot.bottom,
              left: dot.left,
              right: dot.right,
            }}
          />
        ))}
      </div>

      <p className="uppercase tracking-[0.22em] text-[10px] font-semibold text-primary-pink mb-3">
        {data.kicker}
      </p>

      <h2 className="font-heading text-3xl sm:text-4xl font-bold text-heading leading-tight mb-4 whitespace-pre-line">
        {data.headline}
      </h2>

      <p className="text-body text-base leading-relaxed max-w-md opacity-75 mb-10">
        {data.description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={data.primaryHref}
            className="block px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/25 hover:shadow-xl hover:shadow-deep-purple/30 transition-shadow"
          >
            {data.primaryCTA}
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={data.secondaryHref}
            className="block px-8 py-3.5 rounded-full border-2 border-soft-purple/20 text-deep-purple font-semibold hover:bg-light-pink/30 transition-colors"
          >
            {data.secondaryCTA}
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main wizard ───────────────────────────────────────────────────────────────

interface AssessmentWizardProps {
  data: CMSAssessmentData;
  strings: {
    backLabel: string;
    nextLabel: string;
    requiredLabel: string;
    validationMessage: string;
  };
}

type View = "welcome" | "questions" | "summary" | "success";

export default function AssessmentWizard({ data, strings }: AssessmentWizardProps) {
  const [view, setView] = useState<View>("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // When non-null, edit mode jumped back from summary to this step index
  const [editFromSummary, setEditFromSummary] = useState<number | null>(null);

  // ── Load draft from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string | string[]>;
        setAnswers(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ── Auto-save draft to localStorage on every answer change ──────────────────
  useEffect(() => {
    // TODO: replace with supabase.from('assessment_drafts').upsert({ answers, updatedAt })
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage errors (private mode, quota exceeded, etc.)
    }
  }, [answers]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const currentStep = data.steps[stepIndex];

  const currentStepQuestions = useMemo(
    () =>
      data.questions
        .filter((q) => q.stepId === currentStep?.id)
        .sort((a, b) => a.order - b.order),
    [data.questions, currentStep]
  );

  // ── Conditional visibility filter ────────────────────────────────────────────
  const visibleQuestions = useMemo(
    () =>
      currentStepQuestions.filter((q) => {
        if (!q.conditional) return true;
        const dep = answers[q.conditional.questionId];
        const expected = q.conditional.value;
        if (Array.isArray(expected)) {
          const depArr = Array.isArray(dep) ? dep : [dep];
          return expected.some((v) => depArr.includes(v));
        }
        return Array.isArray(dep) ? dep.includes(expected) : dep === expected;
      }),
    [currentStepQuestions, answers]
  );

  // ── Validation ────────────────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    if (view !== "questions") return true;
    return visibleQuestions
      .filter((q) => q.required)
      .every((q) => {
        const v = answers[q.id];
        if (!v) return false;
        if (Array.isArray(v)) return v.length > 0;
        return v.trim() !== "";
      });
  }, [view, visibleQuestions, answers]);

  // ── Answer handler ───────────────────────────────────────────────────────────
  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setShowValidation(false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const goToStep = (idx: number, dir: number) => {
    setDirection(dir);
    setStepIndex(idx);
    setView("questions");
    setShowValidation(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    if (view === "welcome") {
      setDirection(1);
      setView("questions");
      setStepIndex(0);
      setShowValidation(false);
      return;
    }

    if (!canProceed) {
      setShowValidation(true);
      return;
    }

    if (view === "questions") {
      // If editing from summary, return to summary after this step
      if (editFromSummary !== null) {
        setEditFromSummary(null);
        setDirection(1);
        setView("summary");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (stepIndex < data.steps.length - 1) {
        goToStep(stepIndex + 1, 1);
      } else {
        setDirection(1);
        setView("summary");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (view === "summary") {
      setIsSubmitting(true);
      // Yield to React so the loading indicator renders before sync work begins
      await Promise.resolve();

      const fieldCount = Object.keys(answers).length;
      debugLog({
        level: "log", category: "forms",
        module: "Assessment", component: "AssessmentWizard", action: "submit",
        result: "info",
        data: { fieldCount },
      });
      const t0 = performance.now();

      try {
        // 1. Calculate score, risk level, plan, and diagnosis
        const result = calculateAssessment(answers);

        // 2. Deduplicate: match by email first, then phone
        let existingClient =
          result.email ? await findClientByEmail(result.email) : null;
        if (!existingClient && result.phone) {
          existingClient = await findClientByPhone(result.phone);
        }

        const today = new Date().toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        });

        // 3a. Existing client — update assessment, append timeline event
        if (existingClient) {
          await saveAssessment(existingClient.id, result);
          await appendTimelineEvent(existingClient.id, {
            event:   "Assessment Re-submitted",
            eventAr: "تم تقديم التقييم مجدداً",
            date:    today,
            type:    "assessment",
          });
        } else {
          // 3b. New client — create full record
          await createClient(result);
          incrementClients();
        }

        // 4. Dashboard: prepend to recent-assessment queue, bump counter
        addAssessmentEntry({
          client:   result.fullName,
          initials: result.avatarInitials,
          date:     today,
          risk:     result.riskLevel,
          status:   result.riskLevel === "High" ? "Flagged" : "Pending",
        });
        incrementAssessmentRequests();
        updateRiskCounters(result.riskLevel);

        // 5. Clear draft
        // TODO Supabase: supabase.from('assessments').insert({ answers, submittedAt: new Date() })
        localStorage.removeItem(LS_KEY);

        debugLog({
          level: "log", category: "forms",
          module: "Assessment", component: "AssessmentWizard", action: "submit",
          result: "success", durationMs: Math.round(performance.now() - t0),
          data: { fieldCount, isExistingClient: !!existingClient, riskLevel: result.riskLevel },
        });

        setDirection(1);
        setView("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        debugLog({
          level: "error", category: "forms",
          module: "Assessment", component: "AssessmentWizard", action: "submit",
          result: "error", durationMs: Math.round(performance.now() - t0),
          error: err instanceof Error ? err.message : String(err),
        });
        console.error("[SHELAN] Assessment submission failed:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (view === "questions") {
      if (editFromSummary !== null) {
        setEditFromSummary(null);
        setDirection(-1);
        setView("summary");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (stepIndex > 0) {
        goToStep(stepIndex - 1, -1);
      } else {
        setDirection(-1);
        setView("welcome");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (view === "summary") {
      goToStep(data.steps.length - 1, -1);
    }
  };

  const handleEditStep = (idx: number) => {
    setEditFromSummary(idx);
    goToStep(idx, -1);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const animKey =
    view === "welcome"
      ? "welcome"
      : view === "summary"
      ? "summary"
      : view === "success"
      ? "success"
      : `step-${stepIndex}`;

  return (
    <div>
      {/* Progress stepper — shown only during question steps */}
      {view === "questions" && (
        <ProgressStepper steps={data.steps} currentIndex={stepIndex} />
      )}
      {view === "summary" && (
        <ProgressStepper steps={data.steps} currentIndex={data.steps.length} />
      )}

      {/* Wizard card */}
      <div className="bg-white rounded-3xl border border-soft-purple/12 shadow-xl shadow-deep-purple/10 px-6 py-10 sm:px-10 sm:py-12 min-h-[480px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={animKey}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {/* Welcome */}
            {view === "welcome" && (
              <WelcomeScreen data={data.welcome} onStart={handleNext} />
            )}

            {/* Question step */}
            {view === "questions" && currentStep && (
              <div className="space-y-8">
                {/* Step header */}
                <div className="mb-2">
                  <p className="uppercase tracking-[0.18em] text-[10px] font-semibold text-primary-pink mb-1">
                    {currentStep.description}
                  </p>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-heading leading-tight">
                    {currentStep.title}
                  </h2>
                </div>

                {/* Validation message */}
                {showValidation && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-primary-pink bg-primary-pink/8 border border-primary-pink/20 rounded-xl px-4 py-3"
                  >
                    {strings.validationMessage}
                  </motion.p>
                )}

                {/* Questions */}
                <div className="space-y-10">
                  {visibleQuestions.map((q: CMSAssessmentQuestion) => (
                    <QuestionCard
                      key={q.id}
                      title={q.title}
                      description={q.description}
                      required={q.required}
                      requiredLabel={strings.requiredLabel}
                    >
                      <AssessmentInput
                        question={q}
                        value={answers[q.id]}
                        onChange={handleAnswer}
                      />
                    </QuestionCard>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {view === "summary" && (
              <div className="space-y-6">
                <div className="mb-2">
                  <p className="uppercase tracking-[0.18em] text-[10px] font-semibold text-primary-pink mb-1">
                    {data.summary.description}
                  </p>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-heading leading-tight">
                    {data.summary.headline}
                  </h2>
                </div>

                <div className="space-y-4">
                  {data.steps.map((step, idx) => {
                    const stepQs = data.questions
                      .filter((q) => q.stepId === step.id)
                      .sort((a, b) => a.order - b.order);
                    return (
                      <SummaryCard
                        key={step.id}
                        step={step}
                        questions={stepQs}
                        answers={answers}
                        editLabel={data.summary.editLabel}
                        noneSelectedLabel={data.summary.noneSelectedLabel}
                        onEdit={() => handleEditStep(idx)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Success */}
            {view === "success" && <SuccessScreen data={data.submission} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer — hidden on welcome and success */}
      {view !== "welcome" && view !== "success" && (
        <>
          {/* Submitting indicator — shown while processing the assessment */}
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2.5 mt-6 text-[13px] font-semibold text-primary-pink"
            >
              <Loader2 size={15} className="animate-spin" />
              Processing your assessment…
            </motion.div>
          )}
          <NavigationFooter
            currentStepIndex={stepIndex}
            totalSteps={data.steps.length}
            canProceed={canProceed && !isSubmitting}
            isLastStep={stepIndex === data.steps.length - 1}
            isSummary={view === "summary"}
            backLabel={strings.backLabel}
            nextLabel={strings.nextLabel}
            submitLabel={data.summary.submitLabel}
            onBack={handleBack}
            onNext={handleNext}
          />
        </>
      )}
    </div>
  );
}
