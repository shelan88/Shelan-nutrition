/**
 * AnalyticsPage — /admin/analytics
 *
 * Fetches live data from /api/analytics (server-side Google Analytics 4
 * Data API proxy) and renders a responsive dashboard with:
 *   • 7 KPI stat cards
 *   • Daily sessions / users trend line chart (SVG, no external lib)
 *   • Top pages table with inline bar visualisation
 *   • Traffic sources donut chart
 *   • Countries table
 *   • Device categories donut chart
 *
 * Credentials never touch the client — only the aggregated JSON payload
 * returned by the API endpoint is received here.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Eye, TrendingUp, Globe, Smartphone,
  Monitor, Tablet, RefreshCw, AlertTriangle,
  Activity, UserCheck, UserPlus, Clock,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { supabase } from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Summary {
  activeUsers: number;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDurationSecs: number;
}

interface TrendPoint { date: string; sessions: number; users: number; }
interface TopPage    { path: string; title: string; views: number; users: number; }
interface Source     { channel: string; sessions: number; }
interface Country    { country: string; sessions: number; users: number; }
interface Device     { device: string; sessions: number; }

interface AnalyticsData {
  days: number;
  summary: Summary;
  trend: TrendPoint[];
  topPages: TopPage[];
  sources: Source[];
  countries: Country[];
  devices: Device[];
}

type LoadState = "idle" | "loading" | "success" | "error" | "not_configured";

// ─── Animations ────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Formatters ────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Colour palette for charts ─────────────────────────────────────────────────
const PALETTE = [
  "#e91e8c", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#3b82f6", "#84cc16",
];

// ─── 1. Stat card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  delay: number;
}
function StatCard({ label, value, icon: Icon, gradient, delay }: StatCardProps) {
  return (
    <motion.div {...fadeUp(delay)}>
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5 relative overflow-hidden">
        <div className={`absolute -top-5 -end-5 w-20 h-20 rounded-full opacity-10 blur-2xl ${gradient}`} />
        <div className="relative flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${gradient}`}>
            <Icon size={17} strokeWidth={1.8} className="text-white" />
          </div>
        </div>
        <p className="text-[11.5px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className="text-[28px] font-bold text-[var(--admin-text)] leading-none tabular-nums">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── 2. Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-[var(--admin-border)] mb-4" />
      <div className="h-3 w-24 rounded bg-[var(--admin-border)] mb-2" />
      <div className="h-7 w-16 rounded bg-[var(--admin-border)]" />
    </div>
  );
}

// ─── 3. Panel wrapper ──────────────────────────────────────────────────────────
function Panel({ title, children, delay = 0 }: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div {...fadeUp(delay)}>
      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--admin-border)]">
          <p className="text-[13.5px] font-bold text-[var(--admin-text)]">{title}</p>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </motion.div>
  );
}

// ─── 4. Skeleton panel ─────────────────────────────────────────────────────────
function SkeletonPanel({ rows = 4, height = 180 }: { rows?: number; height?: number }) {
  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-[var(--admin-border)]">
        <div className="h-4 w-32 rounded bg-[var(--admin-border)]" />
      </div>
      <div className="p-5">
        <div className={`rounded-lg bg-[var(--admin-border)]`} style={{ height }} />
        {rows > 0 && (
          <div className="mt-4 space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="h-3 rounded bg-[var(--admin-border)]" style={{ width: `${75 - i * 8}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. Line Chart (pure SVG) ──────────────────────────────────────────────────
function LineChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-[var(--admin-text-faint)] text-sm">
      No trend data
    </div>
  );

  const W = 700, H = 180;
  const PAD = { top: 12, right: 16, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const sessions = data.map(d => d.sessions);
  const users    = data.map(d => d.users);
  const maxVal   = Math.max(...sessions, ...users, 1);

  const xPos = (i: number) =>
    PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const yPos = (v: number) =>
    PAD.top + plotH - (v / maxVal) * plotH;

  const makePolyline = (vals: number[]) =>
    vals.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");

  const makeAreaPath = (vals: number[]) => {
    const base = PAD.top + plotH;
    const pts  = vals.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" L");
    return `M${xPos(0)},${base} L${pts} L${xPos(vals.length - 1)},${base} Z`;
  };

  // X-axis: show at most 8 labels
  const step = Math.ceil(data.length / 8);
  const xLabels = data
    .map((d, i) => ({ i, label: fmtDate(d.date) }))
    .filter(({ i }) => i % step === 0 || i === data.length - 1);

  // Y-axis: 4 ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: Math.round(f * maxVal),
    y: PAD.top + plotH - f * plotH,
  }));

  const sessionsId = "sessions-area";
  const usersId    = "users-area";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
        <defs>
          <linearGradient id={sessionsId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e91e8c" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e91e8c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={usersId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid lines + labels */}
        {yTicks.map(({ v, y }) => (
          <g key={y}>
            <line
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--admin-border)" strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={y + 4}
              textAnchor="end" fontSize="10" fill="var(--admin-text-faint)"
            >
              {fmt(v)}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path d={makeAreaPath(sessions)} fill={`url(#${sessionsId})`} />
        <path d={makeAreaPath(users)}    fill={`url(#${usersId})`} />

        {/* Lines */}
        <polyline
          points={makePolyline(sessions)}
          fill="none" stroke="#e91e8c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        />
        <polyline
          points={makePolyline(users)}
          fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        />

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xPos(i)} y={H - 8}
            textAnchor="middle" fontSize="10" fill="var(--admin-text-faint)"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 px-1">
        <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--admin-text-muted)]">
          <span className="w-3 h-0.5 rounded-full bg-[#e91e8c] inline-block" />
          Sessions
        </span>
        <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--admin-text-muted)]">
          <span className="w-3 h-0.5 rounded-full bg-[#8b5cf6] inline-block" />
          Users
        </span>
      </div>
    </div>
  );
}

