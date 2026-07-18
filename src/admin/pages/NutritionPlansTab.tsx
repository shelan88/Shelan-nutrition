/**
 * NutritionPlansTab — Client Profile › Nutrition Plans tab
 *
 * Features:
 *  • List active / draft / previous plans with status badges
 *  • Create Plan (modal with Overview | Meals | Additional tabs)
 *  • Edit Plan (creates a new version — old version preserved)
 *  • Duplicate Plan, Archive Plan, Delete Draft
 *  • Version History modal
 *  • File management modal (upload PDF / images / documents)
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, BookOpen, Edit2, Copy, Archive, Trash2, History,
  ChevronDown, ChevronUp, X, Save, Loader2, Upload, FileText,
  Image as ImageIcon, File as FileIcon, Paperclip, RotateCcw,
  Droplets, Footprints, Dumbbell, Pill, ClipboardList,
  Sun, Sunset, Moon, Coffee, Apple, UtensilsCrossed,
  Download, AlertTriangle, CheckCircle,
} from "lucide-react";
import {
  getClientNutritionPlans,
  getNutritionPlanHistory,
  getPlanFiles,
  createNutritionPlan,
  updateNutritionPlan,
  setNutritionPlanStatus,
  duplicateNutritionPlan,
  deleteNutritionPlan,
  uploadPlanFile,
  deletePlanFile,
  MEAL_SLOTS,
} from "@/admin/repositories/nutrition-plans.repository";
import type {
  NutritionPlanRow,
  NutritionPlanFileRow,
  MealsMap,
  MealSlot,
  MealSlotKey,
} from "@/admin/repositories/nutrition-plans.repository";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  NutritionPlanRow["status"],
  { en: string; ar: string; badge: string; dot: string }
> = {
  active:    { en: "Active",    ar: "نشطة",     badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500 animate-pulse" },
  draft:     { en: "Draft",     ar: "مسودة",    badge: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",          dot: "bg-blue-400"                  },
  completed: { en: "Completed", ar: "مكتملة",   badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",    dot: "bg-purple-500"                },
  archived:  { en: "Archived",  ar: "مؤرشفة",   badge: "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)]", dot: "bg-[var(--admin-text-faint)]" },
};

const MEAL_ICONS: Record<MealSlotKey, React.ElementType> = {
  breakfast:       Sun,
  morning_snack:   Coffee,
  lunch:           UtensilsCrossed,
  afternoon_snack: Apple,
  dinner:          Sunset,
  evening_snack:   Moon,
};

const EMPTY_MEAL: MealSlot = { title: "", description: "", instructions: "", notes: "" };

const EMPTY_FORM = {
  name:                       "",
  description:                "",
  status:                     "draft" as NutritionPlanRow["status"],
  start_date:                 "",
  end_date:                   "",
  meals:                      {} as MealsMap,
  water_intake_goal:          "",
  steps_goal:                 "",
  exercise_recommendations:   "",
  supplement_recommendations: "",
  general_instructions:       "",
};

type EditorTab = "overview" | "meals" | "additional";
type ModalKind = "editor" | "history" | "files";

// ─── Utility ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return d; }
}

function fmtSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hasMealContent(meal: MealSlot | undefined): boolean {
  if (!meal) return false;
  return !!(meal.title || meal.description || meal.instructions || meal.notes);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyPlans({ isAr, onCreate }: { isAr: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
        <BookOpen size={28} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
      </div>
      <div>
        <p className="text-[15px] font-bold text-[var(--admin-text)]">
          {isAr ? "لا توجد خطط غذائية بعد" : "No nutrition plans yet"}
        </p>
        <p className="text-[12.5px] text-[var(--admin-text-muted)] mt-1 max-w-sm leading-relaxed">
          {isAr
            ? "أنشئي أول خطة غذائية لهذا العميل لبدء تتبع تقدمه الغذائي."
            : "Create the first nutrition plan for this client to start tracking their dietary progress."}
        </p>
      </div>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus size={13} strokeWidth={2.5} />
        {isAr ? "إنشاء خطة" : "Create Plan"}
      </button>
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-3">
      {label}
    </p>
  );
}

interface PlanCardProps {
  plan: NutritionPlanRow;
  isAr: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onStatusChange: (status: NutritionPlanRow["status"]) => void;
  onDelete: () => void;
  onHistory: () => void;
  onFiles: () => void;
  hasHistory: boolean;
}

function PlanCard({
  plan, isAr, onEdit, onDuplicate, onStatusChange, onDelete, onHistory, onFiles, hasHistory,
}: PlanCardProps) {
  const meta = STATUS_META[plan.status];
  const filledMeals = MEAL_SLOTS.filter((s) => hasMealContent((plan.meals as MealsMap)?.[s.key]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        border border-[var(--admin-border)] rounded-xl p-4
        hover:bg-[var(--admin-hover-bg)] hover:shadow-sm transition-all duration-200
      "
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen size={15} strokeWidth={1.8} className="text-emerald-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-[14px] font-bold text-[var(--admin-text)] leading-tight">{plan.name}</p>
            <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
              {isAr ? meta.ar : meta.en}
            </span>
            {plan.version > 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]">
                v{plan.version}
              </span>
            )}
          </div>

          {plan.description && (
            <p className="text-[12px] text-[var(--admin-text-muted)] leading-relaxed line-clamp-2 mb-2">
              {plan.description}
            </p>
          )}

          {/* Date + meals row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-[var(--admin-text-faint)]">
            {(plan.start_date || plan.end_date) && (
              <span>
                {fmtDate(plan.start_date)} → {fmtDate(plan.end_date)}
              </span>
            )}
            {filledMeals.length > 0 && (
              <span>
                {filledMeals.length}{isAr ? " وجبات" : " meals"}
              </span>
            )}
            <span>
              {isAr ? "آخر تحديث: " : "Updated "}{fmtDate(plan.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--admin-border)]">
        {/* Edit */}
        <ActionButton icon={Edit2} label={isAr ? "تعديل" : "Edit"} onClick={onEdit} variant="primary" />

        {/* Files */}
        <ActionButton icon={Paperclip} label={isAr ? "الملفات" : "Files"} onClick={onFiles} />

        {/* Duplicate */}
        <ActionButton icon={Copy} label={isAr ? "نسخ" : "Duplicate"} onClick={onDuplicate} />

        {/* History (only if more than 1 version) */}
        {hasHistory && (
          <ActionButton icon={History} label={isAr ? "السجل" : "History"} onClick={onHistory} />
        )}

        {/* Status transitions */}
        {plan.status === "draft" && (
          <ActionButton
            icon={CheckCircle}
            label={isAr ? "تفعيل" : "Activate"}
            onClick={() => onStatusChange("active")}
            variant="success"
          />
        )}
        {plan.status === "active" && (
          <ActionButton
            icon={Archive}
            label={isAr ? "إكمال" : "Complete"}
            onClick={() => onStatusChange("completed")}
          />
        )}
        {plan.status === "active" && (
          <ActionButton
            icon={Archive}
            label={isAr ? "أرشفة" : "Archive"}
            onClick={() => onStatusChange("archived")}
          />
        )}
        {(plan.status === "archived" || plan.status === "completed") && (
          <ActionButton
            icon={RotateCcw}
            label={isAr ? "استعادة" : "Restore"}
            onClick={() => onStatusChange("draft")}
          />
        )}

        {/* Delete — only draft */}
        {plan.status === "draft" && (
          <ActionButton
            icon={Trash2}
            label={isAr ? "حذف" : "Delete"}
            onClick={onDelete}
            variant="danger"
          />
        )}
      </div>
    </motion.div>
  );
}

