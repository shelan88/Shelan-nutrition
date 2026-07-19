/**
 * LeadMagnet — PDF guide email-collection section.
 * Dark-themed, premium. Frontend-only placeholder — wire to API when ready.
 *
 * INTEGRATION NOTE FOR DEVELOPERS:
 * The form `onSubmit` handler is clearly marked. Replace the `TODO` block with:
 *   - A POST to your backend API / Supabase Edge Function
 *   - The function should: store the email, send the PDF via email service
 * The `email` state holds the submitted address.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LeadMagnet() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [emailError, setEmailError] = useState("");

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

    if (!validateEmail(email)) {
      setEmailError(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      /**
       * TODO: Replace this block with your actual API call.
       * Example:
       *   await fetch("/api/lead-magnet", {
       *     method: "POST",
       *     headers: { "Content-Type": "application/json" },
       *     body: JSON.stringify({ email: email.trim(), lang }),
       *   });
       */
      // Simulate network delay for UI demonstration
      await new Promise((r) => setTimeout(r, 1200));

      setSubmitted(true);
    } catch (err) {
      console.error("[LeadMagnet] submission error:", err);
      setEmailError(
        isAr
          ? "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى."
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative py-24 overflow-hidden section-dark bg-gradient-to-br from-[#1a0a33] via-deep-purple to-[#2d1254]">
      {/* Decorative blobs */}
      <div className="absolute -top-28 -start-28 w-[420px] h-[420px] rounded-full bg-primary-pink/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -end-28 w-[380px] h-[380px] rounded-full bg-lavender-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full bg-soft-pink/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
        >
          {/* Icon badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6">
            <Sparkles size={14} className="text-light-pink" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-light-pink">
              {isAr ? "مجاني تماماً" : "Completely Free"}
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-heading leading-tight mb-5">
            {isAr
              ? "احصلي على دليلك المجاني"
              : "Download Your Free Guide"}
          </h2>
          <p className="text-2xl font-bold text-light-pink mb-5">
            {isAr
              ? "5 خطوات للسيطرة على آلام الليبيديما"
              : "5 Steps to Control Lipedema Pain"}
          </p>
          <p className="text-body leading-relaxed mb-10 opacity-80 max-w-md mx-auto">
            {isAr
              ? "دليل عملي شامل من خبيرة متخصصة — خطوات قابلة للتطبيق فوراً لتحسين حياتك"
              : "A practical comprehensive guide from a specialist — immediately actionable steps to improve your life"}
          </p>

          {/* Form or success */}
          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                {/* Email input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none">
                    <Mail size={15} className="text-white/40" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                    dir={isAr ? "rtl" : "ltr"}
                    className={`w-full ps-10 pe-4 py-3.5 rounded-full bg-white/12 border text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary-pink/50 focus:border-primary-pink/50 transition-all ${
                      emailError ? "border-red-400/60" : "border-white/20 hover:border-white/35"
                    }`}
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.04, y: -1 }}
                  whileTap={loading ? {} : { scale: 0.97 }}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold text-sm shadow-lg shadow-primary-pink/30 hover:from-primary-pink hover:to-lavender-purple transition-all disabled:opacity-70 whitespace-nowrap"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  {loading
                    ? (isAr ? "جارٍ الإرسال…" : "Sending…")
                    : (isAr ? "تحميل الدليل" : "Download Guide")}
                </motion.button>
              </div>

              {/* Error message */}
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-400"
                >
                  {emailError}
                </motion.p>
              )}

              <p className="mt-4 text-[11px] text-white/35 leading-relaxed">
                {isAr
                  ? "🔒 بريدك محمي — لن نشاركه مع أي جهة. يمكنك إلغاء الاشتراك في أي وقت."
                  : "🔒 Your email is safe — we never share it. Unsubscribe anytime."}
              </p>
            </form>
          ) : (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex flex-col items-center gap-4 px-8 py-7 rounded-3xl bg-white/10 border border-white/15 max-w-sm mx-auto"
            >
              <div className="w-14 h-14 rounded-full bg-green-400/20 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-400" />
              </div>
              <div>
                <p className="font-bold text-heading text-lg mb-1">
                  {isAr ? "تم الإرسال بنجاح!" : "Sent successfully!"}
                </p>
                <p className="text-body text-sm opacity-75">
                  {isAr
                    ? "ستصلك الرسالة على بريدك الإلكتروني قريباً"
                    : "You'll receive the guide in your inbox shortly"}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
