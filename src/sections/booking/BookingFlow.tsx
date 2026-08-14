/**
 * BookingFlow — Multi-step booking UI.
 * Step 1: Service selection. Step 2: Calendar + time. Step 3: Personal info. Step 4: Summary + payment.
 * Confirms by creating a row in the Supabase appointments table, then sending
 * confirmation emails via /api/send-booking-emails.
 * Props-only for data and strings. CMS-ready.
 */
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { debugLog } from "@/shared/debug/logger";
import { trackEvent } from "@/lib/analytics";
import { createAppointment } from "@/admin/repositories/appointments.repository";
import { getTemplateForService } from "@/admin/repositories/assessment-templates.repository";
import { createResponse } from "@/admin/repositories/assessment-responses.repository";
import { getProgramById } from "@/admin/repositories/programs.repository";
import { recordPayment } from "@/admin/repositories/payments.repository";
import type { ProgramRow } from "@/types/database.types";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Calendar, Star, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, Lock, Tag, Clock, AlertCircle,
} from "lucide-react";
import type { CMSBookingData, CMSBookingService } from "@/types/cms.types";
import { resolveAvailability, getDisabledDays, getEnabledTimeSlots } from "@/lib/availability";
import type { AvailabilitySettings } from "@/lib/availability";
import { useAdminTimezone, slotToLocalDisplay, getLocalTimezone, getTzAbbr, todayInTz } from "@/lib/timezone";
import { getSetting } from "@/admin/repositories/settings.repository";
import PhoneInput from "@/components/PhoneInput";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise, parsePriceCents } from "@/lib/stripe";

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

// ─── Icon resolver ────────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, React.ElementType> = { Calendar, Star, RefreshCw };

