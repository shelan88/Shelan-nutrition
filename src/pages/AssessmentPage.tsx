/**
 * AssessmentPage — /assessment
 *
 * Composes PageHero + AssessmentWizard.
 * All content is pulled from typed data files and content strings.
 *
 * To connect Supabase:
 *   - In AssessmentWizard.tsx, replace the two TODO comments with real DB calls.
 *   - Here, you can optionally fetch data.steps and data.questions dynamically:
 *       const { data: steps } = await supabase.from('assessment_steps').select('*').eq('locale', lang).order('order')
 *       const { data: questions } = await supabase.from('assessment_questions').select('*').eq('locale', lang).order('order')
 */
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { assessmentData } from "@/data/assessment.data";
import { assessmentStrings } from "@/content/content";
import PageHero from "@/components/ui/PageHero";
import AssessmentLayout from "@/components/assessment/AssessmentLayout";
import AssessmentWizard from "@/sections/assessment/AssessmentWizard";

export default function AssessmentPage() {
  const { lang } = useLanguage();

  const data = assessmentData[lang];
  const str = assessmentStrings[lang];

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "تقييم صحي | SHELAN"
        : "Health Assessment | SHELAN Nutrition";
  }, [lang]);

  const breadcrumbs = [
    { label: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: lang === "ar" ? "تقييم صحي" : "Health Assessment" },
  ];

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
