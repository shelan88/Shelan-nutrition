/**
 * App — Root component with React Router v6 setup.
 *
 * Route structure:
 *   /              → HomePage (all existing homepage sections)
 *   /about         → AboutPage
 *   /services      → ServicesPage
 *   /services/:slug → ServiceDetailPage
 *   /blog          → BlogPage
 *   /blog/:slug    → BlogDetailPage
 *   /contact       → ContactPage
 *   /booking       → BookingPage
 *   *              → NotFoundPage
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ProgressBar from "@/components/ProgressBar";
import ScrollToTop from "@/components/ui/ScrollToTop";

import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetailPage from "@/pages/ServiceDetailPage";
import BlogPage from "@/pages/BlogPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import ContactPage from "@/pages/ContactPage";
import BookingPage from "@/pages/BookingPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ProgressBar />
        <Navbar />
        <ScrollToTop />
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <BackToTop />
      </LanguageProvider>
    </BrowserRouter>
  );
}
