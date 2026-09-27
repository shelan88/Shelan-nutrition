import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ShieldCheck, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { bookingStrings, checkoutModal } from "@/content/content";
import { bookingData } from "@/data/booking.data";
import { supabase } from "@/lib/supabase";
import { createAppointment } from "@/admin/repositories/appointments.repository";
import { getTemplateForService } from "@/admin/repositories/assessment-templates.repository";
import { createResponse } from "@/admin/repositories/assessment-responses.repository";
import { recordPayment } from "@/admin/repositories/payments.repository";
import { stripePromise, parsePriceCents } from "@/lib/stripe";
import PhoneInput from "@/components/PhoneInput";
import { useBookingAvailability, availabilityMessage } from "@/lib/bookingAvailability";
import { getSetting } from "@/admin/repositories/settings.repository";
import { getDisabledDays, getEnabledTimeSlots, resolveAvailability } from "@/lib/availability";
import type { AvailabilitySettings } from "@/lib/availability";
import { getLocalTimezone, slotToLocalDisplay, useAdminTimezone } from "@/lib/timezone";
import { PickTime } from "@/sections/booking/BookingFlow";

// ─── Card element styles ──────────────────────────────────────────────────────

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize:        "14px",
      color:           "#1f1635",
      fontFamily:      "inherit",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CheckoutPlan {
  name:               string;
  price:              string;
  period:             string;
  serviceId?:         string;
  /** DB primary-key of the ConsultationRow this plan was built from.
   *  When present, assessment_enabled is resolved by ID rather than by name,
   *  so renaming the consultation in the CMS never silently breaks the toggle. */
  consultationId?:    string;
  /** Appointment-day and time availability from the consultation row, when available. */
  availability?:       AvailabilitySettings | null;
  /** Mirrors the per-service assessment_enabled toggle in the admin panel.
   *  When undefined (legacy callers), defaults to true so existing behaviour
   *  is preserved. Set to false to suppress the post-payment questionnaire. */
  assessmentEnabled?: boolean;
}

interface CheckoutModalProps {
  plan:    CheckoutPlan;
  onClose: () => void;
}

// ─── Inner modal (inside <Elements>) ─────────────────────────────────────────

