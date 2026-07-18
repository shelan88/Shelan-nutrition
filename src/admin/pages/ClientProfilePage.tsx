/**
 * ClientProfilePage — /admin/clients/:id
 *
 * Clinical workspace for a single client.
 *   1. Primary Action Bar  — Create Plan · Assess · Book · Upload · Message · More
 *   2. Profile Header      — avatar, name, contact, status, next appointment
 *   3. Quick Stats         — 4 summary cards (Appts / Assessments / Plans / Files)
 *   4. Navigation Tabs     — Overview | Appointments | Assessments | Nutrition Plans
 *                            | Payments | Files | Progress | Notes
 *   5. Tab Content         — live data for all implemented tabs
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, FileText, BookOpen, CreditCard,
  Phone, Mail, MapPin, Clock, Edit2, Download as DownloadIcon,
  ClipboardList, Users, MessageSquare, Info, RefreshCw,
  CalendarCheck, UserCircle, Star, File as FileIcon, Image as ImageIcon,
  Plus, MoreHorizontal, Upload, Send, ChevronDown, ChevronUp, Trash2, Archive,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "@/admin/components/PageHeader";
import ClientDrawer from "@/admin/pages/ClientDrawer";
import {
  getClient, archiveClient, deleteClient,
} from "@/admin/repositories/clients.repository";
import { uploadClientFile, deleteClientFile } from "@/admin/repositories/client-files.repository";
import {
  getClientAppointments,
  getClientAssessmentResponses,
} from "@/admin/repositories/client-profile.repository";
import NutritionPlansTab from "@/admin/pages/NutritionPlansTab";
import ProgressTab from "@/admin/pages/ProgressTab";
import type { Client, TimelineEvent } from "@/admin/data/clients";
import type { AppointmentRow } from "@/types/database.types";
import type { ClientAssessmentResponse } from "@/admin/repositories/client-profile.repository";

// ─── Animation preset ─────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId =
  | "overview"
  | "appointments"
  | "assessments"
  | "nutrition"
  | "payments"
  | "files"
  | "progress"
  | "notes";

const TABS: { id: TabId; en: string; ar: string }[] = [
  { id: "overview",     en: "Overview",        ar: "نظرة عامة"     },
  { id: "appointments", en: "Appointments",    ar: "المواعيد"       },
  { id: "assessments",  en: "Assessments",     ar: "التقييمات"      },
  { id: "nutrition",    en: "Nutrition Plans", ar: "الخطط الغذائية" },
  { id: "payments",     en: "Payments",        ar: "المدفوعات"      },
  { id: "files",        en: "Files",           ar: "الملفات"        },
  { id: "progress",     en: "Progress",        ar: "التقدم"         },
  { id: "notes",        en: "Notes",           ar: "الملاحظات"      },
];

// ─── Appointment status helpers ───────────────────────────────────────────────
type KnownStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

const APPT_BADGE: Record<KnownStatus, string> = {
  scheduled: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  confirmed:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  completed:  "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  cancelled:  "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const APPT_DOT: Record<KnownStatus, string> = {
  scheduled: "bg-amber-400 animate-pulse",
  confirmed:  "bg-emerald-500 animate-pulse",
  completed:  "bg-blue-500",
  cancelled:  "bg-red-500",
};
const APPT_LABEL_EN: Record<KnownStatus, string> = {
  scheduled: "Scheduled", confirmed: "Confirmed",
  completed: "Completed", cancelled: "Cancelled",
};
const APPT_LABEL_AR: Record<KnownStatus, string> = {
  scheduled: "مجدول", confirmed: "مؤكد",
  completed: "مكتمل", cancelled: "ملغى",
};

// ─── Client status helpers ────────────────────────────────────────────────────
const CLIENT_STATUS_BADGE: Record<string, string> = {
  Active:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Inactive:  "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]",
  Waiting:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Completed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};
const CLIENT_STATUS_DOT: Record<string, string> = {
  Active:    "bg-emerald-500 animate-pulse",
  Inactive:  "bg-[var(--admin-text-faint)]",
  Waiting:   "bg-amber-400 animate-pulse",
  Completed: "bg-blue-500",
};
const CLIENT_STATUS_LABEL_EN: Record<string, string> = {
  Active: "Active", Inactive: "Inactive", Waiting: "Waiting", Completed: "Completed",
};
const CLIENT_STATUS_LABEL_AR: Record<string, string> = {
  Active: "نشطة", Inactive: "غير نشطة", Waiting: "انتظار", Completed: "مكتملة",
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmtDate(d: string, isAr: boolean): string {
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

function fmtDateLong(d: string, isAr: boolean): string {
  try {
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  } catch { return d; }
}

function timelineMeta(type: string | null): {
  Icon: React.ElementType; ring: string; dot: string;
} {
  switch (type) {
    case "assessment":   return { Icon: ClipboardList, ring: "ring-purple-200 bg-purple-50",   dot: "text-purple-600"  };
    case "appointment":
    case "booking":      return { Icon: CalendarCheck, ring: "ring-blue-200 bg-blue-50",       dot: "text-blue-600"    };
    case "consultation": return { Icon: Users,          ring: "ring-pink-200 bg-pink-50",       dot: "text-pink-600"    };
    case "plan":         return { Icon: BookOpen,       ring: "ring-emerald-200 bg-emerald-50", dot: "text-emerald-600" };
    case "followup":     return { Icon: RefreshCw,      ring: "ring-amber-200 bg-amber-50",     dot: "text-amber-600"   };
    case "note":
    case "message":      return { Icon: MessageSquare,  ring: "ring-indigo-200 bg-indigo-50",   dot: "text-indigo-600"  };
    default:             return { Icon: Info,           ring: "ring-gray-200 bg-gray-50",       dot: "text-gray-500"    };
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EmptyState({
  icon: Icon, label, action,
}: {
  icon: React.ElementType;
  label: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
        <Icon size={22} strokeWidth={1.3} className="text-[var(--admin-text-faint)]" />
      </div>
      <p className="text-[13px] text-[var(--admin-text-muted)]">{label}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={12} strokeWidth={2.5} />
          {action.label}
        </button>
      )}
    </div>
  );
}

/** Simple collapsible section — collapsed by default. */
function CollapsibleSection({
  title, children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--admin-hover-bg)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors"
      >
        <span className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
          {title}
        </span>
        {open
          ? <ChevronUp   size={13} strokeWidth={2} className="text-[var(--admin-text-faint)]" />
          : <ChevronDown size={13} strokeWidth={2} className="text-[var(--admin-text-faint)]" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function PlaceholderTab({
  icon: Icon, title, titleAr, desc, descAr, isAr,
}: {
  icon: React.ElementType; title: string; titleAr: string;
  desc: string; descAr: string; isAr: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
        <Icon size={24} strokeWidth={1.3} className="text-[var(--admin-text-faint)]" />
      </div>
      <div>
        <p className="text-[14px] font-bold text-[var(--admin-text)]">{isAr ? titleAr : title}</p>
        <p className="text-[12.5px] text-[var(--admin-text-muted)] mt-1 max-w-xs leading-relaxed">
          {isAr ? descAr : desc}
        </p>
      </div>
      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
        {isAr ? "قريباً" : "Coming Soon"}
      </span>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-40 bg-[var(--admin-hover-bg)] rounded-lg" />
      <div className="h-10 bg-[var(--admin-hover-bg)] rounded-2xl" />
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] h-36" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] h-24" />
        ))}
      </div>
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] h-96" />
    </div>
  );
}

