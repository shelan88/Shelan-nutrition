/**
 * AdminContext — global state for the Admin Portal shell.
 *
 * Provides:
 *  - sidebarCollapsed   desktop sidebar toggle (icon-only mode)
 *  - mobileSidebarOpen  mobile overlay drawer toggle
 *  - theme              light | dark (prepared — no dark styles yet)
 *
 * Future: add user session, permissions, notification count.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface AdminContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

const SIDEBAR_KEY = "shelan-admin-sidebar-collapsed";
const THEME_KEY = "shelan-admin-theme";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const setSidebarCollapsed = (v: boolean) => {
    setSidebarCollapsedState(v);
    try {
      localStorage.setItem(SIDEBAR_KEY, String(v));
    } catch { /* ignore */ }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch { /* ignore */ }
  };

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false);
    };
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
