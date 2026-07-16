/**
 * AboutPage — Thin orchestrator.
 * Language is selected here; all section components receive pre-translated typed props.
 *
 * To connect Supabase (future):
 *   Replace `aboutData[lang]` with an async fetch from `supabase.from('about_page')...`
 *   Nothing else in this file changes.
 */
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { aboutData } from "@/data/about.data";
import PageHero from "@/components/ui/PageHero";
import CTABanner from "@/components/ui/CTABanner";
import AboutStory from "@/sections/about/AboutStory";
import AboutMissionVision from "@/sections/about/AboutMissionVision";
import AboutPhilosophy from "@/sections/about/AboutPhilosophy";
import AboutApproach from "@/sections/about/AboutApproach";
import AboutCertifications from "@/sections/about/AboutCertifications";
import AboutWhyTrust from "@/sections/about/AboutWhyTrust";

export default function AboutPage() {
  const { lang } = useLanguage();
  // ↓ Only this line changes when Supabase is connected
  const data = aboutData[lang];

  useEffect(() => {
    document.title = lang === "ar" ? "من أنا | SHELAN" : "About Shelan | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "من أنا" : "About" },
  ];

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
      <AboutCertifications certifications={data.certifications} />
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
