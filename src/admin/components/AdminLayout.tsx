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
import PlaceholderPage from "../pages/PlaceholderPage";

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

              {/* Content */}
              <Route path="website-builder"       element={<PlaceholderPage pageId="website-builder" />} />
              <Route path="services"              element={<PlaceholderPage pageId="services" />} />
              <Route path="assessment-templates"  element={<PlaceholderPage pageId="assessment-templates" />} />
              <Route path="blog"                  element={<PlaceholderPage pageId="blog" />} />
              <Route path="testimonials"          element={<PlaceholderPage pageId="testimonials" />} />
              <Route path="media-library"         element={<PlaceholderPage pageId="media-library" />} />

              {/* Business */}
              <Route path="bookings"              element={<PlaceholderPage pageId="bookings" />} />
              <Route path="clients"               element={<ClientsPage />} />
              <Route path="payments"              element={<PlaceholderPage pageId="payments" />} />
              <Route path="messages"              element={<PlaceholderPage pageId="messages" />} />

              {/* Insights */}
              <Route path="analytics"             element={<PlaceholderPage pageId="analytics" />} />
              <Route path="seo"                   element={<PlaceholderPage pageId="seo" />} />

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
