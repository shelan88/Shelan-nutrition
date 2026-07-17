/**
 * AuthRequiredDialog — shown when an unauthenticated visitor tries to book.
 *
 * Presents an explanation and two buttons: "Create Account" and "Sign In".
 * Clicking either opens AuthModal with the correct initial view.
 * On successful auth, calls onAuthenticated(user) so the caller can proceed.
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, UserPlus, LogIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import AuthModal from "@/components/AuthModal";
import type { User } from "@supabase/supabase-js";

interface Props {
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export default function AuthRequiredDialog({ onClose, onAuthenticated }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [authView, setAuthView] = useState<"login" | "signup" | null>(null);

  // When the nested AuthModal succeeds, lift the user up and close everything.
  const handleAuthSuccess = (user: User) => {
    onAuthenticated(user);
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {authView ? (
        <AuthModal
          key="auth-modal"
          initialView={authView}
          onClose={() => setAuthView(null)}
          onSuccess={handleAuthSuccess}
        />
      ) : (
        <motion.div
          key="auth-required"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4 py-8 sm:p-6 bg-black/60 backdrop-blur-[4px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm my-auto rounded-[2rem] bg-white border border-gray-200 shadow-2xl shadow-black/40 overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 end-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-primary-pink/8 to-lavender-purple/8 px-8 pt-10 pb-7 text-center border-b border-soft-purple/10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-lg shadow-deep-purple/20 mb-4">
                <Lock className="text-white" size={24} />
              </div>
              <h3 className="font-heading text-xl font-bold text-heading mb-2">
                {isAr ? "يلزم تسجيل الدخول" : "Sign In to Book"}
              </h3>
              <p className="text-sm text-deep-purple/60 leading-relaxed">
                {isAr
                  ? "يرجى إنشاء حساب أو تسجيل الدخول لإتمام الحجز وتتبع تاريخ استشاراتكِ."
                  : "Create an account or sign in to complete your booking and track your consultation history."}
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 py-7 space-y-3">
              <button
                type="button"
                onClick={() => setAuthView("signup")}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-gradient-to-r from-primary-pink to-soft-pink text-white font-semibold shadow-lg shadow-deep-purple/20 hover:from-primary-pink hover:to-lavender-purple transition-colors"
              >
                <UserPlus size={17} />
                {isAr ? "إنشاء حساب" : "Create Account"}
              </button>
              <button
                type="button"
                onClick={() => setAuthView("login")}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full border-2 border-soft-purple/20 text-deep-purple font-semibold hover:bg-light-pink/30 transition-colors"
              >
                <LogIn size={17} />
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
