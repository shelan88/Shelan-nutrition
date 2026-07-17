import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, MailCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { authModal } from "@/content/content";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { upsertClientFromAuth } from "@/admin/repositories/clients.repository";

interface AuthModalProps {
  onClose: () => void;
  /** If provided, called with the authenticated user after successful login/signup. */
  onSuccess?: (user: SupabaseUser) => void;
  /** Which tab to start on. Defaults to "login". */
  initialView?: "login" | "signup";
}

type View = "login" | "signup" | "forgot" | "confirm";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white ps-11 pe-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-pink/40 focus:border-primary-pink/60 transition-all";

export default function AuthModal({ onClose, onSuccess, initialView = "login" }: AuthModalProps) {
  const { lang } = useLanguage();
  const t = authModal[lang];
  const [view,      setView]      = useState<View>(initialView);
  const [resetSent, setResetSent] = useState(false);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;

  // ── Login form state ────────────────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError,    setLoginError]    = useState("");
  const [loginLoading,  setLoginLoading]  = useState(false);

  // ── Signup form state ───────────────────────────────────────────────────────
  const [signupName,     setSignupName]     = useState("");
  const [signupEmail,    setSignupEmail]    = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm,  setSignupConfirm]  = useState("");
  const [signupError,    setSignupError]    = useState("");
  const [signupLoading,  setSignupLoading]  = useState(false);

  // ── Forgot password ─────────────────────────────────────────────────────────
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ── Confirm email screen ────────────────────────────────────────────────────
  const [confirmEmail,   setConfirmEmail]   = useState("");
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendSent,     setResendSent]     = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoginLoading(false);
    if (error) {
      setLoginError(error.message);
      return;
    }
    if (data.user) {
      // Ensure a client record exists for this user (handles accounts created
      // before this feature was added, or users who never completed assessment).
      upsertClientFromAuth(data.user).catch(() => {/* non-blocking */});
      onSuccess?.(data.user);
      onClose();
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    if (signupPassword !== signupConfirm) {
      setSignupError(lang === "ar" ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }
    setSignupLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: { data: { full_name: signupName.trim() } },
    });
    setSignupLoading(false);
    if (error) {
      setSignupError(error.message);
      return;
    }
    if (data.user && !data.session) {
      // Email confirmation is required — keep the modal open and show the
      // "check your email" screen instead of closing or calling onSuccess.
      setConfirmEmail(signupEmail.trim());
      setResendSent(false);
      setView("confirm");
      return;
    }
    if (data.user && data.session) {
      // Email confirmation is disabled — user is immediately active.
      // Create a client record so the user appears in the admin Clients list
      // even before they complete the health assessment.
      upsertClientFromAuth(data.user).catch(() => {/* non-blocking */});
      onSuccess?.(data.user);
      onClose();
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    await supabase.auth.resend({ type: "signup", email: confirmEmail });
    setResendLoading(false);
    setResendSent(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail.trim());
    setResetLoading(false);
    setResetSent(true);
  };

  // Rendered through a portal directly under <body> so this modal is a true
  // fixed/centered overlay regardless of where it's triggered from — the
  // header uses backdrop-blur, which creates a CSS containing block for any
  // fixed-position descendant and would otherwise trap the modal inside it.
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
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 end-5 z-10 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {view === "confirm" ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="px-8 py-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary-pink/10 flex items-center justify-center mx-auto mb-5">
                  <MailCheck className="text-primary-pink" size={32} />
                </div>
                <h3 className="font-heading text-2xl font-bold text-gray-900 mb-3">
                  {t.confirmTitle}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  {t.confirmBody}
                </p>
                <p className="text-xs text-gray-400 mb-8 break-all">{confirmEmail}</p>

                {resendSent ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{t.resendSent}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-60 mb-3"
                  >
                    {resendLoading ? "…" : t.resendButton}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="flex items-center justify-center gap-1.5 w-full text-sm font-medium text-primary-pink hover:text-deep-purple transition-colors mt-1"
                >
                  <BackIcon size={16} />
                  {t.backToSignIn}
                </button>
              </motion.div>
            ) : view === "forgot" ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: lang === "ar" ? -40 : 40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="px-8 py-10"
              >
                <button
                  onClick={() => { setView("login"); setResetSent(false); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-pink hover:text-deep-purple transition-colors mb-6"
                >
                  <BackIcon size={16} />
                  {t.backToLogin}
                </button>

                {resetSent ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="mx-auto text-primary-pink mb-4" size={44} />
                    <p className="text-gray-900 font-semibold">{t.resetSent}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">{t.forgotTitle}</h3>
                    <p className="text-sm text-gray-500 mb-7 leading-relaxed">{t.forgotSubtitle}</p>
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-60"
                      >
                        {resetLoading ? "…" : t.resetButton}
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
                {/* Tab switcher */}
                <div className="flex rounded-full bg-gray-100 p-1 mb-8">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      view === "login"
                        ? "bg-gradient-to-r from-primary-pink to-soft-pink text-white shadow-md"
                        : "text-gray-500 hover:text-gray-900"
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
                        : "text-gray-500 hover:text-gray-900"
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
                      onSubmit={handleLoginSubmit}
                      className="space-y-4"
                    >
                      {loginError && (
                        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle size={15} className="mt-0.5 shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.password}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className={inputClass}
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
                        disabled={loginLoading}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-60"
                      >
                        {loginLoading ? "…" : t.loginButton}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup-form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSignupSubmit}
                      className="space-y-4"
                    >
                      {signupError && (
                        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <AlertCircle size={15} className="mt-0.5 shrink-0" />
                          <span>{signupError}</span>
                        </div>
                      )}
                      <div className="relative">
                        <User className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="text"
                          placeholder={t.name}
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="email"
                          placeholder={t.email}
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.password}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute top-1/2 -translate-y-1/2 start-4 text-gray-400" size={18} />
                        <input
                          required
                          type="password"
                          placeholder={t.confirmPassword}
                          value={signupConfirm}
                          onChange={(e) => setSignupConfirm(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={signupLoading}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold hover:from-primary-pink hover:to-lavender-purple transition-colors shadow-lg shadow-deep-purple/25 disabled:opacity-60"
                      >
                        {signupLoading ? "…" : t.signupButton}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
