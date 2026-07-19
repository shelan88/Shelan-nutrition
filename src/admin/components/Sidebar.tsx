/**
 * Sidebar — collapsible admin navigation sidebar.
 *
 * Desktop: 240px expanded / 60px collapsed (icon-only).
 * Mobile: hidden by default, slides in as a full-height overlay drawer.
 *
 * Groups nav items under labeled sections. Active state uses react-router
 * location. All labels are bilingual via useLanguage.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAdmin } from "../context/AdminContext";
import {
  NAV_ITEMS,
  NAV_GROUP_LABELS,
  type NavGroup,
  type NavItem,
} from "../data/navigation";
import NavigationItem from "./NavigationItem";
import { supabase } from "@/lib/supabase";
import { getUnreadCount } from "@/admin/repositories/messages.repository";

// ─── Logo mark ────────────────────────────────────────────────────────────────
function SidebarLogo({ collapsed, lang }: { collapsed: boolean; lang: "en" | "ar" }) {
  return (
    <Link
      to="/admin"
      className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--admin-border)] shrink-0 overflow-hidden"
    >
      {/* Brand icon */}
      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-sm shadow-deep-purple/20">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 2C5 2 3 4 3 6.5c0 2 1.5 3.5 3 4.5l2 1.5 2-1.5c1.5-1 3-2.5 3-4.5C13 4 11 2 8 2z" fill="white" fillOpacity=".9"/>
        </svg>
      </div>

      {/* Wordmark — hidden in collapsed mode */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <span className="font-semibold text-[15px] tracking-wide text-[var(--admin-text)] whitespace-nowrap leading-none">
              SHELAN
            </span>
            <p className="text-[9px] text-[var(--admin-text-faint)] tracking-[0.12em] uppercase whitespace-nowrap leading-none mt-0.5">
              {lang === "ar" ? "لوحة الإدارة" : "Admin Portal"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

// ─── User strip at the bottom ─────────────────────────────────────────────────
function SidebarUser({
  collapsed,
  name,
  initials,
  role,
}: {
  collapsed: boolean;
  name:      string;
  initials:  string;
  role:      string;
}) {
  return (
    <div className="shrink-0 border-t border-[var(--admin-border)] p-3">
      <div
        className={`flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--admin-hover-bg)] transition-colors cursor-pointer ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center text-white text-[11px] font-bold">
          {initials || "A"}
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-1 min-w-0"
            >
              <p className="text-[13px] font-medium text-[var(--admin-text)] truncate whitespace-nowrap leading-none">
                {name || "Admin"}
              </p>
              <p className="text-[11px] text-[var(--admin-text-faint)] whitespace-nowrap leading-none mt-0.5">
                {role || "Admin"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { lang } = useLanguage();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useAdmin();
  const location = useLocation();

  // Live admin user + unread message count
  const [adminName,     setAdminName]     = useState("");
  const [adminInitials, setAdminInitials] = useState("A");
  const [adminRole,     setAdminRole]     = useState("Admin");
  const [unreadCount,   setUnreadCount]   = useState(0);

  useEffect(() => {
    // Fetch current admin user from Supabase auth
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) return;
      const raw =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name     as string | undefined) ||
        user.email?.split("@")[0] ||
        "Admin";
      setAdminName(raw);
      setAdminInitials(
        raw.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("") || "A"
      );
    });

    // Fetch role from admin_profiles
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return;
      supabase
        .from("admin_profiles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.role) setAdminRole(profile.role);
        });
    });

    // Fetch unread message count
    getUnreadCount().then(setUnreadCount);

    // Refresh unread count every 60 s
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  // Override the messages badge with the live unread count
  const navItemsWithLiveBadge: NavItem[] = NAV_ITEMS.map((item) =>
    item.id === "messages"
      ? { ...item, badge: unreadCount > 0 ? String(unreadCount) : undefined }
      : item
  );

  // Grouped nav
  const groups: NavGroup[] = ["main", "content", "business", "insights", "system"];

  const renderNavGroup = (group: NavGroup, isMobile = false) => {
    const items = navItemsWithLiveBadge.filter((i) => i.group === group);
    const groupLabel = NAV_GROUP_LABELS[group][lang];
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    return (
      <div key={group} className={group !== "main" ? "mt-4" : ""}>
        {/* Group label */}
        {groupLabel && !isCollapsed && (
          <p className="px-3 mb-1 text-[9px] font-semibold tracking-[0.14em] uppercase text-[var(--admin-text-faint)]">
            {groupLabel}
          </p>
        )}
        {groupLabel && isCollapsed && (
          <div className="mx-auto w-4 h-px bg-[var(--admin-border)] my-2" />
        )}

        <ul className="space-y-0.5">
          {items.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              collapsed={isCollapsed}
              label={lang === "ar" ? item.labelAr : item.label}
              onNavigate={isMobile ? () => setMobileSidebarOpen(false) : undefined}
            />
          ))}
        </ul>
      </div>
    );
  };

  // ── Desktop sidebar ──────────────────────────────────────────────────────────
  const desktopSidebar = (
    <aside
      className={`
        hidden lg:flex flex-col h-screen sticky top-0
        bg-[var(--admin-surface)] border-e border-[var(--admin-border)]
        transition-all duration-300 ease-out shrink-0 z-20
        ${sidebarCollapsed ? "w-[60px]" : "w-[240px]"}
      `}
    >
      <SidebarLogo collapsed={sidebarCollapsed} lang={lang} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0 no-scrollbar">
        {groups.map((g) => renderNavGroup(g))}
      </nav>

      {/* View site link */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text-muted)] transition-colors"
          >
            <ExternalLink size={13} strokeWidth={1.8} />
            <span>{lang === "ar" ? "عرض الموقع العام" : "View public site"}</span>
          </a>
        </div>
      )}

      <SidebarUser collapsed={sidebarCollapsed} name={adminName} initials={adminInitials} role={adminRole} />

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="
          absolute -end-3 top-[72px]
          w-6 h-6 rounded-full
          bg-[var(--admin-surface)] border border-[var(--admin-border)]
          flex items-center justify-center
          text-[var(--admin-text-faint)] hover:text-[var(--admin-text-muted)]
          shadow-sm hover:shadow-md
          transition-all duration-200 z-30
        "
      >
        {sidebarCollapsed
          ? <ChevronRight size={12} strokeWidth={2.5} className="rtl:rotate-180" />
          : <ChevronLeft size={12} strokeWidth={2.5} className="rtl:rotate-180" />
        }
      </button>
    </aside>
  );

  // ── Mobile drawer ────────────────────────────────────────────────────────────
  const mobileSidebar = (
    <AnimatePresence>
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: lang === "ar" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: lang === "ar" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="
              lg:hidden fixed inset-y-0 start-0 w-72
              bg-[var(--admin-surface)] flex flex-col z-50
              shadow-2xl shadow-black/25
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--admin-border)] shrink-0">
              <Link
                to="/admin"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C5 2 3 4 3 6.5c0 2 1.5 3.5 3 4.5l2 1.5 2-1.5c1.5-1 3-2.5 3-4.5C13 4 11 2 8 2z" fill="white" fillOpacity=".9"/>
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-[15px] tracking-wide text-[var(--admin-text)]">SHELAN</span>
                  <p className="text-[9px] text-[var(--admin-text-faint)] tracking-[0.12em] uppercase leading-none mt-0.5">{lang === "ar" ? "لوحة الإدارة" : "Admin Portal"}</p>
                </div>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
              {groups.map((g) => renderNavGroup(g, true))}
            </nav>

            <SidebarUser collapsed={false} name={adminName} initials={adminInitials} role={adminRole} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}
