/**
 * AdminResetPasswordPage — /admin/reset-password
 *
 * Handles the Supabase PASSWORD_RECOVERY flow.
 * Supabase emails a link: https://shelancircle.com/admin/reset-password
 * with the recovery token in the URL hash. Supabase JS v2 picks it up
 * automatically and fires the PASSWORD_RECOVERY event via onAuthStateChange.
 * The user can then set a new password via supabase.auth.updateUser().
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";

// ─── Shared input / label styles (match LoginPage) ────────────────────────────
const inputCls = `
  w-full px-4 py-3 rounded-xl border text-[14px]
  bg-white text-[#1c1033]
  border-[rgba(138,92,215,0.18)]
  placeholder:text-[#b3a6c9]
  focus:outline-none
  focus:border-[rgba(243,94,152,0.5)]
  focus:ring-2 focus:ring-[rgba(243,94,152,0.12)]
  transition-all duration-150
`;
const labelCls = "block text-[12px] font-semibold text-[#1c1033] mb-1.5 tracking-wide";

// ─── Brand panel (identical to LoginPage) ────────────────────────────────────
function BrandPanel({ lang }: { lang: "en" | "ar" }) {
  const benefits = lang === "ar"
    ? ["إدارة العملاء", "جدولة ذكية", "تحليلات متقدمة", "منشئ الموقع"]
    : ["Client Management", "Smart Scheduling", "Analytics", "Website Builder"];

  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#3a1a72] via-[#6a35b5] to-[#c24e8a]">
      <div className="absolute -top-20 -start-20 w-72 h-72 rounded-full bg-primary-pink/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 end-0 w-80 h-80 rounded-full bg-lavender-purple/25 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5 2 3 4 3 6.5c0 2 1.5 3.5 3 4.5l2 1.5 2-1.5c1.5-1 3-2.5 3-4.5C13 4 11 2 8 2z" fill="white" fillOpacity=".9"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-lg tracking-wide leading-none">SHELAN</p>
          <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase leading-none mt-1">Admin Portal</p>
        </div>
      </div>

      {/* Central illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center py-8"
      >
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5 shadow-2xl shadow-black/25 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-primary-pink/70" />
            <div className="w-2 h-2 rounded-full bg-lavender-purple/70" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="flex-1 h-2 rounded bg-white/10 ms-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: lang === "ar" ? "العملاء" : "Clients", value: "142", color: "bg-primary-pink/20 border-primary-pink/30" },
              { label: lang === "ar" ? "الحجوزات" : "Bookings", value: "38", color: "bg-lavender-purple/20 border-lavender-purple/30" },
              { label: lang === "ar" ? "الرسائل" : "Messages", value: "12", color: "bg-white/10 border-white/20" },
              { label: lang === "ar" ? "الإيرادات" : "Revenue", value: "$4.2k", color: "bg-primary-pink/15 border-primary-pink/25" },
            ].map((card) => (
              <div key={card.label} className={`rounded-lg p-2.5 border ${card.color}`}>
                <p className="text-white/50 text-[9px] mb-1">{card.label}</p>
                <p className="text-white font-bold text-base leading-none">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-14">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-primary-pink/50 to-lavender-purple/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <h2 className="text-white text-2xl font-semibold text-center leading-snug">
          {lang === "ar"
            ? "منصة إدارة التغذية الذكية"
            : "The intelligent nutrition\nmanagement platform."}
        </h2>
        <p className="text-white/55 text-sm text-center mt-2 max-w-xs leading-relaxed">
          {lang === "ar"
            ? "أدِيري عيادتك وعملاءكِ ومحتواكِ — كل ذلك في مكان واحد."
            : "Manage your practice, clients, and content — all in one place."}
        </p>
      </motion.div>

      {/* Benefit chips */}
      <div className="relative z-10 flex flex-wrap gap-2">
        {benefits.map((b) => (
          <span
            key={b}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-[11px] font-medium backdrop-blur-sm"
          >
            <CheckCircle2 size={11} className="text-primary-pink" />
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Reset password form (right side) ────────────────────────────────────────
function ResetForm({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();

  // "ready" means the PASSWORD_RECOVERY event has fired and we can update.
  // "invalid" means no recovery event arrived (direct nav / expired link).
  const [status, setStatus] = useState<"waiting" | "ready" | "invalid" | "done">("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for the Supabase PASSWORD_RECOVERY auth event.
  // Supabase v2 automatically parses the access_token from the URL hash.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    // Fallback: if the user already has an active recovery session (page reload),
    // getSession() will return it — but we still need the event. Set a timeout
    // so that if no event fires within 3 s, we treat the link as invalid.
    const timer = setTimeout(() => {
      setStatus((prev) => (prev === "waiting" ? "invalid" : prev));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(isAr ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل" : "Password must be at least 8 characters.");
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
      // Sign out so they must log in fresh with the new password.
      await supabase.auth.signOut();
      setStatus("done");
    }
  };

  // ── Done state ──────────────────────────────────────────────────────────────
  if (status === "done") {
    return (
      <div className="flex flex-col justify-center w-full max-w-[420px] mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1c1033] mb-2 !font-sans">
            {isAr ? "تم تغيير كلمة المرور" : "Password updated"}
          </h1>
          <p className="text-[14px] text-[#7b6997] mb-8">
            {isAr
              ? "كلمة مرورك الجديدة جاهزة. يمكنكِ الآن تسجيل الدخول."
              : "Your new password is set. You can now sign in."}
          </p>
          <motion.button
            onClick={() => navigate("/admin/login", { replace: true })}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white bg-gradient-to-r from-primary-pink to-lavender-purple shadow-md shadow-deep-purple/20 hover:shadow-lg hover:shadow-deep-purple/25 transition-all duration-200"
          >
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Invalid / expired token ─────────────────────────────────────────────────
  if (status === "invalid") {
    return (
      <div className="flex flex-col justify-center w-full max-w-[420px] mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-6">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1c1033] mb-2 !font-sans">
            {isAr ? "رابط غير صالح أو منتهي" : "Invalid or expired link"}
          </h1>
          <p className="text-[14px] text-[#7b6997] mb-8">
            {isAr
              ? "رابط إعادة تعيين كلمة المرور هذا غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد."
              : "This password reset link is invalid or has expired. Please request a new one."}
          </p>
          <button
            onClick={() => navigate("/admin/login", { replace: true })}
            className="flex items-center gap-1.5 text-[13px] text-primary-pink hover:text-soft-purple transition-colors font-medium mx-auto"
          >
            <ArrowLeft size={13} className="rtl:rotate-180" />
            {isAr ? "العودة إلى تسجيل الدخول" : "Back to sign in"}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Waiting for token (brief spinner) ──────────────────────────────────────
  if (status === "waiting") {
    return (
      <div className="flex flex-col justify-center items-center w-full max-w-[420px] mx-auto px-8 py-12">
        <div className="w-8 h-8 border-2 border-lavender-purple/30 border-t-lavender-purple rounded-full animate-spin mb-4" />
        <p className="text-[14px] text-[#7b6997]">
          {isAr ? "جارٍ التحقق…" : "Verifying…"}
        </p>
      </div>
    );
  }

  // ── Ready: show set-new-password form ──────────────────────────────────────
  return (
    <div className="flex flex-col justify-center w-full max-w-[420px] mx-auto px-8 py-12">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-md shadow-deep-purple/20">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C5 2 3 4 3 6.5c0 2 1.5 3.5 3 4.5l2 1.5 2-1.5c1.5-1 3-2.5 3-4.5C13 4 11 2 8 2z" fill="white" fillOpacity=".9"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[15px] tracking-wide text-[#1c1033]">SHELAN</p>
          <p className="text-[9px] text-[#b3a6c9] tracking-[0.12em] uppercase leading-none mt-0.5">Admin Portal</p>
        </div>
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 border border-lavender-purple/15 mb-4">
          <ShieldCheck size={22} className="text-lavender-purple" />
        </div>
        <h1 className="text-[26px] font-semibold text-[#1c1033] leading-tight mb-1 !font-sans">
          {isAr ? "تعيين كلمة مرور جديدة" : "Set a new password"}
        </h1>
        <p className="text-[14px] text-[#7b6997]">
          {isAr
            ? "أدخلي كلمة مرورك الجديدة أدناه."
            : "Enter your new password below."}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-5"
        noValidate
      >
        {/* New password */}
        <div>
          <label className={labelCls}>
            {isAr ? "كلمة المرور الجديدة" : "New password"}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isAr ? "••••••••" : "••••••••"}
              required
              className={`${inputCls} pe-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-[#b3a6c9] hover:text-[#7b6997] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className={labelCls}>
            {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={isAr ? "••••••••" : "••••••••"}
              required
              className={`${inputCls} pe-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-[#b3a6c9] hover:text-[#7b6997] transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        {/* Strength hint */}
        <p className="text-[11px] text-[#b3a6c9]">
          {isAr ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Must be at least 8 characters."}
        </p>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={saving || !password || !confirm}
          whileHover={!saving && password && confirm ? { scale: 1.01, y: -1 } : {}}
          whileTap={!saving && password && confirm ? { scale: 0.99 } : {}}
          className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white bg-gradient-to-r from-primary-pink to-lavender-purple shadow-md shadow-deep-purple/20 hover:shadow-lg hover:shadow-deep-purple/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {isAr ? "جارٍ الحفظ…" : "Saving…"}
            </span>
          ) : (
            isAr ? "تعيين كلمة المرور" : "Set password"
          )}
        </motion.button>

        {/* Back link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/admin/login", { replace: true })}
            className="flex items-center gap-1.5 text-[12px] text-[#b3a6c9] hover:text-[#7b6997] transition-colors mx-auto"
          >
            <ArrowLeft size={12} className="rtl:rotate-180" />
            {isAr ? "العودة إلى تسجيل الدخول" : "Back to sign in"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminResetPasswordPage() {
  const { lang } = useLanguage();

  return (
    <div className="admin-login flex min-h-screen">
      {/* Left — brand panel (hidden on mobile) */}
      <div className="hidden lg:block lg:w-3/5 xl:w-[58%]">
        <BrandPanel lang={lang} />
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col justify-center bg-white">
        <ResetForm lang={lang} />
      </div>
    </div>
  );
}
