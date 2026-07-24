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
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { debugLog } from "@/shared/debug/logger";
import { LanguageProvider } from "@/context/LanguageContext";
import ScrollToTop from "@/components/ui/ScrollToTop";

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

// ─── Admin portal ──────────────────────────────────────────────────────────────
import AdminLoginPage from "@/admin/pages/LoginPage";
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

/** Logs every client-side route change into the debug panel (DEV only). */
function RouteLogger() {
  const { pathname } = useLocation();
  useEffect(() => {
    debugLog({
      level: "log", category: "navigation",
      module: "Router", component: "RouteLogger",
      action: `route → ${pathname}`,
      result: "info",
    });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ScrollToTop />
        <RouteLogger />
        <Routes>
          {/* Admin — completely isolated, no public chrome */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
