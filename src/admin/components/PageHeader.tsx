/**
 * PageHeader — page title, description, and breadcrumb trail for admin pages.
 * Rendered at the top of every page's content area.
 * Accepts optional action slot for right-aligned buttons.
 */
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div className="min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-2 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight
                    size={12}
                    className="text-[var(--admin-text-faint)] rtl:rotate-180 shrink-0"
                  />
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-xs text-[var(--admin-text-muted)] hover:text-primary-pink transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--admin-text-faint)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-[22px] font-semibold text-[var(--admin-text)] leading-tight tracking-tight !font-sans">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="mt-1.5 text-sm text-[var(--admin-text-muted)] leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>

      {/* Actions slot */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
