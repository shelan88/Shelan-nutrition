/**
 * Portal — My Nutrition Plans
 * Read-only view of admin-assigned nutrition plans with meal details and files.
 */

import { useState, useEffect } from "react";
import {
  Utensils, ChevronDown, ChevronUp, FileText, Droplets,
  Footprints, Dumbbell, Pill, ExternalLink,
} from "lucide-react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  getOwnNutritionPlans,
  MEAL_SLOTS,
  type PortalNutritionPlan,
} from "@/portal/repositories/nutrition.repository";

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  draft:     "bg-amber-500/15 text-amber-300 border-amber-500/20",
  completed: "bg-ivory/10 text-ivory/50 border-white/10",
  archived:  "bg-ivory/5 text-ivory/30 border-white/5",
};

const STATUS_LABELS_AR: Record<string, string> = {
  active:    "نشط",
  draft:     "مسودة",
  completed: "مكتمل",
  archived:  "مؤرشف",
};

function PlanCard({ plan, isAr }: { plan: PortalNutritionPlan; isAr: boolean }) {
  const [open, setOpen] = useState(plan.status === "active");

  const statusClass = STATUS_COLORS[plan.status] ?? "bg-white/10 text-ivory/50 border-white/10";
  const statusLabel = isAr
    ? (STATUS_LABELS_AR[plan.status] ?? plan.status)
    : (plan.status.charAt(0).toUpperCase() + plan.status.slice(1));

  const dateRange = [plan.start_date, plan.end_date]
    .filter(Boolean)
    .map((d) => new Date(d!).toLocaleDateString(isAr ? "ar-KW" : "en-US", { month: "short", day: "numeric", year: "numeric" }))
    .join(" – ");

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-start"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mt-0.5">
          <Utensils className="text-emerald-400" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-ivory">{plan.name}</span>
            <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          {dateRange && <p className="text-xs text-ivory/40">{dateRange}</p>}
        </div>
        <span className="text-ivory/30 shrink-0 mt-1">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-white/10 p-5 space-y-6">
          {/* Meals grid */}
          <div>
            <h3 className="text-xs font-semibold text-ivory/40 uppercase tracking-wider mb-3">
              {isAr ? "الوجبات" : "Meals"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEAL_SLOTS.map(({ key, en: slotLabelEn, ar: slotLabelAr }) => {
                const meal = plan.mealsMap[key];
                if (!meal?.title && !meal?.description) return null;
                return (
                  <div key={key} className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary-pink/80 uppercase tracking-wide mb-2">
                      {isAr ? (slotLabelAr ?? slotLabelEn) : slotLabelEn}
                    </p>
                    {meal.title && <p className="text-sm font-medium text-ivory mb-1">{meal.title}</p>}
                    {meal.description && <p className="text-sm text-ivory/60">{meal.description}</p>}
                    {meal.instructions && (
                      <p className="text-xs text-ivory/40 mt-2 italic">{meal.instructions}</p>
                    )}
                    {meal.notes && (
                      <p className="text-xs text-ivory/30 mt-1">{meal.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals & recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plan.water_intake_goal && (
              <InfoBlock icon={<Droplets size={14} />} label={isAr ? "هدف شرب الماء" : "Water Goal"} value={plan.water_intake_goal} />
            )}
            {plan.steps_goal && (
              <InfoBlock icon={<Footprints size={14} />} label={isAr ? "هدف الخطوات" : "Steps Goal"} value={plan.steps_goal} />
            )}
            {plan.exercise_recommendations && (
              <InfoBlock icon={<Dumbbell size={14} />} label={isAr ? "التمارين" : "Exercise"} value={plan.exercise_recommendations} />
            )}
            {plan.supplement_recommendations && (
              <InfoBlock icon={<Pill size={14} />} label={isAr ? "المكملات" : "Supplements"} value={plan.supplement_recommendations} />
            )}
          </div>

          {/* General instructions */}
          {plan.general_instructions && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-ivory/40 uppercase tracking-wide mb-2">
                {isAr ? "تعليمات عامة" : "General Instructions"}
              </p>
              <p className="text-sm text-ivory/70 whitespace-pre-line">{plan.general_instructions}</p>
            </div>
          )}

          {/* Attached files */}
          {plan.files.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ivory/40 uppercase tracking-wider mb-3">
                {isAr ? "المرفقات" : "Attachments"}
              </h3>
              <div className="space-y-2">
                {plan.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                  >
                    <FileText size={15} className="text-ivory/40 shrink-0" />
                    <span className="text-sm text-ivory/70 flex-1 truncate">{file.filename}</span>
                    <ExternalLink size={13} className="text-ivory/30 group-hover:text-ivory/60 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ivory/40 uppercase tracking-wide mb-1.5">
        <span className="text-primary-pink/70">{icon}</span>
        {label}
      </div>
      <p className="text-sm text-ivory/70">{value}</p>
    </div>
  );
}

export default function NutritionPage() {
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [plans,   setPlans]   = useState<PortalNutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    getOwnNutritionPlans(profile.id).then((data) => {
      setPlans(data);
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

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "خطط التغذية" : "My Nutrition Plans"}
      </h1>

      {plans.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-white/3 border border-white/8 rounded-2xl px-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Utensils className="text-emerald-400/60" size={26} />
          </div>
          <h3 className="font-heading text-base font-semibold text-ivory mb-2">
            {isAr ? "لا توجد خطط تغذية بعد" : "No nutrition plans yet"}
          </h3>
          <p className="text-sm text-ivory/40 max-w-xs">
            {isAr
              ? "سيقوم أخصائي التغذية بمشاركة خطتك الغذائية هنا بعد موعدك."
              : "Your nutritionist will share your personalised meal plan here after your consultation."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => <PlanCard key={plan.id} plan={plan} isAr={isAr} />)}
        </div>
      )}
    </div>
  );
}
