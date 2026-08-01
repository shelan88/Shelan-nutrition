/**
 * ResetPasswordPage — /reset-password
 *
 * Public-facing password reset page for all users (customers and admins).
 * Supabase fires PASSWORD_RECOVERY when a user arrives via a reset-password
 * email link. The PasswordRecoveryInterceptor in App.tsx catches that event
 * on any page and navigates here. This page then handles the new-password form.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { lang, dir } = useLanguage();
  const isAr = lang === "ar";

  type Status = "waiting" | "ready" | "invalid" | "done";
  const [status,      setStatus]      = useState<Status>("waiting");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Supabase v2 guarantees that every new onAuthStateChange subscriber
  // immediately receives INITIAL_SESSION with the current state.
  // If the recovery token was already processed (implicit flow: synchronously
  // during createClient), INITIAL_SESSION carries the recovery session.
  // PASSWORD_RECOVERY is the belt-and-suspenders path when the token is
  // processed after subscription (PKCE flow or timing edge case).
  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      } else if (event === "INITIAL_SESSION") {
        setStatus(session ? "ready" : "invalid");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(isAr
        ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"
        : "Password must be at least 8 characters."
      );
      return;
    }
    if (password !== confirm) {
      setError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      await supabase.auth.signOut();
      setStatus("done");
    }
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-[#faf7ff] to-[#fff0f7] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-deep-purple/10 border border-[rgba(138,92,215,0.1)] overflow-hidden"
      >
        {/* Brand strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary-pink to-lavender-purple" />

        <div className="px-8 py-10">
          {/* ── Done ──────────────────────────────────────────────────────── */}
          {status === "done" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-5">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-[#1c1033] mb-2">
                {isAr ? "تم تغيير كلمة المرور" : "Password updated"}
              </h1>
              <p className="text-sm text-[#7b6997] mb-8 leading-relaxed">
                {isAr
                  ? "كلمة مرورك الجديدة جاهزة. يمكنكِ الآن تسجيل الدخول."
                  : "Your new password is set. You can now sign in."}
              </p>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold text-sm shadow-md shadow-deep-purple/20 hover:shadow-lg transition-all duration-200"
              >
                {isAr ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
              </button>
            </div>
          )}

          {/* ── Invalid / expired ─────────────────────────────────────────── */}
          {status === "invalid" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-5">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-[#1c1033] mb-2">
                {isAr ? "رابط غير صالح أو منتهي" : "Invalid or expired link"}
              </h1>
              <p className="text-sm text-[#7b6997] mb-8 leading-relaxed">
                {isAr
                  ? "رابط إعادة تعيين كلمة المرور هذا غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد."
                  : "This password reset link is invalid or has expired. Please request a new one."}
              </p>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="text-sm font-medium text-primary-pink hover:text-lavender-purple transition-colors"
              >
                {isAr ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
              </button>
            </div>
          )}

          {/* ── Waiting ───────────────────────────────────────────────────── */}
          {status === "waiting" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-2 border-lavender-purple/30 border-t-lavender-purple rounded-full animate-spin mb-4" />
              <p className="text-sm text-[#7b6997]">
                {isAr ? "جارٍ التحقق…" : "Verifying…"}
              </p>
            </div>
          )}

          {/* ── Ready: set new password ───────────────────────────────────── */}
          {status === "ready" && (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 border border-lavender-purple/15 mb-5">
                <ShieldCheck size={22} className="text-lavender-purple" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-[#1c1033] mb-1">
                {isAr ? "تعيين كلمة مرور جديدة" : "Set a new password"}
              </h1>
              <p className="text-sm text-[#7b6997] mb-7">
                {isAr ? "أدخلي كلمة مرورك الجديدة أدناه." : "Enter your new password below."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* New password */}
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={isAr ? "كلمة المرور الجديدة" : "New password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pe-12 rounded-xl border border-[rgba(138,92,215,0.18)] text-[14px] text-[#1c1033] placeholder:text-[#b3a6c9] focus:outline-none focus:border-[rgba(243,94,152,0.5)] focus:ring-2 focus:ring-[rgba(243,94,152,0.12)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-[#b3a6c9] hover:text-[#7b6997] transition-colors"
                  >
                    {showPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>

                {/* Confirm password */}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-3 pe-12 rounded-xl border border-[rgba(138,92,215,0.18)] text-[14px] text-[#1c1033] placeholder:text-[#b3a6c9] focus:outline-none focus:border-[rgba(243,94,152,0.5)] focus:ring-2 focus:ring-[rgba(243,94,152,0.12)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-[#b3a6c9] hover:text-[#7b6997] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>

                <p className="text-[11px] text-[#b3a6c9]">
                  {isAr
                    ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
                    : "Must be at least 8 characters."}
                </p>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !password || !confirm}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold text-sm shadow-md shadow-deep-purple/20 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAr ? "جارٍ الحفظ…" : "Saving…"}
                    </span>
                  ) : (
                    isAr ? "تعيين كلمة المرور" : "Set password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
