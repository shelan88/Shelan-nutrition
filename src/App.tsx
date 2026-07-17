/**
 * App — Root component with React Router v6 setup.
 *
 * Route structure:
 *   PUBLIC (with Navbar + Footer + public chrome):
 *     /              → HomePage
 *     /about         → AboutPage
 *     /services      → ServicesPage
 *     /services/:slug → ServiceDetailPage
 *     /blog          → BlogPage
 *     /blog/:slug    → BlogDetailPage
 *     /contact       → ContactPage
 *     /booking       → BookingPage
 *     /assessment    → AssessmentPage
 *     *              → NotFoundPage
 *
 *   ADMIN (completely isolated shell — no public Navbar/Footer):
 *     /admin/login   → AdminLoginPage   (standalone, no sidebar)
 *     /admin/*       → AdminLayout      (sidebar + topbar + nested routes)
 *
 * The public and admin worlds are completely separated at the routing level.
 * Admin pages never see the public Navbar/Footer, and vice-versa.
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AssessmentPage from "@/pages/AssessmentPage";
import AssessmentResponsePage from "@/pages/AssessmentResponsePage";
import NotFoundPage from "@/pages/NotFoundPage";

// ─── Admin portal ──────────────────────────────────────────────────────────────
import AdminLoginPage from "@/admin/pages/LoginPage";
import AdminLayout from "@/admin/components/AdminLayout";
import AuthGuard from "@/admin/components/AuthGuard";

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
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/assessment/respond/:appointmentId" element={<AssessmentResponsePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ScrollToTop />
        <Routes>
          {/* Admin — completely isolated, no public chrome */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AuthGuard><AdminLayout /></AuthGuard>} />

          {/* Public — wrapped in Navbar + Footer + chrome */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}
