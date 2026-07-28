/**
 * AssessmentPage — /assessment
 *
 * Composes PageHero + AssessmentWizard.
 * All content is pulled from typed data files and content strings.
 */
import { useLanguage } from "@/context/LanguageContext";
import { useSEO, buildBreadcrumbLd } from "@/hooks/useSEO";
import { assessmentData } from "@/data/assessment.data";
import { assessmentStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import AssessmentLayout from "@/components/assessment/AssessmentLayout";
import AssessmentWizard from "@/sections/assessment/AssessmentWizard";

export default function AssessmentPage() {
  const { lang } = useLanguage();

  const data = assessmentData[lang];
  const str = assessmentStrings[lang];

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "تقييم صحي" : "Health Assessment" },
  ];

  useSEO({
    title:
      lang === "ar"
        ? "تقييم صحي مجاني | SHELAN — ابدئي رحلتكِ"
        : "Free Health Assessment | SHELAN — Start Your Journey",
    description:
      lang === "ar"
        ? "أجيبي على بعض الأسئلة السريعة عن صحتكِ وأهدافكِ لنتمكن من تصميم خطة تغذية مخصصة لكِ."
        : "Answer a few quick questions about your health and goals so we can design a personalised nutrition plan just for you.",
    path: "/assessment",
    lang,
    jsonLd: buildBreadcrumbLd(breadcrumbs),
  });

  return (
    <>
      <PageHero
        kicker={str.heroKicker}
        headline={str.heroHeadline}
        subheadline={str.heroSubheadline}
        breadcrumbs={breadcrumbs}
      />

      <AssessmentLayout>
        <AssessmentWizard
          data={data}
          strings={{
            backLabel: str.backLabel,
            nextLabel: str.nextLabel,
            requiredLabel: str.requiredLabel,
            validationMessage: str.validationMessage,
          }}
        />
      </AssessmentLayout>
    </>
  );
}