function ActionButton({
  icon: Icon, label, onClick, variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "danger";
}) {
  const cls = {
    default: "text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)]",
    primary: "text-primary-pink hover:bg-primary-pink/8",
    success: "text-emerald-600 hover:bg-emerald-50",
    danger:  "text-red-500 hover:bg-red-50",
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11.5px] font-semibold transition-all ${cls}`}
    >
      <Icon size={11} strokeWidth={2} />
      {label}
    </button>
  );
}

// ─── Plan Editor Modal ─────────────────────────────────────────────────────────

interface PlanEditorProps {
  plan: NutritionPlanRow | null;  // null = creating new
  clientId: string;
  isAr: boolean;
  onSave: (saved: NutritionPlanRow) => void;
  onClose: () => void;
}

function PlanEditor({ plan, clientId, isAr, onSave, onClose }: PlanEditorProps) {
  const [tab, setTab] = useState<EditorTab>("overview");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<MealSlotKey | null>(null);

  // Form state
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(plan ? {
      name:                       plan.name,
      description:                plan.description ?? "",
      status:                     plan.status,
      start_date:                 plan.start_date ?? "",
      end_date:                   plan.end_date ?? "",
      meals:                      (plan.meals as MealsMap) ?? {},
      water_intake_goal:          plan.water_intake_goal ?? "",
      steps_goal:                 plan.steps_goal ?? "",
      exercise_recommendations:   plan.exercise_recommendations ?? "",
      supplement_recommendations: plan.supplement_recommendations ?? "",
      general_instructions:       plan.general_instructions ?? "",
    } : {}),
  });

  function setMeal(key: MealSlotKey, field: keyof MealSlot, value: string) {
    setForm((f) => ({
      ...f,
      meals: {
        ...f.meals,
        [key]: { ...(f.meals[key] ?? EMPTY_MEAL), [field]: value },
      },
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError(isAr ? "اسم الخطة مطلوب" : "Plan name is required");
      setTab("overview");
      return;
    }
    setSaving(true);
    setError(null);

    let saved: NutritionPlanRow | null;
    if (!plan) {
      saved = await createNutritionPlan({ ...form, client_id: clientId });
    } else {
      saved = await updateNutritionPlan(plan, form);
    }

    setSaving(false);
    if (!saved) {
      setError(isAr ? "حدث خطأ أثناء الحفظ، حاولي مجدداً." : "Save failed — please try again.");
      return;
    }
    onSave(saved);
  }

  const editorTabs: { id: EditorTab; en: string; ar: string }[] = [
    { id: "overview",    en: "Overview",    ar: "نظرة عامة"    },
    { id: "meals",       en: "Meals",       ar: "الوجبات"       },
    { id: "additional",  en: "Additional",  ar: "إضافي"          },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2 }}
        className="
          relative w-full max-w-2xl max-h-[90vh] flex flex-col
          bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]
          shadow-2xl shadow-black/20 overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--admin-border)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <BookOpen size={14} strokeWidth={1.8} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[var(--admin-text)] leading-tight">
              {plan
                ? (isAr ? "تعديل الخطة الغذائية" : "Edit Nutrition Plan")
                : (isAr ? "إنشاء خطة غذائية" : "Create Nutrition Plan")}
            </p>
            {plan && plan.version > 0 && (
              <p className="text-[11px] text-[var(--admin-text-faint)]">
                {isAr
                  ? `سيتم حفظ الإصدار الجديد (v${plan.version + 1}) مع الاحتفاظ بالإصدار القديم`
                  : `Saves as v${plan.version + 1} — previous version preserved in history`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Editor tabs */}
        <div className="flex border-b border-[var(--admin-border)] shrink-0 overflow-x-auto scrollbar-none">
          {editorTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                flex-shrink-0 px-5 py-3 text-[12.5px] font-semibold border-b-2 transition-all whitespace-nowrap
                ${tab === t.id
                  ? "border-primary-pink text-primary-pink"
                  : "border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)]"}
              `}
            >
              {isAr ? t.ar : t.en}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Plan name */}
              <Field label={isAr ? "اسم الخطة *" : "Plan Name *"}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isAr ? "مثال: خطة ضبط الوزن" : "e.g. Weight Management Phase 1"}
                  className="form-input"
                />
              </Field>

              {/* Description */}
              <Field label={isAr ? "وصف" : "Description"}>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={isAr ? "نبذة عن الخطة..." : "Brief overview of the plan..."}
                  className="form-input resize-none"
                />
              </Field>

              {/* Status */}
              <Field label={isAr ? "الحالة" : "Status"}>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NutritionPlanRow["status"] }))}
                  className="form-input"
                >
                  <option value="draft">{isAr ? "مسودة" : "Draft"}</option>
                  <option value="active">{isAr ? "نشطة" : "Active"}</option>
                  <option value="completed">{isAr ? "مكتملة" : "Completed"}</option>
                  <option value="archived">{isAr ? "مؤرشفة" : "Archived"}</option>
                </select>
              </Field>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={isAr ? "تاريخ البدء" : "Start Date"}>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="form-input"
                  />
                </Field>
                <Field label={isAr ? "تاريخ الانتهاء" : "End Date"}>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="form-input"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Meals tab ── */}
          {tab === "meals" && (
            <div className="space-y-2">
              <p className="text-[12px] text-[var(--admin-text-muted)] mb-4 leading-relaxed">
                {isAr
                  ? "أضيفي تفاصيل كل وجبة. يمكنك توسيع أي وجبة للتعديل عليها."
                  : "Add details for each meal. Expand any meal slot to edit it."}
              </p>
              {MEAL_SLOTS.map((slot) => {
                const meal = form.meals[slot.key] ?? EMPTY_MEAL;
                const filled = hasMealContent(meal);
                const isExpanded = expandedMeal === slot.key;
                const Icon = MEAL_ICONS[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="border border-[var(--admin-border)] rounded-xl overflow-hidden"
                  >
                    {/* Slot header */}
                    <button
                      onClick={() => setExpandedMeal(isExpanded ? null : slot.key)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--admin-hover-bg)] transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${filled ? "bg-emerald-50" : "bg-[var(--admin-hover-bg)]"}`}>
                        <Icon size={14} strokeWidth={1.8} className={filled ? "text-emerald-600" : "text-[var(--admin-text-faint)]"} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-tight">
                          {isAr ? slot.ar : slot.en}
                        </p>
                        {filled && meal.title && (
                          <p className="text-[11px] text-[var(--admin-text-faint)] truncate">{meal.title}</p>
                        )}
                        {!filled && (
                          <p className="text-[11px] text-[var(--admin-text-faint)]">
                            {isAr ? "غير محدد" : "Not specified"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {filled && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-[var(--admin-text-faint)]" />
                        ) : (
                          <ChevronDown size={14} className="text-[var(--admin-text-faint)]" />
                        )}
                      </div>
                    </button>

                    {/* Expanded meal fields */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-[var(--admin-border)]"
                        >
                          <div className="p-4 space-y-3 bg-[var(--admin-hover-bg)]/50">
                            <Field label={isAr ? "العنوان" : "Meal Title"}>
                              <input
                                value={meal.title}
                                onChange={(e) => setMeal(slot.key, "title", e.target.value)}
                                placeholder={isAr ? "مثال: عصيدة الشوفان بالموز" : "e.g. Oatmeal with banana"}
                                className="form-input"
                              />
                            </Field>
                            <Field label={isAr ? "الوصف" : "Description"}>
                              <textarea
                                rows={2}
                                value={meal.description}
                                onChange={(e) => setMeal(slot.key, "description", e.target.value)}
                                placeholder={isAr ? "تفاصيل الوجبة..." : "Meal composition and details..."}
                                className="form-input resize-none"
                              />
                            </Field>
                            <Field label={isAr ? "التعليمات" : "Instructions"}>
                              <textarea
                                rows={3}
                                value={meal.instructions}
                                onChange={(e) => setMeal(slot.key, "instructions", e.target.value)}
                                placeholder={isAr ? "خطوات التحضير..." : "Preparation steps..."}
                                className="form-input resize-none"
                              />
                            </Field>
                            <Field label={isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}>
                              <input
                                value={meal.notes}
                                onChange={(e) => setMeal(slot.key, "notes", e.target.value)}
                                placeholder={isAr ? "بدائل مقترحة، تحذيرات..." : "Suggested alternatives, alerts..."}
                                className="form-input"
                              />
                            </Field>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Additional tab ── */}
          {tab === "additional" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={isAr ? "هدف شرب الماء اليومي" : "Daily Water Intake Goal"}
                  icon={Droplets}
                >
                  <input
                    value={form.water_intake_goal}
                    onChange={(e) => setForm((f) => ({ ...f, water_intake_goal: e.target.value }))}
                    placeholder={isAr ? "مثال: 2.5 لتر يومياً" : "e.g. 2.5 litres per day"}
                    className="form-input"
                  />
                </Field>

                <Field
                  label={isAr ? "هدف الخطوات اليومية" : "Daily Steps Goal"}
                  icon={Footprints}
                >
                  <input
                    value={form.steps_goal}
                    onChange={(e) => setForm((f) => ({ ...f, steps_goal: e.target.value }))}
                    placeholder={isAr ? "مثال: 8,000 خطوة يومياً" : "e.g. 8,000 steps per day"}
                    className="form-input"
                  />
                </Field>
              </div>

              <Field
                label={isAr ? "توصيات التمارين الرياضية" : "Exercise Recommendations"}
                icon={Dumbbell}
              >
                <textarea
                  rows={3}
                  value={form.exercise_recommendations}
                  onChange={(e) => setForm((f) => ({ ...f, exercise_recommendations: e.target.value }))}
                  placeholder={isAr ? "أنواع التمارين، التكرار، المدة..." : "Types of exercise, frequency, duration..."}
                  className="form-input resize-none"
                />
              </Field>

              <Field
                label={isAr ? "توصيات المكملات الغذائية" : "Supplement Recommendations"}
                icon={Pill}
              >
                <textarea
                  rows={3}
                  value={form.supplement_recommendations}
                  onChange={(e) => setForm((f) => ({ ...f, supplement_recommendations: e.target.value }))}
                  placeholder={isAr ? "نوع المكمل، الجرعة، وقت التناول..." : "Supplement name, dosage, timing..."}
                  className="form-input resize-none"
                />
              </Field>

              <Field
                label={isAr ? "تعليمات عامة" : "General Instructions"}
                icon={ClipboardList}
              >
                <textarea
                  rows={4}
                  value={form.general_instructions}
                  onChange={(e) => setForm((f) => ({ ...f, general_instructions: e.target.value }))}
                  placeholder={isAr ? "إرشادات التغذية العامة، نمط الحياة..." : "General dietary guidelines, lifestyle advice..."}
                  className="form-input resize-none"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--admin-border)] shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-red-600 flex-1">
              <AlertTriangle size={13} strokeWidth={2} />
              {error}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 rounded-xl text-[12.5px] font-semibold text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors disabled:opacity-50"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} strokeWidth={2} />
              )}
              {saving
                ? (isAr ? "جارٍ الحفظ..." : "Saving...")
                : (isAr ? "حفظ الخطة" : "Save Plan")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

function HistoryModal({
  plan, isAr, onClose, onRestoreVersion,
}: {
  plan: NutritionPlanRow;
  isAr: boolean;
  onClose: () => void;
  onRestoreVersion: (version: NutritionPlanRow) => void;
}) {
  const [versions, setVersions] = useState<NutritionPlanRow[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getNutritionPlanHistory(plan.plan_group_id).then((v) => {
      setVersions(v);
      setLoading(false);
    });
  }, [plan.plan_group_id]);

  return (
    <ModalShell title={isAr ? "سجل الإصدارات" : "Version History"} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[var(--admin-text-faint)]" />
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v, i) => {
            const isCurrent = i === 0;
            return (
              <div
                key={v.id}
                className={`
                  flex items-center gap-3 p-3.5 rounded-xl border transition-colors
                  ${isCurrent
                    ? "border-primary-pink/30 bg-primary-pink/[0.03]"
                    : "border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)]"}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                  ${isCurrent ? "bg-primary-pink text-white" : "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)]"}
                `}>
                  v{v.version}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-tight">
                    {isCurrent ? (isAr ? "الإصدار الحالي" : "Current version") : v.name}
                  </p>
                  <p className="text-[11px] text-[var(--admin-text-faint)]">
                    {fmtDate(v.created_at)}
                    {" · "}
                    {isAr
                      ? STATUS_META[v.status].ar
                      : STATUS_META[v.status].en}
                  </p>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => onRestoreVersion(v)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold text-primary-pink hover:bg-primary-pink/8 transition-colors"
                  >
                    <RotateCcw size={11} strokeWidth={2} />
                    {isAr ? "استعادة" : "Restore"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

// ─── Files Modal ──────────────────────────────────────────────────────────────

function FilesModal({
  plan, clientId, isAr, onClose,
}: {
  plan: NutritionPlanRow;
  clientId: string;
  isAr: boolean;
  onClose: () => void;
}) {
  const [files, setFiles]       = useState<NutritionPlanFileRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPlanFiles(plan.id).then((f) => { setFiles(f); setLoading(false); });
  }, [plan.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadPlanFile(plan.id, clientId, file);
    if (result) setFiles((prev) => [result, ...prev]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(f: NutritionPlanFileRow) {
    if (!window.confirm(isAr ? "هل تريدين حذف هذا الملف؟" : "Delete this file?")) return;
    const ok = await deletePlanFile(f.id, f.url);
    if (ok) setFiles((prev) => prev.filter((x) => x.id !== f.id));
  }

  const fileIcon = (type: NutritionPlanFileRow["file_type"]) =>
    type === "image" ? ImageIcon : type === "pdf" ? FileText : FileIcon;

  return (
    <ModalShell
      title={isAr ? "ملفات الخطة" : "Plan Files"}
      subtitle={plan.name}
      onClose={onClose}
    >
      {/* Upload zone */}
      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx,.csv"
          onChange={handleUpload}
          className="hidden"
          id="plan-file-upload"
        />
        <label
          htmlFor="plan-file-upload"
          className={`
            flex items-center gap-3 w-full border-2 border-dashed rounded-xl p-4
            cursor-pointer transition-colors text-center justify-center
            ${uploading
              ? "border-[var(--admin-border)] opacity-60 pointer-events-none"
              : "border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-primary-pink/[0.02]"}
          `}
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin text-[var(--admin-text-faint)]" />
          ) : (
            <Upload size={15} strokeWidth={1.8} className="text-[var(--admin-text-faint)]" />
          )}
          <span className="text-[12.5px] text-[var(--admin-text-muted)] font-medium">
            {uploading
              ? (isAr ? "جارٍ الرفع..." : "Uploading...")
              : (isAr ? "اضغطي لرفع ملف (PDF، صورة، مستند)" : "Click to upload (PDF, image, document)")}
          </span>
        </label>
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-[var(--admin-text-faint)]" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Paperclip size={22} strokeWidth={1.3} className="text-[var(--admin-text-faint)]" />
          <p className="text-[12.5px] text-[var(--admin-text-muted)]">
            {isAr ? "لا توجد ملفات مرفوعة بعد" : "No files uploaded yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = fileIcon(f.file_type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--admin-border)] hover:bg-[var(--admin-hover-bg)] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
                  <Icon size={13} strokeWidth={1.8} className="text-[var(--admin-text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-[var(--admin-text)] truncate">{f.filename}</p>
                  <p className="text-[11px] text-[var(--admin-text-faint)]">
                    {f.file_type.toUpperCase()}
                    {f.size ? ` · ${fmtSize(f.size)}` : ""}
                    {" · "}{fmtDate(f.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/8 transition-all"
                    title={isAr ? "تنزيل" : "Download"}
                  >
                    <Download size={12} strokeWidth={2} />
                  </a>
                  <button
                    onClick={() => handleDelete(f)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-red-500 hover:bg-red-50 transition-all"
                    title={isAr ? "حذف" : "Delete"}
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

// ─── Generic modal shell ─────────────────────────────────────────────────────

function ModalShell({
  title, subtitle, onClose, children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="
          relative w-full max-w-lg max-h-[80vh] flex flex-col
          bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)]
          shadow-2xl shadow-black/20 overflow-hidden
        "
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--admin-border)] shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[var(--admin-text)]">{title}</p>
            {subtitle && <p className="text-[11.5px] text-[var(--admin-text-faint)] truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, icon: Icon, children,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
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

// ─── Main exported component ──────────────────────────────────────────────────

interface NutritionPlansTabProps {
  clientId: string;
  isAr: boolean;
  onCountChange?: (activePlans: number) => void;
}

export default function NutritionPlansTab({
  clientId, isAr, onCountChange,
}: NutritionPlansTabProps) {
  const [plans, setPlans]         = useState<NutritionPlanRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState<ModalKind | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlanRow | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<string, number>>({});

  // Load plans + check which have version > 1
  async function loadPlans() {
    setLoading(true);
    const data = await getClientNutritionPlans(clientId);
    setPlans(data);

    // Check which plan groups have history (version > 1) without full fetches
    const map: Record<string, number> = {};
    for (const p of data) {
      map[p.plan_group_id] = p.version;
    }
    setHistoryMap(map);

    onCountChange?.(data.filter((p) => p.status === "active").length);
    setLoading(false);
  }

  useEffect(() => { loadPlans(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setSelectedPlan(null);
    setModal("editor");
  }

  function openEdit(plan: NutritionPlanRow) {
    setSelectedPlan(plan);
    setModal("editor");
  }

  function openHistory(plan: NutritionPlanRow) {
    setSelectedPlan(plan);
    setModal("history");
  }

  function openFiles(plan: NutritionPlanRow) {
    setSelectedPlan(plan);
    setModal("files");
  }

  function closeModal() {
    setModal(null);
    setSelectedPlan(null);
  }

  async function handleSaved(saved: NutritionPlanRow) {
    closeModal();
    await loadPlans();
    // If this was an edit (new version), the old plan row still exists — handled by loadPlans
    void saved;
  }

  async function handleStatusChange(plan: NutritionPlanRow, status: NutritionPlanRow["status"]) {
    await setNutritionPlanStatus(plan.id, status);
    await loadPlans();
  }

  async function handleDuplicate(plan: NutritionPlanRow) {
    await duplicateNutritionPlan(plan, clientId);
    await loadPlans();
  }

  async function handleDelete(plan: NutritionPlanRow) {
    if (!window.confirm(
      isAr ? "هل تريدين حذف هذه المسودة؟ لا يمكن التراجع." : "Delete this draft? This cannot be undone."
    )) return;
    await deleteNutritionPlan(plan.id);
    await loadPlans();
  }

  async function handleRestoreVersion(version: NutritionPlanRow) {
    // "Restore" = create a new version (latest) that is a copy of this historical version
    const restored = await updateNutritionPlan(
      // We need the current latest plan for the group
      plans.find((p) => p.plan_group_id === version.plan_group_id) ?? version,
      {
        name:                       version.name,
        description:                version.description ?? "",
        status:                     "draft",
        start_date:                 version.start_date ?? "",
        end_date:                   version.end_date ?? "",
        meals:                      (version.meals as MealsMap) ?? {},
        water_intake_goal:          version.water_intake_goal ?? "",
        steps_goal:                 version.steps_goal ?? "",
        exercise_recommendations:   version.exercise_recommendations ?? "",
        supplement_recommendations: version.supplement_recommendations ?? "",
        general_instructions:       version.general_instructions ?? "",
      },
    );
    if (restored) {
      closeModal();
      await loadPlans();
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)]" />
        ))}
      </div>
    );
  }

  // Partition plans into sections
  const activePlans    = plans.filter((p) => p.status === "active");
  const draftPlans     = plans.filter((p) => p.status === "draft");
  const previousPlans  = plans.filter((p) => p.status === "completed" || p.status === "archived");

  const planCardProps = (plan: NutritionPlanRow) => ({
    plan,
    isAr,
    onEdit:         () => openEdit(plan),
    onDuplicate:    () => handleDuplicate(plan),
    onStatusChange: (s: NutritionPlanRow["status"]) => handleStatusChange(plan, s),
    onDelete:       () => handleDelete(plan),
    onHistory:      () => openHistory(plan),
    onFiles:        () => openFiles(plan),
    hasHistory:     (historyMap[plan.plan_group_id] ?? 1) > 1,
  });

  return (
    <>
      {/* ── Tab header ── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[14px] font-bold text-[var(--admin-text)]">
            {isAr ? "الخطط الغذائية" : "Nutrition Plans"}
          </p>
          <p className="text-[11.5px] text-[var(--admin-text-faint)]">
            {plans.length === 0
              ? (isAr ? "لا توجد خطط بعد" : "No plans yet")
              : `${plans.length} ${isAr ? "خطة" : plans.length === 1 ? "plan" : "plans"}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary-pink text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={13} strokeWidth={2.5} />
          {isAr ? "خطة جديدة" : "New Plan"}
        </button>
      </div>

      {/* ── Empty state ── */}
      {plans.length === 0 && <EmptyPlans isAr={isAr} onCreate={openCreate} />}

      {/* ── Active plans ── */}
      {activePlans.length > 0 && (
        <div className="mb-5">
          <SectionHeading label={isAr ? "الخطط النشطة" : "Active Plans"} />
          <div className="space-y-3">
            {activePlans.map((p) => <PlanCard key={p.id} {...planCardProps(p)} />)}
          </div>
        </div>
      )}

      {/* ── Draft plans ── */}
      {draftPlans.length > 0 && (
        <div className="mb-5">
          <SectionHeading label={isAr ? "المسودات" : "Drafts"} />
          <div className="space-y-3">
            {draftPlans.map((p) => <PlanCard key={p.id} {...planCardProps(p)} />)}
          </div>
        </div>
      )}

      {/* ── Previous plans ── */}
      {previousPlans.length > 0 && (
        <div>
          <SectionHeading label={isAr ? "الخطط السابقة" : "Previous Plans"} />
          <div className="space-y-3">
            {previousPlans.map((p) => <PlanCard key={p.id} {...planCardProps(p)} />)}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === "editor" && (
          <PlanEditor
            key="editor"
            plan={selectedPlan}
            clientId={clientId}
            isAr={isAr}
            onSave={handleSaved}
            onClose={closeModal}
          />
        )}
        {modal === "history" && selectedPlan && (
          <HistoryModal
            key="history"
            plan={selectedPlan}
            isAr={isAr}
            onClose={closeModal}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
        {modal === "files" && selectedPlan && (
          <FilesModal
            key="files"
            plan={selectedPlan}
            clientId={clientId}
            isAr={isAr}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
