/**
 * Navbar — Fixed header with full-screen overlay menu.
 *
 * Navigation items are loaded from Supabase (site.nav key) and fall back to
 * the static pagesNav from content.ts when no DB data exists.
 *
 * The "Admin Dashboard" link is shown in the overlay menu ONLY for authenticated
 * admin/staff users (verified against admin_profiles table).
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, UserCircle2, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { pagesNav, authModal } from "@/content/content";
import AuthModal from "@/components/AuthModal";
import { getSetting } from "@/admin/repositories/settings.repository";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ── Nav item shape coming from DB (site.nav) ──────────────────────────────────

type DBNavItem = {
  id: string;
  label_en: string;
  label_ar: string;
  href: string;
  visible: boolean;
  order: number;
  cta?: boolean;
};

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
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: 12 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function checkAdminProfile(session: Session | null): Promise<boolean> {
  if (!session) return false;
  const { data } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .in("role", ["admin", "staff"])
    .maybeSingle();
  return !!data;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const [open,      setOpen]      = useState(false);
  const [authOpen,  setAuthOpen]  = useState(false);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [dbNavItems, setDbNavItems] = useState<DBNavItem[] | null>(null);
  const location = useLocation();

  const authT = authModal[lang];

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Load navigation from DB
  useEffect(() => {
    getSetting("site.nav").then((val) => {
      if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).items)) {
        setDbNavItems((val as any).items as DBNavItem[]);
      }
      // null → use static fallback; no update needed
    });
  }, []);

  // Check if current user is an admin (for dashboard link)
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      checkAdminProfile(data.session).then(result => { if (!cancelled) setIsAdmin(result); });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      checkAdminProfile(session).then(result => { if (!cancelled) setIsAdmin(result); });
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // Compute display nav — DB items (filtered + sorted) or static fallback
  const items = dbNavItems
    ? dbNavItems
        .filter(i => i.visible)
        .sort((a, b) => a.order - b.order)
        .map(i => ({
          label: lang === "en" ? i.label_en : i.label_ar,
          href:  i.href,
          cta:   i.cta ?? false,
        }))
    : pagesNav[lang];

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
            className="fixed inset-x-0 top-0 z-[999] w-full h-dvh overflow-y-auto bg-[rgba(15,23,42,0.97)] backdrop-blur-[12px] shadow-2xl shadow-black/40"
          >
            {/* Close button — stays fixed while content scrolls */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="fixed top-6 end-6 sm:top-10 sm:end-10 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-ivory hover:bg-white/10 hover:border-white/40 transition-colors"
            >
              <X size={26} />
            </button>

            <nav className="min-h-full flex flex-col items-center justify-center gap-6 sm:gap-7 text-center px-6 pt-28 pb-12">
              {items.map((item) =>
                item.cta ? (
                  /* CTA button */
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

              {/* Auth button */}
              <motion.button
                type="button"
                variants={linkVariants}
                onClick={() => { setOpen(false); window.setTimeout(() => setAuthOpen(true), 320); }}
                className="flex items-center gap-2 font-heading text-base sm:text-lg font-bold text-light-pink hover:text-white transition-colors mt-2"
              >
                <UserCircle2 size={22} />
                {authT.trigger}
              </motion.button>

              {/* Admin Dashboard — ONLY visible to authenticated admin/staff users */}
              {isAdmin && (
                <motion.div variants={linkVariants}>
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/25 text-sm font-semibold text-ivory/70 hover:text-white hover:border-white/50 hover:bg-white/10 transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    {lang === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
                  </Link>
                </motion.div>
              )}
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
