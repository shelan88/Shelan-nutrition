/**
 * ServicesPage — Lists all services fetched from Supabase.
 * Hero strings come from static data. Service cards come from DB.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { servicesData } from "@/data/services.data";
import { servicesStrings } from "@/content/content";
import { supabase } from "@/lib/supabase";
import type { ServiceRow } from "@/types/database.types";
import type { CMSService } from "@/types/cms.types";
import PageHero from "@/components/ui/PageHero";
import ServicesGrid from "@/sections/services/ServicesGrid";
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

export default function ServicesPage() {
  const { lang } = useLanguage();
  const data = servicesData[lang];
  const str = servicesStrings[lang];

  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = lang === "ar" ? "الخدمات | SHELAN" : "Services | SHELAN Nutrition";
  }, [lang]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data: rows }) => {
        setServiceRows(rows ?? []);
        setLoading(false);
      });
  }, []);

  const services = serviceRows.map(s => mapService(s, lang));

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        breadcrumbs={breadcrumbs}
      />
      <ServicesGrid
        services={services.length > 0 ? services : data.services}
        learnMoreLabel={str.learnMore}
      />
      <CTABanner {...ctaData} />
    </>
  );
}
