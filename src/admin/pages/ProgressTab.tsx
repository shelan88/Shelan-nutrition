/**
 * ProgressTab — Client Profile › Progress tab
 *
 * Features:
 *  • Stats dashboard: current weight, goal weight, weight lost, latest measurements
 *  • Interactive SVG line charts: Weight | BMI | Waist | Hip | Thigh
 *  • Time filters: 30d | 90d | 6m | 1y | All
 *  • Progress history with cards (add / edit / duplicate / delete)
 *  • Comparison view: any two entries, diffs highlighted, photos side-by-side
 *  • Entry editor modal: all measurements + progress photos + notes
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, TrendingUp, TrendingDown, Minus,
  Scale, Target, ArrowDownToLine,
  Edit2, Copy, Trash2, ChevronDown, ChevronUp,
  X, Save, Loader2, Camera,
  BarChart2, GitCompare, List,
  AlertTriangle, Eye,
  Droplets, Percent,
} from "lucide-react";
import ImageUpload from "@/shared/components/upload/ImageUpload";
import {
  getClientProgressEntries,
  getEntryPhotos,
  createProgressEntry,
  updateProgressEntry,
  duplicateProgressEntry,
  deleteProgressEntry,
  uploadEntryPhoto,
  deleteEntryPhoto,
  calcBMI,
} from "@/admin/repositories/progress.repository";
import type {
  ProgressEntryRow,
  ProgressPhotoRow,
  ProgressEntryInput,
} from "@/admin/repositories/progress.repository";

// ─── Types & constants ─────────────────────────────────────────────────────────

type ViewMode = "overview" | "history" | "compare";
type ChartMetric = "weight" | "bmi" | "waist" | "hip" | "thigh";
type TimeRange = "30d" | "90d" | "6m" | "1y" | "all";

const CHART_METRICS: { key: ChartMetric; en: string; ar: string; unit: string; color: string }[] = [
  { key: "weight", en: "Weight",   ar: "الوزن",   unit: "kg", color: "#f35e98" },
  { key: "bmi",    en: "BMI",      ar: "BMI",      unit: "",   color: "#8b5cf6" },
  { key: "waist",  en: "Waist",    ar: "الخصر",    unit: "cm", color: "#0ea5e9" },
  { key: "hip",    en: "Hip",      ar: "الوركين",  unit: "cm", color: "#10b981" },
  { key: "thigh",  en: "Thigh",    ar: "الفخذ",    unit: "cm", color: "#f59e0b" },
];

const TIME_RANGES: { key: TimeRange; en: string; ar: string }[] = [
  { key: "30d", en: "30 Days",   ar: "30 يوماً"   },
  { key: "90d", en: "90 Days",   ar: "90 يوماً"   },
  { key: "6m",  en: "6 Months",  ar: "6 أشهر"    },
  { key: "1y",  en: "1 Year",    ar: "سنة"        },
  { key: "all", en: "All Time",  ar: "كل الوقت"  },
];

const PHOTO_SLOTS: { key: ProgressPhotoRow["photo_type"]; en: string; ar: string }[] = [
  { key: "front", en: "Front",   ar: "أمامية" },
  { key: "side",  en: "Side",    ar: "جانبية" },
  { key: "back",  en: "Back",    ar: "خلفية"  },
];

const EMPTY_FORM: ProgressEntryInput = {
  entry_date: new Date().toISOString().slice(0, 10),
  weight_kg: null, height_cm: null,
  waist_cm: null, hip_cm: null, thigh_cm: null, arm_cm: null, chest_cm: null,
  body_fat_pct: null, muscle_mass_pct: null, water_pct: null,
  goal_weight_kg: null,
  nutritionist_notes: "", client_notes: "",
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined, short = false): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", short
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
}

function n(v: number | null | undefined, dec = 1): string {
  if (v == null) return "—";
  return v % 1 === 0 ? String(v) : v.toFixed(dec);
}

function diff(a: number | null | undefined, b: number | null | undefined): {
  val: number | null; dir: "up" | "down" | "same"; text: string;
} {
  if (a == null || b == null) return { val: null, dir: "same", text: "—" };
  const d = b - a;
  return {
    val: d,
    dir: d < 0 ? "down" : d > 0 ? "up" : "same",
    text: `${d > 0 ? "+" : ""}${d.toFixed(1)}`,
  };
}

/** Lower is better for weight/circumferences; both directions neutral for others */
function isImprovement(metric: string, direction: "up" | "down" | "same"): boolean | null {
  if (direction === "same") return null;
  const lowerBetter = ["weight", "waist", "hip", "thigh", "arm", "chest", "bmi", "body_fat"];
  const higherBetter = ["muscle_mass", "water"];
  if (lowerBetter.some((m) => metric.includes(m))) return direction === "down";
  if (higherBetter.some((m) => metric.includes(m))) return direction === "up";
  return null;
}

function filterByTimeRange(entries: ProgressEntryRow[], range: TimeRange): ProgressEntryRow[] {
  if (range === "all") return entries;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "30d") cutoff.setDate(now.getDate() - 30);
  else if (range === "90d") cutoff.setDate(now.getDate() - 90);
  else if (range === "6m") cutoff.setMonth(now.getMonth() - 6);
  else if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter((e) => e.entry_date >= cutoffStr);
}

function metricValue(entry: ProgressEntryRow, metric: ChartMetric): number | null {
  switch (metric) {
    case "weight": return entry.weight_kg;
    case "bmi":    return entry.bmi;
    case "waist":  return entry.waist_cm;
    case "hip":    return entry.hip_cm;
    case "thigh":  return entry.thigh_cm;
  }
}

