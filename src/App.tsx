/**
 * App — Root component with React Router v6 setup.
 *
 * Route structure:
 *   PUBLIC (with Navbar + Footer + public chrome):
 *     /              → HomePage
 *     /about         → AboutPage
 *     /services      → ServicesPage
 *     /services/:slug → ServiceDetailPage
 *     /programs/:id  → ProgramDetailPage
 *     /blog          → BlogPage
 *     /blog/:slug    → BlogDetailPage
 *     /contact       → ContactPage
 *     /booking       → BookingPage
 *     /assessment    → AssessmentPage
 *     /portal/*      → Client Portal (PortalLayout guard)
 *     *              → NotFoundPage
 *
 *   ADMIN (completely isolated shell — no public Navbar/Footer):
 *     /admin/login   → AdminLoginPage   (standalone, no sidebar)
 *     /admin/*       → AdminLayout      (sidebar + topbar + nested routes)
 *
 * The public and admin worlds are completely separated at the routing level.
 * Admin pages never see the public Navbar/Footer, and vice-versa.
 */
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { debugLog } from "@/shared/debug/logger";
import { trackPageView } from "@/lib/analytics";
import { LanguageProvider } from "@/context/LanguageContext";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { supabase } from "@/lib/supabase";

// ─── Public site chrome ────────────────────────────────────────────────────────
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ProgressBar from "@/components/ProgressBar";

// ─── Public pages ──────────────────────────────────────────────────────────────
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import BlogPage from "@/pages/BlogPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import ContactPage from "@/pages/ContactPage";
import BookingPage from "@/pages/BookingPage";
import ProgramDetailPage from "@/pages/ProgramDetailPage";
import AssessmentPage from "@/pages/AssessmentPage";
import AssessmentResponsePage from "@/pages/AssessmentResponsePage";
import NotFoundPage from "@/pages/NotFoundPage";

// ─── Client portal ─────────────────────────────────────────────────────────────
import PortalLayout from "@/portal/components/PortalLayout";
import ProfilePage from "@/portal/pages/ProfilePage";
import AppointmentsPage from "@/portal/pages/AppointmentsPage";
import AssessmentsPage from "@/portal/pages/AssessmentsPage";
import NutritionPage from "@/portal/pages/NutritionPage";
import ProgressPage from "@/portal/pages/ProgressPage";
import FilesPage from "@/portal/pages/FilesPage";
import SettingsPage from "@/portal/pages/SettingsPage";

// ─── Shared reset-password page (customers + admins) ──────────────────────────
import ResetPasswordPage from "@/pages/ResetPasswordPage";

// ─── Admin portal ──────────────────────────────────────────────────────────────
import AdminLoginPage from "@/admin/pages/LoginPage";
import AdminResetPasswordPage from "@/admin/pages/ResetPasswordPage";
import AdminLayout from "@/admin/components/AdminLayout";
import AuthGuard from "@/admin/components/AuthGuard";
import DebugPanel from "@/shared/debug/DebugPanel";

/**
 * PublicLayout — wraps all public-facing pages with the shared site chrome.
 * Completely invisible to admin routes.
 */
function PublicLayout() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <Routes>
          {/* Standard public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/programs/:id" element={<ProgramDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/assessment/respond/:appointmentId" element={<AssessmentResponsePage />} />

          {/* Client portal — guarded inside PortalLayout */}
          <Route path="/portal" element={<Navigate to="/portal/profile" replace />} />
          <Route
            path="/portal/profile"
            element={<PortalLayout><ProfilePage /></PortalLayout>}
          />
          <Route
            path="/portal/appointments"
            element={<PortalLayout><AppointmentsPage /></PortalLayout>}
          />
          <Route
            path="/portal/assessments"
            element={<PortalLayout><AssessmentsPage /></PortalLayout>}
          />
          <Route
            path="/portal/nutrition"
            element={<PortalLayout><NutritionPage /></PortalLayout>}
          />
          <Route
            path="/portal/progress"
            element={<PortalLayout><ProgressPage /></PortalLayout>}
          />
          <Route
            path="/portal/files"
            element={<PortalLayout><FilesPage /></PortalLayout>}
          />
          <Route
            path="/portal/settings"
            element={<PortalLayout><SettingsPage /></PortalLayout>}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

/**
 * Catches Supabase PASSWORD_RECOVERY events on any page and redirects ALL
 * users (customers and admins) to /reset-password before role-specific
 * rendering happens.
 *
 * WHY THIS IS NEEDED:
 * AuthModal calls resetPasswordForEmail with redirectTo pointing to
 * /reset-password, but if that URL is not yet in the Supabase Redirect URLs
 * allowlist, Supabase falls back to the Site URL (homepage). The user lands
 * on / signed in, with no reset form. This interceptor catches the
 * PASSWORD_RECOVERY event wherever it fires and routes to the reset page.
 *
 * It also checks INITIAL_SESSION for a recovery-flavoured JWT (AMR method
 * "recovery") to handle the implicit-flow case where Supabase processes the
 * recovery hash synchronously before any subscriber registers, meaning
 * PASSWORD_RECOVERY already fired before this component mounted.
 */
function PasswordRecoveryInterceptor() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Already on a reset page — don't loop
    if (pathname === "/reset-password" || pathname === "/admin/reset-password") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
        return;
      }
      // INITIAL_SESSION fires immediately on subscribe. If the recovery token
      // was processed synchronously (implicit flow) the session's JWT already
      // carries amr[].method === "recovery".
      if (event === "INITIAL_SESSION" && session) {
        try {
          const payload = JSON.parse(atob(session.access_token.split(".")[1]));
          const amr: Array<{ method: string }> = payload.amr ?? [];
          if (amr.some((a) => a.method === "recovery")) {
            navigate("/reset-password", { replace: true });
          }
        } catch {
          // malformed JWT — ignore
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, pathname]);

  return null;
}

/** Logs every client-side route change and fires GA4 page_view. */
function RouteLogger() {
  const { pathname } = useLocation();
  useEffect(() => {
    // DEV: feed the floating debug panel
    debugLog({
      level: "log", category: "navigation",
      module: "Router", component: "RouteLogger",
      action: `route → ${pathname}`,
      result: "info",
    });

    // GA4 SPA page tracking — deferred one tick so useSEO has set document.title first
    const id = setTimeout(() => {
      trackPageView(pathname, document.title);
    }, 0);
    return () => clearTimeout(id);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ScrollToTop />
        <RouteLogger />
        <PasswordRecoveryInterceptor />
        <Routes>
          {/* Standalone reset-password — no Navbar/Footer, works for all users */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin — completely isolated, no public chrome */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
          <Route path="/admin/*" element={<AuthGuard><AdminLayout /></AuthGuard>} />

          {/* Public — wrapped in Navbar + Footer + chrome */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
        {/* ── DEV ONLY: global debug panel — remove before production ship */}
        {import.meta.env.DEV && <DebugPanel />}
      </LanguageProvider>
    </BrowserRouter>
  );
}
