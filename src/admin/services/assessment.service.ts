/**
 * assessment.service.ts — SHELAN Admin Portal
 *
 * Pure functions: no side effects, no imports from repositories.
 * Input:  raw answers from AssessmentWizard (Record<string, string | string[]>)
 * Output: AssessmentResult — score, risk, plan, recommendation, diagnosis
 *
 * Supabase-ready: replace nothing here. The service is logic-only.
 * The repositories call this service and then persist the result.
 */

import type { RiskLevel, Gender } from "@/admin/data/clients";

// ─── Country lookup ────────────────────────────────────────────────────────────

const COUNTRY_MAP_EN: Record<string, string> = {
  sa: "Saudi Arabia",    ae: "UAE",           kw: "Kuwait",
  qa: "Qatar",           bh: "Bahrain",       om: "Oman",
  jo: "Jordan",          lb: "Lebanon",       eg: "Egypt",
  uk: "United Kingdom",  us: "United States", ca: "Canada",
  au: "Australia",       other: "Other",
};

const COUNTRY_MAP_AR: Record<string, string> = {
  sa: "المملكة العربية السعودية",   ae: "الإمارات العربية المتحدة",
  kw: "الكويت",                      qa: "قطر",
  bh: "البحرين",                     om: "سلطنة عُمان",
  jo: "الأردن",                      lb: "لبنان",
  eg: "مصر",                         uk: "المملكة المتحدة",
  us: "الولايات المتحدة الأمريكية", ca: "كندا",
  au: "أستراليا",                    other: "أخرى",
};

// ─── Avatar gradient pool ──────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "bg-gradient-to-br from-primary-pink to-soft-pink",
  "bg-gradient-to-br from-lavender-purple to-soft-purple",
  "bg-gradient-to-br from-soft-purple to-deep-purple",
  "bg-gradient-to-br from-primary-pink to-lavender-purple",
  "bg-gradient-to-br from-soft-pink to-primary-pink",
  "bg-gradient-to-br from-deep-purple to-lavender-purple",
  "bg-gradient-to-br from-primary-pink to-soft-purple",
  "bg-gradient-to-br from-lavender-purple to-primary-pink",
];

