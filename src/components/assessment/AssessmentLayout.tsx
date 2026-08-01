/**
 * AssessmentLayout — outer wrapper for the assessment wizard area.
 * Provides the section background, max-width container, and consistent padding.
 * Reusable for any future assessment type.
 */
interface AssessmentLayoutProps {
  children: React.ReactNode;
}

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return (
    <section className="pt-28 sm:pt-32 lg:pt-36 pb-16 lg:pb-24 bg-gradient-to-b from-light-pink/20 via-white to-white min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
