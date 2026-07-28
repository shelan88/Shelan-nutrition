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
import { useSEO, buildBreadcrumbLd } from "@/hooks/useSEO";
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

  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [checkingClient, setCheckingClient]   = useState(false);

  const data = bookingData[lang];
  const str  = bookingStrings[lang];

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home",     href: "/" },
    { label: lang === "ar" ? "احجزي الآن" : "Book Now" },
  ];

  useSEO({
    title:
      lang === "ar"
        ? "احجزي استشارتكِ | SHELAN — أخصائية تغذية"
        : "Book a Consultation | SHELAN Nutrition",
    description:
      lang === "ar"
        ? "احجزي استشارتكِ الأولى مع شيلان — أخصائية تغذية معتمدة. اختاري الخدمة المناسبة وحددي موعدك في دقائق."
        : "Book your first consultation with Shelan, certified nutritionist. Choose your service and schedule your appointment in minutes.",
    path: "/booking",
    lang,
    jsonLd: buildBreadcrumbLd(breadcrumbs),
  });

  useEffect(() => {
    if (loading || !user) return;

    setCheckingClient(true);
    findClientByEmail(user.email ?? "").then((client) => {
      setCheckingClient(false);
      if (!client) {
        navigate("/assessment");
      }
    }).catch(() => {
      setCheckingClient(false);
    });
  }, [user, loading, navigate]);

  const showAuthGate    = !loading && !user && !dialogDismissed;
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

      <AnimatePresence>
        {showAuthGate && (
          <AuthRequiredDialog
            onClose={() => setDialogDismissed(true)}
            onAuthenticated={() => {
              setDialogDismissed(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
