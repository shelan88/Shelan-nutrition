/**
 * Navbar — Fixed header with full-screen overlay menu.
 *
 * Multi-page routing:
 *   - Logo → React Router <Link to="/">
 *   - All nav items use <Link> for page navigation
 *   - Homepage sections (hero buttons, CTA) continue to use in-page scroll anchors
 *   - Overlay closes on navigation via useEffect on location
 *
 * Design is unchanged from the approved homepage.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, UserCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { pagesNav, authModal } from "@/content/content";
import AuthModal from "@/components/AuthModal";

// ── Framer variants (unchanged) ───────────────────────────────────────────────

const curtainVariants = {
  hidden: { y: "-100%", opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut" as const,
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
  exit: {
    y: "-100%",
    opacity: 0.8,
    transition: { duration: 0.4, ease: "easeInOut" as const },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { opacity: 0, y: 12 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  const items = pagesNav[lang];
  const authT = authModal[lang];

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-[1000] backdrop-blur-md bg-gradient-to-b from-deep-purple/95 to-soft-purple/90 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-24 sm:h-28">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0" aria-label="SHELAN — Home">
          <img
            src="/logo.png"
            alt="SHELAN Nutritionist Logo"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            className="protected-image h-[77px] sm:h-24 w-auto object-contain"
          />
        </Link>

        {/* Header actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Auth button — desktop */}
          <button
            onClick={() => setAuthOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-ivory hover:bg-white/15 transition-colors"
            aria-label={authT.trigger}
          >
            <UserCircle2 size={16} />
            {authT.trigger}
          </button>

          {/* Auth button — mobile */}
          <button
            onClick={() => setAuthOpen(true)}
            className="sm:hidden flex items-center justify-center w-11 h-11 rounded-full border border-white/15 text-ivory hover:bg-white/10 transition-colors"
            aria-label={authT.trigger}
          >
            <UserCircle2 size={20} />
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-ivory hover:bg-white/15 transition-colors"
            aria-label="Toggle language"
          >
            <Globe size={16} />
            {lang === "en" ? "العربية" : "English"}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="relative w-11 h-11 flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 transition-colors"
          >
            <span className="relative w-5 h-4 flex flex-col justify-between">
              <motion.span
                animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="block h-[1.5px] w-full bg-ivory rounded-full origin-center"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="block h-[1.5px] w-full bg-ivory rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="block h-[1.5px] w-full bg-ivory rounded-full origin-center"
              />
            </span>
          </button>
        </div>
      </div>

      {/* Full-screen overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={curtainVariants}
            className="fixed inset-x-0 top-0 z-[999] w-full min-h-screen bg-[rgba(15,23,42,0.97)] backdrop-blur-[12px] shadow-2xl shadow-black/40"
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="fixed top-6 end-6 sm:top-10 sm:end-10 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-ivory hover:bg-white/10 hover:border-white/40 transition-colors"
            >
              <X size={26} />
            </button>

            <nav className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-7 text-center px-6 pt-28 pb-12">
              {items.map((item) =>
                item.cta ? (
                  /* "Book Now" — pink gradient CTA button */
                  <motion.div key={item.href} variants={linkVariants}>
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple font-heading text-base font-bold text-white shadow-lg shadow-deep-purple/30 hover:shadow-xl hover:shadow-deep-purple/40 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ) : (
                  /* Regular page link */
                  <motion.div key={item.href} variants={linkVariants}>
                    <Link
                      to={item.href}
                      className={`font-heading text-[1.3rem] sm:text-[1.4rem] font-bold transition-colors ${
                        location.pathname === item.href
                          ? "text-primary-pink"
                          : "text-ivory hover:text-light-pink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                )
              )}

              {/* Auth link at bottom */}
              <motion.button
                type="button"
                variants={linkVariants}
                onClick={() => {
                  setOpen(false);
                  window.setTimeout(() => setAuthOpen(true), 320);
                }}
                className="flex items-center gap-2 font-heading text-base sm:text-lg font-bold text-light-pink hover:text-white transition-colors mt-2"
              >
                <UserCircle2 size={22} />
                {authT.trigger}
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}
