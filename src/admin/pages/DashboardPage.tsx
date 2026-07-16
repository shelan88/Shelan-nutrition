/**
 * DashboardPage — /admin
 *
 * Premium production-ready dashboard for SHELAN Admin Portal.
 * Sections:
 *   1. Welcome Header
 *   2. KPI Cards (4) — animated counters
 *   3. Today's Schedule — timeline
 *   4. Recent Assessment Requests — table
 *   5. Latest Messages — inbox
 *   6. Quick Actions — icon cards
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar, Users, FileText, CreditCard,
  TrendingUp, TrendingDown, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle, MinusCircle,
  Plus, BookOpen, Upload, Star, Briefcase, BarChart3,
  MessageSquare, ChevronRight, Sparkles, Dot,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useDashboardStore } from "@/admin/repositories/dashboard.repository";

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getGreeting(isAr: boolean): string {
  const hour = new Date().getHours();
  if (isAr) {
    if (hour < 12) return "صباح الخير، شيلان 🌸";
    if (hour < 17) return "مساء الخير، شيلان 🌸";
    return "مساء النور، شيلان 🌸";
  }
  if (hour < 12) return "Good morning, Shelan 🌸";
  if (hour < 17) return "Good afternoon, Shelan 🌸";
  return "Good evening, Shelan 🌸";
}

function formatDate(isAr: boolean): string {
  const now = new Date();
  return now.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      const tick = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame); };
  }, [target, duration, delay]);
  return value;
}

// ─── Fade-in animation preset ──────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] },
});

// ─── 1. KPI Card ───────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  rawValue: number;
  prefix?: string;
  suffix?: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  gradient: string;
  href: string;
  delay: number;
  isAr: boolean;
}

function KpiCard({ label, rawValue, prefix = "", suffix = "", change, positive, icon: Icon, gradient, href, delay }: KpiProps) {
  const count = useCountUp(rawValue, 1100, delay * 1000 + 200);

  return (
    <motion.div {...fadeUp(delay)}>
      <Link
        to={href}
        className="
          group relative block overflow-hidden
          bg-[var(--admin-surface)] rounded-2xl
          border border-[var(--admin-border)]
          p-5 hover:border-[var(--admin-border-strong)]
          hover:shadow-xl hover:shadow-black/[0.06]
          hover:-translate-y-0.5
          transition-all duration-200
        "
      >
        {/* Subtle glow in top-right */}
        <div className={`absolute -top-6 -end-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${gradient}`} />

        <div className="relative flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${gradient}`}>
            <Icon size={19} strokeWidth={1.7} className="text-white" />
          </div>
          <ArrowUpRight
            size={14}
            className="text-[var(--admin-text-faint)] group-hover:text-primary-pink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
          />
        </div>

        <p className="text-[12.5px] font-medium text-[var(--admin-text-muted)] mb-1 tracking-wide">
          {label}
        </p>
        <p className="text-[30px] font-bold text-[var(--admin-text)] leading-none mb-3 tabular-nums">
          {prefix}{count.toLocaleString()}{suffix}
        </p>

        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          positive
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-500"
        }`}>
          {positive
            ? <TrendingUp size={10} />
            : <TrendingDown size={10} />
          }
          {change}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── 2. Schedule item ──────────────────────────────────────────────────────────
interface AppointmentProps {
  time: string;
  client: string;
  service: string;
  status: "confirmed" | "in-progress" | "upcoming";
  isAr: boolean;
}

const statusConfig = {
  confirmed:    { color: "bg-emerald-500", label: "Confirmed",   labelAr: "مؤكد",     ring: "ring-emerald-100" },
  "in-progress":{ color: "bg-primary-pink", label: "In Progress", labelAr: "جارٍ الآن", ring: "ring-pink-100"    },
  upcoming:     { color: "bg-[var(--admin-text-faint)]", label: "Upcoming", labelAr: "قادم", ring: "ring-purple-100" },
};

function ScheduleItem({ time, client, service, status, isAr, isLast }: AppointmentProps & { isLast: boolean }) {
  const cfg = statusConfig[status];
  return (
    <div className="flex gap-4 group">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ring-4 ${cfg.color} ${cfg.ring}`} />
        {!isLast && <div className="w-px flex-1 mt-1.5 bg-[var(--admin-border)]" />}
      </div>

      {/* Content */}
      <div className={`pb-5 flex-1 min-w-0 ${isLast ? "" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-[var(--admin-text)] leading-snug truncate">{client}</p>
            <p className="text-[12px] text-[var(--admin-text-muted)] truncate">{service}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-[11px] font-semibold text-[var(--admin-text-faint)] flex items-center gap-1">
              <Clock size={10} /> {time}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${cfg.color}`}>
              {isAr ? cfg.labelAr : cfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 3. Assessment row ─────────────────────────────────────────────────────────
interface AssessmentProps {
  client: string;
  initials: string;
  date: string;
  risk: "High" | "Medium" | "Low";
  status: "Pending" | "Reviewed" | "Flagged";
  isAr: boolean;
}

const riskStyle = {
  High:   "bg-red-50 text-red-600 ring-1 ring-red-200",
  Medium: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  Low:    "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
};
const riskAr = { High: "مرتفع", Medium: "متوسط", Low: "منخفض" };

const assessStatusStyle = {
  Pending:  "bg-amber-50 text-amber-600",
  Reviewed: "bg-emerald-50 text-emerald-600",
  Flagged:  "bg-red-50 text-red-600",
};
const assessStatusAr = { Pending: "بانتظار المراجعة", Reviewed: "تمت المراجعة", Flagged: "مُعلَّق" };

function AssessmentRow({ client, initials, date, risk, status, isAr }: AssessmentProps) {
  return (
    <tr className="group border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender-purple to-soft-purple flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {initials}
          </div>
          <span className="text-[13px] font-semibold text-[var(--admin-text)]">{client}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-[12.5px] text-[var(--admin-text-muted)]">{date}</td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${riskStyle[risk]}`}>
          {risk === "High" && <AlertCircle size={10} />}
          {isAr ? riskAr[risk] : risk}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${assessStatusStyle[status]}`}>
          {isAr ? assessStatusAr[status] : status}
        </span>
      </td>
      <td className="py-3 px-4">
        <button className="text-[12px] font-semibold text-primary-pink hover:text-soft-purple transition-colors opacity-0 group-hover:opacity-100">
          {isAr ? "مراجعة ←" : "Review →"}
        </button>
      </td>
    </tr>
  );
}

// ─── 4. Message item ───────────────────────────────────────────────────────────
interface MessageProps {
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread: boolean;
  gradient: string;
}

function MessageItem({ initials, name, preview, time, unread, gradient }: MessageProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] -mx-5 px-5 cursor-pointer transition-colors group">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${gradient}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-[13px] truncate ${unread ? "font-bold text-[var(--admin-text)]" : "font-medium text-[var(--admin-text-muted)]"}`}>
            {name}
          </p>
          <span className="text-[10.5px] text-[var(--admin-text-faint)] shrink-0">{time}</span>
        </div>
        <p className="text-[12px] text-[var(--admin-text-faint)] truncate leading-snug">{preview}</p>
      </div>
      {unread && (
        <div className="w-2 h-2 rounded-full bg-primary-pink shrink-0 mt-1.5" />
      )}
    </div>
  );
}

