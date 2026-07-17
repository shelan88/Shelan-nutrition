/**
 * BookingsAdminPage — /admin/bookings
 *
 * Live list of all appointments booked via the public website's BookingFlow.
 * Features: search by client name, filter by status, update status per row.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar, CheckCircle2, Clock, XCircle,
  Search, X, RefreshCw, ChevronDown,
  CalendarCheck, TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "@/admin/repositories/appointments.repository";
import type { AppointmentRow } from "@/types/database.types";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type Status = AppointmentRow["status"];
type KnownStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

const STATUS_BADGE: Record<KnownStatus, string> = {
  scheduled: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  completed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const STATUS_DOT: Record<KnownStatus, string> = {
  scheduled: "bg-amber-400 animate-pulse",
  confirmed: "bg-emerald-500 animate-pulse",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};
const STATUS_LABEL_EN: Record<KnownStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_LABEL_AR: Record<KnownStatus, string> = {
  scheduled: "مجدول",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const ALL_STATUSES: KnownStatus[] = ["scheduled", "confirmed", "completed", "cancelled"];

function formatDate(dateStr: string, isAr: boolean): string {
  try {
    return new Date(dateStr).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BookingsAdminPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [appts,     setAppts]     = useState<AppointmentRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState<Status | "">("");
  const [updatingId,setUpdatingId]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllAppointments();
    setAppts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return appts.filter((a) => {
      if (filter && a.status !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (a.client_name ?? "").toLowerCase().includes(q) ||
        (a.type ?? "").toLowerCase().includes(q)
      );
    });
  }, [appts, filter, search]);

  // Stats
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of ALL_STATUSES) c[s] = appts.filter((a) => a.status === s).length;
    return c;
  }, [appts]);

  async function changeStatus(id: string, status: KnownStatus) {
    setUpdatingId(id);
    const ok = await updateAppointmentStatus(id, status);
    if (ok) {
      setAppts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
    setUpdatingId(null);
  }

  const colLabels = isAr
    ? ["العميل", "التاريخ", "الوقت", "النوع", "الحالة", "الإجراءات"]
    : ["Client", "Date", "Time", "Type", "Status", "Actions"];

  return (
    <div>
      <PageHeader
        title={isAr ? "الحجوزات" : "Bookings"}
        description={
          isAr
            ? "إدارة الجلسات والمواعيد المحجوزة."
            : "Manage all booked sessions and appointments."
        }
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "الحجوزات" : "Bookings" },
        ]}
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        }
      />

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.04)} className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: isAr ? "إجمالي المواعيد" : "Total",     value: appts.length,         icon: Calendar,     gradient: "from-primary-pink to-soft-pink" },
          { label: isAr ? "مجدولة"           : "Scheduled", value: counts.scheduled ?? 0, icon: Clock,        gradient: "from-amber-400 to-orange-400" },
          { label: isAr ? "مؤكدة"            : "Confirmed", value: counts.confirmed ?? 0, icon: CalendarCheck,gradient: "from-emerald-400 to-teal-400" },
          { label: isAr ? "مكتملة"           : "Completed", value: counts.completed ?? 0, icon: CheckCircle2, gradient: "from-deep-purple to-soft-purple" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp(i * 0.05)}
            className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient}`}>
                <s.icon size={18} strokeWidth={1.8} className="text-white" />
              </div>
              <TrendingUp size={14} className="text-[var(--admin-text-faint)]" />
            </div>
            <p className="text-[11px] font-medium text-[var(--admin-text-muted)] mb-1 tracking-wide uppercase">{s.label}</p>
            <p className="text-[28px] font-bold text-[var(--admin-text)] leading-none tabular-nums">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Table card ────────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0.20)}
        className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[var(--admin-border)]">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو النوع…" : "Search by client or type…"}
              className="w-full h-9 ps-8 pe-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover-bg)] text-[13px] text-[var(--admin-text)] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:border-primary-pink/40 focus:ring-2 focus:ring-primary-pink/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Status | "")}
              className="appearance-none h-9 ps-3 pe-7 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[12.5px] font-medium text-[var(--admin-text-muted)] focus:outline-none focus:border-primary-pink/40 focus:ring-2 focus:ring-primary-pink/10 transition-all cursor-pointer"
            >
              <option value="">{isAr ? "كل الحالات" : "All statuses"}</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {isAr ? STATUS_LABEL_AR[s] : STATUS_LABEL_EN[s]}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
          </div>

          {(search || filter) && (
            <button
              onClick={() => { setSearch(""); setFilter(""); }}
              className="flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/5 transition-all"
            >
              <X size={12} /> {isAr ? "إعادة تعيين" : "Clear"}
            </button>
          )}

          <span className="text-[11.5px] font-semibold text-[var(--admin-text-faint)] ms-auto whitespace-nowrap">
            {filtered.length}{" "}
            {isAr ? "موعد" : filtered.length === 1 ? "booking" : "bookings"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
                {colLabels.map((h, i) => (
                  <th
                    key={i}
                    className="text-start px-4 py-3 text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colLabels.length} className="py-16 text-center">
                    <div className="inline-block w-6 h-6 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin mb-3" />
                    <p className="text-[13px] text-[var(--admin-text-muted)]">{isAr ? "جارٍ التحميل…" : "Loading…"}</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colLabels.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={28} strokeWidth={1.4} className="text-[var(--admin-text-faint)]" />
                      <p className="text-[13.5px] font-semibold text-[var(--admin-text-muted)]">
                        {isAr ? "لا توجد نتائج" : "No bookings found"}
                      </p>
                      <p className="text-[12px] text-[var(--admin-text-faint)]">
                        {isAr
                          ? "ستظهر الحجوزات هنا عند إنشائها من الموقع."
                          : "Bookings will appear here once submitted from the website."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((appt, idx) => {
                  const status = (appt.status ?? "scheduled") as KnownStatus;
                  const isUpdating = updatingId === appt.id;

                  return (
                    <motion.tr
                      key={appt.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.025 }}
                      className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors group"
                    >
                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-pink/20 to-lavender-purple/20 flex items-center justify-center text-[11px] font-bold text-primary-pink shrink-0">
                            {(appt.client_name ?? "?")
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((w) => w[0]?.toUpperCase() ?? "")
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate">
                              {appt.client_name ?? (isAr ? "غير معروف" : "Unknown")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-[13px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {formatDate(appt.date, isAr)}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-[var(--admin-text)] tabular-nums whitespace-nowrap">
                        {appt.time ?? "—"}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5 text-[13px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {appt.type ?? "—"}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                          {isAr ? STATUS_LABEL_AR[status] : STATUS_LABEL_EN[status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <select
                            disabled={isUpdating}
                            value={status}
                            onChange={(e) => changeStatus(appt.id, e.target.value as KnownStatus)}
                            className="appearance-none h-7 ps-2 pe-6 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[11.5px] font-medium text-[var(--admin-text-muted)] focus:outline-none focus:border-primary-pink/40 cursor-pointer disabled:opacity-50 hover:border-[var(--admin-border-strong)] transition-all"
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {isAr ? STATUS_LABEL_AR[s] : STATUS_LABEL_EN[s]}
                              </option>
                            ))}
                          </select>
                          {isUpdating ? (
                            <RefreshCw size={10} className="pointer-events-none absolute end-1.5 top-1/2 -translate-y-1/2 text-primary-pink animate-spin" />
                          ) : (
                            <ChevronDown size={10} className="pointer-events-none absolute end-1.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
            <span className="text-[11px] text-[var(--admin-text-faint)]">
              {loading
                ? (isAr ? "جارٍ التحميل…" : "Loading…")
                : (isAr ? "البيانات: Supabase مباشر" : "Data: live via Supabase")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-faint)]">
            <XCircle size={11} />
            {isAr
              ? `${counts.cancelled ?? 0} ملغى`
              : `${counts.cancelled ?? 0} cancelled`}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