// Quick stat card
function StatCard({
  label, value, icon: Icon, gradient, delay, placeholder,
}: {
  label: string; value: number; icon: React.ElementType;
  gradient: string; delay: number; placeholder?: string;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="
        bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-4
        hover:shadow-md hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-200
      "
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${gradient}`}>
        <Icon size={16} strokeWidth={1.8} className="text-white" />
      </div>
      <p className="text-[11.5px] font-medium text-[var(--admin-text-muted)] leading-tight mb-1">{label}</p>
      <p className="text-[24px] font-bold text-[var(--admin-text)] tabular-nums leading-none">
        {placeholder ?? value}
      </p>
    </motion.div>
  );
}

// Timeline event row
function TimelineRow({
  event, isAr, isLast,
}: { event: TimelineEvent; isAr: boolean; isLast: boolean }) {
  const { Icon, ring, dot } = timelineMeta(event.type);
  return (
    <div className="flex gap-3.5 min-w-0">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full ring-1 ${ring} flex items-center justify-center`}>
          <Icon size={14} className={dot} strokeWidth={1.8} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-[var(--admin-border)] mt-1 mb-0.5" />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
        <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-snug">
          {isAr ? event.eventAr : event.event}
        </p>
        <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">
          {fmtDate(event.date, isAr)}
        </p>
      </div>
    </div>
  );
}

// ─── Tab content components ───────────────────────────────────────────────────

function InfoRow({
  label, value,
}: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[var(--admin-border)] last:border-0">
      <span className="text-[12px] text-[var(--admin-text-muted)] shrink-0">{label}</span>
      <span className="text-[12.5px] font-semibold text-[var(--admin-text)] text-end">{value}</span>
    </div>
  );
}

// ─── Overview Tab (fully rewritten as clinic-first layout) ────────────────────