// ─── SVG Line Chart ────────────────────────────────────────────────────────────

interface ChartPoint { date: string; value: number }

function LineChart({
  points, color, unit, height = 200,
}: { points: ChartPoint[]; color: string; unit: string; height?: number }) {
  const PL = 52, PR = 16, PT = 16, PB = 36;

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[12px] text-[var(--admin-text-faint)]">
        No data for this time range
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const vals   = sorted.map((p) => p.value);
  const yMin   = Math.min(...vals);
  const yMax   = Math.max(...vals);
  const yRange = yMax - yMin || 1;

  // Responsive: use percentage-based width via viewBox
  const W = 600;
  const H = height;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const toX = (i: number) => PL + (i / Math.max(sorted.length - 1, 1)) * plotW;
  const toY = (v: number) => PT + plotH - ((v - yMin) / yRange) * plotH;

  const linePoints = sorted.map((p, i) => `${toX(i)},${toY(p.value)}`).join(" ");

  // Gradient fill area (close path back to baseline)
  const areaPath = [
    `M ${toX(0)},${PT + plotH}`,
    ...sorted.map((p, i) => `L ${toX(i)},${toY(p.value)}`),
    `L ${toX(sorted.length - 1)},${PT + plotH}`,
    "Z",
  ].join(" ");

  // Y-axis labels (3–4 evenly spaced)
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const v = yMin + (i / ySteps) * yRange;
    return { y: toY(v), label: v.toFixed(yRange > 10 ? 0 : 1) };
  });

  // X-axis labels (up to 5)
  const xLabelCount = Math.min(sorted.length, 5);
  const xStep = Math.floor((sorted.length - 1) / Math.max(xLabelCount - 1, 1));
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.min(i * xStep, sorted.length - 1);
    return { x: toX(idx), label: fmtDate(sorted[idx].date, true) };
  });

  const gradientId = `grad-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {yLabels.map((l, i) => (
        <line key={i} x1={PL} y1={l.y} x2={W - PR} y2={l.y}
          stroke="var(--admin-border)" strokeWidth="1" />
      ))}

      {/* Y labels */}
      {yLabels.map((l, i) => (
        <text key={i} x={PL - 6} y={l.y + 4} textAnchor="end"
          fontSize="11" fill="var(--admin-text-faint)" fontFamily="Inter, sans-serif">
          {l.label}{i === yLabels.length - 1 && unit ? ` ${unit}` : ""}
        </text>
      ))}

      {/* X labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - 8} textAnchor="middle"
          fontSize="10" fill="var(--admin-text-faint)" fontFamily="Inter, sans-serif">
          {l.label}
        </text>
      ))}

      {/* Gradient fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {sorted.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.value)} r="4"
          fill="white" stroke={color} strokeWidth="2.5" />
      ))}
    </svg>
  );
}

// ─── Small stat card ──────────────────────────────────────────────────────────

function MiniStat({
  label, value, unit = "", icon: Icon, gradient, sub,
}: {
  label: string; value: string; unit?: string;
  icon: React.ElementType; gradient: string; sub?: string;
}) {
  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-4
      hover:shadow-md hover:shadow-black/[0.04] hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${gradient}`}>
        <Icon size={16} strokeWidth={1.8} className="text-white" />
      </div>
      <p className="text-[11px] font-medium text-[var(--admin-text-muted)] mb-1">{label}</p>
      <p className="text-[22px] font-bold text-[var(--admin-text)] leading-none tabular-nums">
        {value}
        {unit && <span className="text-[13px] font-semibold ml-1 text-[var(--admin-text-muted)]">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-[var(--admin-text-faint)] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry, isFirst, isAr, onEdit, onDuplicate, onDelete, onView,
}: {
  entry: ProgressEntryRow; isFirst: boolean; isAr: boolean;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void; onView: () => void;
}) {
  const [open, setOpen] = useState(isFirst);

  const measurements = [
    { label: isAr ? "الوزن" : "Weight",  value: entry.weight_kg,  unit: "kg" },
    { label: "BMI",                       value: entry.bmi,         unit: ""   },
    { label: isAr ? "الخصر" : "Waist",   value: entry.waist_cm,   unit: "cm" },
    { label: isAr ? "الوركين" : "Hip",   value: entry.hip_cm,     unit: "cm" },
    { label: isAr ? "الفخذ" : "Thigh",  value: entry.thigh_cm,   unit: "cm" },
    { label: isAr ? "الذراع" : "Arm",   value: entry.arm_cm,     unit: "cm" },
    { label: isAr ? "الصدر" : "Chest",  value: entry.chest_cm,   unit: "cm" },
  ].filter((m) => m.value != null);

  const optionals = [
    { label: isAr ? "دهون الجسم" : "Body Fat",    value: entry.body_fat_pct,    unit: "%" },
    { label: isAr ? "كتلة العضلات" : "Muscle",   value: entry.muscle_mass_pct, unit: "%" },
    { label: isAr ? "نسبة الماء" : "Water",       value: entry.water_pct,       unit: "%" },
  ].filter((m) => m.value != null);

  return (
    <div className="border border-[var(--admin-border)] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--admin-hover-bg)] transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <TrendingUp size={15} strokeWidth={1.8} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[var(--admin-text)] leading-tight">
            {fmtDate(entry.entry_date)}
          </p>
          <p className="text-[11.5px] text-[var(--admin-text-faint)]">
            {entry.weight_kg != null ? `${n(entry.weight_kg)} kg` : ""}
            {entry.bmi != null ? ` · BMI ${n(entry.bmi)}` : ""}
            {entry.waist_cm != null ? ` · ${n(entry.waist_cm)} cm waist` : ""}
          </p>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-[var(--admin-text-faint)] shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-[var(--admin-text-faint)] shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--admin-border)]"
          >
            <div className="px-4 py-4 bg-[var(--admin-hover-bg)]/40">
              {/* Measurements grid */}
              {measurements.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {measurements.map((m) => (
                    <div key={m.label} className="bg-[var(--admin-surface)] rounded-lg p-2.5 border border-[var(--admin-border)]">
                      <p className="text-[10.5px] text-[var(--admin-text-faint)] mb-0.5">{m.label}</p>
                      <p className="text-[14px] font-bold text-[var(--admin-text)] tabular-nums">
                        {n(m.value)}<span className="text-[10px] text-[var(--admin-text-muted)] ml-0.5">{m.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional body composition */}
              {optionals.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {optionals.map((m) => (
                    <span key={m.label} className="text-[12px] text-[var(--admin-text-muted)]">
                      {m.label}: <strong className="text-[var(--admin-text)]">{n(m.value)}{m.unit}</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {(entry.nutritionist_notes || entry.client_notes) && (
                <div className="space-y-2 mb-3">
                  {entry.nutritionist_notes && (
                    <div className="text-[12px] text-[var(--admin-text-muted)]">
                      <span className="font-semibold text-[var(--admin-text)]">
                        {isAr ? "ملاحظات الأخصائية: " : "Nutritionist: "}
                      </span>
                      {entry.nutritionist_notes}
                    </div>
                  )}
                  {entry.client_notes && (
                    <div className="text-[12px] text-[var(--admin-text-muted)]">
                      <span className="font-semibold text-[var(--admin-text)]">
                        {isAr ? "ملاحظات العميلة: " : "Client: "}
                      </span>
                      {entry.client_notes}
                    </div>
                  )}
                </div>
              )}

              {/* Action row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--admin-border)]">
                <Btn icon={Eye}    label={isAr ? "عرض الصور" : "Photos"} onClick={onView} />
                <Btn icon={Edit2}  label={isAr ? "تعديل" : "Edit"}      onClick={onEdit} variant="primary" />
                <Btn icon={Copy}   label={isAr ? "نسخ" : "Duplicate"}   onClick={onDuplicate} />
                <Btn icon={Trash2} label={isAr ? "حذف" : "Delete"}      onClick={onDelete} variant="danger" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Btn({
  icon: Icon, label, onClick, variant = "default",
}: { icon: React.ElementType; label: string; onClick: () => void; variant?: "default" | "primary" | "danger" }) {
  const cls = {
    default: "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)]",
    primary: "text-primary-pink hover:bg-primary-pink/8",
    danger:  "text-red-500 hover:bg-red-50",
  }[variant];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11.5px] font-semibold transition-all ${cls}`}
    >
      <Icon size={11} strokeWidth={2} />{label}
    </button>
  );
}

// ─── Comparison view ──────────────────────────────────────────────────────────

function ComparisonRow({
  label, a, b, unit, metricKey,
}: { label: string; a: number | null; b: number | null; unit: string; metricKey: string }) {
  if (a == null && b == null) return null;
  const { dir, text } = diff(a, b);
  const improved = isImprovement(metricKey, dir);

  return (
    <div className="grid grid-cols-[1fr,auto,1fr,auto] items-center gap-3 py-2.5 border-b border-[var(--admin-border)] last:border-0">
      <div className="text-right">
        <span className="text-[13px] font-bold text-[var(--admin-text)] tabular-nums">
          {n(a)}{unit && <span className="text-[11px] text-[var(--admin-text-muted)] ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5 min-w-[90px]">
        <span className="text-[10px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider">{label}</span>
        <span className={`flex items-center gap-1 text-[11.5px] font-bold tabular-nums ${
          improved === true  ? "text-emerald-600" :
          improved === false ? "text-red-500" :
          dir === "same"     ? "text-[var(--admin-text-faint)]" :
          "text-amber-600"
        }`}>
          {dir === "down" ? <TrendingDown size={10} /> : dir === "up" ? <TrendingUp size={10} /> : <Minus size={10} />}
          {text}{unit && <span className="text-[10px]">{unit}</span>}
        </span>
      </div>
      <div>
        <span className="text-[13px] font-bold text-[var(--admin-text)] tabular-nums">
          {n(b)}{unit && <span className="text-[11px] text-[var(--admin-text-muted)] ml-0.5">{unit}</span>}
        </span>
      </div>
      <div className="w-5 flex justify-center">
        {improved === true  && <span className="text-emerald-500 text-[13px]">✓</span>}
        {improved === false && <span className="text-red-400 text-[13px]">↑</span>}
      </div>
    </div>
  );
}

function CompareView({
  entries, isAr,
}: { entries: ProgressEntryRow[]; isAr: boolean }) {
  const [idA, setIdA] = useState<string>(entries[Math.min(1, entries.length - 1)]?.id ?? "");
  const [idB, setIdB] = useState<string>(entries[0]?.id ?? "");
  const [photosA, setPhotosA] = useState<ProgressPhotoRow[]>([]);
  const [photosB, setPhotosB] = useState<ProgressPhotoRow[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const entryA = entries.find((e) => e.id === idA) ?? null;
  const entryB = entries.find((e) => e.id === idB) ?? null;

  useEffect(() => {
    if (idA) getEntryPhotos(idA).then(setPhotosA);
  }, [idA]);
  useEffect(() => {
    if (idB) getEntryPhotos(idB).then(setPhotosB);
  }, [idB]);

  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <GitCompare size={28} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
        <p className="text-[13px] text-[var(--admin-text-muted)]">
          {isAr ? "تحتاجين إلى إدخالين على الأقل للمقارنة" : "You need at least 2 entries to compare"}
        </p>
      </div>
    );
  }

  const dateOpts = entries.map((e) => ({ id: e.id, label: fmtDate(e.entry_date) }));

  return (
    <div>
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider block mb-1.5">
            {isAr ? "الإدخال الأول" : "Entry A"}
          </label>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className="form-input"
          >
            {dateOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider block mb-1.5">
            {isAr ? "الإدخال الثاني" : "Entry B"}
          </label>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className="form-input"
          >
            {dateOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {entryA && entryB && (
        <>
          {/* Date headers */}
          <div className="grid grid-cols-[1fr,auto,1fr,auto] items-center gap-3 mb-2">
            <div className="text-right text-[11px] font-bold text-[var(--admin-text-faint)]">{fmtDate(entryA.entry_date)}</div>
            <div className="min-w-[90px]" />
            <div className="text-[11px] font-bold text-[var(--admin-text-faint)]">{fmtDate(entryB.entry_date)}</div>
            <div className="w-5" />
          </div>

          {/* Measurement diffs */}
          <div className="bg-[var(--admin-hover-bg)]/60 rounded-xl p-3 mb-5">
            <ComparisonRow label={isAr ? "الوزن" : "Weight"} a={entryA.weight_kg} b={entryB.weight_kg} unit="kg"   metricKey="weight"/>
            <ComparisonRow label="BMI"                        a={entryA.bmi}       b={entryB.bmi}       unit=""    metricKey="bmi"   />
            <ComparisonRow label={isAr ? "الخصر" : "Waist"}  a={entryA.waist_cm}  b={entryB.waist_cm}  unit="cm"  metricKey="waist" />
            <ComparisonRow label={isAr ? "الوركين" : "Hip"}  a={entryA.hip_cm}    b={entryB.hip_cm}    unit="cm"  metricKey="hip"   />
            <ComparisonRow label={isAr ? "الفخذ" : "Thigh"}  a={entryA.thigh_cm}  b={entryB.thigh_cm}  unit="cm"  metricKey="thigh" />
            <ComparisonRow label={isAr ? "الذراع" : "Arm"}   a={entryA.arm_cm}    b={entryB.arm_cm}    unit="cm"  metricKey="arm"   />
            <ComparisonRow label={isAr ? "الصدر" : "Chest"}  a={entryA.chest_cm}  b={entryB.chest_cm}  unit="cm"  metricKey="chest" />
            <ComparisonRow label={isAr ? "دهون" : "Body Fat"} a={entryA.body_fat_pct} b={entryB.body_fat_pct} unit="%" metricKey="body_fat"/>
            <ComparisonRow label={isAr ? "عضلات" : "Muscle"} a={entryA.muscle_mass_pct} b={entryB.muscle_mass_pct} unit="%" metricKey="muscle_mass"/>
          </div>

          {/* Photos side-by-side */}
          {(photosA.length > 0 || photosB.length > 0) && (
            <div>
              <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
                {isAr ? "صور المقارنة" : "Progress Photos"}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {PHOTO_SLOTS.map((slot) => {
                  const pA = photosA.find((p) => p.photo_type === slot.key);
                  const pB = photosB.find((p) => p.photo_type === slot.key);
                  if (!pA && !pB) return null;
                  return (
                    <div key={slot.key}>
                      <p className="text-[10.5px] font-semibold text-[var(--admin-text-faint)] text-center mb-1.5">{slot.en}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {[pA, pB].map((p, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-[var(--admin-hover-bg)] border border-[var(--admin-border)]">
                            {p ? (
                              <img
                                src={p.url} alt={slot.en}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setLightbox(p.url)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera size={14} className="text-[var(--admin-text-faint)]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={lightbox}
              className="max-w-full max-h-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Entry editor modal ───────────────────────────────────────────────────────

function EntryEditor({
  entry, clientId, isAr, onSave, onClose,
}: {
  entry: ProgressEntryRow | null;
  clientId: string;
  isAr: boolean;
  onSave: (saved: ProgressEntryRow) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"measurements" | "body" | "notes" | "photos">("measurements");
  const [form, setForm] = useState<ProgressEntryInput>({
    ...EMPTY_FORM,
    ...(entry ? {
      entry_date:         entry.entry_date,
      weight_kg:          entry.weight_kg,
      height_cm:          entry.height_cm,
      waist_cm:           entry.waist_cm,
      hip_cm:             entry.hip_cm,
      thigh_cm:           entry.thigh_cm,
      arm_cm:             entry.arm_cm,
      chest_cm:           entry.chest_cm,
      body_fat_pct:       entry.body_fat_pct,
      muscle_mass_pct:    entry.muscle_mass_pct,
      water_pct:          entry.water_pct,
      goal_weight_kg:     entry.goal_weight_kg,
      nutritionist_notes: entry.nutritionist_notes ?? "",
      client_notes:       entry.client_notes ?? "",
    } : {}),
  });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [photos, setPhotos]       = useState<ProgressPhotoRow[]>([]);
  const [savedId, setSavedId]     = useState<string | null>(entry?.id ?? null);

  useEffect(() => {
    if (entry?.id) getEntryPhotos(entry.id).then(setPhotos);
  }, [entry?.id]);

  const previewBMI = calcBMI(form.weight_kg, form.height_cm);

  function setNum(field: keyof ProgressEntryInput, raw: string) {
    const v = raw === "" ? null : parseFloat(raw);
    setForm((f) => ({ ...f, [field]: isNaN(v as number) ? null : v }));
  }

  async function handleSave() {
    if (!form.entry_date) {
      setError(isAr ? "التاريخ مطلوب" : "Entry date is required");
      return;
    }
    setSaving(true);
    setError(null);

    let saved: ProgressEntryRow | null;
    if (entry) {
      saved = await updateProgressEntry(entry.id, form);
    } else {
      saved = await createProgressEntry(clientId, form);
    }

    setSaving(false);
    if (!saved) {
      setError(isAr ? "حدث خطأ، حاولي مجدداً" : "Save failed — please try again.");
      return;
    }
    setSavedId(saved.id);
    setTab("photos"); // nudge to photos after save
    onSave(saved);
  }

  function makePhotoUploader(type: ProgressPhotoRow["photo_type"]) {
    return async (file: File): Promise<string | null> => {
      const id = savedId ?? entry?.id;
      if (!id) return null;
      const result = await uploadEntryPhoto(id, clientId, type, file);
      if (result) {
        setPhotos((prev) => [...prev.filter((p) => p.photo_type !== type), result]);
        return result.url;
      }
      return null;
    };
  }

  async function handlePhotoDelete(photo: ProgressPhotoRow) {
    await deleteEntryPhoto(photo.id, photo.url);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  const editorTabs = [
    { id: "measurements" as const, en: "Measurements", ar: "القياسات"    },
    { id: "body"         as const, en: "Body Comp.",   ar: "تركيب الجسم" },
    { id: "notes"        as const, en: "Notes",        ar: "ملاحظات"     },
    { id: "photos"       as const, en: "Photos",       ar: "الصور"       },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col
          bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]
          shadow-2xl shadow-black/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--admin-border)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <TrendingUp size={14} strokeWidth={1.8} className="text-amber-600" />
          </div>
          <p className="text-[14px] font-bold text-[var(--admin-text)] flex-1">
            {entry ? (isAr ? "تعديل الإدخال" : "Edit Progress Entry") : (isAr ? "إضافة إدخال" : "Add Progress Entry")}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--admin-border)] shrink-0 overflow-x-auto scrollbar-none">
          {editorTabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-[12.5px] font-semibold border-b-2 transition-all whitespace-nowrap
                ${tab === t.id
                  ? "border-primary-pink text-primary-pink"
                  : "border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)]"}`}>
              {isAr ? t.ar : t.en}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Measurements ── */}
          {tab === "measurements" && (
            <div className="space-y-4">
              <EField label={isAr ? "التاريخ *" : "Date *"}>
                <input type="date" value={form.entry_date}
                  onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
                  className="form-input" />
              </EField>
              <div className="grid grid-cols-2 gap-3">
                <EField label={isAr ? "الوزن (كجم)" : "Weight (kg)"}>
                  <input type="number" step="0.1" min="0" value={form.weight_kg ?? ""}
                    onChange={(e) => setNum("weight_kg", e.target.value)}
                    placeholder="e.g. 72.5" className="form-input" />
                </EField>
                <EField label={isAr ? "الطول (سم)" : "Height (cm)"}>
                  <input type="number" step="0.1" min="0" value={form.height_cm ?? ""}
                    onChange={(e) => setNum("height_cm", e.target.value)}
                    placeholder="e.g. 165" className="form-input" />
                </EField>
              </div>
              {/* BMI preview */}
              {previewBMI != null && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                  <BarChart2 size={13} className="text-blue-500" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-blue-700">
                    {isAr ? `BMI محسوب: ${previewBMI}` : `Calculated BMI: ${previewBMI}`}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <EField label={isAr ? "الخصر (سم)" : "Waist (cm)"}>
                  <input type="number" step="0.5" min="0" value={form.waist_cm ?? ""}
                    onChange={(e) => setNum("waist_cm", e.target.value)} placeholder="—" className="form-input" />
                </EField>
                <EField label={isAr ? "الوركان (سم)" : "Hip (cm)"}>
                  <input type="number" step="0.5" min="0" value={form.hip_cm ?? ""}
                    onChange={(e) => setNum("hip_cm", e.target.value)} placeholder="—" className="form-input" />
                </EField>
                <EField label={isAr ? "الفخذ (سم)" : "Thigh (cm)"}>
                  <input type="number" step="0.5" min="0" value={form.thigh_cm ?? ""}
                    onChange={(e) => setNum("thigh_cm", e.target.value)} placeholder="—" className="form-input" />
                </EField>
                <EField label={isAr ? "الذراع (سم)" : "Arm (cm)"}>
                  <input type="number" step="0.5" min="0" value={form.arm_cm ?? ""}
                    onChange={(e) => setNum("arm_cm", e.target.value)} placeholder="—" className="form-input" />
                </EField>
                <EField label={isAr ? "الصدر (سم)" : "Chest (cm)"}>
                  <input type="number" step="0.5" min="0" value={form.chest_cm ?? ""}
                    onChange={(e) => setNum("chest_cm", e.target.value)} placeholder="—" className="form-input" />
                </EField>
                <EField label={isAr ? "هدف الوزن (كجم)" : "Goal Weight (kg)"}>
                  <input type="number" step="0.1" min="0" value={form.goal_weight_kg ?? ""}
                    onChange={(e) => setNum("goal_weight_kg", e.target.value)} placeholder="—" className="form-input" />
                </EField>
              </div>
            </div>
          )}

          {/* ── Body Composition ── */}
          {tab === "body" && (
            <div className="space-y-4">
              <p className="text-[12px] text-[var(--admin-text-muted)] leading-relaxed">
                {isAr
                  ? "هذه الحقول اختيارية وتتطلب جهاز قياس تكوين الجسم."
                  : "These are optional fields requiring body composition analysis equipment."}
              </p>
              <EField label={isAr ? "نسبة الدهون (%)" : "Body Fat (%)"} icon={Percent}>
                <input type="number" step="0.1" min="0" max="100" value={form.body_fat_pct ?? ""}
                  onChange={(e) => setNum("body_fat_pct", e.target.value)} placeholder="—" className="form-input" />
              </EField>
              <EField label={isAr ? "كتلة العضلات (%)" : "Muscle Mass (%)"} icon={TrendingUp}>
                <input type="number" step="0.1" min="0" max="100" value={form.muscle_mass_pct ?? ""}
                  onChange={(e) => setNum("muscle_mass_pct", e.target.value)} placeholder="—" className="form-input" />
              </EField>
              <EField label={isAr ? "نسبة الماء (%)" : "Water (%)"} icon={Droplets}>
                <input type="number" step="0.1" min="0" max="100" value={form.water_pct ?? ""}
                  onChange={(e) => setNum("water_pct", e.target.value)} placeholder="—" className="form-input" />
              </EField>
            </div>
          )}

          {/* ── Notes ── */}
          {tab === "notes" && (
            <div className="space-y-4">
              <EField label={isAr ? "ملاحظات الأخصائية" : "Nutritionist Notes"}>
                <textarea rows={4} value={form.nutritionist_notes}
                  onChange={(e) => setForm((f) => ({ ...f, nutritionist_notes: e.target.value }))}
                  placeholder={isAr ? "ملاحظات طبية وتغذوية..." : "Clinical and nutritional observations..."}
                  className="form-input resize-none" />
              </EField>
              <EField label={isAr ? "ملاحظات العميلة" : "Client Notes"}>
                <textarea rows={4} value={form.client_notes}
                  onChange={(e) => setForm((f) => ({ ...f, client_notes: e.target.value }))}
                  placeholder={isAr ? "ملاحظات العميلة حول تقدمها..." : "Client's own observations and notes..."}
                  className="form-input resize-none" />
              </EField>
            </div>
          )}

          {/* ── Photos ── */}
          {tab === "photos" && (
            <div className="space-y-4">
              {!savedId && !entry?.id && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[12px]">
                  <AlertTriangle size={13} strokeWidth={2} />
                  {isAr ? "احفظي الإدخال أولاً ثم ارفعي الصور" : "Save the entry first, then upload photos"}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {PHOTO_SLOTS.map((slot) => {
                  const existing = photos.find((p) => p.photo_type === slot.key);
                  const entryId = savedId ?? entry?.id;
                  return (
                    <div key={slot.key}>
                      <p className="text-[11.5px] font-semibold text-[var(--admin-text-muted)] mb-2 text-center">
                        {isAr ? slot.ar : slot.en}
                      </p>
                      <ImageUpload
                        key={existing?.id ?? `empty-${slot.key}`}
                        shape="rect"
                        value={existing?.url ?? null}
                        disabled={!entryId}
                        lang={isAr ? "ar" : "en"}
                        fallback={
                          <Camera size={18} strokeWidth={1.5} className="text-[var(--admin-text-faint)]" />
                        }
                        upload={makePhotoUploader(slot.key)}
                        className="w-full"
                      />
                      {existing && (
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete(existing)}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11.5px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={11} strokeWidth={2} />
                          {isAr ? "حذف" : "Remove"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--admin-border)] shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-red-600 flex-1">
              <AlertTriangle size={13} strokeWidth={2} />{error}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} disabled={saving}
              className="h-9 px-4 rounded-xl text-[12.5px] font-semibold text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors disabled:opacity-50">
              {tab === "photos" ? (isAr ? "إغلاق" : "Close") : (isAr ? "إلغاء" : "Cancel")}
            </button>
            {tab !== "photos" && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={2} />}
                {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save Entry")}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EField({
  label, icon: Icon, children,
}: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--admin-text-muted)] mb-1.5">
        {Icon && <Icon size={11} strokeWidth={2} className="shrink-0" />}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Photo viewer modal ───────────────────────────────────────────────────────

function PhotoViewer({
  entry, isAr, onClose,
}: { entry: ProgressEntryRow; clientId?: string; isAr: boolean; onClose: () => void }) {
  const [photos, setPhotos]       = useState<ProgressPhotoRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [lightbox, setLightbox]   = useState<string | null>(null);

  useEffect(() => {
    getEntryPhotos(entry.id).then((p) => { setPhotos(p); setLoading(false); });
  }, [entry.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative w-full max-w-md bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <p className="text-[14px] font-bold text-[var(--admin-text)]">
            {isAr ? "صور التقدم" : "Progress Photos"} · {fmtDate(entry.entry_date)}
          </p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[var(--admin-text-faint)]" /></div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Camera size={24} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
              <p className="text-[12.5px] text-[var(--admin-text-muted)]">
                {isAr ? "لا توجد صور لهذا الإدخال" : "No photos for this entry"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {PHOTO_SLOTS.map((slot) => {
                const photo = photos.find((p) => p.photo_type === slot.key);
                return (
                  <div key={slot.key}>
                    <p className="text-[10.5px] font-semibold text-[var(--admin-text-faint)] text-center mb-1.5">{isAr ? slot.ar : slot.en}</p>
                    <div className="aspect-square rounded-xl border border-[var(--admin-border)] overflow-hidden bg-[var(--admin-hover-bg)] flex items-center justify-center">
                      {photo ? (
                        <img src={photo.url} alt={slot.en}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setLightbox(photo.url)} />
                      ) : (
                        <Camera size={20} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
            <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              src={lightbox} className="max-w-full max-h-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ProgressTabProps {
  clientId: string;
  isAr: boolean;
  onCountChange?: (count: number) => void;
}

export default function ProgressTab({ clientId, isAr, onCountChange }: ProgressTabProps) {
  const [entries, setEntries]       = useState<ProgressEntryRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<ViewMode>("overview");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("weight");
  const [timeRange, setTimeRange]   = useState<TimeRange>("all");
  const [editEntry, setEditEntry]   = useState<ProgressEntryRow | null | "new">(null);
  const [viewPhotos, setViewPhotos] = useState<ProgressEntryRow | null>(null);

  const loadEntries = useCallback(async () => {
    const data = await getClientProgressEntries(clientId);
    setEntries(data);
    onCountChange?.(data.length);
    setLoading(false);
  }, [clientId, onCountChange]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function handleSave(saved: ProgressEntryRow) {
    setEditEntry(null);
    await loadEntries();
    void saved;
  }

  async function handleDuplicate(e: ProgressEntryRow) {
    await duplicateProgressEntry(e);
    await loadEntries();
  }

  async function handleDelete(e: ProgressEntryRow) {
    if (!window.confirm(isAr ? "هل تريدين حذف هذا الإدخال؟" : "Delete this progress entry?")) return;
    await deleteProgressEntry(e.id);
    await loadEntries();
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)]" />)}
      </div>
      <div className="h-52 rounded-2xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)]" />
    </div>
  );

  const latest  = entries[0] ?? null;
  const oldest  = entries[entries.length - 1] ?? null;
  const goal    = latest?.goal_weight_kg ?? null;
  const current = latest?.weight_kg ?? null;
  const first   = oldest?.weight_kg ?? null;
  const weightLost = (current != null && first != null) ? +(first - current).toFixed(1) : null;

  // Chart data
  const metricMeta = CHART_METRICS.find((m) => m.key === chartMetric)!;
  const chartEntries = filterByTimeRange([...entries].reverse(), timeRange);
  const chartPoints: { date: string; value: number }[] = chartEntries
    .map((e) => ({ date: e.entry_date, value: metricValue(e, chartMetric) ?? 0 }))
    .filter((p) => p.value > 0);

  const views = [
    { id: "overview" as ViewMode, en: "Overview",  ar: "نظرة عامة", icon: BarChart2 },
    { id: "history"  as ViewMode, en: "History",   ar: "السجل",     icon: List      },
    { id: "compare"  as ViewMode, en: "Compare",   ar: "مقارنة",    icon: GitCompare},
  ];

  return (
    <>
      {/* ── Tab header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          <p className="text-[14px] font-bold text-[var(--admin-text)]">
            {isAr ? "متابعة التقدم" : "Progress Tracking"}
          </p>
          <p className="text-[11.5px] text-[var(--admin-text-faint)]">
            {entries.length === 0 ? (isAr ? "لا توجد إدخالات بعد" : "No entries yet")
              : `${entries.length} ${isAr ? "إدخال" : entries.length === 1 ? "entry" : "entries"}`}
          </p>
        </div>

        {/* View switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-[var(--admin-hover-bg)] rounded-xl p-1">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold transition-all whitespace-nowrap
                  ${view === v.id ? "bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm" : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"}`}>
                <Icon size={11} strokeWidth={2} />{isAr ? v.ar : v.en}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setEditEntry("new")}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity shrink-0">
          <Plus size={13} strokeWidth={2.5} />
          {isAr ? "إضافة إدخال" : "Add Entry"}
        </button>
      </div>

      {/* Mobile view switcher */}
      <div className="flex sm:hidden items-center gap-1 bg-[var(--admin-hover-bg)] rounded-xl p-1 mb-4">
        {views.map((v) => {
          const Icon = v.icon;
          return (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11.5px] font-semibold transition-all
                ${view === v.id ? "bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-sm" : "text-[var(--admin-text-muted)]"}`}>
              <Icon size={11} strokeWidth={2} />{isAr ? v.ar : v.en}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
            <TrendingUp size={28} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[var(--admin-text)]">
              {isAr ? "لا توجد إدخالات تقدم بعد" : "No progress entries yet"}
            </p>
            <p className="text-[12.5px] text-[var(--admin-text-muted)] mt-1 max-w-sm leading-relaxed">
              {isAr
                ? "سجلي أول إدخال لبدء متابعة تقدم العميلة."
                : "Record the first entry to begin tracking the client's progress."}
            </p>
          </div>
          <button onClick={() => setEditEntry("new")}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity">
            <Plus size={13} strokeWidth={2.5} />
            {isAr ? "إضافة أول إدخال" : "Add First Entry"}
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ── */}
          {view === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <MiniStat label={isAr ? "الوزن الحالي" : "Current Weight"}
                  value={current != null ? n(current) : "—"} unit="kg" icon={Scale}
                  gradient="bg-gradient-to-br from-primary-pink to-soft-pink"
                  sub={latest?.entry_date ? fmtDate(latest.entry_date) : undefined} />
                <MiniStat label={isAr ? "الوزن المستهدف" : "Goal Weight"}
                  value={goal != null ? n(goal) : "—"} unit={goal != null ? "kg" : ""}
                  icon={Target} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  sub={current != null && goal != null
                    ? `${n(Math.abs(current - goal))} kg ${current > goal ? (isAr ? "متبقٍ" : "to go") : (isAr ? "تجاوزت" : "below goal")}`
                    : undefined} />
                <MiniStat label={isAr ? "الوزن المفقود" : "Weight Lost"}
                  value={weightLost != null ? (weightLost > 0 ? `−${weightLost}` : `+${Math.abs(weightLost)}`) : "—"}
                  unit={weightLost != null ? "kg" : ""}
                  icon={weightLost != null && weightLost > 0 ? ArrowDownToLine : TrendingDown}
                  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                  sub={entries.length > 1 ? (isAr ? `منذ ${fmtDate(oldest?.entry_date)}` : `since ${fmtDate(oldest?.entry_date)}`) : undefined} />
                <MiniStat label="BMI" value={latest?.bmi != null ? n(latest.bmi) : "—"} unit=""
                  icon={BarChart2} gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                  sub={latest?.bmi != null
                    ? (latest.bmi < 18.5 ? "Underweight" : latest.bmi < 25 ? "Normal" : latest.bmi < 30 ? "Overweight" : "Obese")
                    : undefined} />
              </div>

              {/* Latest measurements */}
              {latest && (
                <div className="bg-[var(--admin-hover-bg)]/60 rounded-xl p-4 mb-6">
                  <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
                    {isAr ? "أحدث القياسات" : "Latest Measurements"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                      { l: isAr ? "الخصر" : "Waist",   v: latest.waist_cm  },
                      { l: isAr ? "الوركان" : "Hip",   v: latest.hip_cm    },
                      { l: isAr ? "الفخذ" : "Thigh",   v: latest.thigh_cm  },
                      { l: isAr ? "الذراع" : "Arm",    v: latest.arm_cm    },
                      { l: isAr ? "الصدر" : "Chest",   v: latest.chest_cm  },
                    ].filter((m) => m.v != null).map((m) => (
                      <div key={m.l} className="bg-[var(--admin-surface)] rounded-lg p-3 border border-[var(--admin-border)]">
                        <p className="text-[10.5px] text-[var(--admin-text-faint)] mb-1">{m.l}</p>
                        <p className="text-[16px] font-bold text-[var(--admin-text)] tabular-nums">
                          {n(m.v)}<span className="text-[11px] text-[var(--admin-text-muted)] ml-0.5">cm</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-[var(--admin-surface)] rounded-xl border border-[var(--admin-border)] p-4">
                {/* Chart controls */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {/* Metric selector */}
                  <div className="flex flex-wrap gap-1">
                    {CHART_METRICS.map((m) => (
                      <button key={m.key} onClick={() => setChartMetric(m.key)}
                        className={`h-7 px-3 rounded-lg text-[11.5px] font-semibold transition-all
                          ${chartMetric === m.key
                            ? "text-white shadow-sm"
                            : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"}`}
                        style={chartMetric === m.key ? { backgroundColor: m.color } : {}}>
                        {isAr ? m.ar : m.en}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex gap-1">
                    {TIME_RANGES.map((r) => (
                      <button key={r.key} onClick={() => setTimeRange(r.key)}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all
                          ${timeRange === r.key
                            ? "bg-[var(--admin-hover-bg)] text-[var(--admin-text)]"
                            : "text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]"}`}>
                        {isAr ? r.ar : r.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart title */}
                <p className="text-[12px] font-semibold text-[var(--admin-text-muted)] mb-2">
                  {isAr ? metricMeta.ar : metricMeta.en}
                  {metricMeta.unit && ` (${metricMeta.unit})`}
                </p>

                <LineChart points={chartPoints} color={metricMeta.color} unit={metricMeta.unit} height={200} />
              </div>
            </motion.div>
          )}

          {/* ── HISTORY ── */}
          {view === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="space-y-2">
                {entries.map((e, i) => (
                  <EntryCard key={e.id} entry={e} isFirst={i === 0} isAr={isAr}
                    onEdit={() => setEditEntry(e)}
                    onDuplicate={() => handleDuplicate(e)}
                    onDelete={() => handleDelete(e)}
                    onView={() => setViewPhotos(e)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── COMPARE ── */}
          {view === "compare" && (
            <motion.div key="compare" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <CompareView entries={entries} isAr={isAr} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {editEntry !== null && (
          <EntryEditor
            key="editor"
            entry={editEntry === "new" ? null : editEntry}
            clientId={clientId}
            isAr={isAr}
            onSave={handleSave}
            onClose={() => setEditEntry(null)}
          />
        )}
        {viewPhotos && (
          <PhotoViewer
            key="photos"
            entry={viewPhotos}
            clientId={clientId}
            isAr={isAr}
            onClose={() => setViewPhotos(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