// ─── 6. Donut Chart (pure SVG) ─────────────────────────────────────────────────
interface DonutItem { label: string; value: number; }
function DonutChart({ data, title }: { data: DonutItem[]; title: string }) {
  if (!data.length) return null;

  const CX = 80, CY = 80, R = 54, SW = 18;
  const CIRC = 2 * Math.PI * R;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct  = d.value / total;
    const dash = pct * CIRC;
    const seg  = { pct, dash, offset, color: PALETTE[i % PALETTE.length] };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 160 160" width="160" height="160">
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none" stroke="var(--admin-border)" strokeWidth={SW}
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={SW}
              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
              strokeDashoffset={CIRC / 4 - seg.offset}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          ))}
          {/* Centre label */}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--admin-text)">
            {fmt(total)}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize="10" fill="var(--admin-text-faint)">
            {title}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-2 text-[var(--admin-text-muted)] min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="text-[var(--admin-text)] font-semibold tabular-nums ml-2 shrink-0">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. Device icon helper ─────────────────────────────────────────────────────
function DeviceIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("mobile"))  return <Smartphone size={14} className="text-[var(--admin-text-muted)]" />;
  if (lower.includes("tablet"))  return <Tablet      size={14} className="text-[var(--admin-text-muted)]" />;
  return                                <Monitor      size={14} className="text-[var(--admin-text-muted)]" />;
}

