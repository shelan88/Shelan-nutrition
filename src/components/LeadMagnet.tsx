/**
 * LeadMagnet — Free Guide section.
 *
 * Behaviour:
 *   1. Loads settings from free_guide_settings via getGuideSettings().
 *   2. If email_collection_enabled: captures visitor email, saves to lead_emails.
 *   3. After successful save (or if collection disabled), triggers browser PDF download.
 *   4. If no PDF has been uploaded (pdf_url is null), shows a "coming soon" state
 *      so visitors never hit a broken button.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Mail, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  getGuideSettings,
  saveLeadEmail,
  type FreeGuideSettings,
} from "@/admin/repositories/freeGuide.repository";

// ─── helpers ─────────────────────────────────────────────────────────────────

function validateEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/** Trigger a browser download for a public URL. */
function triggerDownload(url: string, filename = "free-guide.pdf") {
  // Use a hidden <a> so the browser opens Save-As instead of navigating.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── component ───────────────────────────────────────────────────────────────

export default function LeadMagnet() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [settings,    setSettings]    = useState<FreeGuideSettings | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const [email,      setEmail]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [emailError, setEmailError] = useState("");

  // Load guide settings on mount
  useEffect(() => {
    getGuideSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoadingInit(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");

    const emailCollectionOn = settings?.email_collection_enabled ?? true;

    // Validate only when collection is enabled
    if (emailCollectionOn && !validateEmail(email)) {
      setEmailError(
        isAr
          ? "يرجى إدخال بريد إلكتروني صحيح"
          : "Please enter a valid email address"
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Save email if collection is enabled
      if (emailCollectionOn) {
        await saveLeadEmail(email);
      }

      // 2. Trigger PDF download
      if (settings?.pdf_url) {
        triggerDownload(settings.pdf_url);
      }

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

  // Resolve display text from DB or fall back to defaults
  const titleText = isAr
    ? (settings?.title_ar   || "5 خطوات للسيطرة على آلام الليبيديما")
    : (settings?.title_en   || "5 Steps to Control Lipedema Pain");

  const subtitleText = isAr
    ? settings?.subtitle_ar
    : settings?.subtitle_en;

  const descText = isAr
    ? (settings?.description_ar || "دليل عملي شامل من خبيرة متخصصة — خطوات قابلة للتطبيق فوراً لتحسين حياتك")
    : (settings?.description_en || "A practical comprehensive guide from a specialist — immediately actionable steps to improve your life");

  const ctaText = isAr
    ? (settings?.cta_text_ar || "تحميل الدليل المجاني")
    : (settings?.cta_text_en || "Download Free Guide");

  const hasPdf             = !!settings?.pdf_url;
  const emailCollectionOn  = settings?.email_collection_enabled ?? true;

  return (
    <section
      id="free-guide"
      className="relative py-24 overflow-hidden section-dark bg-gradient-to-br from-[#1a0a33] via-deep-purple to-[#2d1254]"
    >
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

          {/* Loading skeleton */}
          {loadingInit ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-white/10 rounded-xl mx-auto w-3/4" />
              <div className="h-6 bg-white/8 rounded-lg mx-auto w-1/2" />
              <div className="h-4 bg-white/6 rounded mx-auto w-2/3" />
            </div>
          ) : (
            <>
              {/* Headline */}
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-heading leading-tight mb-5">
                {isAr ? "احصلي على دليلك المجاني" : "Download Your Free Guide"}
              </h2>

              {/* Guide title */}
              <p className="text-2xl font-bold text-light-pink mb-3">{titleText}</p>

              {/* Optional subtitle */}
              {subtitleText && (
                <p className="text-base text-white/70 font-medium mb-3">{subtitleText}</p>
              )}

              {/* Description */}
              <p className="text-body leading-relaxed mb-10 opacity-80 max-w-md mx-auto">
                {descText}
              </p>

              {/* ── No PDF uploaded → Coming Soon state ── */}
              {!hasPdf ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex flex-col items-center gap-4 px-8 py-7 rounded-3xl bg-white/8 border border-white/12 max-w-sm mx-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock size={24} className="text-white/50" />
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {isAr
                      ? "الدليل قادم قريباً — ترقّبي!"
                      : "Guide coming soon — stay tuned!"}
                  </p>
                </motion.div>

              ) : submitted ? (
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
                      {isAr ? "جارٍ التحميل…" : "Your download is starting…"}
                    </p>
                    <p className="text-body text-sm opacity-75">
                      {isAr
                        ? "إذا لم يبدأ التحميل تلقائياً، اضغطي على الزر أدناه"
                        : "If the download doesn't start automatically, click below"}
                    </p>
                    <a
                      href={settings!.pdf_url!}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-light-pink underline underline-offset-2 hover:text-white transition-colors"
                    >
                      <Download size={14} />
                      {isAr ? "تحميل مباشر" : "Direct download"}
                    </a>
                  </div>
                </motion.div>

              ) : (
                /* ── Email form (or direct download button) ── */
                <form onSubmit={handleSubmit} noValidate>
                  {emailCollectionOn ? (
                    /* With email collection */
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
                          : ctaText}
                      </motion.button>
                    </div>
                  ) : (
                    /* No email collection — direct download button */
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={loading ? {} : { scale: 1.04, y: -1 }}
                      whileTap={loading ? {} : { scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold text-base shadow-lg shadow-primary-pink/30 hover:from-primary-pink hover:to-lavender-purple transition-all disabled:opacity-70"
                    >
                      {loading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {ctaText}
                    </motion.button>
                  )}

                  {/* Validation error */}
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-sm text-red-400"
                    >
                      {emailError}
                    </motion.p>
                  )}

                  {emailCollectionOn && (
                    <p className="mt-4 text-[11px] text-white/35 leading-relaxed">
                      {isAr
                        ? "🔒 بريدك محمي — لن نشاركه مع أي جهة. يمكنك إلغاء الاشتراك في أي وقت."
                        : "🔒 Your email is safe — we never share it. Unsubscribe anytime."}
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
