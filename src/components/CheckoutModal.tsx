import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, X, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { checkoutModal } from "@/content/content";
import { createAppointment } from "@/admin/repositories/appointments.repository";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/60 transition-all";

export interface CheckoutPlan {
  name: string;
  price: string;
  period: string;
}

interface CheckoutModalProps {
  plan: CheckoutPlan;
  onClose: () => void;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

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
}: {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const monthName  = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isPast = (day: number) => {
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
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={14} className="text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800">{monthName}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} className="text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</span>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <span key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ds       = dateStr(day);
              const disabled = isPast(day) || isSunday(day);
              const sel      = selectedDate === ds;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onDateChange(ds); onTimeChange(""); }}
                  className={`aspect-square rounded-full text-[11px] font-medium transition-all flex items-center justify-center ${
                    sel
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-sm scale-110"
                      : disabled
                      ? "text-gray-300 cursor-not-allowed"
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
        {selectedDate && (
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_SLOTS.map((slot) => {
              const sel = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onTimeChange(slot.time)}
                  className={`py-2 rounded-xl text-[11px] font-semibold transition-all text-center ${
                    sel
                      ? "bg-gradient-to-br from-primary-pink to-lavender-purple text-white shadow-sm"
                      : !slot.available
                      ? "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50"
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

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const { lang } = useLanguage();
  const t = checkoutModal[lang];

  // Step 0 = date/time, Step 1 = payment
  const [step, setStep]   = useState<0 | 1>(0);
  const [date, setDate]   = useState("");
  const [time, setTime]   = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvc, setCvc]               = useState("");
  const [name, setName]             = useState("");
  const [status, setStatus]         = useState<"idle" | "processing" | "success">("idle");

  const canProceed = !!date && !!time;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("processing");

    // Save booking to Supabase (fire-and-forget alongside the payment simulation)
    createAppointment({
      client_name: name.trim() || "Customer",
      date,
      time,
      type:      plan.name,
      status:    "scheduled",
      notes:     null,
      client_id: null,
    });

    window.setTimeout(() => setStatus("success"), 1400);
  };

  const stepLabel = step === 0 ? "Step 1 of 2 — Pick a Date & Time" : "Step 2 of 2 — Payment Details";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
          <button
            onClick={onClose}
            aria-label={t.close}
            className="absolute top-4 end-4 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
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
              /* ── Success ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={48} />
                <h4 className="font-heading text-lg font-bold text-gray-900 mb-2">{t.success}</h4>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{t.successNote}</p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white text-sm font-semibold shadow-md"
                >
                  {t.close}
                </button>
              </motion.div>

            ) : step === 0 ? (
              /* ── Step 0: Date + Time ── */
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
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
                  selectedDate={date}
                  selectedTime={time}
                  onDateChange={setDate}
                  onTimeChange={setTime}
                />

                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={() => setStep(1)}
                  className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold shadow-lg shadow-deep-purple/25 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ChevronRight size={16} />
                </button>
              </motion.div>

            ) : (
              /* ── Step 1: Payment ── */
              <motion.form
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Back + step label */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft size={14} className="text-gray-500" />
                  </button>
                  <p className="text-[11px] text-gray-400">{stepLabel}</p>
                </div>

                {/* Booking summary line */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 text-xs text-gray-600 flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-800">{plan.name}</span>
                  <span>
                    {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    {time}
                  </span>
                </div>

                {/* Cardholder name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.nameOnCard}
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={inputClass}
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.cardNumber}
                  </label>
                  <input
                    required
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`${inputClass} tracking-widest`}
                  />
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t.expiry}
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t.cvc}
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "processing"}
                  className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-70 flex items-center justify-center gap-2"
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
    document.body
  );
}
