/**
 * PortalLayout — wraps all client portal pages with:
 *   • Auth guard (shows sign-in prompt if no session)
 *   • Consistent top padding to clear the fixed Navbar
 *   • Centered max-width content container
 *
 * Navigation is handled entirely by the Navbar avatar dropdown —
 * no duplicate tab bar is rendered here.
 */

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/AuthModal";
import type { ReactNode } from "react";

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);

  const isAr = lang === "ar";

  // ── Still resolving auth ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!user) {
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

  // ── Authenticated ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {children}
      </div>
    </div>
  );
}
