/**
 * ClientsPage — /admin/clients
 *
 * Production-ready CRM for SHELAN Admin Portal.
 * Full client list view. All data fetched live from Supabase via getAllClients().
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, UserPlus, AlertTriangle, Activity,
  Search, SlidersHorizontal, ChevronDown, X,
  ArrowUpRight, TrendingUp, Eye,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import ClientDrawer from "./ClientDrawer";
import { getAllClients } from "../repositories/clients.repository";
import type { Client, RiskLevel, ClientStatus, Gender } from "../data/clients";

// ─── Animation preset ─────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Badge helpers ────────────────────────────────────────────────────────────
const riskBadge: Record<RiskLevel, string> = {
  Low:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  High:   "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const riskDot: Record<RiskLevel, string> = {
  Low: "bg-emerald-500", Medium: "bg-amber-400", High: "bg-red-500",
};

const statusBadge: Record<ClientStatus, string> = {
  Active:    "bg-emerald-50 text-emerald-700",
  Inactive:  "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)]",
  Waiting:   "bg-amber-50 text-amber-600",
  Completed: "bg-blue-50 text-blue-600",
};
const statusDot: Record<ClientStatus, string> = {
  Active: "bg-emerald-500 animate-pulse", Inactive: "bg-[var(--admin-text-faint)]",
  Waiting: "bg-amber-400 animate-pulse",  Completed: "bg-blue-500",
};

// ─── Top stat card ────────────────────────────────────────────────────────────
interface StatProps {
  label: string; value: number; suffix?: string;
  icon: React.ElementType; gradient: string; delay: number;
}
function StatCard({ label, value, suffix = "", icon: Icon, gradient, delay }: StatProps) {
  return (
    <motion.div {...fadeUp(delay)}
      className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5 hover:shadow-lg hover:shadow-black/[0.05] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient}`}>
          <Icon size={18} strokeWidth={1.8} className="text-white" />
        </div>
        <ArrowUpRight size={14} className="text-[var(--admin-text-faint)]" />
      </div>
      <p className="text-[12px] font-medium text-[var(--admin-text-muted)] mb-1 tracking-wide">{label}</p>
      <p className="text-[28px] font-bold text-[var(--admin-text)] leading-none tabular-nums">
        {value}{suffix}
      </p>
    </motion.div>
  );
}

// ─── Filter select ────────────────────────────────────────────────────────────
interface SelectProps {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}
function FilterSelect({ value, onChange, options, placeholder }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          appearance-none h-9 ps-3 pe-8 rounded-lg border border-[var(--admin-border)]
          bg-[var(--admin-surface)] text-[12.5px] font-medium text-[var(--admin-text-muted)]
          hover:border-[var(--admin-border-strong)] focus:outline-none focus:border-primary-pink
          focus:ring-2 focus:ring-primary-pink/15 transition-all cursor-pointer
          min-w-[130px]
        "
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
    </div>
  );
}

// ─── Score pill ───────────────────────────────────────────────────────────────
function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--admin-text-faint)]">—</span>;
  const color = score >= 70 ? "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200"
    : score >= 50            ? "text-amber-600 bg-amber-50 ring-1 ring-amber-200"
                             : "text-red-600 bg-red-50 ring-1 ring-red-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortKey = "newest" | "oldest" | "high-risk" | "low-risk" | "alpha";

const SORT_OPTIONS_EN: { value: SortKey; label: string }[] = [
  { value: "newest",    label: "Newest first"     },
  { value: "oldest",    label: "Oldest first"     },
  { value: "high-risk", label: "Highest risk"     },
  { value: "low-risk",  label: "Lowest risk"      },
  { value: "alpha",     label: "Alphabetical"     },
];
const SORT_OPTIONS_AR: { value: SortKey; label: string }[] = [
  { value: "newest",    label: "الأحدث أولاً"     },
  { value: "oldest",    label: "الأقدم أولاً"     },
  { value: "high-risk", label: "الأعلى خطراً"     },
  { value: "low-risk",  label: "الأدنى خطراً"     },
  { value: "alpha",     label: "أبجدياً"          },
];

const RISK_ORDER: Record<RiskLevel, number> = { High: 2, Medium: 1, Low: 0 };

function sortClients(clients: Client[], key: SortKey): Client[] {
  return [...clients].sort((a, b) => {
    switch (key) {
      case "newest":    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      case "oldest":    return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
      case "high-risk": return RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel];
      case "low-risk":  return RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
      case "alpha":     return a.fullName.localeCompare(b.fullName);
      default:          return 0;
    }
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // ── Live data from Supabase ──
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllClients()
      .then((data) => { if (!cancelled) setClients(data); })
      .catch((err) => console.error("[ClientsPage] load:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Drawer state ──
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // ── Filters ──
  const [search,      setSearch]      = useState("");
  const [filterRisk,  setFilterRisk]  = useState<RiskLevel | "">("");
  const [filterGender,setFilterGender]= useState<Gender | "">("");
  const [filterPlan,  setFilterPlan]  = useState("");
  const [filterStatus,setFilterStatus]= useState<ClientStatus | "">("");
  const [sortKey,     setSortKey]     = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const clearFilters = useCallback(() => {
    setSearch(""); setFilterRisk(""); setFilterGender("");
    setFilterPlan(""); setFilterStatus(""); setSortKey("newest");
  }, []);

  const hasActiveFilters = search || filterRisk || filterGender || filterPlan || filterStatus || sortKey !== "newest";

  // ── Derived data ──
  const uniquePlans = useMemo(
    () => Array.from(new Set(clients.map((c) => c.currentPlan))),
    [clients],
  );

  const filtered = useMemo(() => {
    let list = clients.filter((c) => {
      const q = search.toLowerCase();
      if (q && !c.fullName.toLowerCase().includes(q) &&
               !c.phone.includes(q) &&
               !c.email.toLowerCase().includes(q)) return false;
      if (filterRisk   && c.riskLevel    !== filterRisk)   return false;
      if (filterGender && c.gender       !== filterGender)  return false;
      if (filterPlan   && c.currentPlan  !== filterPlan)    return false;
      if (filterStatus && c.status       !== filterStatus)  return false;
      return true;
    });
    return sortClients(list, sortKey);
  }, [clients, search, filterRisk, filterGender, filterPlan, filterStatus, sortKey]);

  // ── Stat cards (derived inline from live clients array) ──
  const now          = new Date();
  const totalClients = clients.length;
  const newThisMonth = clients.filter((c) => {
    const d = new Date(c.joinedDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const highRiskCount   = clients.filter((c) => c.riskLevel === "High").length;
  const activePlanCount = clients.filter((c) => c.status === "Active").length;

  const stats: StatProps[] = [
    { label: isAr ? "إجمالي العملاء" : "Total Clients",    value: totalClients,    icon: Users,         gradient: "bg-gradient-to-br from-primary-pink to-soft-pink",      delay: 0.05 },
    { label: isAr ? "جدد هذا الشهر"  : "New This Month",   value: newThisMonth,    icon: UserPlus,      gradient: "bg-gradient-to-br from-lavender-purple to-soft-purple",  delay: 0.10 },
    { label: isAr ? "حالات خطر مرتفع": "High Risk Cases",  value: highRiskCount,   icon: AlertTriangle, gradient: "bg-gradient-to-br from-red-400 to-orange-400",            delay: 0.15 },
    { label: isAr ? "خطط نشطة"        : "Active Plans",     value: activePlanCount, icon: Activity,      gradient: "bg-gradient-to-br from-deep-purple to-soft-purple",       delay: 0.20 },
  ];

  // ── Table column labels ──
  const colLabels = isAr
    ? ["العميلة","الجنس","العمر","الدولة","الهاتف","البريد الإلكتروني","التقييم","الخطر","الخطة","آخر موعد","الحالة",""]
    : ["Client","Gender","Age","Country","Phone","Email","Score","Risk","Plan","Last Appt","Status",""];

  return (
    <>
      {/* Drawer */}
      <ClientDrawer
        client={selectedClient}
        isAr={isAr}
        onClose={() => setSelectedClient(null)}
        onDelete={(id) => setClients((prev) => prev.filter((c) => c.id !== id))}
        onRefresh={() => {
          getAllClients()
            .then((data) => setClients(data))
            .catch((err) => console.error("[ClientsPage] refresh:", err));
        }}
      />

      <div>
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <PageHeader
          title={isAr ? "إدارة العملاء" : "Client Management"}
          description={isAr
            ? "إدارة ملفات العملاء والخطط الغذائية ومتابعة الحالات الصحية."
            : "Manage client profiles, nutrition plans, and health case tracking."}
          breadcrumbs={[
            { label: isAr ? "الإدارة"   : "Admin",   href: "/admin" },
            { label: isAr ? "العملاء"   : "Clients"               },
          ]}
        />

        {/* ── Stat cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Table card ────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.22)} className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[var(--admin-border)]">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" strokeWidth={2} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث بالاسم أو الهاتف أو البريد…" : "Search by name, phone, email…"}
                className="
                  w-full h-9 ps-8 pe-4 rounded-lg border border-[var(--admin-border)]
                  bg-[var(--admin-hover-bg)] text-[13px] text-[var(--admin-text)]
                  placeholder:text-[var(--admin-text-faint)]
                  focus:outline-none focus:border-primary-pink focus:ring-2 focus:ring-primary-pink/15
                  transition-all
                "
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-[12.5px] font-semibold transition-all ${
                  filtersOpen
                    ? "border-primary-pink text-primary-pink bg-primary-pink/5"
                    : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-border-strong)]"
                }`}
              >
                <SlidersHorizontal size={13} strokeWidth={2} />
                {isAr ? "تصفية" : "Filter"}
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-pink" />
                )}
              </button>

              {/* Sort */}
              <FilterSelect
                value={sortKey}
                onChange={(v) => setSortKey(v as SortKey)}
                options={isAr ? SORT_OPTIONS_AR : SORT_OPTIONS_EN}
                placeholder={isAr ? "الترتيب" : "Sort"}
              />

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 h-9 px-3 rounded-lg text-[12px] font-semibold text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/5 transition-all"
                >
                  <X size={12} />
                  {isAr ? "إعادة تعيين" : "Clear"}
                </button>
              )}

              {/* Result count */}
              <span className="text-[11.5px] font-semibold text-[var(--admin-text-faint)] ms-auto sm:ms-0 whitespace-nowrap">
                {filtered.length} {isAr ? "عميل" : filtered.length === 1 ? "client" : "clients"}
              </span>
            </div>
          </div>

          {/* Expanded filter row */}
          {filtersOpen && (
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
              <FilterSelect
                value={filterRisk}
                onChange={(v) => setFilterRisk(v as RiskLevel | "")}
                options={isAr
                  ? [{ value: "High", label: "مرتفع" }, { value: "Medium", label: "متوسط" }, { value: "Low", label: "منخفض" }]
                  : [{ value: "High", label: "High"   }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]}
                placeholder={isAr ? "مستوى الخطر" : "Risk Level"}
              />
              <FilterSelect
                value={filterGender}
                onChange={(v) => setFilterGender(v as Gender | "")}
                options={isAr
                  ? [{ value: "Female", label: "أنثى" }, { value: "Male", label: "ذكر" }]
                  : [{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }]}
                placeholder={isAr ? "الجنس" : "Gender"}
              />
              <FilterSelect
                value={filterPlan}
                onChange={(v) => setFilterPlan(v)}
                options={uniquePlans.map((p) => ({ value: p, label: p }))}
                placeholder={isAr ? "الخطة" : "Plan"}
              />
              <FilterSelect
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as ClientStatus | "")}
                options={isAr
                  ? [
                      { value: "Active",    label: "نشطة"          },
                      { value: "Inactive",  label: "غير نشطة"      },
                      { value: "Waiting",   label: "في الانتظار"   },
                      { value: "Completed", label: "مكتملة"        },
                    ]
                  : [
                      { value: "Active",    label: "Active"    },
                      { value: "Inactive",  label: "Inactive"  },
                      { value: "Waiting",   label: "Waiting"   },
                      { value: "Completed", label: "Completed" },
                    ]}
                placeholder={isAr ? "الحالة" : "Status"}
              />
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={colLabels.length} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={28} className="text-[var(--admin-text-faint)]" strokeWidth={1.4} />
                        <p className="text-[13.5px] font-semibold text-[var(--admin-text-muted)]">
                          {loading
                            ? (isAr ? "جارٍ تحميل العملاء…" : "Loading clients…")
                            : (isAr ? "لا توجد نتائج" : "No clients found")}
                        </p>
                        {!loading && (
                          <p className="text-[12px] text-[var(--admin-text-faint)]">
                            {isAr ? "جرّب تغيير معايير البحث أو التصفية." : "Try adjusting your search or filters."}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((client, idx) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                      className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors group cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold ${client.avatarGradient}`}>
                            {client.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[var(--admin-text)] truncate group-hover:text-primary-pink transition-colors">
                              {isAr ? client.fullNameAr : client.fullName}
                            </p>
                            <p className="text-[11px] text-[var(--admin-text-faint)] truncate">{client.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3.5 text-[13px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {isAr ? (client.gender === "Female" ? "أنثى" : "ذكر") : client.gender}
                      </td>

                      {/* Age */}
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-[var(--admin-text)] tabular-nums">
                        {client.age}
                      </td>

                      {/* Country */}
                      <td className="px-4 py-3.5 text-[13px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {isAr ? client.countryAr : client.country}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-[12.5px] text-[var(--admin-text-muted)] whitespace-nowrap font-mono">
                        {client.phone}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-[12.5px] text-[var(--admin-text-muted)] max-w-[180px] truncate">
                        {client.email}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5">
                        <ScorePill score={client.assessmentScore} />
                      </td>

                      {/* Risk */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${riskBadge[client.riskLevel]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskDot[client.riskLevel]}`} />
                          {isAr
                            ? { Low:"منخفض", Medium:"متوسط", High:"مرتفع" }[client.riskLevel]
                            : client.riskLevel}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5 text-[12.5px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {isAr ? client.currentPlanAr : client.currentPlan}
                      </td>

                      {/* Last Appt */}
                      <td className="px-4 py-3.5 text-[12.5px] text-[var(--admin-text-muted)] whitespace-nowrap">
                        {client.lastAppointment}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusBadge[client.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[client.status]}`} />
                          {isAr
                            ? { Active:"نشطة", Inactive:"غير نشطة", Waiting:"انتظار", Completed:"مكتملة" }[client.status]
                            : client.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                          className="flex items-center gap-1 text-[12px] font-semibold text-primary-pink opacity-0 group-hover:opacity-100 hover:text-soft-purple transition-all whitespace-nowrap"
                        >
                          <Eye size={12} strokeWidth={2} />
                          {isAr ? "عرض" : "View"}
                        </button>
                      </td>
                    </motion.tr>
                  ))
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
              <TrendingUp size={11} />
              {isAr
                ? `${filtered.length} من ${clients.length} عميل`
                : `${filtered.length} of ${clients.length} clients`}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
