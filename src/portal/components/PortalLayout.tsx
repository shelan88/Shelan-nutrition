/**
 * PortalLayout — wraps all client portal pages with:
 *   • Auth guard (shows sign-in prompt if no session)
 *   • Horizontal tab navigation
 *   • Shared loading / error state via useClientProfile
 */

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  User, Calendar, ClipboardList, Utensils,
  TrendingUp, Folder, Settings, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/AuthModal";
import type { ReactNode } from "react";

const NAV = [
  { href: "/portal/profile",      label: "My Profile",     labelAr: "ملفي الشخصي",  Icon: User           },
  { href: "/portal/appointments", label: "Appointments",   labelAr: "المواعيد",      Icon: Calendar       },
  { href: "/portal/assessments",  label: "Assessments",    labelAr: "التقييمات",     Icon: ClipboardList  },
  { href: "/portal/nutrition",    label: "Nutrition Plans",labelAr: "خطط التغذية",   Icon: Utensils       },
  { href: "/portal/progress",     label: "Progress",       labelAr: "التقدم",        Icon: TrendingUp     },
  { href: "/portal/files",        label: "My Files",       labelAr: "ملفاتي",        Icon: Folder         },
  { href: "/portal/settings",     label: "Settings",       labelAr: "الإعدادات",     Icon: Settings       },
] as const;

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  const isAr = lang === "ar";

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary-pink/20 flex items-center justify-center mb-6">
          <ShieldAlert className="text-primary-pink" size={30} />
        </div>
        <h2 className="font-heading text-2xl font-bold text-ivory mb-3 text-center">
          {isAr ? "يرجى تسجيل الدخول" : "Sign in required"}
        </h2>
        <p className="text-ivory/60 text-center max-w-sm mb-8">
          {isAr
            ? "قم بتسجيل الدخول للوصول إلى بوابتك الشخصية."
            : "Please sign in to access your personal portal."}
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple font-semibold text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isAr ? "تسجيل الدخول" : "Sign In"}
        </button>

        <AnimatePresence>
          {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-16">
      {/* Tab navigation */}
      <div className="border-b border-white/10 bg-deep-purple/60 backdrop-blur-sm sticky top-24 sm:top-28 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex overflow-x-auto gap-0 hide-scrollbar" aria-label="Portal navigation">
            {NAV.map(({ href, label, labelAr, Icon }) => {
              const active = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                    active
                      ? "border-primary-pink text-primary-pink"
                      : "border-transparent text-ivory/50 hover:text-ivory/80 hover:border-white/20"
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="hidden sm:block">{isAr ? labelAr : label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Profile context bar */}
      {profile && (
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-9 h-9 rounded-full object-cover border border-white/20"
              />
            ) : (
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white select-none"
                style={{ background: "linear-gradient(135deg, #e91e8c 0%, #c084fc 100%)" }}
              >
                {profile.initials ?? profile.full_name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-semibold text-ivory text-sm leading-none">{profile.full_name}</p>
              <p className="text-ivory/40 text-xs mt-0.5">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        {children}
      </div>
    </div>
  );
}
