/**
 * ServicesPage — Lists all services. Each card links to /services/:slug.
 *
 * To connect Supabase:
 *   Replace `servicesData[lang]` with supabase.from('services').select('*').eq('locale', lang)
 */
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { servicesData } from "@/data/services.data";
import { servicesStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import ServicesGrid from "@/sections/services/ServicesGrid";
import CTABanner from "@/components/ui/CTABanner";

export default function ServicesPage() {
  const { lang } = useLanguage();
  const data = servicesData[lang];
  const str = servicesStrings[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "الخدمات | SHELAN" : "Services | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "الخدمات" : "Services" },
  ];

  const ctaData = {
    kicker: lang === "ar" ? "ابدأي اليوم" : "Start Today",
    headline: lang === "ar" ? "هل أنتِ مستعدة للبدء؟" : "Ready to Get Started?",
    description:
      lang === "ar"
        ? "احجزي استشارتكِ الأولى وابدأي رحلتك نحو الصحة الحقيقية."
        : "Book your first consultation and begin your journey to genuine, lasting health.",
    buttonLabel: lang === "ar" ? "احجزي الآن" : "Book Your Consultation",
    buttonHref: "/booking",
  };

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        breadcrumbs={breadcrumbs}
      />
      <ServicesGrid services={data.services} learnMoreLabel={str.learnMore} />
      <CTABanner {...ctaData} />
    </>
  );
}
