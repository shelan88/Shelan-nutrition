/**
 * Navbar — Fixed header with full-screen overlay menu.
 *
 * Navigation items are loaded from Supabase (site.nav key) and fall back to
 * the static pagesNav from content.ts when no DB data exists.
 *
 * Auth-aware behaviour:
 *   • When NOT authenticated: shows Login/Register button (opens AuthModal).
 *   • When authenticated: shows avatar + portal dropdown (desktop) and portal
 *     navigation links inside the overlay menu. Login/Register is hidden.
 *   • "Admin Dashboard" link appears in the overlay ONLY for admin/staff users.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, X, UserCircle2, LayoutDashboard, LogOut,
  User, Calendar, ClipboardList, Utensils, TrendingUp, Folder, Settings, ChevronDown,
} from "lucide-react";
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

// ── Portal nav links shown to authenticated clients ───────────────────────────

const PORTAL_NAV = [
  { href: "/portal/profile",      labelEn: "My Profile",      labelAr: "ملفي الشخصي",  Icon: User          },
  { href: "/portal/appointments", labelEn: "Appointments",    labelAr: "المواعيد",      Icon: Calendar      },
  { href: "/portal/assessments",  labelEn: "Assessments",     labelAr: "التقييمات",     Icon: ClipboardList },
  { href: "/portal/nutrition",    labelEn: "Nutrition Plans", labelAr: "خطط التغذية",   Icon: Utensils      },
  { href: "/portal/progress",     labelEn: "Progress",        labelAr: "التقدم",        Icon: TrendingUp    },
  { href: "/portal/files",        labelEn: "My Files",        labelAr: "ملفاتي",        Icon: Folder        },
  { href: "/portal/settings",     labelEn: "Settings",        labelAr: "الإعدادات",     Icon: Settings      },
] as const;

// ── Framer variants (unchanged) ───────────────────────────────────────────────

const curtainVariants = {
  hidden: { y: "-100%", opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut" as const,
      staggerChildren: 0.06,
      delayChildren: 0.12,
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
  const [open,          setOpen]          = useState(false);
  const [authOpen,      setAuthOpen]      = useState(false);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [hasSession,    setHasSession]    = useState(false);
  const [userInitials,  setUserInitials]  = useState("");
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(null);
  const [dbNavItems,    setDbNavItems]    = useState<DBNavItem[] | null>(null);
  const location = useLocation();
  const dropRef  = useRef<HTMLDivElement>(null);

  const authT = authModal[lang];

  // Close menu on route change
  useEffect(() => { setOpen(false); setDropOpen(false); }, [location.pathname]);

  // Lock body scroll when overlay menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropOpen]);

  // Load navigation from DB
  useEffect(() => {
    getSetting("site.nav").then((val) => {
      if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).items)) {
        setDbNavItems((val as any).items as DBNavItem[]);
      }
    });
  }, []);

  // Track session + admin status + user initials + avatar
  useEffect(() => {
    let cancelled = false;

    async function applySession(session: import("@supabase/supabase-js").Session | null) {
      setHasSession(!!session);
      if (session?.user) {
        const name: string =
          (session.user.user_metadata?.full_name as string | undefined) ?? "";
        const email = session.user.email ?? "";
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const initials =
          parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.trim()
            ? name.trim()[0].toUpperCase()
            : email[0]?.toUpperCase() ?? "?";
        setUserInitials(initials);

        // Fetch avatar_url from client row
        const { data } = await supabase
          .from("clients")
          .select("avatar_url")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!cancelled) setAvatarUrl((data as any)?.avatar_url ?? null);
      } else {
        setUserInitials("");
        setAvatarUrl(null);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      applySession(data.session);
      checkAdminProfile(data.session).then(result => { if (!cancelled) setIsAdmin(result); });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      applySession(session);
      checkAdminProfile(session).then(result => { if (!cancelled) setIsAdmin(result); });
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  // Re-fetch avatar when ProfilePage signals a successful save
  useEffect(() => {
    let cancelled = false;
    const handler = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      const { data } = await supabase
        .from("clients")
        .select("avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!cancelled) setAvatarUrl((data as any)?.avatar_url ?? null);
    };
    window.addEventListener("shelan:avatar-updated", handler);
    return () => { cancelled = true; window.removeEventListener("shelan:avatar-updated", handler); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    setDropOpen(false);
  };

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

  // Avatar display helper
  const AvatarBubble = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="avatar"
          className={`${dim} rounded-full object-cover border border-white/20 select-none`}
        />
      );
    }
    return (
      <span
        className={`${dim} rounded-full bg-primary-pink/80 flex items-center justify-center font-bold text-white select-none`}
      >
        {userInitials}
      </span>
    );
  };

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

          {/* ── AUTHENTICATED ─── */}
          {hasSession && (
            <>
              {/* Avatar dropdown — all screen sizes */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setDropOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full border border-white/15 hover:bg-white/10 transition-colors"
                  aria-label="My portal"
                  aria-expanded={dropOpen}
                >
                  <AvatarBubble size="sm" />
                  <ChevronDown size={12} className={`text-ivory/60 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute end-0 mt-2 w-56 rounded-2xl bg-[#1a1333] border border-white/15 shadow-2xl shadow-black/40 overflow-hidden z-[1001]"
                    >
                      {/* User identity hint */}
                      {userInitials && (
                        <div className="px-4 py-3 border-b border-white/8">
                          <div className="flex items-center gap-2.5">
                            <AvatarBubble size="sm" />
                            <span className="text-xs font-medium text-ivory/50 truncate">
                              {lang === "ar" ? "حسابي" : "My Account"}
                            </span>
                          </div>
                        </div>
                      )}
                      {/* Portal links */}
                      <div className="py-1">
                        {PORTAL_NAV.map(({ href, labelEn, labelAr, Icon }) => (
                          <Link
                            key={href}
                            to={href}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ivory/70 hover:text-ivory hover:bg-white/8 transition-colors"
                          >
                            <Icon size={14} className="text-ivory/40 shrink-0" />
                            {lang === "ar" ? labelAr : labelEn}
                          </Link>
                        ))}
                      </div>
                      {/* Divider + Sign Out */}
                      <div className="border-t border-white/10 py-1">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                          <LogOut size={14} className="shrink-0" />
                          {lang === "ar" ? "تسجيل الخروج" : "Sign Out"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* ── NOT AUTHENTICATED: show auth button ─── */}
          {!hasSession && (
            <>
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-ivory hover:bg-white/15 transition-colors"
                aria-label={authT.trigger}
              >
                <UserCircle2 size={16} />
                {authT.trigger}
              </button>
              <button
                onClick={() => setAuthOpen(true)}
                className="sm:hidden flex items-center justify-center w-11 h-11 rounded-full border border-white/15 text-ivory hover:bg-white/10 transition-colors"
                aria-label={authT.trigger}
              >
                <UserCircle2 size={20} />
              </button>
            </>
          )}

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
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="fixed top-6 end-6 sm:top-10 sm:end-10 z-10 w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-ivory hover:bg-white/10 hover:border-white/40 transition-colors"
            >
              <X size={26} />
            </button>

            <nav className="min-h-full flex flex-col items-center justify-center gap-5 sm:gap-6 text-center px-6 pt-28 pb-12">
              {/* Main site links */}
              {items.map((item) =>
                item.cta ? (
                  <motion.div key={item.href} variants={linkVariants}>
                    <Link
                      to={item.href}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple font-heading text-base font-bold text-white shadow-lg shadow-deep-purple/30 hover:shadow-xl hover:shadow-deep-purple/40 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ) : (
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

              {/* Divider */}
              <motion.div variants={linkVariants} className="w-16 h-px bg-white/10 my-1" />

              {/* ── AUTHENTICATED: portal links ───────── */}
              {hasSession && (
                <>
                  {/* User info */}
                  <motion.div variants={linkVariants} className="flex items-center gap-2.5">
                    <AvatarBubble size="sm" />
                    <span className="text-sm font-medium text-ivory/60">
                      {lang === "ar" ? "بوابتي الشخصية" : "My Portal"}
                    </span>
                  </motion.div>

                  {/* Portal nav links */}
                  {PORTAL_NAV.map(({ href, labelEn, labelAr, Icon }) => (
                    <motion.div key={href} variants={linkVariants}>
                      <Link
                        to={href}
                        className={`flex items-center justify-center gap-2 font-heading text-base font-semibold transition-colors ${
                          location.pathname === href
                            ? "text-primary-pink"
                            : "text-ivory/70 hover:text-ivory"
                        }`}
                      >
                        <Icon size={16} className="text-ivory/40 shrink-0" />
                        {lang === "ar" ? labelAr : labelEn}
                      </Link>
                    </motion.div>
                  ))}

                  {/* Sign Out */}
                  <motion.div variants={linkVariants}>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 font-heading text-base font-semibold text-red-400/80 hover:text-red-300 transition-colors"
                    >
                      <LogOut size={16} />
                      {lang === "ar" ? "تسجيل الخروج" : "Sign Out"}
                    </button>
                  </motion.div>
                </>
              )}

              {/* ── NOT AUTHENTICATED: login button ───── */}
              {!hasSession && (
                <motion.button
                  type="button"
                  variants={linkVariants}
                  onClick={() => { setOpen(false); window.setTimeout(() => setAuthOpen(true), 320); }}
                  className="flex items-center gap-2 font-heading text-base sm:text-lg font-bold text-light-pink hover:text-white transition-colors"
                >
                  <UserCircle2 size={22} />
                  {authT.trigger}
                </motion.button>
              )}

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
