/**
 * ContentContainer — scrollable content area inside the admin layout.
 * Provides consistent padding and max-width constraint for all admin pages.
 * Wraps page content inside AdminLayout's main panel.
 */
interface ContentContainerProps {
  children: React.ReactNode;
  /** Optional extra class applied to the inner content wrapper */
  className?: string;
  /** Whether to apply the default max-width. Default: true. */
  constrained?: boolean;
}

export default function ContentContainer({
  children,
  className = "",
  constrained = true,
}: ContentContainerProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div
        className={`
          px-5 py-6 sm:px-8 sm:py-8
          ${constrained ? "max-w-[1280px]" : ""}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
}
