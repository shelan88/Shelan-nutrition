/**
 * AdminLayout — master shell for all admin portal pages.
 *
 * Structure:
 *   <AdminProvider>          ← context: sidebar state, theme
 *     <div.admin-shell>      ← CSS variable scope + font reset
 *       <Sidebar />          ← sticky left panel (desktop) / drawer (mobile)
 *       <div.main-column>
 *         <Topbar />         ← fixed top bar with breadcrumbs + actions
 *         <ContentContainer> ← scrollable page content area
 *           <Routes>         ← nested admin sub-routes
 *         </ContentContainer>
 *       </div>
 *     </div>
 *   </AdminProvider>
 *
 * To add a new admin page:
 *   1. Add entry to src/admin/data/navigation.ts
 *   2. Add <Route> below
 *   Done — no other file changes needed.
 */
import { Routes, Route } from "react-router-dom";
import { AdminProvider } from "../context/AdminContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ContentContainer from "./ContentContainer";
import DashboardPage from "../pages/DashboardPage";
import ClientsPage from "../pages/ClientsPage";
import BlogAdminPage from "../pages/BlogAdminPage";
import ServicesAdminPage from "../pages/ServicesAdminPage";
import TestimonialsAdminPage from "../pages/TestimonialsAdminPage";
import FAQAdminPage from "../pages/FAQAdminPage";
import ProgramsAdminPage from "../pages/ProgramsAdminPage";
import SuccessStoriesAdminPage from "../pages/SuccessStoriesAdminPage";
import WebsiteSettingsPage from "../pages/WebsiteSettingsPage";
import SocialMediaAdminPage from "../pages/SocialMediaAdminPage";
import MediaLibraryPage from "../pages/MediaLibraryPage";
import PlaceholderPage from "../pages/PlaceholderPage";
import MessagesAdminPage from "../pages/MessagesAdminPage";
import BookingsAdminPage from "../pages/BookingsAdminPage";
import SEOPage from "../pages/SEOPage";

export default function AdminLayout() {
  return (
    <AdminProvider>
      <div className="admin-shell flex h-screen overflow-hidden">
        {/* Sidebar — sticky left panel */}
        <Sidebar />

        {/* Main column — topbar + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
          <Topbar />

          <ContentContainer>
            <Routes>
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />

              {/* Content — CMS-powered pages */}
              <Route path="website-builder"       element={<WebsiteSettingsPage />} />
              <Route path="website-settings"      element={<WebsiteSettingsPage />} />
              <Route path="social-media"          element={<SocialMediaAdminPage />} />
              <Route path="services"              element={<ServicesAdminPage />} />
              <Route path="blog"                  element={<BlogAdminPage />} />
              <Route path="testimonials"          element={<TestimonialsAdminPage />} />
              <Route path="media-library"         element={<MediaLibraryPage />} />
              <Route path="faqs"                  element={<FAQAdminPage />} />
              <Route path="programs"              element={<ProgramsAdminPage />} />
              <Route path="success-stories"       element={<SuccessStoriesAdminPage />} />

              {/* Content — still placeholder */}
              <Route path="assessment-templates"  element={<PlaceholderPage pageId="assessment-templates" />} />

              {/* Business */}
              <Route path="bookings"              element={<BookingsAdminPage />} />
              <Route path="clients"               element={<ClientsPage />} />
              <Route path="payments"              element={<PlaceholderPage pageId="payments" />} />
              <Route path="messages"              element={<MessagesAdminPage />} />

              {/* Insights */}
              <Route path="analytics"             element={<PlaceholderPage pageId="analytics" />} />
              <Route path="seo"                   element={<SEOPage />} />

              {/* System */}
              <Route path="settings"              element={<PlaceholderPage pageId="settings" />} />

              {/* Fallback — redirect to dashboard */}
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </ContentContainer>
        </div>
      </div>
    </AdminProvider>
  );
}
