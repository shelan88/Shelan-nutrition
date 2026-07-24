/**
 * AdminContext — global state for the Admin Portal shell.
 *
 * Provides:
 *  - sidebarCollapsed   desktop sidebar toggle (icon-only mode)
 *  - mobileSidebarOpen  mobile overlay drawer toggle
 *  - theme              light | dark — persisted to localStorage; AdminLayout
 *                       applies class="dark" to .admin-shell so all
 *                       var(--admin-*) CSS tokens and scoped overrides in
 *                       index.css activate without flash on page load.
 *  - avatarUrl          current admin avatar URL from admin_profiles table;
 *                       null when no photo has been set (shows initials).
 *  - avatarNonce        increments on every setAvatarUrl() call so all <img>
 *                       consumers add ?av={nonce} to bust the CDN cache.
 *  - setAvatarUrl       call after a successful upload to instantly propagate
 *                       the new photo everywhere without a page refresh.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

type Theme = "light" | "dark";

interface AdminContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  /** Current admin avatar URL; null = no photo, show initials. */
  avatarUrl: string | null;
  /** Increments on each setAvatarUrl() — append as ?av={nonce} to bust cache. */
  avatarNonce: number;
  /** Call with the new public URL after a successful upload. */
  setAvatarUrl: (url: string | null) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const SIDEBAR_KEY = "shelan-admin-sidebar-collapsed";
const THEME_KEY   = "shelan-admin-theme";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return stored === "dark" ? "dark" : "light";
    } catch { return "light"; }
  });

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const [avatarUrlRaw, setAvatarUrlRaw] = useState<string | null>(null);
  const [avatarNonce,  setAvatarNonce]  = useState(0);

  // Load avatar once on mount.  AdminProvider is inside the auth-guard so the
  // Supabase session is already established by the time this effect runs.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      supabase
        .from("admin_profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data?.avatar_url) setAvatarUrlRaw(data.avatar_url as string);
        });
    });
    return () => { cancelled = true; };
  }, []);

  /** Reactive setter — updates state and bumps the cache-buster nonce. */
  const setAvatarUrl = (url: string | null) => {
    setAvatarUrlRaw(url);
    setAvatarNonce((n) => n + 1);
  };

  // ── Sidebar / theme helpers ─────────────────────────────────────────────────
  const setSidebarCollapsed = (v: boolean) => {
    setSidebarCollapsedState(v);
    try { localStorage.setItem(SIDEBAR_KEY, String(v)); } catch { /* ignore */ }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        theme,
        toggleTheme,
        avatarUrl:    avatarUrlRaw,
        avatarNonce,
        setAvatarUrl,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
