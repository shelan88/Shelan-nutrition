/**
 * DashboardPage — /admin
 *
 * The primary landing page of the admin portal.
 * Shows metric card skeletons, quick-action nav, and an activity placeholder.
 * All values are static placeholders — replace with Supabase queries.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar, Users, MessageSquare, CreditCard,
  TrendingUp, ArrowUpRight, Clock,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  href: string;
  delay: number;
}

function StatCard({ label, value, change, positive, icon: Icon, color, href, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={href}
        className="group block bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5 hover:border-[var(--admin-border-strong)] hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} strokeWidth={1.8} className="text-white" />
          </div>
          <ArrowUpRight
            size={14}
            className="text-[var(--admin-text-faint)] group-hover:text-primary-pink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
          />
        </div>

        <p className="text-[13px] text-[var(--admin-text-muted)] mb-1">{label}</p>
        <p className="text-[28px] font-semibold text-[var(--admin-text)] leading-none mb-2 !font-sans">
          {value}
        </p>
        <div className={`flex items-center gap-1 text-[11px] font-medium ${positive ? "text-emerald-500" : "text-red-400"}`}>
          <TrendingUp size={11} className={positive ? "" : "rotate-180"} />
          {change}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Quick action ─────────────────────────────────────────────────────────────
function QuickAction({ label, description, href, gradient }: {
  label: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-4 bg-[var(--admin-surface)] rounded-xl border border-[var(--admin-border)] px-4 py-3.5 hover:border-[var(--admin-border-strong)] hover:shadow-md hover:shadow-black/5 transition-all duration-200"
    >
      <div className={`w-2 h-8 rounded-full shrink-0 ${gradient}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-snug truncate">{label}</p>
        <p className="text-[11px] text-[var(--admin-text-faint)] truncate">{description}</p>
      </div>
      <ArrowUpRight size={14} className="text-[var(--admin-text-faint)] group-hover:text-primary-pink shrink-0 transition-colors" />
    </Link>
  );
}

// ─── Activity item ────────────────────────────────────────────────────────────
function ActivityItem({ icon: Icon, text, time, color }: {
  icon: React.ElementType;
  text: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--admin-border)] last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={13} strokeWidth={2} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[var(--admin-text)] leading-snug">{text}</p>
        <p className="text-[11px] text-[var(--admin-text-faint)] flex items-center gap-1 mt-0.5">
          <Clock size={10} /> {time}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const stats: StatCardProps[] = isAr
    ? [
        { label: "الحجوزات القادمة", value: "—", change: "البيانات الحية قريباً", positive: true, icon: Calendar, color: "bg-gradient-to-br from-primary-pink to-soft-pink", href: "/admin/bookings", delay: 0.05 },
        { label: "العملاء النشطون", value: "—", change: "البيانات الحية قريباً", positive: true, icon: Users, color: "bg-gradient-to-br from-soft-purple to-lavender-purple", href: "/admin/clients", delay: 0.10 },
        { label: "رسائل جديدة", value: "3", change: "+3 منذ آخر تسجيل دخول", positive: true, icon: MessageSquare, color: "bg-gradient-to-br from-lavender-purple to-soft-purple", href: "/admin/messages", delay: 0.15 },
        { label: "الإيرادات الشهرية", value: "—", change: "البيانات الحية قريباً", positive: true, icon: CreditCard, color: "bg-gradient-to-br from-deep-purple to-soft-purple", href: "/admin/payments", delay: 0.20 },
      ]
    : [
        { label: "Upcoming Bookings", value: "—", change: "Live data coming soon", positive: true, icon: Calendar, color: "bg-gradient-to-br from-primary-pink to-soft-pink", href: "/admin/bookings", delay: 0.05 },
        { label: "Active Clients", value: "—", change: "Live data coming soon", positive: true, icon: Users, color: "bg-gradient-to-br from-soft-purple to-lavender-purple", href: "/admin/clients", delay: 0.10 },
        { label: "New Messages", value: "3", change: "+3 since last login", positive: true, icon: MessageSquare, color: "bg-gradient-to-br from-lavender-purple to-soft-purple", href: "/admin/messages", delay: 0.15 },
        { label: "Monthly Revenue", value: "—", change: "Live data coming soon", positive: true, icon: CreditCard, color: "bg-gradient-to-br from-deep-purple to-soft-purple", href: "/admin/payments", delay: 0.20 },
      ];

  const quickActions = isAr
    ? [
        { label: "إدارة الحجوزات", description: "عرض وتأكيد المواعيد القادمة", href: "/admin/bookings", gradient: "bg-gradient-to-b from-primary-pink to-soft-pink" },
        { label: "عرض الرسائل", description: "٣ رسائل جديدة تنتظر ردّكِ", href: "/admin/messages", gradient: "bg-gradient-to-b from-lavender-purple to-soft-purple" },
        { label: "تحديث الخدمات", description: "تعديل خدمات وأسعار الاستشارة", href: "/admin/services", gradient: "bg-gradient-to-b from-soft-purple to-deep-purple" },
        { label: "قوالب التقييم", description: "إدارة أسئلة الاستبيان الصحي", href: "/admin/assessment-templates", gradient: "bg-gradient-to-b from-primary-pink to-lavender-purple" },
        { label: "المدونة", description: "نشر مقالات جديدة وإدارة المحتوى", href: "/admin/blog", gradient: "bg-gradient-to-b from-soft-pink to-primary-pink" },
        { label: "الإعدادات", description: "تكوين المنصة والتكاملات", href: "/admin/settings", gradient: "bg-gradient-to-b from-deep-purple to-soft-purple" },
      ]
    : [
        { label: "Manage Bookings", description: "View and confirm upcoming appointments", href: "/admin/bookings", gradient: "bg-gradient-to-b from-primary-pink to-soft-pink" },
        { label: "View Messages", description: "3 new messages awaiting your reply", href: "/admin/messages", gradient: "bg-gradient-to-b from-lavender-purple to-soft-purple" },
        { label: "Update Services", description: "Edit consultation services and pricing", href: "/admin/services", gradient: "bg-gradient-to-b from-soft-purple to-deep-purple" },
        { label: "Assessment Templates", description: "Manage health questionnaire questions", href: "/admin/assessment-templates", gradient: "bg-gradient-to-b from-primary-pink to-lavender-purple" },
        { label: "Blog", description: "Publish new articles and manage content", href: "/admin/blog", gradient: "bg-gradient-to-b from-soft-pink to-primary-pink" },
        { label: "Settings", description: "Configure platform and integrations", href: "/admin/settings", gradient: "bg-gradient-to-b from-deep-purple to-soft-purple" },
      ];

  const activities = isAr
    ? [
        { icon: MessageSquare, text: "رسالة استفسار جديدة من ريم الأحمد", time: "منذ ١٢ دقيقة", color: "bg-lavender-purple" },
        { icon: Calendar, text: "حجز استشارة جديد — الثلاثاء ١٢:٠٠ م", time: "منذ ٤٥ دقيقة", color: "bg-primary-pink" },
        { icon: Users, text: "تسجيل عميل جديد: نورا محمد", time: "منذ ساعتين", color: "bg-soft-purple" },
        { icon: CreditCard, text: "تم استلام دفعة — ١٢٠ دولار", time: "منذ ٣ ساعات", color: "bg-deep-purple" },
      ]
    : [
        { icon: MessageSquare, text: "New inquiry from Reem Al-Ahmad", time: "12 minutes ago", color: "bg-lavender-purple" },
        { icon: Calendar, text: "New consultation booked — Tue 12:00 PM", time: "45 minutes ago", color: "bg-primary-pink" },
        { icon: Users, text: "New client registered: Nora Mohammed", time: "2 hours ago", color: "bg-soft-purple" },
        { icon: CreditCard, text: "Payment received — $120", time: "3 hours ago", color: "bg-deep-purple" },
      ];

  return (
    <div>
      <PageHeader
        title={isAr ? "لوحة التحكم" : "Dashboard"}
        description={isAr
          ? "مرحباً بعودتكِ — إليكِ نظرة عامة على عيادتكِ."
          : "Welcome back — here's an overview of your practice."}
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin" },
          { label: isAr ? "لوحة التحكم" : "Dashboard" },
        ]}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[var(--admin-text)] !font-sans">
              {isAr ? "إجراءات سريعة" : "Quick Actions"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {quickActions.map((qa) => (
              <QuickAction key={qa.label} {...qa} />
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.30 }}
          className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[var(--admin-text)] !font-sans">
              {isAr ? "النشاط الأخير" : "Recent Activity"}
            </h2>
            <span className="text-[10px] text-[var(--admin-text-faint)] font-medium bg-[var(--admin-hover-bg)] px-2 py-0.5 rounded-full">
              {isAr ? "بيانات وهمية" : "Placeholder"}
            </span>
          </div>

          <div>
            {activities.map((a, i) => (
              <ActivityItem key={i} {...a} />
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--admin-border)]">
            <p className="text-[11px] text-[var(--admin-text-faint)] text-center">
              {isAr
                ? "سيتم ربط النشاط الحقيقي بـ Supabase Realtime."
                : "Real activity will be connected via Supabase Realtime."}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Coming soon banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 rounded-2xl border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-hover-bg)] px-5 py-4 flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shrink-0 shadow-sm shadow-deep-purple/20">
          <TrendingUp size={15} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 text-center sm:text-start">
          <p className="text-[13px] font-semibold text-[var(--admin-text)]">
            {isAr ? "البيانات الحقيقية قريباً" : "Live data coming soon"}
          </p>
          <p className="text-[12px] text-[var(--admin-text-muted)]">
            {isAr
              ? "ستُعرض الإحصائيات والأنشطة الفعلية بعد ربط قاعدة البيانات."
              : "Real metrics and activity will appear here once the database is connected."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
