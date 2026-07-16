/**
 * ServiceDetailPage — Dynamic service detail template.
 * Resolves slug → service from data layer. Graceful 404 if not found.
 *
 * To connect Supabase:
 *   Replace static lookup with:
 *   const { data } = await supabase.from('services').select('*').eq('slug', slug).eq('locale', lang).single()
 */
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { servicesData } from "@/data/services.data";
import { servicesStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import ServiceDetailContent from "@/sections/services/ServiceDetailContent";
import CTABanner from "@/components/ui/CTABanner";

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const data = servicesData[lang];
  const str = servicesStrings[lang];

  const service = data.services.find((s) => s.slug === slug);

  useEffect(() => {
    if (service) {
      document.title = `${service.title} | SHELAN Nutrition`;
    } else {
      document.title = "Service Not Found | SHELAN Nutrition";
    }
  }, [service]);

  // 404 state
  if (!service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center py-32">
        <p className="text-6xl font-heading font-bold text-primary-pink">404</p>
        <h1 className="font-heading text-2xl font-bold text-heading">Service Not Found</h1>
        <p className="text-body opacity-70">This service doesn't exist or has been removed.</p>
        <Link
          to="/services"
          className="px-7 py-3 rounded-full bg-gradient-to-r from-primary-pink to-lavender-purple text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          {str.allServices}
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "الخدمات" : "Services", href: "/services" },
    { label: service.title },
  ];

  return (
    <>
      <PageHero
        kicker={lang === "ar" ? "تفاصيل الخدمة" : "Service Details"}
        headline={service.title}
        subheadline={service.shortDescription}
        gradientClass={`bg-gradient-to-br ${service.accentFrom} ${service.accentTo}`}
        breadcrumbs={breadcrumbs}
      />
      <ServiceDetailContent service={service} />
      <CTABanner
        kicker={service.cta.headline}
        headline={service.cta.headline}
        description={service.cta.description}
        buttonLabel={service.cta.buttonLabel}
        buttonHref={`/booking?service=${service.id}`}
      />
    </>
  );
}
