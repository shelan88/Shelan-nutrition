/**
 * QuestionCard — container card that wraps a single assessment question.
 * Renders the question title, optional description, required badge, and children.
 * Reusable for any question type.
 */
interface QuestionCardProps {
  title: string;
  description?: string;
  required?: boolean;
  requiredLabel?: string;
  children: React.ReactNode;
  /** Optional: additional class applied to the outer wrapper */
  className?: string;
}

export default function QuestionCard({
  title,
  description,
  required,
  requiredLabel = "Required",
  children,
  className = "",
}: QuestionCardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg text-heading leading-snug">
            {title}
            {required && (
              <span className="inline-block ms-2 text-primary-pink" aria-label={requiredLabel}>
                *
              </span>
            )}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-deep-purple/55 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
