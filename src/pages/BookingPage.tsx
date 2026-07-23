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
import { useSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { bookingData } from "@/data/booking.data";
import { bookingStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import BookingFlow from "@/sections/booking/BookingFlow";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import { useAuth } from "@/hooks/useAuth";
import { findClientByEmail } from "@/admin/repositories/clients.repository";

export default function BookingPage() {
  const { lang }                    = useLanguage();
  const [searchParams]              = useSearchParams();
  const preselectedServiceId        = searchParams.get("service") ?? undefined;
  const preselectedProgramId        = searchParams.get("program") ?? undefined;
  const { user, loading }           = useAuth();
  const navigate                    = useNavigate();

  // Show the auth dialog until the user is confirmed authenticated.
  // Once they log in the dialog is dismissed and BookingFlow is visible.
  const [dialogDismissed, setDialogDismissed] = useState(false);

  // Whether we are still checking if the authenticated user has a client record.
  const [checkingClient, setCheckingClient] = useState(false);

  const data = bookingData[lang];
  const str  = bookingStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "احجزي الآن | SHELAN" : "Book a Consultation | SHELAN Nutrition";
  }, [lang]);

  // Once authentication is resolved, ensure the user has completed the health
  // assessment. If no client record exists for their email, send them to the
  // assessment page first — its success screen links back here.
  useEffect(() => {
    if (loading || !user) return;

    setCheckingClient(true);
    findClientByEmail(user.email ?? "").then((client) => {
      setCheckingClient(false);
      if (!client) {
        // No assessment on record — redirect to the questionnaire.
        // The assessment success screen links to /booking, completing the flow.
        navigate("/assessment");
      }
    }).catch(() => {
      // On any error just allow through — don't block the booking flow.
      setCheckingClient(false);
    });
  }, [user, loading, navigate]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home",     href: "/" },
    { label: lang === "ar" ? "احجزي الآن" : "Book Now" },
  ];

  // If user was already logged in when they landed, never show the dialog.
  const showAuthGate = !loading && !user && !dialogDismissed;

  // Show the booking flow only once auth is resolved, a user is present,
  // and we have confirmed a client record exists for them.
  const showBookingFlow = !loading && !!user && !checkingClient;

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
          {showBookingFlow && (
            <BookingFlow
              data={data}
              strings={str as unknown as Record<string, string | string[]>}
              preselectedServiceId={preselectedServiceId}
              preselectedProgramId={preselectedProgramId}
              canonicalServices={bookingData.en.services}
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
