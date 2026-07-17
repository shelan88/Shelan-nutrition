/**
 * BookingPage — Premium multi-step booking flow.
 * Reads optional ?service= URL param to pre-select a service.
 *
 * Authentication is required to book. Unauthenticated visitors see the
 * AuthRequiredDialog. After sign-in/sign-up the dialog closes and the
 * BookingFlow renders with the service still pre-selected (URL param
 * is preserved through the auth round-trip).
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { bookingData } from "@/data/booking.data";
import { bookingStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import BookingFlow from "@/sections/booking/BookingFlow";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";

export default function BookingPage() {
  const { lang }                    = useLanguage();
  const [searchParams]              = useSearchParams();
  const preselectedServiceId        = searchParams.get("service") ?? undefined;
  const { user, loading }           = useAuth();
  // Show the auth dialog until the user is confirmed authenticated.
  // Once they log in the dialog is dismissed and BookingFlow is visible.
  const [dialogDismissed, setDialogDismissed] = useState(false);

  const data = bookingData[lang];
  const str  = bookingStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "احجزي الآن | SHELAN" : "Book a Consultation | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home",     href: "/" },
    { label: lang === "ar" ? "احجزي الآن" : "Book Now" },
  ];

  // If user was already logged in when they landed, never show the dialog.
  const showAuthGate = !loading && !user && !dialogDismissed;

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        breadcrumbs={breadcrumbs}
      />

      <section className="py-20 bg-light-pink/15 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Show skeleton / nothing while resolving session */}
          {!loading && user && (
            <BookingFlow
              data={data}
              strings={str as unknown as Record<string, string | string[]>}
              preselectedServiceId={preselectedServiceId}
            />
          )}
        </div>
      </section>

      {/* Auth gate rendered as a portal — sits above the page content */}
      <AnimatePresence>
        {showAuthGate && (
          <AuthRequiredDialog
            onClose={() => setDialogDismissed(true)}
            onAuthenticated={() => {
              // useAuth picks up the new session automatically; no extra work needed.
              setDialogDismissed(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
