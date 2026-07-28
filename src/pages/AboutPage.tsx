/**
 * AboutPage — Thin orchestrator.
 * Language is selected here; all section components receive pre-translated typed props.
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSEO, buildBreadcrumbLd, SITE_URL } from "@/hooks/useSEO";
import { aboutData } from "@/data/about.data";
import PageHero from "@/components/ui/PageHero";
import CTABanner from "@/components/ui/CTABanner";
import AboutStory from "@/sections/about/AboutStory";
import AboutMissionVision from "@/sections/about/AboutMissionVision";
import AboutPhilosophy from "@/sections/about/AboutPhilosophy";
import AboutApproach from "@/sections/about/AboutApproach";
import AboutCertifications from "@/sections/about/AboutCertifications";
import AboutWhyTrust from "@/sections/about/AboutWhyTrust";
import {
  getSectionSettings,
  type SectionSettingsRow,
} from "@/admin/repositories/aboutCms.repository";

export default function AboutPage() {
  const { lang } = useLanguage();
  const data = aboutData[lang];

  const [certSectionRow, setCertSectionRow] = useState<
    SectionSettingsRow | null | undefined
  >(undefined);

  useEffect(() => {
    getSectionSettings("certifications")
      .then((row) => setCertSectionRow(row))
      .catch(() => setCertSectionRow(null));
  }, []);

  const certVisible =
    certSectionRow === undefined ? true
    : certSectionRow === null    ? true
    : certSectionRow.visible;

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "من أنا" : "About" },
  ];

  useSEO({
    title:
      lang === "ar"
        ? "من أنا | شيلان — أخصائية تغذية أونلاين، الليبيديما وصحة المرأة"
        : "About Shelan | Certified Online Nutrition Consultant — Lipedema & Women's Health",
    description:
      lang === "ar"
        ? "تعرّفي على شيلان — أخصائية تغذية معتمدة تقدم استشارات أونلاين متخصصة في الليبيديما، الليمفيديما، صحة المرأة، والتغذية الشمولية. خدماتها متاحة افتراضياً لكل مكان في العالم."
        : "Meet Shelan — certified online nutrition consultant specializing in Lipedema, Lymphedema, women's health & anti-inflammatory nutrition. Virtual consultations available worldwide.",
    path: "/about",
    lang,
    image: "/portrait.jpg",
    jsonLd: [
      buildBreadcrumbLd(breadcrumbs),
      {
        "@context": "https://schema.org",
        "@type": ["Person", "Nutritionist"],
        name: "Shelan",
        jobTitle:
          lang === "ar"
            ? "أخصائية تغذية أونلاين — الليبيديما وصحة المرأة"
            : "Certified Online Nutrition Consultant — Lipedema & Women's Health",
        url: `${SITE_URL}/about`,
        image: `${SITE_URL}/portrait.jpg`,
        worksFor: { "@id": `${SITE_URL}/#organization` },
        knowsAbout: [
          "Online Nutrition Consultation",
          "Virtual Nutrition Consultation",
          "Lipedema Nutrition",
          "Lymphedema Support",
          "Holistic Nutrition",
          "Women's Health Nutrition",
          "Weight Loss",
          "Anti-inflammatory Nutrition",
        ],
        hasOccupation: {
          "@type": "Occupation",
          name: lang === "ar" ? "أخصائية تغذية أونلاين" : "Online Nutrition Consultant",
          occupationLocation: { "@type": "AdministrativeArea", name: "Worldwide" },
        },
      },
    ],
  });

  return (
    <>
      <PageHero
        kicker={data.hero.kicker}
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        image={
          data.hero.coverImage
            ? { src: data.hero.coverImage, alt: data.hero.coverImageAlt ?? "" }
            : undefined
        }
        breadcrumbs={breadcrumbs}
      />
      <AboutStory story={data.story} />
      <AboutMissionVision missionVision={data.missionVision} />
      <AboutPhilosophy philosophy={data.philosophy} />
      <AboutApproach approach={data.approach} />
      {certVisible && <AboutCertifications certifications={data.certifications} />}
      <AboutWhyTrust whyTrust={data.whyTrust} />
      <CTABanner
        kicker={data.cta.kicker}
        headline={data.cta.headline}
        description={data.cta.description}
        buttonLabel={data.cta.buttonLabel}
        buttonHref={data.cta.buttonHref}
      />
    </>
  );
}
