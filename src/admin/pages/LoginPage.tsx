/**
 * AdminLoginPage — /admin/login
 *
 * Premium split-screen login page that matches the SHELAN brand.
 * Left panel: brand illustration with gradient.
 * Right panel: clean, minimal login form.
 *
 * All form state is local — no auth logic yet.
 * To connect: replace handleSubmit with supabase.auth.signInWithPassword().
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// ─── Shared input style ───────────────────────────────────────────────────────
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

// ─── Brand panel (left side on desktop) ──────────────────────────────────────
function BrandPanel({ lang }: { lang: "en" | "ar" }) {
  const benefits = lang === "ar"
    ? ["إدارة العملاء", "جدولة ذكية", "تحليلات متقدمة", "منشئ الموقع"]
    : ["Client Management", "Smart Scheduling", "Analytics", "Website Builder"];

  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#3a1a72] via-[#6a35b5] to-[#c24e8a]">
      {/* Background blobs */}
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
        {/* Abstract dashboard preview */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5 shadow-2xl shadow-black/25 mb-8">
          {/* Fake topbar */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-primary-pink/70" />
            <div className="w-2 h-2 rounded-full bg-lavender-purple/70" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="flex-1 h-2 rounded bg-white/10 ms-2" />
          </div>

          {/* Fake stat cards */}
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

          {/* Fake chart bar */}
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

// ─── Login form (right side) ──────────────────────────────────────────────────
function LoginForm({ lang }: { lang: "en" | "ar" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAr = lang === "ar";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: replace with supabase.auth.signInWithPassword({ email, password })
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/admin";
    }, 1200);
  };

  return (
    <div className="flex flex-col justify-center w-full max-w-[420px] mx-auto px-8 py-12">
      {/* Mobile logo — visible only on small screens */}
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
      >
        <h1 className="text-[26px] font-semibold text-[#1c1033] leading-tight mb-1 !font-sans">
          {isAr ? "مرحباً بعودتكِ" : "Welcome back"}
        </h1>
        <p className="text-[14px] text-[#7b6997] mb-8">
          {isAr ? "تسجيل الدخول إلى بوابة الإدارة" : "Sign in to your admin portal"}
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
        {/* Email */}
        <div>
          <label className={labelCls}>
            {isAr ? "البريد الإلكتروني" : "Email address"}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAr ? "admin@shelan.com" : "admin@shelan.com"}
            required
            className={inputCls}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace("mb-1.5", "mb-0")}>
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <button
              type="button"
              tabIndex={-1}
              className="text-[11px] text-primary-pink hover:text-soft-purple transition-colors font-medium"
            >
              {isAr ? "نسيتِ كلمة المرور؟" : "Forgot password?"}
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
              {showPassword
                ? <EyeOff size={16} strokeWidth={1.8} />
                : <Eye size={16} strokeWidth={1.8} />
              }
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={`
                w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all
                ${rememberMe
                  ? "bg-primary-pink border-primary-pink"
                  : "border-[rgba(138,92,215,0.3)] group-hover:border-[rgba(243,94,152,0.5)]"
                }
              `}
            >
              {rememberMe && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-[13px] text-[#7b6997]">
            {isAr ? "تذكّريني" : "Remember me"}
          </span>
        </label>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || !email || !password}
          whileHover={!loading && email && password ? { scale: 1.01, y: -1 } : {}}
          whileTap={!loading && email && password ? { scale: 0.99 } : {}}
          className={`
            w-full py-3.5 rounded-xl font-semibold text-[14px] text-white
            bg-gradient-to-r from-primary-pink to-lavender-purple
            shadow-md shadow-deep-purple/20
            hover:shadow-lg hover:shadow-deep-purple/25
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            transition-all duration-200 relative overflow-hidden
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {isAr ? "جارٍ تسجيل الدخول…" : "Signing in…"}
            </span>
          ) : (
            isAr ? "تسجيل الدخول" : "Sign in"
          )}
        </motion.button>
      </motion.form>

      {/* Footer links */}
      <div className="mt-8 pt-6 border-t border-[rgba(138,92,215,0.1)] flex flex-col items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[12px] text-[#b3a6c9] hover:text-[#7b6997] transition-colors"
        >
          <ArrowLeft size={12} className="rtl:rotate-180" />
          {isAr ? "العودة إلى الموقع العام" : "Back to public website"}
        </Link>
        <p className="text-[11px] text-[#b3a6c9]">
          SHELAN Admin Portal · v1.0
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const { lang } = useLanguage();

  return (
    <div className="admin-login flex min-h-screen">
      {/* Left — brand panel (hidden on mobile) */}
      <div className="hidden lg:block lg:w-3/5 xl:w-[58%]">
        <BrandPanel lang={lang} />
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col justify-center bg-white">
        <LoginForm lang={lang} />
      </div>
    </div>
  );
}