// ─── Validation ───────────────────────────────────────────────────────────────
type PersonalInfo = {
  firstName: string; lastName: string;
  email: string; phone: string; notes: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE  = /^\+[1-9]\d{6,14}$/;

function validatePersonalInfo(
  info: PersonalInfo,
  lang: string,
): Partial<Record<keyof PersonalInfo, string>> {
  const isAr = lang === "ar";
  const errors: Partial<Record<keyof PersonalInfo, string>> = {};

  if (!info.firstName.trim())
    errors.firstName = isAr ? "الاسم الأول مطلوب." : "First name is required.";

  if (!info.lastName.trim())
    errors.lastName = isAr ? "الاسم الأخير مطلوب." : "Last name is required.";

  if (!info.email.trim())
    errors.email = isAr ? "البريد الإلكتروني مطلوب." : "Email address is required.";
  else if (!EMAIL_RE.test(info.email.trim()))
    errors.email = isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.";

  if (!info.phone.trim())
    errors.phone = isAr ? "رقم الهاتف مطلوب." : "Phone number is required.";
  else if (!E164_RE.test(info.phone.trim()))
    errors.phone = isAr ? "يرجى إدخال رقم هاتف صحيح بصيغة دولية." : "Please enter a valid phone number.";

  return errors;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  done
                    ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/20"
                    : active
                    ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-lg shadow-deep-purple/25 scale-110"
                    : "bg-white border-2 border-soft-purple/20 text-deep-purple/35"
                }`}
              >
                {done ? <Check size={16} strokeWidth={2.5} /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${active ? "text-primary-pink" : "text-deep-purple/40"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-px mx-2 mb-5 transition-colors duration-300 ${done ? "bg-primary-pink" : "bg-soft-purple/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Service selection ────────────────────────────────────────────────
function SelectService({
  services,
  selected,
  onSelect,
}: {
  services: CMSBookingService[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {services.map((svc) => {
        const Icon   = SERVICE_ICONS[svc.iconName] ?? Calendar;
        const active = selected === svc.id;
        return (
          <button
            key={svc.id}
            type="button"
            onClick={() => onSelect(svc.id)}
            className={`w-full text-start p-5 rounded-2xl border-2 transition-all duration-200 flex gap-5 items-start group ${
              active
                ? "border-primary-pink bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 shadow-md shadow-deep-purple/12"
                : "border-soft-purple/15 bg-white hover:border-primary-pink/30 hover:bg-light-pink/15"
            }`}
          >
            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${active ? "bg-gradient-to-br from-primary-pink to-lavender-purple shadow-md shadow-deep-purple/20" : "bg-light-pink/40 group-hover:bg-light-pink/70"}`}>
              <Icon size={20} className={active ? "text-white" : "text-deep-purple/50"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className={`font-heading font-bold ${active ? "text-primary-pink" : "text-heading"}`}>
                  {svc.name}
                </h3>
                <div className="text-end shrink-0">
                  <span className={`font-heading font-extrabold text-lg ${active ? "text-primary-pink" : "text-heading"}`}>
                    {svc.price}
                  </span>
                  <p className="text-xs text-deep-purple/45">{svc.priceNote}</p>
                </div>
              </div>
              <p className="text-xs text-deep-purple/50 mb-1">{svc.duration}</p>
              <p className="text-body text-sm leading-relaxed opacity-75">{svc.description}</p>
            </div>
            <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 transition-all ${active ? "border-primary-pink bg-primary-pink" : "border-soft-purple/30"}`}>
              {active && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2: Calendar + time ──────────────────────────────────────────────────
function PickTime({
  timeSlots,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  strings,
  disabledDays,
  adminTz,
  lang,
}: {
  timeSlots: CMSBookingData["timeSlots"];
  selectedDate: string;
  selectedTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  strings: { calendarLabel: string; selectTimeLabel: string; unavailableLabel: string; noSlotsMessage: string };
  disabledDays?: Set<number>;
  adminTz?: string | null;
  lang?: string;
}) {
  const today = new Date();
  const [viewYear,    setViewYear]    = useState(today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(today.getMonth());
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDate) { setBookedTimes([]); return; }
    supabase
      .from("appointments")
      .select("time")
      .eq("date", selectedDate)
      .neq("status", "cancelled")
      .then(({ data }) => {
        setBookedTimes((data ?? []).map((row: { time: string | null }) => row.time ?? ""));
      });
  }, [selectedDate]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const monthName   = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const isPast        = (day: number) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isDisabledDay = (day: number) => {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return disabledDays ? disabledDays.has(dow) : dow === 0; // default: only Sunday
  };
  const dateStr = (day: number) =>
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
    <div className="grid md:grid-cols-[1fr_auto] gap-8">
      {/* Calendar */}
      <div>
        <p className="text-sm font-semibold text-heading mb-4">{strings.calendarLabel}</p>
        <div className="bg-white rounded-2xl border border-soft-purple/12 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-light-pink/40 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className="text-deep-purple rtl:rotate-180" />
            </button>
            <span className="font-heading font-bold text-heading text-sm">{monthName}</span>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-light-pink/40 flex items-center justify-center transition-colors">
              <ChevronRight size={16} className="text-deep-purple rtl:rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-center text-xs font-bold text-deep-purple/35 py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ds       = dateStr(day);
              const disabled = isPast(day) || isDisabledDay(day);
              const sel      = selectedDate === ds;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => onDateChange(ds)}
                  className={`aspect-square rounded-full text-xs font-medium transition-all flex items-center justify-center ${
                    sel
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/20 scale-110"
                      : disabled
                      ? "text-deep-purple/20 cursor-not-allowed"
                      : "text-heading hover:bg-light-pink/60"
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
      <div className="min-w-[180px]">
        <p className="text-sm font-semibold text-heading mb-4">{strings.selectTimeLabel}</p>
        {!selectedDate ? (
          <p className="text-xs text-deep-purple/40 italic">{strings.noSlotsMessage}</p>
        ) : (
          <>
            {/* Timezone note — shown when admin TZ is set and date is selected */}
            {adminTz && (
              <p className="text-[10px] text-deep-purple/45 mb-3 leading-relaxed">
                {lang === "ar"
                  ? `الأوقات معروضة بتوقيتك المحلي (${getTzAbbr(getLocalTimezone())})`
                  : `Times shown in your local timezone (${getTzAbbr(getLocalTimezone())})`}
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {timeSlots.map((slot) => {
                const alreadyBooked  = bookedTimes.includes(slot.time);
                const effectiveSlot  = { ...slot, available: slot.available && !alreadyBooked };
                const sel            = selectedTime === effectiveSlot.time;
                // Display in visitor's local timezone; stored value stays in admin TZ
                const displayTime    = adminTz
                  ? slotToLocalDisplay(selectedDate, effectiveSlot.time, adminTz)
                  : effectiveSlot.time;
                return (
                  <button
                    key={effectiveSlot.time}
                    type="button"
                    disabled={!effectiveSlot.available}
                    onClick={() => onTimeChange(effectiveSlot.time)}
                    title={alreadyBooked ? "Already booked" : undefined}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                      sel
                        ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/18"
                        : !effectiveSlot.available
                        ? "bg-light-pink/20 text-deep-purple/25 cursor-not-allowed line-through"
                        : "bg-white border border-soft-purple/15 text-heading hover:border-primary-pink/30 hover:bg-light-pink/20"
                    }`}
                  >
                    {displayTime}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Personal info ────────────────────────────────────────────────────
function PersonalInfoForm({
  info,
  onChange,
  strings,
  lang,
  forceShowErrors,
}: {
  info: PersonalInfo;
  onChange: (info: PersonalInfo) => void;
  strings: Record<string, string>;
  lang: string;
  forceShowErrors: boolean;
}) {
  const [touched, setTouched] = useState<Partial<Record<keyof PersonalInfo, boolean>>>({});

  const markTouched = (k: keyof PersonalInfo) => () =>
    setTouched((t) => ({ ...t, [k]: true }));

  const set = (k: keyof PersonalInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...info, [k]: e.target.value });

  const errors  = validatePersonalInfo(info, lang);
  const visible = (k: keyof PersonalInfo) => (touched[k] || forceShowErrors) && !!errors[k];

  const inputCls = (k: keyof PersonalInfo) =>
    `w-full px-4 py-3 rounded-xl border transition-all text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:ring-2 bg-white ${
      visible(k)
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/15"
        : "border-soft-purple/20 focus:border-primary-pink/50 focus:ring-primary-pink/15"
    }`;

  const labelCls = "block text-sm font-semibold text-heading mb-1.5";

  const FieldError = ({ k }: { k: keyof PersonalInfo }) =>
    visible(k) ? (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle size={11} className="shrink-0" />
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{strings.firstNameLabel}</label>
          <input
            type="text"
            value={info.firstName}
            onChange={set("firstName")}
            onBlur={markTouched("firstName")}
            placeholder={strings.firstNamePlaceholder}
            className={inputCls("firstName")}
          />
          <FieldError k="firstName" />
        </div>
        <div>
          <label className={labelCls}>{strings.lastNameLabel}</label>
          <input
            type="text"
            value={info.lastName}
            onChange={set("lastName")}
            onBlur={markTouched("lastName")}
            placeholder={strings.lastNamePlaceholder}
            className={inputCls("lastName")}
          />
          <FieldError k="lastName" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{strings.emailLabel}</label>
          <input
            type="email"
            value={info.email}
            onChange={set("email")}
            onBlur={markTouched("email")}
            placeholder={strings.emailPlaceholder}
            className={inputCls("email")}
          />
          <FieldError k="email" />
        </div>
        <div>
          <label className={labelCls}>{strings.phoneLabel}</label>
          <PhoneInput
            value={info.phone}
            onChange={(e164) => onChange({ ...info, phone: e164 })}
            onBlur={markTouched("phone")}
            lang={lang as "en" | "ar"}
            error={visible("phone")}
            placeholder={strings.phonePlaceholder}
          />
          <FieldError k="phone" />
        </div>
      </div>

      <div>
        <label className={labelCls}>{strings.notesLabel}</label>
        <textarea
          value={info.notes}
          onChange={set("notes")}
          placeholder={strings.notesPlaceholder}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all resize-none`}
        />
      </div>
    </div>
  );
}

// ─── Step 4: Summary + payment ────────────────────────────────────────────────
function BookingSummary({
  service,
  date,
  time,
  strings,
  paymentNote,
  onConfirm,
  confirmed,
  confirming,
  lang,
  error,
  cardComplete,
  cardError,
  onCardChange,
  adminTz,
}: {
  service: CMSBookingService | undefined;
  date: string;
  time: string;
  strings: Record<string, string>;
  paymentNote: string;
  onConfirm: () => void;
  confirmed: boolean;
  confirming: boolean;
  lang: string;
  error?: string | null;
  cardComplete: boolean;
  cardError: string | null;
  onCardChange: (complete: boolean, error: string | null) => void;
  adminTz?: string | null;
}) {
  const locale        = lang === "ar" ? "ar-SA" : "en-US";
  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "—";
  // Display the selected time in the visitor's local timezone with TZ abbreviation
  const visitorTzAbbr = getTzAbbr(getLocalTimezone());
  const displayTime   = adminTz && date && time
    ? `${slotToLocalDisplay(date, time, adminTz)} (${visitorTzAbbr})`
    : time;

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center gap-5 py-10"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-xl shadow-deep-purple/25">
          <CheckCircle2 size={38} className="text-white" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-heading">
          {strings.successTitle ?? (lang === "ar" ? "تم تأكيد الحجز!" : "Booking Confirmed!")}
        </h3>
        <p className="text-body opacity-75 max-w-sm">
          {strings.successMessage ?? (lang === "ar"
            ? "تم إرسال بريد تأكيد إليكِ. نتطلع إلى لقائكِ!"
            : "A confirmation email has been sent to you. We look forward to seeing you!")}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-light-pink/30 to-white rounded-2xl border border-soft-purple/12 p-6">
        <h3 className="font-heading font-bold text-heading mb-5">{strings.summaryTitle}</h3>
        <ul className="space-y-4">
          {[
            { label: strings.serviceLabel, value: service?.name ?? "—" },
            { label: strings.dateLabel,    value: formattedDate },
            { label: strings.timeLabel,    value: displayTime || "—" },
            { label: strings.totalLabel,   value: service?.price ?? "—" },
          ].map(({ label, value }) => (
            <li key={label} className="flex items-center justify-between border-b border-soft-purple/10 pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-deep-purple/50">{label}</span>
              <span className="font-semibold text-heading text-sm">{value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment — Stripe Card Element */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-heading">{strings.paymentTitle}</h3>

        {/* Stripe Card Element */}
        <div>
          <label className="block text-sm font-semibold text-heading mb-1.5">
            {strings.cardLabel}
          </label>
          <div className={`w-full px-4 py-3.5 rounded-xl border bg-white focus-within:ring-2 transition-all ${
            cardError
              ? "border-red-400 focus-within:border-red-400 focus-within:ring-red-400/15"
              : "border-soft-purple/20 focus-within:border-primary-pink/50 focus-within:ring-primary-pink/15"
          }`}>
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => onCardChange(e.complete, e.error?.message ?? null)}
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

        {/* General booking / payment error */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <motion.button
          onClick={onConfirm}
          disabled={confirming || !cardComplete}
          whileHover={cardComplete && !confirming ? { scale: 1.02, y: -1 } : {}}
          whileTap={cardComplete && !confirming ? { scale: 0.98 } : {}}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl hover:shadow-deep-purple/30 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming
            ? (strings.confirmingLabel ?? (lang === "ar" ? "جارٍ التأكيد…" : "Confirming…"))
            : strings.confirmLabel}
        </motion.button>
        <div className="flex items-center justify-center gap-2 text-xs text-deep-purple/40">
          <Lock size={12} /> {paymentNote}
        </div>
      </div>
    </div>
  );
}

// ─── Program banner ───────────────────────────────────────────────────────────
function ProgramBanner({ program, lang }: { program: ProgramRow; lang?: string }) {
  const name       = (lang === "ar" ? program.name_ar : program.name_en) ?? program.name_en;
  const currency   = program.currency ?? "$";
  const hasDiscount =
    !!(program.discount_enabled &&
      program.discount_percent != null &&
      program.discount_percent > 0 &&
      program.price != null);
  const discountedPrice = hasDiscount
    ? Math.round(program.price! * (1 - program.discount_percent! / 100) * 100) / 100
    : null;

  return (
    <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-primary-pink/10 to-lavender-purple/10 border border-primary-pink/20 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary-pink uppercase tracking-wide mb-0.5">
          {lang === "ar" ? "البرنامج المختار" : "Selected Program"}
        </p>
        <p className="font-heading font-bold text-heading truncate">{name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {program.duration_weeks != null && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-soft-purple/20 text-deep-purple/60" dir="ltr">
            <Clock size={11} strokeWidth={2} />
            {program.duration_weeks}{lang === "ar" ? " أسابيع" : "w"}
          </span>
        )}
        {program.price != null && (
          <span className="flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-primary-pink text-white" dir="ltr">
            <Tag size={12} strokeWidth={2} />
            {hasDiscount ? <>{currency}{discountedPrice}</> : <>{currency}{program.price}</>}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props {
  data: CMSBookingData;
  strings: Record<string, string | string[]>;
  preselectedServiceId?: string;
  preselectedProgramId?: string;
  canonicalServices?: CMSBookingService[];
  /** Per-service availability keyed by service/consultation DB id. */
  serviceAvailabilityMap?: Record<string, AvailabilitySettings | null>;
  serviceAssessmentMap?: Record<string, boolean>;
}

// ─── Booking-open date helper ─────────────────────────────────────────────────
function formatBookingOpenDate(dateStr: string, lang: string): string {
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(
      lang === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );
  } catch {
    return dateStr;
  }
}

function BookingFlowInner({ data, strings, preselectedServiceId, preselectedProgramId, canonicalServices, serviceAvailabilityMap, serviceAssessmentMap }: Props) {
  const { adminTz, tzLoading } = useAdminTimezone();
  const stripe   = useStripe();
  const elements = useElements();

  const steps       = (strings.steps as string[]) ?? [];
  const programMode = !!preselectedProgramId;

  const [program,        setProgram]        = useState<ProgramRow | null>(null);
  const [programLoading, setProgramLoading] = useState(programMode);

  useEffect(() => {
    if (!preselectedProgramId) return;
    setProgramLoading(true);
    getProgramById(preselectedProgramId).then((row) => {
      setProgram(row);
      setProgramLoading(false);
    });
  }, [preselectedProgramId]);

  const [step,            setStep]            = useState(programMode ? 1 : 0);
  const [serviceId,       setServiceId]       = useState(preselectedServiceId ?? "");
  const [date,            setDate]            = useState("");
  const [time,            setTime]            = useState("");
  const [personalInfo,    setPersonalInfo]    = useState<PersonalInfo>({
    firstName: "", lastName: "", email: "", phone: "", notes: "",
  });
  const [confirmed,       setConfirmed]       = useState(false);
  const [confirming,      setConfirming]      = useState(false);
  const [bookingError,    setBookingError]    = useState<string | null>(null);
  const [forceShowErrors, setForceShowErrors] = useState(false);
  // Card element completeness — tracked via CardElement onChange in BookingSummary
  const [cardComplete,    setCardComplete]    = useState(false);
  const [cardFieldError,  setCardFieldError]  = useState<string | null>(null);

  // ── Booking start date gate ────────────────────────────────────────────────
  const [bookingStartDate,    setBookingStartDate]    = useState<string | null>(null);
  const [bookingDateLoading,  setBookingDateLoading]  = useState(true);

  useEffect(() => {
    getSetting("booking_start_date")
      .then((val) => setBookingStartDate(typeof val === "string" && val ? val : null))
      .catch(() => setBookingStartDate(null))
      .finally(() => setBookingDateLoading(false));
  }, []);

  // Open when: date not configured, still loading, or today >= start date.
  // Safety: treat any loading or missing config as "open" to preserve existing behavior.
  const isBookingOpen = useMemo(() => {
    if (bookingDateLoading || tzLoading) return true;
    if (!bookingStartDate) return true;
    return todayInTz(adminTz ?? "UTC") >= bookingStartDate;
  }, [bookingDateLoading, tzLoading, bookingStartDate, adminTz]);

  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate  = useNavigate();

  // ── Derived service objects ────────────────────────────────────────────────
  const programAsService: CMSBookingService | undefined = useMemo(() => {
    if (!program) return undefined;
    const currency    = program.currency ?? "$";
    const hasDiscount =
      !!(program.discount_enabled &&
        program.discount_percent != null &&
        program.discount_percent > 0 &&
        program.price != null);
    const price = hasDiscount
      ? Math.round(program.price! * (1 - program.discount_percent! / 100) * 100) / 100
      : program.price;
    const name  = (lang === "ar" ? program.name_ar : program.name_en) ?? program.name_en ?? "";
    return {
      id:          program.id,
      name,
      duration:    program.duration_weeks != null
        ? `${program.duration_weeks}${lang === "ar" ? " أسابيع" : " weeks"}`
        : "",
      price:       price != null ? `${currency}${price}` : "—",
      priceNote:   "",
      description: (lang === "ar" ? program.short_description_ar : program.short_description_en) ??
        program.short_description_en ?? "",
      iconName:    "Calendar",
    };
  }, [program, lang]);

  const selectedService = useMemo(() => {
    if (programMode) return programAsService;
    return data.services.find((s) => s.id === serviceId);
  }, [programMode, programAsService, data.services, serviceId]);

  // ── Availability ────────────────────────────────────────────────────────────
  const currentAvailability = useMemo(() => {
    if (programMode && program) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return resolveAvailability((program as any).availability ?? null);
    }
    if (serviceId && serviceAvailabilityMap && serviceId in serviceAvailabilityMap) {
      return resolveAvailability(serviceAvailabilityMap[serviceId]);
    }
    return null; // no availability data → fall back to static
  }, [programMode, program, serviceId, serviceAvailabilityMap]);

  const effectiveTimeSlots = useMemo(
    () => (currentAvailability ? getEnabledTimeSlots(currentAvailability) : data.timeSlots),
    [currentAvailability, data.timeSlots],
  );

  const disabledDays = useMemo(
    () => (currentAvailability ? getDisabledDays(currentAvailability) : undefined),
    [currentAvailability],
  );

  // ── Validation ─────────────────────────────────────────────────────────────
  const personalInfoErrors = useMemo(
    () => validatePersonalInfo(personalInfo, lang),
    [personalInfo, lang],
  );
  const personalInfoValid = Object.keys(personalInfoErrors).length === 0;

  const canNext = [
    programMode ? true : !!serviceId,   // step 0
    !!date && !!time,                    // step 1
    personalInfoValid,                   // step 2
    true,                                // step 3 (confirm button has its own handler)
  ];

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (!isBookingOpen) return; // booking not yet open
    if (step === 2) {
      // If invalid: reveal all errors but don't advance
      if (!personalInfoValid) {
        setForceShowErrors(true);
        return;
      }
      setForceShowErrors(false);
    }
    if (step < steps.length - 1 && canNext[step]) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setForceShowErrors(false);
    setStep((s) => Math.max(programMode ? 1 : 0, s - 1));
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!isBookingOpen) return; // safety guard — booking not yet open
    setConfirming(true);
    setBookingError(null);

    const isAr       = lang === "ar";
    const t0         = performance.now();
    const fieldCount = Object.values(personalInfo).filter((v) => String(v).trim()).length + (date ? 1 : 0) + (time ? 1 : 0);

    debugLog({
      level: "log", category: "forms",
      module: "Booking", component: "BookingFlow", action: "confirm",
      result: "info",
      data: { fieldCount, programMode, hasDate: !!date, hasTime: !!time },
    });

    try {
      // ── 0. Validate Stripe is ready ────────────────────────────────────────
      if (!stripe || !elements) {
        throw new Error(isAr ? "لم يتم تحميل نظام الدفع. يرجى تحديث الصفحة." : "Payment system not loaded. Please refresh.");
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error(isAr ? "لم يتم العثور على حقل البطاقة." : "Card field not found. Please refresh.");
      }

      // ── Guard: require complete card details before touching Stripe API ────
      // cardComplete is set by CardElement's onChange — if false the card is
      // empty or incomplete and confirmCardPayment would fail anyway, but we
      // stop here to avoid creating an orphaned PaymentIntent on Stripe.
      if (!cardComplete) {
        throw new Error(
          isAr
            ? "يرجى إدخال بيانات البطاقة كاملةً قبل تأكيد الحجز."
            : "Please complete your card details before confirming.",
        );
      }

      const lookupId = programMode ? (program?.id ?? "") : serviceId;
      console.log("[ASSESSMENT-DEBUG] BookingFlow confirm — lookup start", {
        programMode, serviceId, lookupId,
        serviceAssessmentMap,
      });

      // Service-specific assignment lookup
      let template = lookupId ? await getTemplateForService(lookupId) : null;
      console.log("[ASSESSMENT-DEBUG] getTemplateForService result", {
        lookupId,
        templateId:     template?.id ?? null,
        templateActive: template?.active ?? null,
      });

      // Check per-item assessment toggle
      const assessmentEnabled = programMode
        ? !!(program?.assessment_enabled)
        : !!(serviceAssessmentMap?.[serviceId]);
      console.log("[ASSESSMENT-DEBUG] assessmentEnabled", {
        assessmentEnabled,
        serviceMapEntry: serviceAssessmentMap?.[serviceId],
        programAssessment: programMode ? program?.assessment_enabled : undefined,
      });

      // No global fallback — the service-specific assignment is the source of truth.
      // If no template is assigned to this service, assessment is skipped even if
      // assessment_enabled is true on the service row.
      const hasTemplate = !!(template?.active) && assessmentEnabled;
      console.log("[ASSESSMENT-DEBUG] hasTemplate decision", {
        hasTemplate,
        templateActive:    template?.active ?? null,
        assessmentEnabled,
        blockedBy: !hasTemplate
          ? (!template ? "NO_TEMPLATE" : !template.active ? "TEMPLATE_NOT_ACTIVE" : "ASSESSMENT_DISABLED")
          : null,
      });

      // Canonical service name — always store English for admin consistency
      const serviceType = (
        programMode
          ? (program?.name_en ?? selectedService?.name)
          : (canonicalServices?.find((s) => s.id === serviceId)?.name ?? selectedService?.name)
      ) ?? "Consultation";

      // ── 1. Create PaymentIntent on server ──────────────────────────────────
      const amountCents = parsePriceCents(selectedService?.price ?? "0");
      const piResp = await fetch("/api/create-payment-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount:   amountCents,
          currency: "usd",
          metadata: { service: serviceType, date, time },
        }),
      });

      if (!piResp.ok) {
        const body = await piResp.json().catch(() => ({}));
        throw new Error(body.error ?? (isAr ? "تعذّر بدء عملية الدفع." : "Failed to initialise payment."));
      }
      const { clientSecret, paymentIntentId } = await piResp.json() as {
        clientSecret: string;
        paymentIntentId: string;
      };

      // ── 2. Confirm card payment with Stripe ────────────────────────────────
      const clientName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || personalInfo.email;
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card:            cardElement,
            billing_details: { name: clientName, email: personalInfo.email },
          },
        },
      );

      if (stripeError) {
        throw new Error(stripeError.message ?? (isAr ? "فشلت عملية الدفع." : "Payment failed."));
      }
      if (paymentIntent?.status !== "succeeded") {
        throw new Error(isAr ? "لم تكتمل عملية الدفع. يرجى المحاولة مجدداً." : "Payment was not completed. Please try again.");
      }

      // ── 2b. Resolve client_id ──────────────────────────────────────────────
      // Done here (after payment is confirmed but before appointment creation)
      // so we can link the appointment and the assessment response to the client.
      let resolvedClientId: string | null = null;
      if (user?.id) {
        const { data: clientRow } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        resolvedClientId = clientRow?.id ?? null;
      }

      // ── 3. Create appointment ──────────────────────────────────────────────
      const appt = await createAppointment({
        client_name:  clientName,
        client_email: personalInfo.email || user?.email || null,
        user_id:      user?.id ?? null,
        date,
        time,
        type:         serviceType,
        status:       "scheduled",
        notes:        personalInfo.notes || null,
        client_id:    resolvedClientId,
        ...(hasTemplate && {
          assessment_template_id: template!.id,
          assessment_status:      "awaiting_assessment",
        }),
      });

      if (!appt) {
        throw new Error("createAppointment returned null");
      }

      // ── 4. Record payment in DB ────────────────────────────────────────────
      await recordPayment({
        stripe_payment_intent_id: paymentIntentId,
        amount:                   amountCents,
        currency:                 "usd",
        status:                   "succeeded",
        client_name:              clientName,
        client_email:             personalInfo.email || user?.email || null,
        service_name:             serviceType,
        appointment_id:           appt.id,
      });

      // ── 5. Send confirmation + admin notification emails ───────────────────
      // Email failure must NOT abort the flow — payment + appointment are already
      // saved. Log and continue to the assessment redirect or success screen.
      let emailResp: Response | undefined;
      try {
        const visitorTz   = getLocalTimezone();
        const visitorTime = adminTz ? slotToLocalDisplay(date, time, adminTz) : time;
        emailResp = await fetch("/api/send-booking-emails", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            appointmentId: appt.id,
            clientName,
            clientEmail:   personalInfo.email,
            phone:         personalInfo.phone || null,
            service:       serviceType,
            date,
            time,
            notes:         personalInfo.notes || null,
            lang,
            adminTz:      adminTz ?? null,
            visitorTz,
            visitorTime,
            // When assessment is required, defer admin email until after submission
            assessmentPending: hasTemplate,
          }),
        });
      } catch (networkErr) {
        // Non-fatal — log and continue to assessment/success
        console.error("[BookingFlow] email network error:", networkErr);
      }

      if (emailResp && !emailResp.ok) {
        const body = await emailResp.json().catch(() => ({}));
        // Non-fatal — log and continue to assessment/success
        console.error("[BookingFlow] email API error:", body);
      }

      // ── All succeeded ──────────────────────────────────────────────────────
      debugLog({
        level: "log", category: "forms",
        module: "Booking", component: "BookingFlow", action: "confirm",
        result: "success", durationMs: Math.round(performance.now() - t0),
        recordId: appt.id,
        data: { fieldCount, hasTemplate, emailSent: !!(emailResp?.ok) },
      });

      trackEvent("booking_submitted", {
        service_type:   serviceType,
        has_assessment: hasTemplate,
      });

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
        navigate(targetUrl);
      } else {
        console.log("[ASSESSMENT-DEBUG] no assessment — showing success screen");
        setConfirmed(true);
      }

    } catch (err) {
      debugLog({
        level: "error", category: "forms",
        module: "Booking", component: "BookingFlow", action: "confirm",
        result: "error", durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      });
      setBookingError(
        err instanceof Error ? err.message
          : (lang === "ar" ? "حدث خطأ غير متوقع. يرجى المحاولة مجدداً." : "An unexpected error occurred. Please try again."),
      );
    } finally {
      setConfirming(false);
    }
  };

  const str = strings as Record<string, string>;

  if (programMode && programLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-64">
        <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
      </div>
    );
  }

  const isAr = lang === "ar";

  return (
    <div className="max-w-3xl mx-auto">
      {programMode && program && <ProgramBanner program={program} lang={lang} />}

      {/* ── Booking-closed banner ─────────────────────────────────────────── */}
      {!isBookingOpen && bookingStartDate && (
        <div className={`mb-6 rounded-2xl border border-primary-pink/20 bg-gradient-to-br from-light-pink/50 to-soft-purple/20 p-6 text-${isAr ? "right" : "left"}`} dir={isAr ? "rtl" : "ltr"}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-primary-pink/10 flex items-center justify-center">
              <Lock size={20} className="text-primary-pink" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-deep-purple mb-1">
                {isAr ? "الحجز غير متاح بعد" : "Booking Not Yet Open"}
              </h3>
              <p className="text-[13px] text-deep-purple/70 leading-relaxed">
                {isAr
                  ? `سيبدأ قبول الحجوزات اعتباراً من ${formatBookingOpenDate(bookingStartDate, lang)}. يمكنك الاطلاع على الخدمات المتاحة في الأثناء.`
                  : `Booking opens on ${formatBookingOpenDate(bookingStartDate, lang)}. You can browse the available services in the meantime.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <StepIndicator steps={steps} current={step} />

      <div className="bg-white rounded-3xl border border-soft-purple/12 shadow-xl shadow-deep-purple/10 p-8 lg:p-10 min-h-96">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <SelectService services={data.services} selected={serviceId} onSelect={setServiceId} />
            )}
            {step === 1 && (
              <PickTime
                timeSlots={effectiveTimeSlots}
                selectedDate={date}
                selectedTime={time}
                onDateChange={(d) => { setDate(d); setTime(""); }}
                onTimeChange={setTime}
                disabledDays={disabledDays}
                adminTz={adminTz}
                lang={lang}
                strings={{
                  calendarLabel:    str.calendarLabel,
                  selectTimeLabel:  str.selectTimeLabel,
                  unavailableLabel: str.unavailableLabel,
                  noSlotsMessage:   str.noSlotsMessage,
                }}
              />
            )}
            {step === 2 && (
              <PersonalInfoForm
                info={personalInfo}
                onChange={setPersonalInfo}
                strings={str}
                lang={lang}
                forceShowErrors={forceShowErrors}
              />
            )}
            {step === 3 && (
              <BookingSummary
                service={selectedService}
                date={date}
                time={time}
                strings={str}
                paymentNote={data.paymentNote}
                onConfirm={handleConfirm}
                confirmed={confirmed}
                confirming={confirming}
                lang={lang}
                error={bookingError}
                cardComplete={cardComplete}
                cardError={cardFieldError}
                onCardChange={(complete, err) => {
                  setCardComplete(complete);
                  setCardFieldError(err);
                }}
                adminTz={adminTz}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      {!confirmed && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === (programMode ? 1 : 0)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-soft-purple/20 text-deep-purple text-sm font-semibold hover:bg-light-pink/30 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={16} className="rtl:rotate-180" />
            {str.backLabel}
          </button>

          {step < steps.length - 1 && (
            <button
              onClick={handleNext}
              // Booking not open: always disabled.
              // Step 2: always clickable so clicking reveals validation errors.
              // All other steps: disabled until their canNext condition is met.
              disabled={!isBookingOpen || (step !== 2 && !canNext[step])}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-sm font-semibold shadow-md shadow-deep-purple/18 hover:shadow-lg hover:shadow-deep-purple/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {str.nextLabel}
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Public export — wrapped in <Elements> for Stripe hooks ──────────────────

export default function BookingFlow(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <BookingFlowInner {...props} />
    </Elements>
  );
}
