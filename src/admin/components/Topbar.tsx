/**
 * Topbar — admin portal top navigation bar.
 *
 * Left:   Hamburger (mobile) + Breadcrumbs
 * Right:  Search · Notifications · Language · Theme · User menu
 *
 * Implemented controls:
 *  - Search   → GlobalSearchModal (clients / bookings / assessments / plans)
 *              also opens on Cmd/Ctrl + K
 *  - Bell     → inline dropdown with empty state (no fake data)
 *  - Theme    → toggles dark/light via AdminContext (persisted in localStorage)
 *  - Language → toggles AR/EN via LanguageContext
 *  - User     → dropdown with profile link + sign-out
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, Bell, Sun, Moon, ChevronDown,
  ChevronRight, LogOut, User, ExternalLink, BellOff,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAdmin } from "../context/AdminContext";
import { PAGE_META } from "../data/navigation";
import { supabase } from "@/lib/supabase";
import GlobalSearchModal from "./GlobalSearchModal";

// ─── Breadcrumb builder ───────────────────────────────────────────────────────
function useBreadcrumbs(lang: "en" | "ar") {
  const location = useLocation();
  const segments = location.pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);

  const crumbs = [
    { label: lang === "ar" ? "لوحة التحكم" : "Dashboard", href: "/admin" },
  ];

  if (segments.length > 0) {
    const id = segments[0];
    const meta = PAGE_META[id];
    if (meta) {
      crumbs.push({
        label: lang === "ar" ? meta.titleAr : meta.title,
        href: `/admin/${id}`,
      });
    }
  }

  return crumbs;
}

// ─── User dropdown ────────────────────────────────────────────────────────────
function UserMenu({ lang }: { lang: "en" | "ar" }) {
  const [open,       setOpen]       = useState(false);
  const [adminName,  setAdminName]  = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const ref      = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = (user.user_metadata?.full_name as string | undefined) ?? "";
      setAdminName(name || user.email?.split("@")[0] || "Admin");
      setAdminEmail(user.email ?? "");
    });
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nameParts = adminName.trim().split(/\s+/).filter(Boolean);
  const inits =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : adminName.trim()
      ? adminName.trim()[0].toUpperCase()
      : adminEmail[0]?.toUpperCase() ?? "A";

  const items = lang === "ar"
    ? [
        { icon: User,         label: "الملف الشخصي", href: "/admin/profile",  external: false },
        { icon: ExternalLink, label: "الموقع العام",  href: "/",              external: true  },
      ]
    : [
        { icon: User,         label: "Profile",          href: "/admin/profile", external: false },
        { icon: ExternalLink, label: "View public site",  href: "/",             external: true  },
      ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--admin-hover-bg)] transition-colors"
        aria-expanded={open}
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
          {inits}
        </div>
        <span className="hidden sm:block text-[13px] font-medium text-[var(--admin-text)]">
          {adminName || "Admin"}
        </span>
        <ChevronDown size={13} className={`text-[var(--admin-text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0,    y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="
              absolute end-0 top-full mt-2 w-52 z-50
              bg-[var(--admin-surface)] rounded-xl
              border border-[var(--admin-border)]
              shadow-xl shadow-black/10
              py-1.5 overflow-hidden
            "
          >
            <div className="px-4 py-3 border-b border-[var(--admin-border)]">
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {adminName || "Admin"}
              </p>
              <p className="text-[11px] text-[var(--admin-text-faint)]">{adminEmail}</p>
            </div>

            <div className="py-1">
              {items.map((item) => {
                const Icon = item.icon;
                return item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                  >
                    <Icon size={14} strokeWidth={1.8} />
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                  >
                    <Icon size={14} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-[var(--admin-border)] py-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-400 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} strokeWidth={1.8} />
                {lang === "ar" ? "تسجيل الخروج" : "Sign out"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Notifications dropdown ───────────────────────────────────────────────────
// No real notification system exists yet.  We show an honest empty state
// rather than fabricating counts or mock data.
function NotificationsDropdown({ lang }: { lang: "en" | "ar" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={lang === "ar" ? "الإشعارات" : "Notifications"}
        aria-expanded={open}
        className={`
          relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors
          ${open
            ? "bg-[var(--admin-active-bg)] text-[var(--admin-text-muted)]"
            : "text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text-muted)]"
          }
        `}
      >
        <Bell size={16} strokeWidth={1.8} />
        {/* No badge — no real data */}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0,    y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="
              absolute end-0 top-full mt-2 w-72 z-50
              bg-[var(--admin-surface)] rounded-xl
              border border-[var(--admin-border)]
              shadow-xl shadow-black/10
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--admin-border)]">
              <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                {lang === "ar" ? "الإشعارات" : "Notifications"}
              </p>
            </div>

            {/* Empty state */}
            <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--admin-hover-bg)] flex items-center justify-center">
                <BellOff size={18} className="text-[var(--admin-text-faint)]" strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--admin-text-muted)]">
                  {lang === "ar" ? "لا توجد إشعارات" : "No notifications"}
                </p>
                <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">
                  {lang === "ar"
                    ? "ستظهر الإشعارات هنا عند وصولها"
                    : "Notifications will appear here when they arrive"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Topbar ──────────────────────────────────────────────────────────────
export default function Topbar() {
  const { lang, toggleLang } = useLanguage();
  const { setMobileSidebarOpen, theme, toggleTheme } = useAdmin();
  const breadcrumbs = useBreadcrumbs(lang);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl + K opens search from anywhere in the admin portal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] z-10">
        {/* Left: hamburger + breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <nav aria-label="Admin breadcrumb" className="flex items-center gap-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <ChevronRight size={12} className="text-[var(--admin-text-faint)] shrink-0 rtl:rotate-180" />
                )}
                {i < breadcrumbs.length - 1 ? (
                  <Link
                    to={crumb.href}
                    className="text-[12px] text-[var(--admin-text-muted)] hover:text-primary-pink transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[12px] font-medium text-[var(--admin-text)] truncate">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Search — opens GlobalSearchModal */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={lang === "ar" ? "بحث (⌘K)" : "Search (⌘K)"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text-muted)] transition-colors"
          >
            <Search size={16} strokeWidth={1.8} />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--admin-border)] mx-1" />

          {/* Notifications — real empty state, no fabricated badge */}
          <NotificationsDropdown lang={lang} />

          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Toggle language"
            className="h-8 px-2.5 rounded-lg text-[11px] font-semibold text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors tracking-wide"
          >
            {lang === "en" ? "AR" : "EN"}
          </button>

          {/* Theme toggle — persisted to localStorage via AdminContext */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={lang === "ar"
              ? (theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح")
              : (theme === "light" ? "Switch to dark mode" : "Switch to light mode")
            }
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text-muted)] transition-colors"
          >
            {theme === "light"
              ? <Moon size={15} strokeWidth={1.8} />
              : <Sun  size={15} strokeWidth={1.8} />
            }
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--admin-border)] mx-1" />

          {/* User menu */}
          <UserMenu lang={lang} />
        </div>
      </header>

      {/* Global search modal — rendered outside header to avoid z-index stacking */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
      />
    </>
  );
}