let gradientIndex = 0;
export function nextAvatarGradient(): string {
  const g = AVATAR_GRADIENTS[gradientIndex % AVATAR_GRADIENTS.length];
  gradientIndex++;
  return g;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AssessmentAnswers = Record<string, string | string[]>;

export interface AssessmentResult {
  /** 0–100, higher = healthier */
  score: number;
  /** 0–100, inverse of score-related factor */
  riskPercentage: number;
  riskLevel: RiskLevel;
  diagnosisCategory: string;
  diagnosisCategoryAr: string;
  /** Recommended nutrition plan label */
  planEn: string;
  planAr: string;
  /** Short recommendation sentence for the summary */
  recommendation: string;
  recommendationAr: string;
  /** Derived identity fields for client creation */
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: Gender;
  country: string;
  countryAr: string;
  avatarInitials: string;
  avatarGradient: string;
  bmi: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function str(v: string | string[] | undefined): string {
  if (!v) return "";
  if (Array.isArray(v)) return v[0] ?? "";
  return v;
}

function arr(v: string | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function calcBmi(height: string, weight: string): number | null {
  const h = parseFloat(height);
  const w = parseFloat(weight);
  if (!h || !w || h < 50) return null;
  const hm = h / 100;
  return Math.round((w / (hm * hm)) * 10) / 10;
}

// ─── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Score starts at 100, points are deducted for risk signals.
 * 26 signals across 5 categories.
 */
function computeRawScore(answers: AssessmentAnswers): number {
  let score = 100;

  // ── 1. BMI ──────────────────────────────────────────────────────────────────
  const bmi = calcBmi(str(answers.height), str(answers.weight));
  if (bmi !== null) {
    if      (bmi >= 40)   score -= 30;
    else if (bmi >= 35)   score -= 22;
    else if (bmi >= 30)   score -= 15;
    else if (bmi >= 25)   score -= 8;
    else if (bmi < 18.5)  score -= 6;
  }

  // ── 2. Lifestyle ────────────────────────────────────────────────────────────
  const sleep = parseFloat(str(answers.sleep_hours) || "7");
  if      (sleep < 5)  score -= 12;
  else if (sleep < 6)  score -= 7;
  else if (sleep < 7)  score -= 3;
  else if (sleep > 9)  score -= 4;

  const stress = parseInt(str(answers.stress_level) || "5", 10);
  if      (stress >= 9)  score -= 14;
  else if (stress >= 7)  score -= 9;
  else if (stress >= 5)  score -= 4;

  switch (str(answers.physical_activity)) {
    case "sedentary": score -= 12; break;
    case "light":     score -= 6;  break;
    case "moderate":  score -= 0;  break;
    case "very-active": score += 4; break; // bonus for very active
  }

  switch (str(answers.water_intake)) {
    case "less-1l": score -= 8; break;
    case "1-2l":    score -= 3; break;
    case "2-3l":    score -= 0; break;
    case "more-3l": score += 2; break;
  }

  switch (str(answers.smoking)) {
    case "smoker":        score -= 14; break;
    case "former-smoker": score -= 4;  break;
  }

  switch (str(answers.working_style)) {
    case "desk":  score -= 4; break;
    case "mixed": score -= 1; break;
  }

  // ── 3. Nutrition ────────────────────────────────────────────────────────────
  switch (str(answers.sugar_intake)) {
    case "heavy":    score -= 14; break;
    case "daily":    score -= 8;  break;
    case "moderate": score -= 3;  break;
  }

  switch (str(answers.fast_food)) {
    case "daily":     score -= 14; break;
    case "3-4-week":  score -= 8;  break;
    case "1-2-week":  score -= 3;  break;
  }

  switch (str(answers.soft_drinks)) {
    case "multiple": score -= 12; break;
    case "daily":    score -= 6;  break;
    case "rarely":   score -= 1;  break;
  }

  switch (str(answers.vegetables)) {
    case "rarely":    score -= 10; break;
    case "sometimes": score -= 5;  break;
    case "daily":     score -= 0;  break;
    case "every-meal": score += 2; break;
  }

  switch (str(answers.protein_intake)) {
    case "low":      score -= 7; break;
    case "moderate": score -= 2; break;
  }

  // ── 4. Health history ───────────────────────────────────────────────────────
  const conditions = arr(answers.health_conditions);
  if (conditions.includes("chronic-diseases"))      score -= 7;
  if (conditions.includes("pcos"))                  score -= 6;
  if (conditions.includes("thyroid"))               score -= 5;
  if (conditions.includes("ibs"))                   score -= 4;
  if (conditions.includes("previous-diagnosis"))    score -= 3;
  if (conditions.includes("current-medications"))   score -= 2;
  if (conditions.includes("previous-surgeries"))    score -= 2;
  if (conditions.includes("pregnancy-breastfeeding")) score -= 1;
  if (conditions.includes("food-allergies"))        score -= 1;

  // ── 5. Lipedema symptoms ────────────────────────────────────────────────────
  const symptoms = arr(answers.lipedema_symptoms).filter((s) => s !== "none");
  score -= clamp(symptoms.length * 4, 0, 20);
  if (symptoms.includes("family-history")) score -= 5;

  return clamp(score, 0, 100);
}

// ─── Risk level ────────────────────────────────────────────────────────────────

function scoreToRisk(score: number): RiskLevel {
  if (score >= 68) return "Low";
  if (score >= 45) return "Medium";
  return "High";
}

// ─── Plan assignment ───────────────────────────────────────────────────────────

interface PlanResult {
  planEn: string;
  planAr: string;
}

function assignPlan(answers: AssessmentAnswers, bmi: number | null, risk: RiskLevel): PlanResult {
  const goals     = arr(answers.main_goal);
  const conditions = arr(answers.health_conditions);
  const symptoms  = arr(answers.lipedema_symptoms).filter((s) => s !== "none");
  const hasLipedema = goals.includes("lipedema-support") || symptoms.length >= 3;

  if (hasLipedema) return { planEn: "Lipedema Care",     planAr: "رعاية الليبيديما"  };
  if (goals.includes("hormonal-balance") || conditions.includes("pcos"))
    return { planEn: "Hormonal Balance", planAr: "التوازن الهرموني" };
  if (conditions.includes("chronic-diseases"))
    return { planEn: "Diabetes Management", planAr: "إدارة السكري" };
  if ((bmi !== null && bmi >= 25) || goals.includes("lose-weight"))
    return { planEn: "Weight Management", planAr: "إدارة الوزن" };
  if (goals.includes("anti-inflammatory"))
    return { planEn: "Anti-inflammatory Protocol", planAr: "بروتوكول مضاد للالتهابات" };
  return { planEn: "General Nutrition", planAr: "تغذية عامة" };
}

// ─── Diagnosis category ────────────────────────────────────────────────────────

function buildDiagnosis(answers: AssessmentAnswers, risk: RiskLevel, bmi: number | null): { en: string; ar: string } {
  const conditions = arr(answers.health_conditions);
  const symptoms   = arr(answers.lipedema_symptoms).filter((s) => s !== "none");
  const goals      = arr(answers.main_goal);
  const hasLipedema = goals.includes("lipedema-support") || symptoms.length >= 3;
  const hasDiabetes = conditions.includes("chronic-diseases");
  const hasPcos     = conditions.includes("pcos");

  if (risk === "High") {
    if (hasLipedema && hasDiabetes) return { en: "Lipedema + Metabolic — High Risk",    ar: "ليبيديما + أيضي — خطر مرتفع" };
    if (hasLipedema)                return { en: "Lipedema — High Risk",                ar: "ليبيديما — خطر مرتفع" };
    if (hasDiabetes)                return { en: "Metabolic Syndrome — High Risk",      ar: "متلازمة التمثيل الغذائي — خطر مرتفع" };
    return                               { en: "Complex Health Profile — High Risk",   ar: "ملف صحي معقد — خطر مرتفع" };
  }
  if (risk === "Medium") {
    if (hasPcos)     return { en: "PCOS / Hormonal — Medium Risk",  ar: "تكيس المبايض / هرموني — خطر متوسط" };
    if (hasLipedema) return { en: "Lipedema Screening — Medium Risk", ar: "فحص ليبيديما — خطر متوسط" };
    if (bmi && bmi >= 25) return { en: "Overweight — Medium Risk", ar: "زيادة الوزن — خطر متوسط" };
    return                  { en: "Moderate Health Profile — Medium Risk", ar: "ملف صحي متوسط — خطر متوسط" };
  }
  // Low
  if (bmi && bmi < 25) return { en: "Healthy — Low Risk",      ar: "صحية — خطر منخفض" };
  return                      { en: "Healthy Profile — Low Risk", ar: "ملف صحي سليم — خطر منخفض" };
}

// ─── Recommendation ────────────────────────────────────────────────────────────

function buildRecommendation(risk: RiskLevel, planEn: string): { en: string; ar: string } {
  const base: Record<RiskLevel, { en: string; ar: string }> = {
    High: {
      en: "Urgent nutritional review recommended. A personalised plan will be prioritised for your case.",
      ar: "يُوصى بمراجعة تغذوية عاجلة. ستُعطى أولوية لخطة مخصصة لحالتكِ.",
    },
    Medium: {
      en: "Your profile would benefit from a structured nutrition plan. A consultation is recommended soon.",
      ar: "سيستفيد ملفكِ من خطة تغذية منظمة. يُوصى باستشارة قريبة.",
    },
    Low: {
      en: "Good health profile. A preventive nutrition plan will help you maintain and optimise your wellbeing.",
      ar: "ملف صحي جيد. ستساعدكِ خطة التغذية الوقائية على الحفاظ على صحتكِ وتحسينها.",
    },
  };
  return base[risk];
}

// ─── Gender normalisation ──────────────────────────────────────────────────────

function normaliseGender(v: string): Gender {
  if (v === "male") return "Male";
  return "Female"; // clinic primarily serves female clients; non-binary maps here
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function calculateAssessment(answers: AssessmentAnswers): AssessmentResult {
  const score       = computeRawScore(answers);
  const riskLevel   = scoreToRisk(score);
  const bmi         = calcBmi(str(answers.height), str(answers.weight));
  const diagnosis   = buildDiagnosis(answers, riskLevel, bmi);
  const { planEn, planAr } = assignPlan(answers, bmi, riskLevel);
  const rec         = buildRecommendation(riskLevel, planEn);
  const gender      = normaliseGender(str(answers.gender));
  const countryCode = str(answers.country);
  const name        = str(answers.full_name) || "New Client";
  const riskPercentage = clamp(100 - score + Math.round(Math.random() * 6 - 3), 0, 100);

  return {
    score,
    riskPercentage,
    riskLevel,
    diagnosisCategory:   diagnosis.en,
    diagnosisCategoryAr: diagnosis.ar,
    planEn,
    planAr,
    recommendation:   rec.en,
    recommendationAr: rec.ar,
    fullName:      name,
    email:         str(answers.email),
    phone:         str(answers.phone),
    age:           parseInt(str(answers.age), 10) || 0,
    gender,
    country:       COUNTRY_MAP_EN[countryCode] ?? countryCode,
    countryAr:     COUNTRY_MAP_AR[countryCode] ?? countryCode,
    avatarInitials: initials(name),
    avatarGradient: nextAvatarGradient(),
    bmi,
  };
}
