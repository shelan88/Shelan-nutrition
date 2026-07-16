/**
 * BookingFlow — Multi-step booking UI.
 * Step 1: Service selection. Step 2: Calendar + time. Step 3: Personal info. Step 4: Summary + payment.
 * Confirms by creating a row in the Supabase appointments table.
 * NOTE: The payment card on Step 4 is a UI placeholder — a payment integration (Stripe/Tap) is required
 *       before real card processing can happen.
 * Props-only for data and strings. CMS-ready.
 */
import { useState, useMemo } from "react";
import { createAppointment } from "@/admin/repositories/appointments.repository";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar, Star, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Lock } from "lucide-react";
import type { CMSBookingData, CMSBookingService } from "@/types/cms.types";

// ─── Icon resolver ────────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, React.ElementType> = { Calendar, Star, RefreshCw };

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((label, i) => {
        const done = i < current;
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
        const Icon = SERVICE_ICONS[svc.iconName] ?? Calendar;
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
}: {
  timeSlots: CMSBookingData["timeSlots"];
  selectedDate: string;
  selectedTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  strings: { calendarLabel: string; selectTimeLabel: string; unavailableLabel: string; noSlotsMessage: string };
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isSunday = (day: number) => new Date(viewYear, viewMonth, day).getDay() === 0;

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
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-center text-xs font-bold text-deep-purple/35 py-1">{d}</span>
            ))}
          </div>
          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ds = dateStr(day);
              const past = isPast(day);
              const sun = isSunday(day);
              const disabled = past || sun;
              const sel = selectedDate === ds;
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
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {timeSlots.map((slot) => {
              const sel = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onTimeChange(slot.time)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                    sel
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-md shadow-deep-purple/18"
                      : !slot.available
                      ? "bg-light-pink/20 text-deep-purple/25 cursor-not-allowed line-through"
                      : "bg-white border border-soft-purple/15 text-heading hover:border-primary-pink/30 hover:bg-light-pink/20"
                  }`}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Personal info ────────────────────────────────────────────────────
type PersonalInfo = {
  firstName: string; lastName: string;
  email: string; phone: string; notes: string;
};

function PersonalInfoForm({
  info,
  onChange,
  strings,
}: {
  info: PersonalInfo;
  onChange: (info: PersonalInfo) => void;
  strings: Record<string, string>;
}) {
  const set = (k: keyof PersonalInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...info, [k]: e.target.value });

  const inputCls = "w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all";
  const labelCls = "block text-sm font-semibold text-heading mb-1.5";

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{strings.firstNameLabel}</label>
          <input type="text" value={info.firstName} onChange={set("firstName")} placeholder={strings.firstNamePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{strings.lastNameLabel}</label>
          <input type="text" value={info.lastName} onChange={set("lastName")} placeholder={strings.lastNamePlaceholder} className={inputCls} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{strings.emailLabel}</label>
          <input type="email" value={info.email} onChange={set("email")} placeholder={strings.emailPlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{strings.phoneLabel}</label>
          <input type="tel" value={info.phone} onChange={set("phone")} placeholder={strings.phonePlaceholder} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{strings.notesLabel}</label>
        <textarea value={info.notes} onChange={set("notes")} placeholder={strings.notesPlaceholder} rows={4} className={`${inputCls} resize-none`} />
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
}: {
  service: CMSBookingService | undefined;
  date: string;
  time: string;
  strings: Record<string, string>;
  paymentNote: string;
  onConfirm: () => void;
  confirmed: boolean;
  confirming: boolean;
}) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "—";

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
        <h3 className="font-heading text-2xl font-bold text-heading">{strings.successTitle ?? "Booking Confirmed!"}</h3>
        <p className="text-body opacity-75 max-w-sm">{strings.successMessage ?? "Check your email for session details."}</p>
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
            { label: strings.dateLabel, value: formattedDate },
            { label: strings.timeLabel, value: time || "—" },
            { label: strings.totalLabel, value: service?.price ?? "—" },
          ].map(({ label, value }) => (
            <li key={label} className="flex items-center justify-between border-b border-soft-purple/10 pb-3 last:border-0 last:pb-0">
              <span className="text-sm text-deep-purple/50">{label}</span>
              <span className="font-semibold text-heading text-sm">{value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payment placeholder */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-heading">{strings.paymentTitle}</h3>
        <div>
          <label className="block text-sm font-semibold text-heading mb-1.5">{strings.cardLabel}</label>
          <input
            type="text"
            placeholder={strings.cardPlaceholder}
            maxLength={19}
            className="w-full px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-heading text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 focus:ring-2 focus:ring-primary-pink/15 transition-all tracking-widest"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="MM / YY" className="px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 transition-all" />
          <input placeholder="CVV" className="px-4 py-3 rounded-xl border border-soft-purple/20 bg-white text-sm placeholder:text-deep-purple/35 focus:outline-none focus:border-primary-pink/50 transition-all" />
        </div>

        <motion.button
          onClick={onConfirm}
          disabled={confirming}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-lg shadow-deep-purple/20 hover:shadow-xl hover:shadow-deep-purple/30 transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {confirming ? (strings.confirmingLabel ?? "Confirming…") : strings.confirmLabel}
        </motion.button>
        <div className="flex items-center justify-center gap-2 text-xs text-deep-purple/40">
          <Lock size={12} /> {paymentNote}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props {
  data: CMSBookingData;
  strings: Record<string, string | string[]>;
  preselectedServiceId?: string;
}

export default function BookingFlow({ data, strings, preselectedServiceId }: Props) {
  const steps = (strings.steps as string[]) ?? [];
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(preselectedServiceId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "", lastName: "", email: "", phone: "", notes: "",
  });
  const [confirmed,  setConfirmed]  = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedService = useMemo(
    () => data.services.find((s) => s.id === serviceId),
    [data.services, serviceId]
  );

  const canNext = [
    !!serviceId,
    !!date && !!time,
    !!(personalInfo.firstName && personalInfo.email),
    true,
  ];

  const handleNext = () => {
    if (step < steps.length - 1 && canNext[step]) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleConfirm = async () => {
    setConfirming(true);
    await createAppointment({
      client_name: `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || personalInfo.email,
      date,
      time,
      type:   selectedService?.name ?? "Consultation",
      status: "scheduled",
      notes:  personalInfo.notes || null,
      client_id: null,
    });
    setConfirming(false);
    setConfirmed(true);
  };

  const str = strings as Record<string, string>;

  return (
    <div className="max-w-3xl mx-auto">
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
                timeSlots={data.timeSlots}
                selectedDate={date}
                selectedTime={time}
                onDateChange={(d) => { setDate(d); setTime(""); }}
                onTimeChange={setTime}
                strings={{
                  calendarLabel: str.calendarLabel,
                  selectTimeLabel: str.selectTimeLabel,
                  unavailableLabel: str.unavailableLabel,
                  noSlotsMessage: str.noSlotsMessage,
                }}
              />
            )}
            {step === 2 && (
              <PersonalInfoForm info={personalInfo} onChange={setPersonalInfo} strings={str} />
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
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-soft-purple/20 text-deep-purple text-sm font-semibold hover:bg-light-pink/30 disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={16} className="rtl:rotate-180" />
            {str.backLabel}
          </button>
          {step < steps.length - 1 && (
            <button
              onClick={handleNext}
              disabled={!canNext[step]}
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