// ─── 8. Countries table ────────────────────────────────────────────────────────
function CountriesTable({ data }: { data: Country[] }) {
  const max = Math.max(...data.map(d => d.sessions), 1);
  return (
    <div className="space-y-2">
      {data.map((c, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-2 text-[12.5px] text-[var(--admin-text)]">
              <Globe size={12} className="text-[var(--admin-text-faint)]" />
              {c.country}
            </span>
            <span className="text-[12px] font-semibold text-[var(--admin-text)] tabular-nums">
              {fmt(c.sessions)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--admin-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#e91e8c] transition-all duration-700"
              style={{ width: `${(c.sessions / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 9. Top pages table ────────────────────────────────────────────────────────
function TopPagesTable({ data }: { data: TopPage[] }) {
  const max = Math.max(...data.map(d => d.views), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--admin-border)]">
            <th className="text-start text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide pb-2 pr-4">
              Page
            </th>
            <th className="text-end text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide pb-2 px-4 whitespace-nowrap">
              Views
            </th>
            <th className="text-end text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide pb-2 ps-4 whitespace-nowrap">
              Users
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={i} className="border-b border-[var(--admin-border)] last:border-0">
              <td className="py-2.5 pr-4 min-w-0">
                <div className="text-[var(--admin-text)] font-medium truncate max-w-[220px]" title={p.path}>
                  {p.path}
                </div>
                <div className="mt-1 h-1 rounded-full bg-[var(--admin-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.views / max) * 100}%`,
                      background: PALETTE[i % PALETTE.length],
                    }}
                  />
                </div>
              </td>
              <td className="py-2.5 px-4 text-end text-[var(--admin-text)] font-semibold tabular-nums whitespace-nowrap">
                {fmt(p.views)}
              </td>
              <td className="py-2.5 ps-4 text-end text-[var(--admin-text-muted)] tabular-nums whitespace-nowrap">
                {fmt(p.users)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 10. Main hook ─────────────────────────────────────────────────────────────
function useAnalytics(days: number) {
  const [state, setState] = useState<LoadState>("idle");
  const [data,  setData]  = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setState("loading");
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/analytics?days=${days}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error === "not_configured") {
          setState("not_configured");
          setError(json.message ?? "Credentials not configured.");
        } else {
          setState("error");
          setError(json.message ?? "Failed to load analytics.");
        }
        return;
      }

      setData(json);
      setState("success");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Network error");
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return { state, data, error, reload: load };
}

// ─── 11. Main page ─────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function AnalyticsPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [days, setDays] = useState(30);
  const { state, data, error, reload } = useAnalytics(days);

  const isLoading = state === "loading" || state === "idle";

  // ── Not configured state ────────────────────────────────────────────────────
  if (state === "not_configured") {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={isAr ? "التحليلات" : "Analytics"} description={isAr ? "رؤى عميقة حول حركة مرور الموقع" : "Deep insights into website traffic"} />
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <h3 className="text-[15px] font-bold text-[var(--admin-text)] mb-2">
            {isAr ? "لم يتم ضبط بيانات الاعتماد" : "Credentials Not Configured"}
          </h3>
          <p className="text-[13px] text-[var(--admin-text-muted)] max-w-sm leading-relaxed mb-1">
            {isAr
              ? "أضف متغيرات البيئة التالية لتفعيل لوحة التحليلات:"
              : "Add the following environment variables to activate the analytics dashboard:"}
          </p>
          <div className="mt-4 text-start bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl px-5 py-4 text-[12px] font-mono text-[var(--admin-text-muted)] space-y-1">
            <div><span className="text-[#e91e8c]">GA4_PROPERTY_ID</span>       = 123456789</div>
            <div><span className="text-[#e91e8c]">GOOGLE_CLIENT_EMAIL</span>   = sa@project.iam.gserviceaccount.com</div>
            <div><span className="text-[#e91e8c]">GOOGLE_PRIVATE_KEY</span>    = -----BEGIN RSA PRIVATE KEY-----...</div>
          </div>
          <p className="mt-4 text-[11.5px] text-[var(--admin-text-faint)] max-w-sm">
            {isAr
              ? "يجب منح حساب الخدمة دور «القارئ» على خاصية GA4."
              : "The service account must have Viewer access to the GA4 property, and the Analytics Data API must be enabled in Google Cloud."}
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title={isAr ? "التحليلات" : "Analytics"} description={isAr ? "رؤى عميقة حول حركة مرور الموقع" : "Deep insights into website traffic"} />
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-[15px] font-bold text-[var(--admin-text)] mb-2">
            {isAr ? "فشل تحميل البيانات" : "Failed to Load Analytics"}
          </h3>
          <p className="text-[13px] text-[var(--admin-text-muted)] max-w-md leading-relaxed mb-6">
            {error}
          </p>
          <button
            onClick={reload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[13px] font-medium text-[var(--admin-text)] hover:border-[var(--admin-border-strong)] transition-colors"
          >
            <RefreshCw size={14} />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const s = data?.summary;

  const statCards = [
    { label: isAr ? "المستخدمون النشطون" : "Active Users",   value: fmt(s?.activeUsers ?? 0), icon: Activity,   gradient: "bg-gradient-to-br from-pink-500 to-rose-500"    },
    { label: isAr ? "إجمالي المستخدمين" : "Total Users",     value: fmt(s?.totalUsers ?? 0),  icon: Users,      gradient: "bg-gradient-to-br from-violet-500 to-purple-600" },
    { label: isAr ? "المستخدمون الجدد"  : "New Users",       value: fmt(s?.newUsers ?? 0),    icon: UserPlus,   gradient: "bg-gradient-to-br from-cyan-500 to-blue-500"     },
    { label: isAr ? "الجلسات"           : "Sessions",         value: fmt(s?.sessions ?? 0),    icon: UserCheck,  gradient: "bg-gradient-to-br from-emerald-500 to-teal-600"  },
    { label: isAr ? "مشاهدات الصفحة"   : "Page Views",       value: fmt(s?.pageViews ?? 0),   icon: Eye,        gradient: "bg-gradient-to-br from-amber-500 to-orange-500"  },
    { label: isAr ? "معدل الارتداد"     : "Bounce Rate",      value: `${s?.bounceRate ?? 0}%`, icon: TrendingUp, gradient: "bg-gradient-to-br from-red-400 to-pink-500"      },
    { label: isAr ? "مدة الجلسة"        : "Avg. Session",     value: fmtDuration(s?.avgSessionDurationSecs ?? 0), icon: Clock, gradient: "bg-gradient-to-br from-indigo-500 to-violet-500" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader title={isAr ? "التحليلات" : "Analytics"} description={isAr ? "رؤى عميقة حول حركة مرور الموقع واتجاهات الحجوزات" : "Deep insights into website traffic, booking trends, and audience."} />

        <div className="flex items-center gap-2 shrink-0">
          {/* Date range pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  days === opt.value
                    ? "bg-[#e91e8c] text-white shadow-sm"
                    : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={reload}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => <StatCard key={i} {...c} delay={i * 0.05} />)
        }
      </div>

      {/* Trend chart */}
      {isLoading
        ? <SkeletonPanel rows={0} height={220} />
        : (
          <Panel title={isAr ? `الاتجاه اليومي — آخر ${days} يوماً` : `Daily Trend — Last ${days} Days`} delay={0.15}>
            <LineChart data={data?.trend ?? []} />
          </Panel>
        )
      }

      {/* Top pages */}
      {isLoading
        ? <SkeletonPanel rows={6} height={0} />
        : (
          <Panel title={isAr ? "أفضل الصفحات" : "Top Pages"} delay={0.2}>
            {(data?.topPages ?? []).length === 0
              ? <p className="text-[13px] text-[var(--admin-text-faint)]">No page data</p>
              : <TopPagesTable data={data!.topPages} />
            }
          </Panel>
        )
      }

      {/* Bottom row: sources | countries | devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonPanel rows={5} height={160} />
            <SkeletonPanel rows={5} height={160} />
            <SkeletonPanel rows={3} height={160} />
          </>
        ) : (
          <>
            <Panel title={isAr ? "مصادر الزيارات" : "Traffic Sources"} delay={0.25}>
              <DonutChart
                title={isAr ? "جلسات" : "Sessions"}
                data={(data?.sources ?? []).map(s => ({ label: s.channel, value: s.sessions }))}
              />
            </Panel>

            <Panel title={isAr ? "الدول" : "Countries"} delay={0.3}>
              <CountriesTable data={data?.countries ?? []} />
            </Panel>

            <Panel title={isAr ? "الأجهزة" : "Devices"} delay={0.35}>
              <DonutChart
                title={isAr ? "جلسات" : "Sessions"}
                data={(data?.devices ?? []).map(d => ({
                  label: (
                    <span className="flex items-center gap-1">
                      <DeviceIcon name={d.device} />
                      {d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                    </span>
                  ) as unknown as string,
                  value: d.sessions,
                }))}
              />
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}
