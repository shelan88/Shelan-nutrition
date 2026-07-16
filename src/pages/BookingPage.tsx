/**
 * BookingPage — Premium multi-step booking flow.
 * Reads optional ?service= URL param to pre-select a service.
 *
 * To connect Supabase:
 *   - Fetch time slots: supabase.from('time_slots').select('*').eq('date', selectedDate)
 *   - Submit booking: supabase.from('bookings').insert({ ...bookingData })
 *   Both changes are isolated to BookingFlow.tsx.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { bookingData } from "@/data/booking.data";
import { bookingStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import BookingFlow from "@/sections/booking/BookingFlow";

export default function BookingPage() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get("service") ?? undefined;

  const data = bookingData[lang];
  const str = bookingStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "احجزي الآن | SHELAN" : "Book a Consultation | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "احجزي الآن" : "Book Now" },
  ];

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
          <BookingFlow
            data={data}
            strings={str as unknown as Record<string, string | string[]>}
            preselectedServiceId={preselectedServiceId}
          />
        </div>
      </section>
    </>
  );
}
