/**
 * Portal — My Progress
 * Read-only view: stat cards, SVG weight chart, entry history, progress photos.
 */

import { useState, useEffect } from "react";
import { TrendingUp, Scale, Ruler, AlertCircle, ChevronDown, ChevronUp, Image } from "lucide-react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  getOwnProgressEntries,
  type ProgressEntryWithPhotos,
} from "@/portal/repositories/progress.repository";

// ─── SVG line chart (weight over time) ────────────────────────────────────────

interface ChartPoint { date: string; weight: number }

function WeightChart({ entries, isAr }: { entries: ProgressEntryWithPhotos[]; isAr: boolean }) {
  const points: ChartPoint[] = entries
    .filter((e) => e.weight_kg !== null)
    .map((e) => ({ date: e.entry_date, weight: Number(e.weight_kg) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length < 2) return null;

  const W = 600, H = 180, PAD = { t: 16, r: 24, b: 40, l: 48 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;

  const xScale = (i: number) => PAD.l + (i / (points.length - 1)) * chartW;
  const yScale = (w: number) => PAD.t + chartH - ((w - minW) / (maxW - minW)) * chartH;

  const polyline = points
    .map((p, i) => `${xScale(i).toFixed(1)},${yScale(p.weight).toFixed(1)}`)
    .join(" ");

  const area = [
    `M${xScale(0).toFixed(1)},${(PAD.t + chartH).toFixed(1)}`,
    ...points.map((p, i) => `L${xScale(i).toFixed(1)},${yScale(p.weight).toFixed(1)}`),
    `L${xScale(points.length - 1).toFixed(1)},${(PAD.t + chartH).toFixed(1)}`,
    "Z",
  ].join(" ");

  // Y-axis ticks
  const yTicks = 4;
  const step = (maxW - minW) / yTicks;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-xs font-semibold text-ivory/40 uppercase tracking-wider mb-3">
        {isAr ? "الوزن عبر الزمن (كغ)" : "Weight Over Time (kg)"}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: 200 }}
      >
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e91e8c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e91e8c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const w = minW + step * i;
          const y = yScale(w);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="10">
                {w.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={area} fill="url(#wg)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#e91e8c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(p.weight)} r="3.5" fill="#e91e8c" />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (points.length > 6 && i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
          const d = new Date(p.date);
          const lbl = d.toLocaleDateString(isAr ? "ar-KW" : "en-US", { month: "short", day: "numeric" });
          return (
            <text
              key={i}
              x={xScale(i)}
              y={H - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="9"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, icon }: {
  label: string; value: number | null; unit: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-ivory/40 text-xs font-semibold uppercase tracking-wide mb-3">
        {icon}{label}
      </div>
      {value !== null ? (
        <p className="font-heading text-2xl font-bold text-ivory">
          {value} <span className="text-sm font-normal text-ivory/40">{unit}</span>
        </p>
      ) : (
        <p className="text-ivory/30 text-sm">—</p>
      )}
    </div>
  );
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, isAr }: { entry: ProgressEntryWithPhotos; isAr: boolean }) {
  const [open, setOpen] = useState(false);

  const date = new Date(entry.entry_date).toLocaleDateString(isAr ? "ar-KW" : "en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });

  const metrics = [
    { label: isAr ? "الوزن"      : "Weight",      value: entry.weight_kg,       unit: isAr ? "كغ" : "kg"  },
    { label: isAr ? "الطول"      : "Height",      value: entry.height_cm,       unit: "cm"  },
    { label: "BMI",                                value: entry.bmi,             unit: ""    },
    { label: isAr ? "الخصر"      : "Waist",       value: entry.waist_cm,        unit: "cm"  },
    { label: isAr ? "الوركان"    : "Hip",         value: entry.hip_cm,          unit: "cm"  },
    { label: isAr ? "الفخذ"      : "Thigh",       value: entry.thigh_cm,        unit: "cm"  },
    { label: isAr ? "الذراع"     : "Arm",         value: entry.arm_cm,          unit: "cm"  },
    { label: isAr ? "الصدر"      : "Chest",       value: entry.chest_cm,        unit: "cm"  },
    { label: isAr ? "نسبة الدهون": "Body Fat",    value: entry.body_fat_pct,    unit: "%"   },
    { label: isAr ? "العضلات"    : "Muscle",      value: entry.muscle_mass_pct, unit: "%"   },
    { label: isAr ? "الماء"      : "Water",       value: entry.water_pct,       unit: "%"   },
    { label: isAr ? "الوزن المستهدف": "Goal Weight", value: entry.goal_weight_kg, unit: isAr ? "كغ" : "kg" },
  ].filter((m) => m.value !== null);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-start"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
          <TrendingUp className="text-teal-400" size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ivory text-sm">{date}</p>
          <p className="text-xs text-ivory/40 mt-0.5">
            {entry.weight_kg ? `${entry.weight_kg} ${isAr ? "كغ" : "kg"}` : ""}
            {entry.bmi ? ` · BMI ${entry.bmi}` : ""}
            {entry.photos.length > 0
              ? ` · ${entry.photos.length} ${isAr ? (entry.photos.length === 1 ? "صورة" : "صور") : `photo${entry.photos.length > 1 ? "s" : ""}`}`
              : ""}
          </p>
        </div>
        <span className="text-ivory/30">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 p-5 space-y-5">
          {/* Metrics grid */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {metrics.map((m) => (
                <div key={m.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-ivory/40 mb-0.5">{m.label}</p>
                  <p className="text-sm font-semibold text-ivory">
                    {m.value} {m.unit}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {entry.nutritionist_notes && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-ivory/40 mb-1">
                {isAr ? "ملاحظات أخصائي التغذية" : "Nutritionist Notes"}
              </p>
              <p className="text-sm text-ivory/70">{entry.nutritionist_notes}</p>
            </div>
          )}
          {entry.client_notes && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-ivory/40 mb-1">
                {isAr ? "ملاحظاتي" : "My Notes"}
              </p>
              <p className="text-sm text-ivory/70">{entry.client_notes}</p>
            </div>
          )}

          {/* Photos */}
          {entry.photos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ivory/40 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Image size={11} /> {isAr ? "الصور" : "Photos"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {entry.photos.map((photo) => (
                  <div key={photo.id} className="aspect-square relative">
                    <img
                      src={photo.url}
                      alt={photo.photo_type}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1.5 start-1.5 text-[10px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded-md capitalize">
                      {photo.photo_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [entries,  setEntries]  = useState<ProgressEntryWithPhotos[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!profile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    getOwnProgressEntries(profile.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  const latest = entries[0] ?? null;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "تقدمي" : "My Progress"}
      </h1>

      {entries.length === 0 ? (
        <div className="py-16 text-center bg-white/3 border border-white/8 rounded-2xl">
          <AlertCircle className="mx-auto text-ivory/20 mb-3" size={28} />
          <p className="text-ivory/40 text-sm">
            {isAr ? "لا توجد إدخالات تقدم بعد." : "No progress entries yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label={isAr ? "الوزن" : "Weight"} value={latest?.weight_kg ?? null} unit={isAr ? "كغ" : "kg"} icon={<Scale size={13} />} />
            <StatCard label="BMI"                        value={latest?.bmi ?? null}        unit=""                   icon={<TrendingUp size={13} />} />
            <StatCard label={isAr ? "الخصر" : "Waist"}  value={latest?.waist_cm ?? null}   unit="cm"                 icon={<Ruler size={13} />} />
          </div>

          {/* Weight chart */}
          <WeightChart entries={entries} isAr={isAr} />

          {/* Entry history */}
          <div>
            <h2 className="font-heading text-base font-semibold text-ivory mb-4">
              {isAr ? "السجل" : "History"}
            </h2>
            <div className="space-y-3">
              {entries.map((entry) => <EntryCard key={entry.id} entry={entry} isAr={isAr} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
