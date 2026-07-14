import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Lock, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { checkoutModal } from "@/content/content";

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

export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const { lang } = useLanguage();
  const t = checkoutModal[lang];
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    setStatus("processing");
    window.setTimeout(() => setStatus("success"), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 py-8 sm:p-6 bg-deep-purple/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-full my-auto rounded-[2rem] bg-white border border-soft-purple/15 shadow-2xl shadow-deep-purple/40 overflow-y-auto overscroll-contain"
      >
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
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={48} />
                <h4 className="font-heading text-lg font-bold text-deep-purple mb-2">
                  {t.success}
                </h4>
                <p className="text-sm text-deep-purple/70 mb-6 leading-relaxed">
                  {t.successNote}
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors"
                >
                  {t.close}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="flex items-center justify-between rounded-2xl bg-light-pink/25 px-4 py-3 mb-2">
                  <span className="text-sm font-semibold text-deep-purple">{plan.name}</span>
                  <span className="text-sm font-bold text-primary-pink">
                    {plan.price} <span className="font-normal text-deep-purple/60">{plan.period}</span>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-deep-purple/70 mb-1.5">
                    {t.nameOnCard}
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full rounded-xl border border-soft-purple/25 px-4 py-3 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-deep-purple/70 mb-1.5">
                    {t.cardNumber}
                  </label>
                  <div className="relative">
                    <CreditCard
                      className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30"
                      size={18}
                    />
                    <input
                      required
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-deep-purple/70 mb-1.5">
                      {t.expiry}
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full rounded-xl border border-soft-purple/25 px-4 py-3 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-deep-purple/70 mb-1.5">
                      {t.cvc}
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full rounded-xl border border-soft-purple/25 px-4 py-3 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
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

                <p className="flex items-center justify-center gap-1.5 text-xs text-deep-purple/50 pt-1">
                  <ShieldCheck size={14} />
                  {t.securedBy} Stripe
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