// ─── 5. Quick action card ──────────────────────────────────────────────────────
interface QuickActionProps {
  label: string;
  icon: React.ElementType;
  gradient: string;
  href: string;
  delay: number;
}

function QuickActionCard({ label, icon: Icon, gradient, href, delay }: QuickActionProps) {
  return (
    <motion.div {...fadeUp(delay)}>
      <Link
        to={href}
        className="
          group flex flex-col items-center justify-center gap-2.5
          bg-[var(--admin-surface)] rounded-2xl
          border border-[var(--admin-border)] p-4
          hover:border-[var(--admin-border-strong)]
          hover:shadow-lg hover:shadow-black/[0.05]
          hover:-translate-y-0.5
          transition-all duration-200 text-center
        "
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${gradient}`}>
          <Icon size={17} strokeWidth={1.8} className="text-white" />
        </div>
        <span className="text-[12px] font-semibold text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text)] transition-colors leading-snug">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const store = useDashboardStore();

  // ── KPI data ──
  const kpis: KpiProps[] = [
    {
      label:    isAr ? "الحجوزات اليوم"     : "Today's Bookings",
      rawValue: 24,
      change:   isAr ? "+١٢٪ هذا الأسبوع"  : "+12% this week",
      positive: true,
      icon: Calendar,
      gradient: "bg-gradient-to-br from-primary-pink to-soft-pink",
      href:  "/admin/bookings",
      delay: 0.06,
      isAr,
    },
    {
      label:    isAr ? "إجمالي العملاء"    : "Total Clients",
      rawValue: store.totalClients,
      change:   isAr ? "+٨ هذا الشهر"      : "+8 this month",
      positive: true,
      icon: Users,
      gradient: "bg-gradient-to-br from-lavender-purple to-soft-purple",
      href:  "/admin/clients",
      delay: 0.12,
      isAr,
    },
    {
      label:    isAr ? "تقييمات معلّقة"    : "Pending Assessments",
      rawValue: store.pendingAssessments,
      change:   isAr ? "تحتاج مراجعة"      : "needs attention",
      positive: false,
      icon: FileText,
      gradient: "bg-gradient-to-br from-amber-400 to-orange-400",
      href:  "/admin/assessment-templates",
      delay: 0.18,
      isAr,
    },
    {
      label:    isAr ? "الإيرادات الشهرية" : "Monthly Revenue",
      rawValue: 4200,
      prefix:   "$",
      change:   isAr ? "+٢٣٪ مقارنة بالشهر الماضي" : "+23% vs last month",
      positive: true,
      icon: CreditCard,
      gradient: "bg-gradient-to-br from-deep-purple to-soft-purple",
      href:  "/admin/payments",
      delay: 0.24,
      isAr,
    },
  ];

  // ── Schedule data ──
  const schedule: (AppointmentProps & { isLast: boolean })[] = [
    { time: "09:00 AM", client: isAr ? "لارا حسن"         : "Lara Hassan",        service: isAr ? "استشارة أولية"     : "Initial Consultation",   status: "confirmed",   isAr, isLast: false },
    { time: "10:30 AM", client: isAr ? "ريم الأحمد"        : "Reem Al-Ahmad",      service: isAr ? "جلسة متابعة"        : "Follow-up Session",      status: "confirmed",   isAr, isLast: false },
    { time: "12:00 PM", client: isAr ? "نورا محمد"         : "Nora Mohammed",      service: isAr ? "تقييم تغذوي"        : "Nutritional Assessment", status: "in-progress", isAr, isLast: false },
    { time: "02:00 PM", client: isAr ? "فاطمة الراشد"      : "Fatima Al-Rashid",   service: isAr ? "إدارة الوزن"        : "Weight Management",      status: "upcoming",    isAr, isLast: false },
    { time: "04:00 PM", client: isAr ? "سارة خالد"         : "Sara Khalid",        service: isAr ? "مراجعة خطة الأكل"   : "Meal Plan Review",       status: "upcoming",    isAr, isLast: true  },
  ];

  // ── Assessment data (live from dashboard repository) ──
  const assessments: AssessmentProps[] = store.assessmentEntries.slice(0, 5).map((e) => ({
    client:   e.client,
    initials: e.initials,
    date:     e.date,
    risk:     e.risk,
    status:   e.status,
    isAr,
  }));

  // ── Messages data ──
  const messages: MessageProps[] = [
    { initials: "RA", name: isAr ? "ريم الأحمد"    : "Reem Al-Ahmad",     preview: isAr ? "شكراً جزيلاً على جلسة الأمس، لديّ سؤال…" : "Thank you so much for yesterday's session, I have a question…", time: isAr ? "منذ ١٢ د" : "12m",  unread: true,  gradient: "bg-gradient-to-br from-primary-pink to-soft-pink" },
    { initials: "NM", name: isAr ? "نورا محمد"     : "Nora Mohammed",     preview: isAr ? "هل يمكنني تغيير موعد الاثنين القادم؟"       : "Can I reschedule my Monday appointment?",                         time: isAr ? "منذ ٤٥ د" : "45m",  unread: true,  gradient: "bg-gradient-to-br from-lavender-purple to-soft-purple" },
    { initials: "FK", name: isAr ? "فاطمة خالد"    : "Fatima Khalid",     preview: isAr ? "لقد التزمت بالخطة الغذائية هذا الأسبوع!"    : "I've been sticking to the meal plan this week!",                  time: isAr ? "منذ ٢ س"  : "2h",   unread: true,  gradient: "bg-gradient-to-br from-soft-purple to-deep-purple" },
    { initials: "SK", name: isAr ? "سارة الكندي"   : "Sara Al-Kindi",     preview: isAr ? "وصلت نتائج الفحوصات، هل تودّين الاطلاع؟"    : "My lab results are in, would you like to review them?",           time: isAr ? "منذ ٥ س"  : "5h",   unread: false, gradient: "bg-gradient-to-br from-primary-pink to-lavender-purple" },
    { initials: "LH", name: isAr ? "لارا حسن"      : "Lara Hassan",       preview: isAr ? "أحتاج إلى تعديل بسيط على برنامج التمارين"   : "I need a small tweak to my exercise programme",                   time: isAr ? "منذ ١ ي"  : "1d",   unread: false, gradient: "bg-gradient-to-br from-soft-pink to-primary-pink" },
  ];

  // ── Quick actions ──
  const quickActions: QuickActionProps[] = [
    { label: isAr ? "إضافة عميل"       : "Add Client",         icon: Plus,       gradient: "bg-gradient-to-br from-primary-pink to-soft-pink",     href: "/admin/clients",               delay: 0.30 },
    { label: isAr ? "مقال جديد"        : "Create Blog Post",   icon: BookOpen,   gradient: "bg-gradient-to-br from-lavender-purple to-soft-purple", href: "/admin/blog",                  delay: 0.34 },
    { label: isAr ? "رفع ملف PDF"      : "Upload PDF",         icon: Upload,     gradient: "bg-gradient-to-br from-soft-purple to-deep-purple",     href: "/admin/media-library",         delay: 0.38 },
    { label: isAr ? "إضافة شهادة"      : "Add Testimonial",    icon: Star,       gradient: "bg-gradient-to-br from-amber-400 to-orange-400",        href: "/admin/testimonials",          delay: 0.42 },
    { label: isAr ? "إنشاء خدمة"       : "Create Service",     icon: Briefcase,  gradient: "bg-gradient-to-br from-primary-pink to-lavender-purple", href: "/admin/services",              delay: 0.46 },
    { label: isAr ? "التحليلات"        : "View Analytics",     icon: BarChart3,  gradient: "bg-gradient-to-br from-deep-purple to-lavender-purple",  href: "/admin/analytics",             delay: 0.50 },
  ];

  return (
    <div className="space-y-6">

      {/* ── 1. Welcome Header ─────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        className="
          relative overflow-hidden rounded-2xl
          bg-gradient-to-br from-[#fef0f6] via-[#f9f0ff] to-[#ede9ff]
          border border-[var(--admin-border)]
          px-6 py-5
        "
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -end-10 w-48 h-48 rounded-full bg-gradient-to-br from-primary-pink/20 to-lavender-purple/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 start-1/3 w-32 h-32 rounded-full bg-gradient-to-br from-lavender-purple/15 to-soft-purple/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-primary-pink" strokeWidth={2} />
              <span className="text-[11px] font-semibold text-primary-pink uppercase tracking-widest">
                {isAr ? "لوحة التحكم" : "Admin Dashboard"}
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-[var(--admin-text)] leading-tight mb-1">
              {getGreeting(isAr)}
            </h1>
            <p className="text-[13.5px] text-[var(--admin-text-muted)]">
              {isAr
                ? "إليكِ ملخص ما يحدث في عيادتكِ اليوم."
                : "Here's what's happening in your clinic today."}
            </p>
          </div>

          <div className="sm:text-end">
            <p className="text-[12px] font-semibold text-[var(--admin-text-faint)] flex sm:justify-end items-center gap-1.5">
              <Calendar size={12} strokeWidth={2} />
              {formatDate(isAr)}
            </p>
            <div className="flex sm:justify-end gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? "٥ مواعيد اليوم" : "5 appointments today"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-pink bg-pink-50 px-2.5 py-0.5 rounded-full ring-1 ring-pink-200">
                <MessageSquare size={10} strokeWidth={2} />
                {isAr ? "٣ رسائل جديدة" : "3 new messages"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── 3 + 5. Schedule (left) + Messages (right) ─────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">

        {/* Today's Schedule */}
        <motion.div {...fadeUp(0.28)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
            <div>
              <h2 className="text-[14px] font-bold text-[var(--admin-text)]">
                {isAr ? "مواعيد اليوم" : "Today's Schedule"}
              </h2>
              <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
                {isAr ? "٥ مواعيد مجدولة" : "5 appointments scheduled"}
              </p>
            </div>
            <Link
              to="/admin/bookings"
              className="flex items-center gap-1 text-[12px] font-semibold text-primary-pink hover:text-soft-purple transition-colors"
            >
              {isAr ? "الكل" : "View all"}
              <ChevronRight size={13} className="rtl:rotate-180" />
            </Link>
          </div>

          <div className="px-5 pt-5">
            {schedule.map((appt, i) => (
              <ScheduleItem key={i} {...appt} />
            ))}
          </div>
        </motion.div>

        {/* Latest Messages */}
        <motion.div {...fadeUp(0.32)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
            <div>
              <h2 className="text-[14px] font-bold text-[var(--admin-text)]">
                {isAr ? "آخر الرسائل" : "Latest Messages"}
              </h2>
              <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
                {isAr ? "٣ غير مقروءة" : "3 unread"}
              </p>
            </div>
            <Link
              to="/admin/messages"
              className="flex items-center gap-1 text-[12px] font-semibold text-primary-pink hover:text-soft-purple transition-colors"
            >
              {isAr ? "الكل" : "View all"}
              <ChevronRight size={13} className="rtl:rotate-180" />
            </Link>
          </div>

          <div className="px-5">
            {messages.map((msg, i) => (
              <MessageItem key={i} {...msg} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── 4. Assessment Requests ────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.34)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <div>
            <h2 className="text-[14px] font-bold text-[var(--admin-text)]">
              {isAr ? "طلبات التقييم الأخيرة" : "Recent Assessment Requests"}
            </h2>
            <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
              {isAr ? "٢ تحتاجان مراجعة عاجلة" : "2 flagged and require urgent review"}
            </p>
          </div>
          <Link
            to="/admin/assessment-templates"
            className="flex items-center gap-1 text-[12px] font-semibold text-primary-pink hover:text-soft-purple transition-colors"
          >
            {isAr ? "الكل" : "View all"}
            <ChevronRight size={13} className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
                {[
                  isAr ? "العميلة" : "Client",
                  isAr ? "التاريخ"  : "Date",
                  isAr ? "مستوى الخطر" : "Risk Level",
                  isAr ? "الحالة"   : "Status",
                  isAr ? "إجراء"    : "Action",
                ].map((h) => (
                  <th key={h} className="text-start px-4 py-2.5 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => (
                <AssessmentRow key={i} {...a} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── 6. Quick Actions ──────────────────────────────────────────────── */}
      <div>
        <motion.p {...fadeUp(0.28)} className="text-[12px] font-bold text-[var(--admin-text-faint)] uppercase tracking-widest mb-3 px-0.5">
          {isAr ? "إجراءات سريعة" : "Quick Actions"}
        </motion.p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((qa) => (
            <QuickActionCard key={qa.label} {...qa} />
          ))}
        </div>
      </div>

    </div>
  );
}
