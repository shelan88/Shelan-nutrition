/**
 * ServiceDetailPage — Dynamic service detail template fetched from Supabase by slug.
 * Graceful 404 if not found.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { servicesStrings } from "@/content/content";
import { supabase } from "@/lib/supabase";
import type { ServiceRow } from "@/types/database.types";
import type { CMSService } from "@/types/cms.types";
import PageHero from "@/components/ui/PageHero";
import ServiceDetailContent from "@/sections/services/ServiceDetailContent";
import CTABanner from "@/components/ui/CTABanner";

function mapService(row: ServiceRow, lang: string): CMSService {
  const d = (row.details as any) ?? {};
  const wi = d.whoIsItFor ?? {};
  const be = d.benefits ?? {};
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: lang === "ar" ? (row.name_ar ?? row.name_en) : row.name_en,
    shortDescription:
      lang === "ar"
        ? (row.short_description_ar ?? row.description_ar ?? "")
        : (row.short_description_en ?? row.description_en ?? ""),
    accentFrom: d.accentFrom ?? "from-soft-pink",
    accentTo: d.accentTo ?? "to-primary-pink",
    iconName: row.icon ?? "Star",
    fullDescription: lang === "ar" ? (row.description_ar ?? "") : (row.description_en ?? ""),
    whoIsItFor: {
      headline:
        lang === "ar" ? (wi.headlineAr ?? wi.headline ?? "") : (wi.headline ?? ""),
      description:
        lang === "ar" ? (wi.descriptionAr ?? wi.description ?? "") : (wi.description ?? ""),
      points:
        lang === "ar" ? (wi.pointsAr ?? wi.points ?? []) : (wi.points ?? []),
    },
    benefits: {
      headline:
        lang === "ar" ? (be.headlineAr ?? be.headline ?? "") : (be.headline ?? ""),
      items:
        lang === "ar" ? (be.itemsAr ?? be.items ?? []) : (be.items ?? []),
    },
    consultation: d.consultation ?? { headline: "", steps: [] },
    faq: d.faq ?? [],
    cta: {
      headline:
        lang === "ar"
          ? (d.cta?.headlineAr ?? d.cta?.headline ?? "")
          : (d.cta?.headline ?? ""),
      description:
        lang === "ar"
          ? (d.cta?.descriptionAr ?? d.cta?.description ?? "")
          : (d.cta?.description ?? ""),
      buttonLabel:
        lang === "ar"
          ? (d.cta?.buttonLabelAr ?? d.cta?.buttonLabel ?? "")
          : (d.cta?.buttonLabel ?? "Book Now"),
    },
  };
}

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const str = servicesStrings[lang];

  const [service, setService] = useState<CMSService | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    supabase
      .from("services")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) {
          setNotFound(true);
        } else {
          setService(mapService(row, lang));
        }
        setLoading(false);
      });
  }, [slug, lang]);

  useEffect(() => {
    if (service) {
      document.title = `${service.title} | SHELAN Nutrition`;
    } else if (notFound) {
      document.title = "Service Not Found | SHELAN Nutrition";
    }
  }, [service, notFound]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !service) {
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