function OverviewTab({
  client, assessments, nutritionCount, isAr, onNavigate,
}: {
  client: Client;
  assessments: ClientAssessmentResponse[];
  nutritionCount: number;
  isAr: boolean;
  onNavigate: (tab: TabId, action?: "createPlan" | "upload") => void;
}) {
  const latestAssessment =
    assessments.find((a) => a.status === "submitted") ?? assessments[0] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* ── LEFT COLUMN: primary clinical info ─────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* 1. Personal Information */}
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
          <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
            {isAr ? "المعلومات الشخصية" : "Personal Information"}
          </p>
          <div>
            {client.email && (
              <InfoRow
                label={isAr ? "البريد الإلكتروني" : "Email"}
                value={
                  <a href={`mailto:${client.email}`} className="hover:text-primary-pink transition-colors">
                    {client.email}
                  </a>
                }
              />
            )}
            {client.phone && (
              <InfoRow
                label={isAr ? "الهاتف" : "Phone"}
                value={<a href={`tel:${client.phone}`} className="hover:text-primary-pink transition-colors">{client.phone}</a>}
              />
            )}
            {client.country && (
              <InfoRow
                label={isAr ? "الموقع" : "Location"}
                value={isAr ? client.countryAr : client.country}
              />
            )}
            {client.age > 0 && (
              <InfoRow
                label={isAr ? "العمر" : "Age"}
                value={`${client.age} ${isAr ? "سنة" : "yrs"}`}
              />
            )}
            {client.gender && (
              <InfoRow
                label={isAr ? "الجنس" : "Gender"}
                value={isAr ? (client.gender === "Female" ? "أنثى" : "ذكر") : client.gender}
              />
            )}
            {client.joinedDate && (
              <InfoRow
                label={isAr ? "تاريخ الانضمام" : "Joined"}
                value={fmtDate(client.joinedDate, isAr)}
              />
            )}
            <InfoRow
              label={isAr ? "الحالة" : "Status"}
              value={
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CLIENT_STATUS_BADGE[client.status] ?? ""}`}>
                  {isAr ? CLIENT_STATUS_LABEL_AR[client.status] : CLIENT_STATUS_LABEL_EN[client.status]}
                </span>
              }
            />
          </div>
        </div>

        {/* 2. Latest Assessment */}
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
          <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
            {isAr ? "آخر تقييم" : "Latest Assessment"}
          </p>
          {latestAssessment ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <ClipboardList size={14} strokeWidth={1.8} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-tight">
                    {(isAr ? latestAssessment.template_name_ar : latestAssessment.template_name_en)
                      ?? (isAr ? "تقييم" : "Assessment")}
                  </p>
                  <p className="text-[11px] text-[var(--admin-text-faint)]">
                    {latestAssessment.submitted_at
                      ? fmtDate(latestAssessment.submitted_at, isAr)
                      : latestAssessment.created_at
                      ? fmtDate(latestAssessment.created_at, isAr)
                      : "—"}
                  </p>
                </div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  latestAssessment.status === "submitted"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                }`}>
                  {latestAssessment.status === "submitted"
                    ? (isAr ? "مقدَّم" : "Submitted")
                    : (isAr ? "قيد التقديم" : "In Progress")}
                </span>
              </div>

              {/* Score mini-stats */}
              {latestAssessment.score != null && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-[var(--admin-surface)] rounded-lg p-2.5 text-center ring-1 ring-[var(--admin-border)]">
                    <p className="text-[20px] font-bold text-[var(--admin-text)] tabular-nums leading-none">
                      {latestAssessment.score}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">{isAr ? "النقاط" : "Score"}</p>
                  </div>
                  <div className="bg-[var(--admin-surface)] rounded-lg p-2.5 text-center ring-1 ring-[var(--admin-border)]">
                    <p className={`text-[14px] font-bold tabular-nums leading-none ${
                      latestAssessment.risk_level === "High"   ? "text-red-600"    :
                      latestAssessment.risk_level === "Medium" ? "text-amber-600"  : "text-emerald-600"
                    }`}>
                      {latestAssessment.risk_level
                        ? (isAr
                            ? { Low: "منخفض", Medium: "متوسط", High: "مرتفع" }[latestAssessment.risk_level as "Low"|"Medium"|"High"] ?? latestAssessment.risk_level
                            : latestAssessment.risk_level)
                        : "—"}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">{isAr ? "الخطر" : "Risk"}</p>
                  </div>
                  <div className="bg-[var(--admin-surface)] rounded-lg p-2.5 text-center ring-1 ring-[var(--admin-border)]">
                    <p className="text-[20px] font-bold text-[var(--admin-text)] tabular-nums leading-none">
                      {latestAssessment.risk_percentage != null ? `${latestAssessment.risk_percentage}%` : "—"}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-faint)] mt-0.5">{isAr ? "نسبة %" : "Risk %"}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => onNavigate("assessments")}
                className={`text-[11.5px] font-semibold text-primary-pink hover:underline ${isAr ? "float-left" : "float-right"}`}
              >
                {isAr ? "← عرض كل التقييمات" : "View all assessments →"}
              </button>
              <div className="clear-both" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ClipboardList size={22} strokeWidth={1.3} className="text-[var(--admin-text-faint)]" />
              <p className="text-[12.5px] text-[var(--admin-text-muted)]">
                {isAr ? "لا توجد تقييمات بعد" : "No assessments submitted yet"}
              </p>
              <button
                onClick={() => onNavigate("assessments")}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-purple-500 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={11} strokeWidth={2.5} />
                {isAr ? "إنشاء تقييم" : "Create Assessment"}
              </button>
            </div>
          )}
        </div>

        {/* 3. Nutrition Plan snapshot */}
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
          <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
            {isAr ? "الخطة الغذائية" : "Nutrition Plan"}
          </p>
          {nutritionCount > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <BookOpen size={14} strokeWidth={1.8} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                    {nutritionCount === 1
                      ? (isAr ? "خطة غذائية نشطة" : "1 active plan")
                      : (isAr ? `${nutritionCount} خطط غذائية نشطة` : `${nutritionCount} active plans`)}
                  </p>
                  <p className="text-[11px] text-[var(--admin-text-faint)]">
                    {isAr ? "برنامج التغذية" : "Nutrition program"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("nutrition")}
                className="text-[11.5px] font-semibold text-emerald-600 hover:underline shrink-0"
              >
                {isAr ? "← عرض" : "View →"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <BookOpen size={22} strokeWidth={1.3} className="text-[var(--admin-text-faint)]" />
              <p className="text-[12.5px] text-[var(--admin-text-muted)]">
                {isAr ? "لا توجد خطة غذائية نشطة بعد" : "No nutrition plan yet"}
              </p>
              <button
                onClick={() => onNavigate("nutrition", "createPlan")}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={11} strokeWidth={2.5} />
                {isAr ? "إنشاء خطة" : "Create Plan"}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── RIGHT COLUMN: secondary info + collapsibles ─────────────────── */}
      <div className="space-y-3">

        {/* Health Snapshot */}
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
          <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
            {isAr ? "لمحة صحية" : "Health Snapshot"}
          </p>
          <div>
            <InfoRow
              label={isAr ? "مستوى الخطر" : "Risk Level"}
              value={
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  client.riskLevel === "High"   ? "bg-red-50 text-red-600"       :
                  client.riskLevel === "Medium" ? "bg-amber-50 text-amber-700"   :
                                                  "bg-emerald-50 text-emerald-700"
                }`}>
                  {isAr
                    ? ({ Low: "منخفض", Medium: "متوسط", High: "مرتفع" } as Record<string,string>)[client.riskLevel] ?? client.riskLevel
                    : client.riskLevel}
                </span>
              }
            />
            {client.age > 0 && (
              <InfoRow label={isAr ? "العمر" : "Age"} value={`${client.age} ${isAr ? "سنة" : "yrs"}`} />
            )}
            {client.gender && (
              <InfoRow
                label={isAr ? "الجنس" : "Gender"}
                value={isAr ? (client.gender === "Female" ? "أنثى" : "ذكر") : client.gender}
              />
            )}
            {latestAssessment?.score != null && (
              <InfoRow
                label={isAr ? "آخر نقاط" : "Latest Score"}
                value={`${latestAssessment.score}/100`}
              />
            )}
          </div>
        </div>

        {/* Medical Notes */}
        {(client.medicalNotes || client.medicalNotesAr) && (
          <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
            <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">
              {isAr ? "ملاحظات طبية" : "Medical Notes"}
            </p>
            <p className="text-[12.5px] text-[var(--admin-text)] leading-relaxed line-clamp-4">
              {isAr ? client.medicalNotesAr : client.medicalNotes}
            </p>
          </div>
        )}

        {/* Private Notes */}
        {(client.privateNotes || client.privateNotesAr) && (
          <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4">
            <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">
              {isAr ? "ملاحظات خاصة" : "Private Notes"}
            </p>
            <p className="text-[12.5px] text-[var(--admin-text)] leading-relaxed line-clamp-4">
              {isAr ? client.privateNotesAr : client.privateNotes}
            </p>
          </div>
        )}

        {/* Diagnoses — collapsible */}
        {client.diagnoses.length > 0 && (
          <CollapsibleSection title={isAr ? "التشخيصات" : "Diagnoses"}>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isAr ? client.diagnosesAr : client.diagnoses).map((d, i) => (
                <span
                  key={i}
                  className="text-[11.5px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100"
                >
                  {d}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Risk Indicators — collapsible */}
        {client.riskIndicators.length > 0 && (
          <CollapsibleSection title={isAr ? "مؤشرات الخطر" : "Risk Indicators"}>
            <div className="pt-1">
              {client.riskIndicators.map((ri, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b border-[var(--admin-border)] last:border-0 gap-3"
                >
                  <span className="text-[12px] text-[var(--admin-text-muted)] shrink-0">
                    {isAr ? ri.labelAr : ri.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    ri.level === "critical" ? "bg-red-50 text-red-600"       :
                    ri.level === "warning"  ? "bg-amber-50 text-amber-700"   :
                                              "bg-emerald-50 text-emerald-700"
                  }`}>
                    {ri.value}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Timeline — collapsible, last */}
        <CollapsibleSection title={isAr ? "السجل الزمني" : "Activity Timeline"}>
          {client.timeline.length === 0 ? (
            <p className="text-[12px] text-[var(--admin-text-faint)] py-3 text-center">
              {isAr ? "لا توجد أنشطة بعد" : "No activity yet"}
            </p>
          ) : (
            <div className="pt-2">
              {client.timeline.map((ev, i) => (
                <TimelineRow
                  key={ev.id}
                  event={ev}
                  isAr={isAr}
                  isLast={i === client.timeline.length - 1}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

      </div>
    </div>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────

function AppointmentsTab({
  appointments, isAr, onBook,
}: { appointments: AppointmentRow[]; isAr: boolean; onBook: () => void }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        label={isAr ? "لا توجد مواعيد مسجلة" : "No appointments yet"}
        action={{ label: isAr ? "حجز موعد" : "Book Appointment", onClick: onBook }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => {
        const status = (appt.status ?? "scheduled") as KnownStatus;
        return (
          <div
            key={appt.id}
            className="
              flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl
              border border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)] transition-colors
            "
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={15} strokeWidth={1.8} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-tight">
                {appt.type ?? (isAr ? "استشارة" : "Consultation")}
              </p>
              <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
                {fmtDateLong(appt.date, isAr)}
                {appt.time  ? ` · ${appt.time}`  : ""}
                {appt.notes ? ` · ${appt.notes}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {appt.assessment_status && appt.assessment_status !== "none" && (
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  appt.assessment_status === "assessment_submitted"
                    ? "bg-purple-50 text-purple-600 ring-1 ring-purple-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                }`}>
                  {appt.assessment_status === "assessment_submitted"
                    ? (isAr ? "تقييم مقدَّم" : "Assessed")
                    : (isAr ? "انتظار التقييم" : "Awaiting Assessment")}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${APPT_BADGE[status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${APPT_DOT[status]}`} />
                {isAr ? APPT_LABEL_AR[status] : APPT_LABEL_EN[status]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Assessments Tab ──────────────────────────────────────────────────────────

function AssessmentsTab({
  assessments, isAr, onCreateAssessment,
}: {
  assessments: ClientAssessmentResponse[];
  isAr: boolean;
  onCreateAssessment: () => void;
}) {
  if (assessments.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        label={isAr ? "لا توجد تقييمات مقدمة بعد" : "No assessments submitted yet"}
        action={{ label: isAr ? "إنشاء تقييم" : "Create Assessment", onClick: onCreateAssessment }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {assessments.map((a) => (
        <div
          key={a.id}
          className="
            flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl
            border border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)] transition-colors
          "
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <ClipboardList size={15} strokeWidth={1.8} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-tight">
              {(isAr ? a.template_name_ar : a.template_name_en)
                ?? (isAr ? "قالب غير معروف" : "Unknown Template")}
            </p>
            <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
              {a.submitted_at
                ? fmtDateLong(a.submitted_at, isAr)
                : (a.created_at ? fmtDateLong(a.created_at, isAr) : "—")}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
            a.status === "submitted"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : a.status === "in_progress"
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]"
          }`}>
            {a.status === "submitted"
              ? (isAr ? "مقدَّم" : "Submitted")
              : a.status === "in_progress"
              ? (isAr ? "قيد التقديم" : "In Progress")
              : (isAr ? "معلق" : "Pending")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab({
  initialFiles, clientId, isAr, triggerUpload, onTriggerConsumed,
}: {
  initialFiles: Client["files"];
  clientId: string;
  isAr: boolean;
  triggerUpload?: boolean;
  onTriggerConsumed?: () => void;
}) {
  const [files,     setFiles]     = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Whenever triggerUpload flips to true (from the action bar or overview empty-state),
  // programmatically open the file picker and immediately consume the flag so the
  // parent resets it. Works both when the tab first mounts and when already mounted.
  useEffect(() => {
    if (triggerUpload && !uploading) {
      fileInputRef.current?.click();
      onTriggerConsumed?.();
    }
  }, [triggerUpload]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    const row = await uploadClientFile(clientId, file);
    setUploading(false);
    if (!row) return;
    const newFile: Client["files"][number] = {
      id:         row.id,
      name:       row.filename,
      type:       (row.type ?? "PDF") as import("@/admin/data/clients").FileType,
      size:       row.size ? `${(Number(row.size) / 1_048_576).toFixed(1)} MB` : "",
      uploadedAt: row.uploaded_at,
      url:        row.url ?? null,
    };
    setFiles((prev) => [newFile, ...prev]);
  }

  async function handleDelete(f: Client["files"][number]) {
    if (!window.confirm(isAr ? "هل تريد حذف هذا الملف؟" : "Delete this file?")) return;
    setDeleting(f.id);
    await deleteClientFile(f.id, f.url ?? null);
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex justify-end">
        <label className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold cursor-pointer
          bg-primary-pink/10 text-primary-pink hover:bg-primary-pink/20 transition-colors
          ${uploading ? "opacity-50 pointer-events-none" : ""}
        `}>
          {uploading ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
          ) : (
            <FileIcon size={13} strokeWidth={2} />
          )}
          {isAr ? (uploading ? "جارٍ الرفع…" : "رفع ملف") : (uploading ? "Uploading…" : "Upload File")}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={FileIcon}
          label={isAr ? "لا توجد ملفات مرفوعة بعد" : "No files uploaded yet"}
          action={{
            label: isAr ? "رفع ملف" : "Upload File",
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = f.type === "Image" ? ImageIcon : FileIcon;
            const isDeleting = deleting === f.id;
            return (
              <div
                key={f.id}
                className={`
                  flex items-center gap-3 p-3.5 rounded-xl
                  border border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)] transition-colors
                  ${isDeleting ? "opacity-50" : ""}
                `}
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
                  <Icon size={15} strokeWidth={1.8} className="text-[var(--admin-text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate">{f.name}</p>
                  <p className="text-[11.5px] text-[var(--admin-text-faint)]">
                    {f.type} · {f.size} · {fmtDate(f.uploadedAt, isAr)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {f.url ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={f.name}
                      title={isAr ? "تنزيل" : "Download"}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/8 transition-all"
                    >
                      <DownloadIcon size={14} strokeWidth={2} />
                    </a>
                  ) : (
                    <span
                      title={isAr ? "الرابط غير متاح" : "No URL available"}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)]/30 cursor-default"
                    >
                      <DownloadIcon size={14} strokeWidth={2} />
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(f)}
                    disabled={isDeleting}
                    title={isAr ? "حذف" : "Delete"}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({ client, isAr }: { client: Client; isAr: boolean }) {
  const medicalNotes = isAr ? client.medicalNotesAr : client.medicalNotes;
  const privateNotes = isAr ? client.privateNotesAr : client.privateNotes;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">
          {isAr ? "الملاحظات الطبية" : "Medical Notes"}
        </p>
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4 min-h-[80px]">
          {medicalNotes ? (
            <p className="text-[13px] text-[var(--admin-text)] leading-relaxed whitespace-pre-wrap">{medicalNotes}</p>
          ) : (
            <p className="text-[12.5px] text-[var(--admin-text-faint)] italic">
              {isAr ? "لا توجد ملاحظات طبية مسجلة." : "No medical notes recorded."}
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-2">
          {isAr ? "ملاحظات خاصة" : "Private Notes"}
        </p>
        <div className="bg-[var(--admin-hover-bg)] rounded-xl p-4 min-h-[80px]">
          {privateNotes ? (
            <p className="text-[13px] text-[var(--admin-text)] leading-relaxed whitespace-pre-wrap">{privateNotes}</p>
          ) : (
            <p className="text-[12.5px] text-[var(--admin-text-faint)] italic">
              {isAr ? "لا توجد ملاحظات خاصة مسجلة." : "No private notes recorded."}
            </p>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--admin-text-faint)] text-center pt-1">
        {isAr
          ? 'لتعديل الملاحظات، استخدمي زر "تعديل الملف" في الأعلى.'
          : 'To edit notes, use the "Edit Profile" button above.'}
      </p>
    </div>
  );
}

// ─── Primary Action Bar ───────────────────────────────────────────────────────

function ActionBar({
  isAr,
  onCreatePlan,
  onCreateAssessment,
  onBookAppointment,
  onUploadFile,
  onEditProfile,
  onArchive,
  onDelete,
}: {
  isAr: boolean;
  onCreatePlan: () => void;
  onCreateAssessment: () => void;
  onBookAppointment: () => void;
  onUploadFile: () => void;
  onEditProfile: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [moreOpen]);

  const btnBase = "inline-flex items-center gap-2 h-11 px-4 rounded-xl text-[12.5px] font-semibold transition-all whitespace-nowrap min-w-0";

  return (
    <motion.div
      {...fadeUp(0.02)}
      className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] px-4 py-3 mb-5"
    >
      <div className="flex flex-wrap gap-2 items-center">

        {/* Create Nutrition Plan */}
        <button
          onClick={onCreatePlan}
          className={`${btnBase} bg-emerald-500 text-white hover:bg-emerald-600`}
        >
          <Plus size={13} strokeWidth={2.5} />
          {isAr ? "خطة غذائية" : "Create Plan"}
        </button>

        {/* Create Assessment */}
        <button
          onClick={onCreateAssessment}
          className={`${btnBase} bg-purple-500 text-white hover:bg-purple-600`}
        >
          <ClipboardList size={13} strokeWidth={2} />
          {isAr ? "تقييم" : "Assessment"}
        </button>

        {/* Book Appointment */}
        <button
          onClick={onBookAppointment}
          className={`${btnBase} bg-blue-500 text-white hover:bg-blue-600`}
        >
          <Calendar size={13} strokeWidth={2} />
          {isAr ? "موعد" : "Book Appt"}
        </button>

        {/* Upload File */}
        <button
          onClick={onUploadFile}
          className={`${btnBase} bg-primary-pink text-white hover:opacity-90`}
        >
          <Upload size={13} strokeWidth={2} />
          {isAr ? "رفع ملف" : "Upload File"}
        </button>

        {/* Send Message — disabled */}
        <button
          disabled
          title={isAr ? "قريباً" : "Coming Soon"}
          className={`${btnBase} bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] opacity-50 cursor-not-allowed`}
        >
          <Send size={13} strokeWidth={2} />
          {isAr ? "رسالة" : "Message"}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Edit Profile */}
        <button
          onClick={onEditProfile}
          className={`${btnBase} border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]`}
        >
          <Edit2 size={13} strokeWidth={2} />
          {isAr ? "تعديل الملف" : "Edit Profile"}
        </button>

        {/* More (⋯) */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`${btnBase} px-3 border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]`}
            title={isAr ? "المزيد" : "More options"}
          >
            <MoreHorizontal size={16} strokeWidth={2} />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className={`
                  absolute top-full mt-1.5 z-50 min-w-[160px]
                  bg-[var(--admin-surface)] rounded-xl border border-[var(--admin-border)]
                  shadow-lg shadow-black/[0.08] overflow-hidden py-1
                  ${isAr ? "left-0" : "right-0"}
                `}
              >
                <button
                  onClick={() => { setMoreOpen(false); onArchive(); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors"
                >
                  <Archive size={13} strokeWidth={2} />
                  {isAr ? "أرشفة العميلة" : "Archive Client"}
                </button>
                <div className="border-t border-[var(--admin-border)] my-1" />
                <button
                  onClick={() => { setMoreOpen(false); onDelete(); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  {isAr ? "حذف العميلة" : "Delete Client"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [client,               setClient]               = useState<Client | null>(null);
  const [appointments,         setAppointments]         = useState<AppointmentRow[]>([]);
  const [assessments,          setAssessments]          = useState<ClientAssessmentResponse[]>([]);
  const [loading,              setLoading]              = useState(true);
  const [activeTab,            setActiveTab]            = useState<TabId>("overview");
  const [drawerOpen,           setDrawerOpen]           = useState(false);
  const [nutritionCount,       setNutritionCount]       = useState(0);
  const [progressCount,        setProgressCount]        = useState(0);
  // Pending remote-trigger flags for NutritionPlansTab and FilesTab
  const [pendingNutritionOpen, setPendingNutritionOpen] = useState(false);
  const [pendingUpload,        setPendingUpload]        = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getClient(id),
      getClientAppointments(id),
      getClientAssessmentResponses(id),
    ]).then(([c, appts, assmts]) => {
      setClient(c);
      setAppointments(appts);
      setAssessments(assmts);
      setLoading(false);
    });
  }, [id]);

  // Next upcoming appointment
  const nextAppt = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      appointments
        .filter(
          (a) =>
            a.date >= today &&
            (a.status === "scheduled" || a.status === "confirmed"),
        )
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    );
  }, [appointments]);

  // Refresh client data after drawer edit
  function handleRefresh() {
    if (!id) return;
    getClient(id).then(setClient);
  }

  // Navigation handler wired to action bar buttons + overview tab buttons
  function handleNavigate(tab: TabId, action?: "createPlan" | "upload") {
    setActiveTab(tab);
    if (action === "createPlan") setPendingNutritionOpen(true);
    if (action === "upload")     setPendingUpload(true);
  }

  // Archive client — sets status to Inactive
  async function handleArchive() {
    if (!id) return;
    const confirmed = window.confirm(
      isAr
        ? "هل تريدين أرشفة هذه العميلة؟ سيتم تغيير حالتها إلى غير نشطة."
        : "Archive this client? Their status will be set to Inactive.",
    );
    if (!confirmed) return;
    await archiveClient(id);
    handleRefresh();
  }

  // Delete client — permanent
  async function handleDelete() {
    if (!id) return;
    const confirmed = window.confirm(
      isAr
        ? "هل أنتِ متأكدة من حذف هذه العميلة نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        : "Permanently delete this client? This cannot be undone.",
    );
    if (!confirmed) return;
    const ok = await deleteClient(id);
    if (ok) navigate("/admin/clients");
  }

  if (loading) return <LoadingSkeleton />;

  if (!client) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
          <UserCircle size={32} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-[var(--admin-text)]">
            {isAr ? "العميل غير موجود" : "Client not found"}
          </p>
          <p className="text-[13px] text-[var(--admin-text-muted)] mt-1">
            {isAr ? "تحقق من الرابط أو ارجع إلى قائمة العملاء." : "Check the URL or go back to the client list."}
          </p>
        </div>
        <Link
          to="/admin/clients"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-pink hover:underline"
        >
          <ArrowLeft size={13} />
          {isAr ? "العودة إلى العملاء" : "Back to Clients"}
        </Link>
      </div>
    );
  }

  const submittedCount = assessments.filter((a) => a.status === "submitted").length;

  // 4-card quick stats
  const quickStats = [
    {
      label:    isAr ? "إجمالي المواعيد"    : "Appointments",
      value:    appointments.length,
      icon:     Calendar,
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      delay:    0.05,
    },
    {
      label:    isAr ? "التقييمات المكتملة" : "Assessments",
      value:    submittedCount,
      icon:     FileText,
      gradient: "bg-gradient-to-br from-primary-pink to-soft-pink",
      delay:    0.10,
    },
    {
      label:    isAr ? "خطط غذائية نشطة"   : "Nutrition Plans",
      value:    nutritionCount,
      icon:     BookOpen,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      delay:    0.15,
    },
    {
      label:    isAr ? "الملفات المرفوعة"   : "Files",
      value:    client.files.length,
      icon:     FileIcon,
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      delay:    0.20,
    },
  ];

  // Tab badge counts
  const tabCounts: Partial<Record<TabId, number>> = {
    appointments: appointments.length,
    assessments:  assessments.length,
    nutrition:    nutritionCount,
    progress:     progressCount,
    files:        client.files.length,
  };

  return (
    <>
      {/* Edit / delete drawer — shown only when open */}
      <ClientDrawer
        client={drawerOpen ? client : null}
        isAr={isAr}
        onClose={() => setDrawerOpen(false)}
        onDelete={() => navigate("/admin/clients")}
        onRefresh={handleRefresh}
      />

      <div>
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <PageHeader
          title={isAr ? client.fullNameAr : client.fullName}
          breadcrumbs={[
            { label: isAr ? "الإدارة" : "Admin",   href: "/admin" },
            { label: isAr ? "العملاء" : "Clients", href: "/admin/clients" },
            { label: isAr ? client.fullNameAr : client.fullName },
          ]}
        />

        {/* ── Primary Action Bar ──────────────────────────────────────────── */}
        <ActionBar
          isAr={isAr}
          onCreatePlan={() => handleNavigate("nutrition", "createPlan")}
          onCreateAssessment={() => handleNavigate("assessments")}
          onBookAppointment={() => handleNavigate("appointments")}
          onUploadFile={() => handleNavigate("files", "upload")}
          onEditProfile={() => setDrawerOpen(true)}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />

        {/* ── Profile Header Card ─────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.04)}
          className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div
              className={`
                w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center
                text-white text-[22px] font-bold shadow-md shadow-black/10
                ${client.avatarGradient}
              `}
            >
              {client.avatarInitials}
            </div>

            {/* Name + contact + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h2 className="text-[20px] font-bold text-[var(--admin-text)] leading-tight">
                  {isAr ? client.fullNameAr : client.fullName}
                </h2>
                <span className={`
                  inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full
                  ${CLIENT_STATUS_BADGE[client.status] ?? ""}
                `}>
                  <span className={`w-1.5 h-1.5 rounded-full ${CLIENT_STATUS_DOT[client.status] ?? ""}`} />
                  {isAr ? CLIENT_STATUS_LABEL_AR[client.status] : CLIENT_STATUS_LABEL_EN[client.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-[var(--admin-text-muted)]">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-primary-pink transition-colors">
                    <Mail size={12} strokeWidth={2} />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-primary-pink transition-colors">
                    <Phone size={12} strokeWidth={2} />
                    {client.phone}
                  </a>
                )}
                {client.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} strokeWidth={2} />
                    {isAr ? client.countryAr : client.country}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2.5 text-[12px]">
                {client.joinedDate && (
                  <span className="flex items-center gap-1.5 text-[var(--admin-text-faint)]">
                    <Star size={11} strokeWidth={2} />
                    {isAr ? "انضمت: " : "Joined: "}
                    {fmtDate(client.joinedDate, isAr)}
                  </span>
                )}
                {client.lastAppointment && (
                  <span className="flex items-center gap-1.5 text-[var(--admin-text-faint)]">
                    <Clock size={11} strokeWidth={2} />
                    {isAr ? "آخر موعد: " : "Last appt: "}
                    {client.lastAppointment}
                  </span>
                )}
                {nextAppt ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CalendarCheck size={11} strokeWidth={2} />
                    {isAr ? "القادم: " : "Next: "}
                    {fmtDateLong(nextAppt.date, isAr)}
                    {nextAppt.time ? ` · ${nextAppt.time}` : ""}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[var(--admin-text-faint)]">
                    <CalendarCheck size={11} strokeWidth={2} />
                    {isAr ? "لا مواعيد قادمة" : "No upcoming appointments"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Stats (4 cards) ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {quickStats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* ── Tab Panel ──────────────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.22)}
          className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
        >
          {/* Tab bar — horizontal scroll on mobile */}
          <div className="flex overflow-x-auto border-b border-[var(--admin-border)] scrollbar-none">
            {TABS.map((tab) => {
              const count    = tabCounts[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5
                    text-[12.5px] font-semibold border-b-2 transition-all whitespace-nowrap
                    ${isActive
                      ? "border-primary-pink text-primary-pink bg-primary-pink/[0.03]"
                      : "border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)]"}
                  `}
                >
                  {isAr ? tab.ar : tab.en}
                  {count !== undefined && count > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                      ${isActive
                        ? "bg-primary-pink/15 text-primary-pink"
                        : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)]"}
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "overview" && (
                  <OverviewTab
                    client={client}
                    assessments={assessments}
                    nutritionCount={nutritionCount}
                    isAr={isAr}
                    onNavigate={handleNavigate}
                  />
                )}
                {activeTab === "appointments" && (
                  <AppointmentsTab
                    appointments={appointments}
                    isAr={isAr}
                    onBook={() => setActiveTab("appointments")}
                  />
                )}
                {activeTab === "assessments" && (
                  <AssessmentsTab
                    assessments={assessments}
                    isAr={isAr}
                    onCreateAssessment={() => {/* future: open assessment wizard */}}
                  />
                )}
                {activeTab === "nutrition" && (
                  <NutritionPlansTab
                    clientId={client.id}
                    isAr={isAr}
                    onCountChange={setNutritionCount}
                    autoOpenCreate={pendingNutritionOpen}
                    onAutoOpenConsumed={() => setPendingNutritionOpen(false)}
                  />
                )}
                {activeTab === "payments" && (
                  <PlaceholderTab
                    icon={CreditCard}
                    title="Payments"         titleAr="المدفوعات"
                    desc="Payment history and invoices will appear here."
                    descAr="سجل المدفوعات والفواتير سيظهر هنا."
                    isAr={isAr}
                  />
                )}
                {activeTab === "files" && (
                  <FilesTab
                    initialFiles={client.files}
                    clientId={client.id}
                    isAr={isAr}
                    triggerUpload={pendingUpload}
                    onTriggerConsumed={() => setPendingUpload(false)}
                  />
                )}
                {activeTab === "progress" && (
                  <ProgressTab
                    clientId={client.id}
                    isAr={isAr}
                    onCountChange={setProgressCount}
                  />
                )}
                {activeTab === "notes" && (
                  <NotesTab client={client} isAr={isAr} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
