/**
 * AssessmentResponsePage — /assessment/respond/:appointmentId
 *
 * Renders the assessment questionnaire for a specific appointment.
 * Requires authentication. If the assessment has already been submitted,
 * shows a "already completed" screen instead of the form.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { getAppointmentById } from "@/admin/repositories/appointments.repository";
import { getTemplateWithDetails } from "@/admin/repositories/assessment-templates.repository";
import { getResponseByAppointment, createResponse, getPreviousSubmittedResponse, answersToMap } from "@/admin/repositories/assessment-responses.repository";
import type { AppointmentRow } from "@/types/database.types";
import type { TemplateWithDetails } from "@/admin/repositories/assessment-templates.repository";
import type { ResponseWithAnswers } from "@/admin/repositories/assessment-responses.repository";
import AssessmentResponseWizard from "@/sections/assessment/AssessmentResponseWizard";
import AssessmentLayout from "@/components/assessment/AssessmentLayout";

export default function AssessmentResponsePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [appt,           setAppt]           = useState<AppointmentRow | null>(null);
  const [template,       setTemplate]       = useState<TemplateWithDetails | null>(null);
  const [response,       setResponse]       = useState<ResponseWithAnswers | null>(null);
  const [pageState,      setPageState]      = useState<"loading" | "ready" | "offer_prefill" | "submitted" | "no_template" | "error">("loading");
  const [submitted,      setSubmitted]      = useState(false);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string | string[]> | undefined>(undefined);

  // Auth guard — redirect to booking if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/booking", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load appointment + template + existing response
  useEffect(() => {
    if (!appointmentId || !user || authLoading) return;

    async function load() {
      const appointment = await getAppointmentById(appointmentId!);
      if (!appointment) { setPageState("error"); return; }

      // Security: deny access if the appointment has no owner (shouldn't happen
      // in the normal authenticated booking flow) or if the owner is a different user.
      if (!appointment.user_id || appointment.user_id !== user!.id) {
        navigate("/", { replace: true });
        return;
      }

      setAppt(appointment);

      // Already submitted
      if (appointment.assessment_status === "assessment_submitted") {
        setPageState("submitted");
        return;
      }

      // No template assigned
      if (!appointment.assessment_template_id) {
        setPageState("no_template");
        return;
      }

      // Load template + existing response in parallel
      const [tmpl, existingResponse] = await Promise.all([
        getTemplateWithDetails(appointment.assessment_template_id),
        getResponseByAppointment(appointment.id),
      ]);

      if (!tmpl) { setPageState("error"); return; }
      setTemplate(tmpl);

      // Ensure a response row exists (create one if BookingFlow didn't)
      let resp = existingResponse;
      if (!resp) {
        const created = await createResponse(tmpl.id, appointment.id, user!.id ?? null, null);
        if (created) resp = { ...created, answers: [] };
      }

      // Check submitted status from the response row itself
      if (resp?.status === "submitted") {
        setPageState("submitted");
        return;
      }

      setResponse(resp);

      // Check for a previously submitted response for this same template+user.
      // If one exists and the current draft has no answers yet, offer to pre-fill.
      const hasLocalDraft = (() => {
        try {
          const raw = localStorage.getItem(`shelan_assessment_${appointment.id}`);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          return Object.keys(parsed).length > 0;
        } catch { return false; }
      })();

      if (!hasLocalDraft && user?.id) {
        const prior = await getPreviousSubmittedResponse(tmpl.id, user.id, appointment.id);
        if (prior && prior.answers.length > 0) {
          setInitialAnswers(answersToMap(prior.answers));
          setPageState("offer_prefill");
          return;
        }
      }

      setPageState("ready");
    }

    load();
  }, [appointmentId, user, authLoading, navigate]);

  // ── Already submitted screen ───────────────────────────────────────────────
  if (submitted || pageState === "submitted") {
    return (
      <AssessmentLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-16 gap-6"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-xl shadow-deep-purple/25">
            <CheckCircle2 size={44} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="uppercase tracking-[0.2em] text-[10px] font-semibold text-primary-pink mb-3">
              {isAr ? "تم الإرسال" : "Submitted"}
            </p>
            <h2 className="font-heading text-3xl font-bold text-heading mb-3">
              {isAr ? "تم إرسال استبيانك بنجاح" : "Your assessment is complete!"}
            </h2>
            <p className="text-body opacity-70 max-w-md mx-auto">
              {isAr
                ? "شكراً لك. سيراجع فريقنا إجاباتك ويتواصل معك قبل موعدك."
                : "Thank you! Our team will review your answers and reach out before your session."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link
              to="/"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl transition-shadow"
            >
              {isAr ? "العودة للرئيسية" : "Back to Home"}
            </Link>
            <Link
              to="/booking"
              className="px-8 py-3.5 rounded-full border-2 border-soft-purple/20 text-deep-purple font-semibold hover:bg-light-pink/30 transition-colors"
            >
              {isAr ? "حجز موعد آخر" : "Book Another Session"}
            </Link>
          </div>
        </motion.div>
      </AssessmentLayout>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === "loading" || authLoading) {
    return (
      <AssessmentLayout>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Loader2 size={36} className="text-primary-pink animate-spin" />
          <p className="text-body opacity-60">{isAr ? "جارٍ تحميل الاستبيان…" : "Loading your questionnaire…"}</p>
        </div>
      </AssessmentLayout>
    );
  }

  // ── Offer to pre-fill from prior response ─────────────────────────────────
  if (pageState === "offer_prefill" && template && response) {
    return (
      <AssessmentLayout>
        <div className="mb-8">
          <p className="uppercase tracking-[0.18em] text-[10px] font-semibold text-primary-pink mb-2">
            {isAr ? "استبيان ما قبل الاستشارة" : "Pre-Consultation Questionnaire"}
          </p>
          <h1 className="font-heading text-3xl font-bold text-heading">
            {isAr ? (template.name_ar || template.name_en) : template.name_en}
          </h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-soft-purple/12 shadow-xl shadow-deep-purple/10 px-8 py-10 flex flex-col items-center text-center gap-6"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
            <ClipboardList size={28} className="text-primary-pink" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-heading mb-2">
              {isAr ? "لديكِ إجابات سابقة" : "You have previous answers"}
            </h2>
            <p className="text-body opacity-65 max-w-sm">
              {isAr
                ? "وجدنا إجاباتكِ من المرة الأخيرة. هل تريدين البدء بها أم تعبئة الاستبيان من جديد؟"
                : "We found your answers from a previous visit. Would you like to start with those, or fill out the questionnaire fresh?"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPageState("ready")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl transition-shadow"
            >
              {isAr ? "استخدام الإجابات السابقة" : "Use previous answers"}
            </motion.button>
            <button
              onClick={() => { setInitialAnswers(undefined); setPageState("ready"); }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-soft-purple/20 text-deep-purple font-semibold hover:bg-light-pink/30 transition-colors"
            >
              {isAr ? "البدء من جديد" : "Start fresh"}
            </button>
          </div>
        </motion.div>
      </AssessmentLayout>
    );
  }

  // ── No template / error ────────────────────────────────────────────────────
  if (pageState === "no_template" || pageState === "error") {
    return (
      <AssessmentLayout>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ClipboardList size={40} className="text-soft-purple/50" />
          <h2 className="font-heading text-2xl font-bold text-heading">
            {pageState === "error"
              ? (isAr ? "حدث خطأ" : "Something went wrong")
              : (isAr ? "لا يوجد استبيان لهذا الموعد" : "No questionnaire required")}
          </h2>
          <p className="text-body opacity-60 max-w-sm">
            {pageState === "error"
              ? (isAr ? "تعذّر تحميل الاستبيان. حاولي مرة أخرى." : "Could not load the questionnaire. Please try again.")
              : (isAr ? "موعدك لا يتطلب استبياناً. سنتواصل معك قريباً." : "Your appointment does not require a questionnaire. We'll be in touch soon.")}
          </p>
          <Link to="/" className="mt-4 px-7 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg">
            {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </AssessmentLayout>
    );
  }

  // ── Questionnaire wizard ────────────────────────────────────────────────────
  if (pageState === "ready" && template && response) {
    return (
      <AssessmentLayout>
        <div className="mb-8">
          <p className="uppercase tracking-[0.18em] text-[10px] font-semibold text-primary-pink mb-2">
            {isAr ? "استبيان ما قبل الاستشارة" : "Pre-Consultation Questionnaire"}
          </p>
          <h1 className="font-heading text-3xl font-bold text-heading">
            {isAr ? (template.name_ar || template.name_en) : template.name_en}
          </h1>
          {(template.description_en || template.description_ar) && (
            <p className="text-body opacity-70 mt-2">
              {isAr ? (template.description_ar || template.description_en) : template.description_en}
            </p>
          )}
        </div>
        <AssessmentResponseWizard
          template={template}
          responseId={response.id}
          appointmentId={appt!.id}
          isAr={isAr}
          initialAnswers={initialAnswers}
          onSubmitted={() => setSubmitted(true)}
        />
      </AssessmentLayout>
    );
  }

  return null;
}
