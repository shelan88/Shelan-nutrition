/**
 * NavigationItem — a single sidebar navigation item.
 *
 * Renders an icon + label (or icon-only in collapsed mode) with
 * active / hover states that match the brand design system.
 *
 * Active detection: uses react-router useLocation for exact or prefix matching.
 */
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Globe, Briefcase, ClipboardList, BookOpen,
  Star, Image, Calendar, Users, CreditCard, MessageSquare,
  BarChart3, TrendingUp, Settings2,
} from "lucide-react";
import type { NavItem } from "../data/navigation";

// ─── Icon resolver ─────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Globe,
  Briefcase,
  ClipboardList,
  BookOpen,
  Star,
  Image,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Settings2,
};

interface NavigationItemProps {
  item: NavItem;
  collapsed: boolean;
  label: string;
  onNavigate?: () => void;
}

export default function NavigationItem({
  item,
  collapsed,
  label,
  onNavigate,
}: NavigationItemProps) {
  const location = useLocation();
  const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard;

  const isActive = item.exact
    ? location.pathname === item.href
    : location.pathname === item.href ||
      location.pathname.startsWith(item.href + "/");

  return (
    <li>
      <Link
        to={item.href}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        className={`
          group relative flex items-center gap-3 px-3 py-2 rounded-lg
          text-[13px] font-medium transition-all duration-150 select-none
          ${isActive
            ? "bg-[var(--admin-active-bg)] text-primary-pink"
            : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)]"
          }
          ${collapsed ? "justify-center px-2" : ""}
        `}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="absolute start-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary-pink" />
        )}

        {/* Icon */}
        <Icon
          size={17}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={`shrink-0 transition-colors ${
            isActive ? "text-primary-pink" : "text-[var(--admin-text-faint)] group-hover:text-[var(--admin-text-muted)]"
          }`}
        />

        {/* Label — hidden in collapsed mode */}
        {!collapsed && (
          <span className="flex-1 truncate leading-none">{label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge && (
          <span className="ms-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-pink text-white text-[10px] font-bold flex items-center justify-center">
            {item.badge}
          </span>
        )}

        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <div
            className="
              pointer-events-none absolute start-full ms-3 top-1/2 -translate-y-1/2
              px-2.5 py-1.5 rounded-md bg-[var(--admin-text)] text-white text-xs font-medium
              whitespace-nowrap opacity-0 group-hover:opacity-100
              translate-x-1 group-hover:translate-x-0
              transition-all duration-150 z-50
              shadow-lg shadow-black/20
            "
          >
            {label}
            {item.badge && (
              <span className="ms-1.5 px-1 py-0.5 rounded bg-primary-pink text-[10px]">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </Link>
    </li>
  );
}