function CheckoutModalInner({ plan, onClose }: CheckoutModalProps) {
  const { lang } = useLanguage();
  const t        = checkoutModal[lang];
  const { user } = useAuth();
  const navigate  = useNavigate();
  const stripe    = useStripe();
  const elements  = useElements();
  const { adminTz } = useAdminTimezone();

  // ── Global booking availability gate ────────────────────────────────────
  const { availability: bookingAvailability, settings: bookingAvailabilitySettings } = useBookingAvailability();
  const isBookingOpen = bookingAvailability.state === "open";
  const [appointmentSchedulingEnabled, setAppointmentSchedulingEnabled] = useState(true);
  const [schedulingSettingLoaded, setSchedulingSettingLoaded] = useState(false);
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState(user?.email ?? "");
  const [phone,         setPhone]         = useState("");
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("");
  const [status,        setStatus]        = useState<"idle" | "processing" | "success">("idle");
  const [error,         setError]         = useState<string | null>(null);
  // Card element completeness — tracked via CardElement onChange
  const [cardComplete,  setCardComplete]  = useState(false);
  const [cardError,     setCardError]     = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getSetting("appointment_scheduling_enabled")
      .then((value) => {
        if (current && typeof value === "boolean") setAppointmentSchedulingEnabled(value);
      })
      .catch((settingError) => {
        console.error("[CheckoutModal] failed to load appointment scheduling setting:", settingError);
      })
      .finally(() => {
        if (current) setSchedulingSettingLoaded(true);
      });
    return () => { current = false; };
  }, []);

  const bookingCopy = bookingStrings[lang];
  const serviceAvailability = plan.availability !== undefined
    ? resolveAvailability(plan.availability)
    : null;
  const appointmentTimeSlots = serviceAvailability
    ? getEnabledTimeSlots(serviceAvailability)
    : bookingData[lang].timeSlots;
  const disabledDays = serviceAvailability
    ? getDisabledDays(serviceAvailability)
    : undefined;

  const emailValid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle" || !stripe || !elements) return;

    // Safety guard — bookings scheduled/closed (server also enforces this).
    if (!isBookingOpen) {
      setError(
        availabilityMessage(bookingAvailability, lang)?.body ??
          "Bookings are currently unavailable.",
      );
      return;
    }
    if (appointmentSchedulingEnabled && (!date || !time)) {
      setError(lang === "ar" ? "يرجى اختيار التاريخ والوقت." : "Please choose a date and time.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not loaded. Please refresh and try again.");
      return;
    }

    // Guard: require complete card details before touching Stripe API.
    // Stops here to avoid creating an orphaned PaymentIntent on Stripe.
    if (!cardComplete) {
      setError("Please complete your card details before paying.");
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      // ── 1. Create PaymentIntent on server ─────────────────────────────────
      const amountCents = parsePriceCents(plan.price);
      const piResp = await fetch("/api/create-payment-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:   amountCents,
          currency: "usd",
          metadata: { plan: plan.name },
        }),
      });

      if (!piResp.ok) {
        const body = await piResp.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to initialise payment.");
      }

      const { clientSecret, paymentIntentId } = await piResp.json() as {
        clientSecret: string;
        paymentIntentId: string;
      };

      // ── 2. Confirm the card payment with Stripe ───────────────────────────
      const clientName  = name.trim() || email.trim() || "Customer";
      const clientEmail = email.trim();

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card:             cardElement,
            billing_details:  { name: clientName, email: clientEmail },
          },
        },
      );

      if (stripeError) {
        throw new Error(stripeError.message ?? "Payment failed.");
      }
      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      // ── 3. Resolve client_id ──────────────────────────────────────────────
      let resolvedClientId: string | null = null;
      if (user?.id) {
        const { data: clientRow } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        resolvedClientId = clientRow?.id ?? null;
      }

      // ── 4. Look up assessment template ────────────────────────────────────
      console.log("[ASSESSMENT-DEBUG] CheckoutModal template lookup start", {
        serviceId:         plan.serviceId,
        consultationId:    plan.consultationId,
        assessmentEnabled: plan.assessmentEnabled,
      });

      // Resolve the service/consultation ID for the assignment lookup.
      // ConsultationSection passes consultationId; program bookings pass serviceId.
      const lookupId = plan.consultationId ?? plan.serviceId ?? null;

      // Strict service-specific lookup only — no global fallback.
      // If the service is not explicitly assigned to a template the assessment is skipped.
      const template = lookupId
        ? await getTemplateForService(lookupId)
        : null;
      console.log("[ASSESSMENT-DEBUG] primary template lookup result", {
        lookupId,
        templateId:     template?.id ?? null,
        templateActive: template?.active ?? null,
      });

      // Gate on both the template being active AND the per-service toggle.
      // plan.assessmentEnabled is undefined for legacy callers → treat as true.
      const hasTemplate = !!(template?.active) && (plan.assessmentEnabled !== false);
      console.log("[ASSESSMENT-DEBUG] hasTemplate decision", {
        hasTemplate,
        templateActive:    template?.active ?? null,
        assessmentEnabled: plan.assessmentEnabled,
        blockedBy: !hasTemplate
          ? (!template ? "NO_TEMPLATE" : !template.active ? "TEMPLATE_NOT_ACTIVE" : "ASSESSMENT_DISABLED")
          : null,
      });

      // ── 5. Create appointment ─────────────────────────────────────────────
      const appt = await createAppointment({
        client_name:  clientName,
        client_email: clientEmail || null,
        client_phone: phone.trim() || null,
        user_id:      user?.id    ?? null,
        date:         appointmentSchedulingEnabled ? date : null,
        time:         appointmentSchedulingEnabled ? time : null,
        type:         plan.name,
        status:       "scheduled",
        notes:        null,
        client_id:    resolvedClientId,
        ...(hasTemplate && {
          assessment_template_id: template!.id,
          assessment_status:      "awaiting_assessment",
        }),
      });

      if (!appt) {
        setError("Payment succeeded but booking could not be saved. Please contact support.");
        setStatus("idle");
        return;
      }

      // ── 6. Record payment in DB ───────────────────────────────────────────
      await recordPayment({
        stripe_payment_intent_id: paymentIntentId,
        amount:                   amountCents,
        currency:                 "usd",
        status:                   "succeeded",
        client_name:              clientName,
        client_email:             clientEmail || null,
        service_name:             plan.name,
        appointment_id:           appt.id,
      });

      // ── 7. Send confirmation + admin notification emails ──────────────────
      try {
        const emailResp = await fetch("/api/send-booking-emails", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            appointmentId: appt.id,
            clientName,
            clientEmail,
            phone:        phone.trim() || null,
            service:      plan.name,
            date:         appointmentSchedulingEnabled ? date : null,
            time:         appointmentSchedulingEnabled ? time : null,
            notes:        null,
            lang,
            adminTz:      adminTz ?? null,
            visitorTz:    getLocalTimezone(),
            visitorTime:  appointmentSchedulingEnabled && adminTz
              ? slotToLocalDisplay(date, time, adminTz)
              : time,
          }),
        });
        if (!emailResp.ok) {
          const body = await emailResp.json().catch(() => ({}));
          console.error("[CheckoutModal] email API error:", body);
        }
      } catch (emailErr) {
        // Email failure must not abort the booking — payment and appointment
        // are already saved. Log and continue to success state.
        console.error("[CheckoutModal] email network error:", emailErr);
      }

      // ── 8. Redirect to assessment or show success ─────────────────────────
      if (hasTemplate) {
        // Attempt to pre-create the response row; navigate unconditionally even
        // if the insert fails — AssessmentResponsePage creates it as a fallback.
        const responseRow = await createResponse(template!.id, appt.id, user?.id ?? null, resolvedClientId);
        const targetUrl = `/assessment/respond/${appt.id}`;
        console.log("[ASSESSMENT-DEBUG] navigate() called", {
          targetUrl,
          appointmentId:  appt.id,
          templateId:     template!.id,
          responseCreated: !!responseRow,
          userId:         user?.id ?? null,
          clientId:       resolvedClientId,
        });
        onClose();
        navigate(targetUrl);
        return;
      }

      console.log("[ASSESSMENT-DEBUG] no assessment — showing success screen", {
        hasTemplate,
        assessmentEnabled: plan.assessmentEnabled,
        templateId: template?.id ?? null,
      });
      setStatus("success");
    } catch (err) {
      console.error("[CheckoutModal] payment/booking error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }, [
    status, stripe, elements, plan, name, email, phone, date, time, user,
    navigate, onClose, cardComplete, lang, isBookingOpen, bookingAvailability,
    appointmentSchedulingEnabled, adminTz,
  ]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4 py-8 sm:p-6 bg-black/60 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-full my-auto rounded-[2rem] bg-white border border-gray-200 shadow-2xl shadow-black/40 overflow-y-auto overscroll-contain"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-deep-purple to-soft-purple px-8 py-7 text-center">
          <button onClick={onClose} aria-label={t.close}
            className="absolute top-4 end-4 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/15 flex items-center justify-center mb-3">
            <Lock className="text-white" size={22} />
          </div>
          <h3 className="font-heading text-xl font-bold text-white mb-1">{t.title}</h3>
          <p className="text-sm text-white/85">{t.subtitle}</p>
        </div>

        <div className="px-8 py-7">
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div key="success"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-6"
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={48} />
                <h4 className="font-heading text-lg font-bold text-gray-900 mb-2">
                  {appointmentSchedulingEnabled
                    ? (lang === "ar" ? "تم تأكيد حجزك!" : "Booking Confirmed!")
                    : t.success}
                </h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {appointmentSchedulingEnabled
                    ? (lang === "ar"
                        ? "تم تأكيد موعدك وإرسال تفاصيل الحجز إلى بريدك الإلكتروني."
                        : "Your appointment is confirmed. The booking details have been sent to your email.")
                    : t.successNote}
                </p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white text-sm font-semibold shadow-md">
                  {t.close}
                </button>
              </motion.div>

            ) : !schedulingSettingLoaded ? (
              <motion.div key="loading-settings"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex min-h-40 items-center justify-center"
              >
                <span className="w-8 h-8 rounded-full border-2 border-primary-pink/25 border-t-primary-pink animate-spin" />
              </motion.div>

            ) : !isBookingOpen ? (
              <motion.div key="unavailable"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-6"
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-pink/10 flex items-center justify-center mb-4">
                  <Lock className="text-primary-pink" size={22} />
                </div>
                <h4 className="font-heading text-lg font-bold text-gray-900 mb-2">
                  {availabilityMessage(bookingAvailability, lang)?.title}
                </h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {availabilityMessage(bookingAvailability, lang)?.body}
                </p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white text-sm font-semibold shadow-md">
                  {t.close}
                </button>
              </motion.div>

            ) : (
              <motion.form key="payment"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
                onSubmit={handleSubmit} className="space-y-4"
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                {/* Product summary */}
                <div className="mb-2 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">{lang === "ar" ? "الخدمة" : "Service"}</p>
                    <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                  </div>
                  <p className="font-heading font-extrabold text-primary-pink text-lg">{plan.price}</p>
                </div>

                {appointmentSchedulingEnabled && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-1">
                      {lang === "ar" ? "اختاري موعدك" : "Choose an appointment time"}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      {lang === "ar"
                        ? "اختاري تاريخًا ووقتًا متاحين قبل إتمام الدفع."
                        : "Select an available date and time before completing payment."}
                    </p>
                    <PickTime
                      timeSlots={appointmentTimeSlots}
                      selectedDate={date}
                      selectedTime={time}
                      onDateChange={(selectedDate) => { setDate(selectedDate); setTime(""); }}
                      onTimeChange={setTime}
                      disabledDays={disabledDays}
                      adminTz={adminTz}
                      lang={lang}
                      minimumDate={bookingAvailabilitySettings?.startDate}
                      maximumDate={bookingAvailabilitySettings?.endDate}
                      strings={{
                        calendarLabel: bookingCopy.calendarLabel,
                        selectTimeLabel: bookingCopy.selectTimeLabel,
                        unavailableLabel: bookingCopy.unavailableLabel,
                        noSlotsMessage: bookingCopy.noSlotsMessage,
                      }}
                    />
                  </div>
                )}

                {/* Email address — required, pre-filled from auth */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.emailLabel}
                    <span className="text-primary-pink ms-0.5">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      email && !emailValid
                        ? "border-red-400 focus:ring-red-400/40 focus:border-red-400"
                        : "border-gray-300 focus:ring-primary-pink/40 focus:border-primary-pink/60"
                    }`}
                  />
                  {email && !emailValid ? (
                    <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle size={10} className="shrink-0" />
                      {lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address."}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-gray-400">{t.emailHint}</p>
                  )}
                </div>

                {/* Cardholder name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.nameOnCard}
                  </label>
                  <input
                    required type="text" value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/60 transition-all"
                  />
                </div>

                {/* Phone number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(e164) => setPhone(e164)}
                    lang={lang as "en" | "ar"}
                    placeholder="e.g. +1 555 000 0000"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    {lang === "ar"
                      ? "قد نستخدم هذا الرقم للتواصل معك بشأن تنسيق موعدك."
                      : "We may use this number to contact you about scheduling."}
                  </p>
                </div>

                {/* Stripe Card Element */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Card Details
                  </label>
                  <div className={`w-full rounded-xl border bg-white px-4 py-3.5 focus-within:ring-2 transition-all ${
                    cardError
                      ? "border-red-400 focus-within:ring-red-400/40 focus-within:border-red-400"
                      : "border-gray-300 focus-within:ring-primary-pink/40 focus-within:border-primary-pink/60"
                  }`}>
                    <CardElement
                      options={CARD_ELEMENT_OPTIONS}
                      onChange={(e) => {
                        setCardComplete(e.complete);
                        setCardError(e.error?.message ?? null);
                      }}
                    />
                  </div>
                  {/* Inline Stripe card-field error */}
                  {cardError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} className="shrink-0" />
                      {cardError}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={status === "processing" || !stripe || !cardComplete || !emailValid}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "processing" ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {t.payButton}
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-xs text-red-500 text-center -mt-1 flex items-center justify-center gap-1">
                    <AlertCircle size={11} className="shrink-0" />
                    {error}
                  </p>
                )}

                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pt-1">
                  <ShieldCheck size={14} />
                  {t.securedBy} Stripe
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

// ─── Public export — wrapped in <Elements> ────────────────────────────────────
export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutModalInner plan={plan} onClose={onClose} />
    </Elements>
  );
}
