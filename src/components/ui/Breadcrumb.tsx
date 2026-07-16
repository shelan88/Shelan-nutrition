/**
 * Breadcrumb — Accessible navigation trail for inner pages.
 */
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  dark?: boolean;
}

export default function Breadcrumb({ items, className = "", dark = false }: BreadcrumbProps) {
  const baseColor = dark ? "text-white/60" : "text-deep-purple/50";
  const activeColor = dark ? "text-white/90" : "text-deep-purple/90";
  const hoverColor = dark ? "hover:text-white" : "hover:text-primary-pink";
  const iconColor = dark ? "text-white/30" : "text-deep-purple/25";

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1 ${className}`}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                size={13}
                className={`${iconColor} rtl:rotate-180`}
                aria-hidden="true"
              />
            )}
            {isLast || !item.href ? (
              <span
                className={`text-xs font-medium ${isLast ? activeColor : baseColor}`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className={`text-xs font-medium ${baseColor} ${hoverColor} transition-colors`}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
