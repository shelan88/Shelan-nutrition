import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { authModal } from "@/content/content";

interface AuthModalProps {
  onClose: () => void;
}

type View = "login" | "signup" | "forgot";

export default function AuthModal({ onClose }: AuthModalProps) {
  const { lang } = useLanguage();
  const t = authModal[lang];
  const [view, setView] = useState<View>("login");
  const [resetSent, setResetSent] = useState(false);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-deep-purple/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-[2rem] bg-white border border-soft-purple/15 shadow-2xl shadow-deep-purple/40 overflow-hidden"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 end-5 z-10 w-9 h-9 rounded-full flex items-center justify-center text-deep-purple/60 hover:bg-light-pink/30 hover:text-deep-purple transition-colors"
        >
          <X size={18} />
        </button>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {view === "forgot" ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="px-8 py-10"
              >
                <button
                  onClick={() => {
                    setView("login");
                    setResetSent(false);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-pink hover:text-deep-purple transition-colors mb-6"
                >
                  <BackIcon size={16} />
                  {t.backToLogin}
                </button>

                {resetSent ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={44} />
                    <p className="text-deep-purple font-semibold">{t.resetSent}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading text-2xl font-bold text-deep-purple mb-2">
                      {t.forgotTitle}
                    </h3>
                    <p className="text-sm text-deep-purple/60 mb-7 leading-relaxed">
                      {t.forgotSubtitle}
                    </p>
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25"
                      >
                        {t.resetButton}
                      </button>
                    </form>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: lang === "ar" ? 40 : -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="px-8 pt-10 pb-9"
              >
                <div className="flex rounded-full bg-light-pink/25 p-1 mb-8">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      view === "login"
                        ? "bg-gradient-to-r from-primary-pink to-soft-pink text-white shadow-md"
                        : "text-deep-purple/60 hover:text-deep-purple"
                    }`}
                  >
                    {t.loginTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      view === "signup"
                        ? "bg-gradient-to-r from-primary-pink to-soft-pink text-white shadow-md"
                        : "text-deep-purple/60 hover:text-deep-purple"
                    }`}
                  >
                    {t.signupTab}
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {view === "login" ? (
                    <motion.form
                      key="login-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.password}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="block text-sm font-medium text-primary-pink hover:text-deep-purple transition-colors"
                      >
                        {t.forgotPassword}
                      </button>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25"
                      >
                        {t.loginButton}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <User className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="text"
                          placeholder={t.name}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.password}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-deep-purple/30" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.confirmPassword}
                          className="w-full rounded-xl border border-soft-purple/25 ps-11 pe-4 py-3.5 text-sm text-deep-purple placeholder:text-deep-purple/30 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/50 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25"
                      >
                        {t.signupButton}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
