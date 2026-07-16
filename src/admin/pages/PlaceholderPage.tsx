/**
 * PlaceholderPage — generic "Coming Soon" page for all unbuilt admin sections.
 *
 * Receives a `pageId` that maps to PAGE_META for the section-specific
 * title, description, and illustration. This single component drives
 * all 13 placeholder admin pages — no code duplication.
 *
 * To graduate a page from placeholder to live:
 *   1. Build the real page component (e.g. BookingsPage.tsx)
 *   2. Replace <PlaceholderPage pageId="bookings" /> with <BookingsPage />
 *      in AdminLayout.tsx
 *   Done — nothing else to change.
 */
import { useLanguage } from "@/context/LanguageContext";
import { PAGE_META } from "../data/navigation";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

interface PlaceholderPageProps {
  pageId: string;
}

export default function PlaceholderPage({ pageId }: PlaceholderPageProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const meta = PAGE_META[pageId] ?? {
    title: pageId,
    titleAr: pageId,
    description: "This section is under construction.",
    descriptionAr: "هذا القسم قيد الإنشاء.",
    illustrationVariant: "dashboard",
  };

  const title = isAr ? meta.titleAr : meta.title;
  const description = isAr ? meta.descriptionAr : meta.description;

  const breadcrumbs = [
    { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
    { label: title },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />

      {/* Content card with coming soon state */}
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        {/* Fake toolbar — gives a sense of what the real UI will look like */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 rounded-md bg-[var(--admin-border)] animate-pulse" />
            <div className="h-6 w-16 rounded-md bg-[var(--admin-border)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-lg bg-[var(--admin-border)] animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-primary-pink/15 animate-pulse" />
          </div>
        </div>

        {/* Empty state illustration */}
        <EmptyState
          title={isAr ? `${title} — قريباً` : `${title} — Coming Soon`}
          description={
            isAr
              ? "هذه الميزة قيد التطوير وستكون متاحة قريباً. البنية التحتية للبيانات جاهزة — نحتاج فقط إلى ربط الواجهة."
              : "This feature is under development and will be available soon. The data architecture is ready — we just need to wire up the interface."
          }
          illustrationVariant={meta.illustrationVariant}
          showBadge
        />

        {/* Bottom status bar */}
        <div className="px-5 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-pink animate-pulse" />
            <span className="text-[11px] text-[var(--admin-text-faint)]">
              {isAr ? "البنية التحتية للبيانات: جاهزة" : "Data architecture: ready"}
            </span>
          </div>
          <span className="text-[11px] text-[var(--admin-text-faint)]">
            {isAr ? "مستعد للاتصال بـ Supabase" : "Supabase-ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
