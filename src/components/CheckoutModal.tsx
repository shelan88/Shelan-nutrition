import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ShieldCheck, X, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { checkoutModal } from "@/content/content";
import { supabase } from "@/lib/supabase";
import { createAppointment } from "@/admin/repositories/appointments.repository";
import { getTemplateForService } from "@/admin/repositories/assessment-templates.repository";
import { createResponse } from "@/admin/repositories/assessment-responses.repository";
import { recordPayment } from "@/admin/repositories/payments.repository";
import { stripePromise, parsePriceCents } from "@/lib/stripe";
import PhoneInput from "@/components/PhoneInput";
import { useAdminTimezone, slotToLocalDisplay, getLocalTimezone, getTzAbbr } from "@/lib/timezone";
import { useBookingAvailability, availabilityMessage } from "@/lib/bookingAvailability";

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

// ─── Static time slots ────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { time: "9:00 AM",  available: true  },
  { time: "9:30 AM",  available: false },
  { time: "10:00 AM", available: true  },
  { time: "10:30 AM", available: true  },
  { time: "11:00 AM", available: false },
  { time: "11:30 AM", available: true  },
  { time: "1:00 PM",  available: true  },
  { time: "1:30 PM",  available: true  },
  { time: "2:00 PM",  available: true  },
  { time: "3:00 PM",  available: true  },
  { time: "4:00 PM",  available: true  },
  { time: "4:30 PM",  available: true  },
];

// ─── Step 0: Date + Time picker ───────────────────────────────────────────────
function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  adminTz,
}: {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  adminTz?: string | null;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const monthName   = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long", year: "numeric",
  });

  const isPast    = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };
  const isSunday  = (day: number) => new Date(viewYear, viewMonth, day).getDay() === 0;
  const dateStr   = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="space-y-5">
      {/* Calendar */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Select Date</p>
        <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ChevronLeft size={14} className="text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800">{monthName}</span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <ChevronRight size={14} className="text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <span key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ds       = dateStr(day);
              const disabled = isPast(day) || isSunday(day);
              const sel      = selectedDate === ds;
              return (
                <button key={day} type="button" disabled={disabled}
                  onClick={() => { onDateChange(ds); onTimeChange(""); }}
                  className={`aspect-square rounded-full text-[11px] font-medium transition-all flex items-center justify-center ${
                    sel       ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-sm scale-110"
                    : disabled ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-700 hover:bg-pink-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
          {selectedDate ? "Available Times" : "Select a date to see times"}
        </p>
        {adminTz && selectedDate && (
          <p className="text-[10px] text-gray-400 mb-2">
            Times shown in your local timezone ({getTzAbbr(getLocalTimezone())})
          </p>
        )}
        {selectedDate && (
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_SLOTS.map((slot) => {
              const sel         = selectedTime === slot.time;
              const displayTime = (adminTz && selectedDate)
                ? slotToLocalDisplay(selectedDate, slot.time, adminTz)
                : slot.time;
              return (
                <button key={slot.time} type="button" disabled={!slot.available}
                  onClick={() => onTimeChange(slot.time)}
                  className={`py-2 rounded-xl text-[11px] font-semibold transition-all text-center ${
                    sel ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-sm"
                    : !slot.available ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {displayTime}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const { availability } = useBookingAvailability();
  const isBookingOpen = availability.state === "open";

  const [step,          setStep]          = useState<0 | 1>(0);
  const [date,          setDate]          = useState("");
  const [time,          setTime]          = useState("");
  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState(user?.email ?? "");
  const [phone,         setPhone]         = useState("");
  const [status,        setStatus]        = useState<"idle" | "processing" | "success">("idle");
  const [error,         setError]         = useState<string | null>(null);
  // Card element completeness — tracked via CardElement onChange
  const [cardComplete,  setCardComplete]  = useState(false);
  const [cardError,     setCardError]     = useState<string | null>(null);

  const canProceed  = !!date && !!time;
  const emailValid  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle" || !stripe || !elements) return;

    // Safety guard — bookings scheduled/closed (server also enforces this).
    if (!isBookingOpen) {
      setError(
        availabilityMessage(availability, lang)?.body ??
          "Bookings are currently unavailable.",
      );
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
          metadata: { plan: plan.name, date, time },
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
        user_id:      user?.id    ?? null,
        date,
        time,
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
            date,
            time,
            notes:        null,
            lang,
            adminTz:      adminTz ?? null,
            visitorTz:    getLocalTimezone(),
            visitorTime:  adminTz ? slotToLocalDisplay(date, time, adminTz) : time,
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
  }, [status, stripe, elements, plan, date, time, name, email, phone, user, navigate, onClose, cardComplete, lang, adminTz, isBookingOpen, availability]);

  const stepLabel = step === 0
    ? "Step 1 of 2 — Pick a Date & Time"
    : "Step 2 of 2 — Payment Details";

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
              >
                <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={48} />
                <h4 className="font-heading text-lg font-bold text-gray-900 mb-2">{t.success}</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{t.successNote}</p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white text-sm font-semibold shadow-md">
                  {t.close}
                </button>
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
                  {availabilityMessage(availability, lang)?.title}
                </h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {availabilityMessage(availability, lang)?.body}
                </p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white text-sm font-semibold shadow-md">
                  {t.close}
                </button>
              </motion.div>

            ) : step === 0 ? (
              <motion.div key="datetime"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
              >
                {/* Plan summary */}
                <div className="mb-5 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                  </div>
                  <p className="font-heading font-extrabold text-primary-pink text-lg">{plan.price}</p>
                </div>

                <p className="text-[11px] text-gray-400 mb-4">{stepLabel}</p>

                <DateTimePicker
                  selectedDate={date} selectedTime={time}
                  onDateChange={setDate} onTimeChange={setTime}
                  adminTz={adminTz}
                />

                <button type="button" disabled={!canProceed} onClick={() => setStep(1)}
                  className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold shadow-lg shadow-deep-purple/25 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2">
                  Continue to Payment
                  <ChevronRight size={16} />
                </button>
              </motion.div>

            ) : (
              <motion.form key="payment"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
                onSubmit={handleSubmit} className="space-y-4"
              >
                {/* Back + step label */}
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setStep(0)}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronLeft size={14} className="text-gray-500" />
                  </button>
                  <p className="text-[11px] text-gray-400">{stepLabel}</p>
                </div>

                {/* Booking summary */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-xs text-gray-600 flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-800">{plan.name}</span>
                  <span>
                    {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}{time}
                  </span>
                </div>

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
                  <p className="mt-1 text-[10px] text-gray-400">Used to send a session confirmation via WhatsApp.</p>
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
