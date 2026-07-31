/**
 * BookingPage — Premium multi-step booking flow.
 * Reads optional ?service= URL param to pre-select a service.
 *
 * Authentication is required to book. Unauthenticated visitors see the
 * AuthRequiredDialog. After sign-in/sign-up the dialog closes and the
 * BookingFlow renders with the service still pre-selected (URL param
 * is preserved through the auth round-trip).
 */
import { useEffect, useState, useMemo } from "react";
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
import { getActiveConsultations } from "@/admin/repositories/consultations.repository";
import type { ConsultationRow } from "@/types/database.types";
import type { CMSBookingService } from "@/types/cms.types";
import type { AvailabilitySettings } from "@/lib/availability";

/** Map a DB ConsultationRow → CMSBookingService for the given lang. */
function rowToService(row: ConsultationRow, lang: "en" | "ar"): CMSBookingService {
  const currency = row.currency ?? "$";
  let priceStr = "";
  if (row.price != null) {
    const hasDiscount = row.discount_enabled && row.discount_percent != null && row.discount_percent > 0;
    if (hasDiscount) {
      const final = Math.round(row.price * (1 - row.discount_percent! / 100) * 100) / 100;
      priceStr = `${currency}${final}`;
    } else {
      priceStr = `${currency}${row.price}`;
    }
  }
  const name = (lang === "ar" ? row.title_ar : row.title_en) || row.title_en;
  return {
    id:          row.id,
    name,
    duration:    (lang === "ar" ? row.duration_ar : row.duration_en) || "",
    price:       priceStr,
    priceNote:   (lang === "ar" ? row.period_ar  : row.period_en)   || "",
    description: (lang === "ar" ? row.description_ar : row.description_en) || "",
    iconName:    row.icon || "Calendar",
  };
}

export default function BookingPage() {
  const { lang }                    = useLanguage();
  const [searchParams]              = useSearchParams();
  const preselectedServiceId        = searchParams.get("service") ?? undefined;
  const preselectedProgramId        = searchParams.get("program") ?? undefined;
  const { user, loading }           = useAuth();
  const navigate                    = useNavigate();

  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [checkingClient, setCheckingClient]   = useState(false);

  // Load consultations from DB to use their real IDs and availability settings
  const [dbConsultations, setDbConsultations] = useState<ConsultationRow[] | null>(null);

  useEffect(() => {
    getActiveConsultations()
      .then(setDbConsultations)
      .catch(() => setDbConsultations([]));
  }, []);

  const staticData = bookingData[lang];
  const str  = bookingStrings[lang];

  // Map DB consultations → CMSBookingService for the current language
  const dbServices: CMSBookingService[] = useMemo(() => {
    if (!dbConsultations || dbConsultations.length === 0) return [];
    return dbConsultations.map((row) => rowToService(row, lang as "en" | "ar"));
  }, [dbConsultations, lang]);

  // English-only services for appointment type storage (always English)
  const dbServicesEn: CMSBookingService[] = useMemo(() => {
    if (!dbConsultations || dbConsultations.length === 0) return [];
    return dbConsultations.map((row) => rowToService(row, "en"));
  }, [dbConsultations]);

  // Per-service availability map keyed by consultation UUID
  const serviceAvailabilityMap: Record<string, AvailabilitySettings | null> = useMemo(() => {
    if (!dbConsultations) return {};
    const map: Record<string, AvailabilitySettings | null> = {};
    for (const row of dbConsultations) {
      map[row.id] = row.availability ?? null;
    }
    return map;
  }, [dbConsultations]);

  // Build the effective booking data: prefer DB consultations, fall back to static
  const data = useMemo(() => {
    if (dbServices.length > 0) {
      return { ...staticData, services: dbServices };
    }
    return staticData;
  }, [staticData, dbServices]);

  const canonicalServices = dbServicesEn.length > 0 ? dbServicesEn : bookingData.en.services;

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home",     href: "/" },
    { label: lang === "ar" ? "احجزي الآن" : "Book Now" },
  ];

  useSEO({
    title:
      lang === "ar"
        ? "احجزي استشارة أونلاين | SHELAN — تغذية متخصصة"
        : "Book an Online Consultation | SHELAN Nutrition",
    description:
      lang === "ar"
        ? "احجزي استشارتكِ التغذوية الافتراضية مع شيلان — جلسات أونلاين متاحة من أي مكان في العالم. متخصصة في الليبيديما، صحة المرأة، والتغذية الشمولية."
        : "Book your virtual nutrition consultation with Shelan — online sessions available worldwide. Specializing in Lipedema, Lymphedema, women's health & holistic nutrition.",
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
        kicker={staticData.hero.kicker}
        headline={staticData.hero.headline}
        subheadline={staticData.hero.subheadline}
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
              canonicalServices={canonicalServices}
              serviceAvailabilityMap={serviceAvailabilityMap}
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
