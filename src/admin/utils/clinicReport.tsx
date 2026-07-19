/**
 * clinicReport.tsx — Professional A4 medical PDF for SHELAN Nutrition Clinic.
 *
 * Built with @react-pdf/renderer v4. Generates a fully branded clinic report
 * supporting both Arabic (RTL) and English (LTR).
 *
 * Sections:
 *   1. Client Information
 *   2. Assessment Summary (score arc, risk level, diagnosis)
 *   3. Health Indicators
 *   4. Full Assessment Q&A (all question types, translated labels)
 *   5. Diagnoses
 *   6. Nutrition Plan
 *   7. Consultations
 *   8. Medical Notes
 *
 * Header + Footer repeat on every page. Page numbers included.
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
  Svg,
  Circle,
  Path,
} from "@react-pdf/renderer";

import type {
  Client,
  Consultation,
  NutritionPlan,
} from "@/admin/data/clients";
import type {
  ResponseWithAnswers,
  AnswerWithQuestion,
} from "@/admin/repositories/assessment-responses.repository";

// ─── Font Registration ────────────────────────────────────────────────────────
// Cairo covers Arabic + Latin in a single family.
Font.register({
  family: "Cairo",
  fonts: [
    { src: "/fonts/Cairo-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Cairo-Bold.ttf",    fontWeight: "bold"   },
  ],
});

// Disable hyphenation — breaks Arabic words otherwise.
Font.registerHyphenationCallback((word) => [word]);

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  purple:      "#6c2fa7",
  purpleLight: "#9b59d0",
  pink:        "#e85fa0",
  pinkBorder:  "#f2aed0",
  bg:          "#f7f5fb",
  bgPurple:    "#f0eaff",
  bgPink:      "#fef0f6",
  white:       "#ffffff",
  dark:        "#1c1033",
  muted:       "#5b4e7a",
  faint:       "#9182b8",
  border:      "#ddd6f3",
  borderLight: "#ede8f8",
  green:       "#059669",
  amber:       "#d97706",
  red:         "#dc2626",
  orange:      "#ea580c",
  rowAlt:      "#faf9fd",
  tagGreen:    "#ecfdf5",
  tagAmber:    "#fffbeb",
  tagRed:      "#fef2f2",
  tagOrange:   "#fff7ed",
};

// ─── Public types ─────────────────────────────────────────────────────────────

/** Keys for each toggleable report section. */
export type SectionKey =
  | "clientInfo"
  | "assessmentSummary"
  | "healthIndicators"
  | "diagnoses"
  | "qa"
  | "nutritionPlan"
  | "consultations"
  | "medicalNotes";

export type ReportSections = Record<SectionKey, boolean>;

/** All sections enabled — use as default. */
export const ALL_SECTIONS_ON: ReportSections = {
  clientInfo:        true,
  assessmentSummary: true,
  healthIndicators:  true,
  diagnoses:         true,
  qa:                true,
  nutritionPlan:     true,
  consultations:     true,
  medicalNotes:      true,
};

export interface ReportData {
  client:       Client;
  isAr:         boolean;
  response:     ResponseWithAnswers | null;
  templateName: string;
  logoUrl:      string;
  generatedAt:  string;
  /** Which sections to include. Defaults to all enabled if omitted. */
  sections?:    ReportSections;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function t(en: string, ar: string, isAr: boolean) {
  return isAr ? ar : en;
}

function scoreColor(score: number): string {
  if (score >= 70) return C.green;
  if (score >= 50) return C.amber;
  return C.red;
}

type RiskTheme = { bg: string; text: string; dot: string; label_en: string; label_ar: string };
const RISK_THEMES: Record<string, RiskTheme> = {
  Low:      { bg: C.tagGreen,  text: "#065f46", dot: C.green,  label_en: "Low Risk",      label_ar: "خطر منخفض"    },
  Medium:   { bg: C.tagAmber,  text: "#92400e", dot: C.amber,  label_en: "Medium Risk",   label_ar: "خطر متوسط"    },
  High:     { bg: C.tagOrange, text: "#9a3412", dot: C.orange, label_en: "High Risk",     label_ar: "خطر مرتفع"    },
  Critical: { bg: C.tagRed,    text: "#991b1b", dot: C.red,    label_en: "Critical Risk", label_ar: "خطر حرج"      },
};
const RISK_FALLBACK: RiskTheme = { bg: C.bg, text: C.muted, dot: C.faint, label_en: "Unknown", label_ar: "غير محدد" };

type IndicatorTheme = { dot: string; text: string; bg: string };
const IND_THEMES: Record<string, IndicatorTheme> = {
  normal:   { dot: C.green,  text: "#065f46", bg: C.tagGreen  },
  warning:  { dot: C.amber,  text: "#92400e", bg: C.tagAmber  },
  critical: { dot: C.red,    text: "#991b1b", bg: C.tagRed    },
};
const IND_FALLBACK: IndicatorTheme = { dot: C.faint, text: C.muted, bg: C.bg };

function resolveAnswer(ans: AnswerWithQuestion, isAr: boolean): string {
  const { answer_text, answer_json, question } = ans;
  // Guard: if the question was deleted from the template after the response was
  // submitted, the join returns undefined. Fall back to raw answer text.
  if (!question) return answer_text ?? "—";
  const { type, options } = question;

  if (!answer_text && !answer_json) return "—";

  if (type === "multiple_choice" && Array.isArray(answer_json)) {
    const vals = answer_json as string[];
    const labels = vals.map((v) => {
      const opt = options.find((o) => o.value === v);
      return (isAr && opt?.label_ar) ? opt.label_ar : (opt?.label_en ?? v);
    });
    return labels.join(" · ");
  }

  if ((type === "single_choice" || type === "dropdown") && answer_text) {
    const opt = options.find((o) => o.value === answer_text);
    return (isAr && opt?.label_ar) ? opt.label_ar : (opt?.label_en ?? answer_text);
  }

  if (type === "yes_no") {
    return answer_text === "yes" ? (isAr ? "نعم" : "Yes")
         : answer_text === "no"  ? (isAr ? "لا"  : "No")
         : (answer_text ?? "—");
  }

  return answer_text ?? "—";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Page
  page: {
    fontFamily: "Cairo",
    backgroundColor: C.white,
    paddingTop: 92,
    paddingBottom: 54,
    paddingHorizontal: 44,
  },

  // ── Fixed header ────────────────────────────────────────────────────────────
  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backgroundColor: C.white,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
    paddingHorizontal: 44,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: { width: 34, height: 34, objectFit: "contain" },
  hClinicName: { fontSize: 13, fontWeight: "bold", color: C.purple },
  hClinicSub:  { fontSize: 8.5, color: C.faint, marginTop: 1 },
  hReportTitle:{ fontSize: 8.5, fontWeight: "bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  hDate:       { fontSize: 7.5, color: C.faint, marginTop: 2 },

  // ── Fixed footer ────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingHorizontal: 44,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
  },
  footerText:  { fontSize: 7, color: C.faint },
  footerBrand: { fontSize: 7, color: C.purple, fontWeight: "bold" },

  // ── Section card ────────────────────────────────────────────────────────────
  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  cardHead: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardHeadDot: { width: 4, height: 14, borderRadius: 2 },
  cardTitle: { fontSize: 9, fontWeight: "bold", color: C.purple, textTransform: "uppercase", letterSpacing: 0.8 },
  cardBody: { paddingHorizontal: 14, paddingVertical: 12 },

  // ── Client info grid ────────────────────────────────────────────────────────
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "33.33%", marginBottom: 10 },
  infoCellHalf: { width: "50%", marginBottom: 10 },
  infoCellFull: { width: "100%", marginBottom: 10 },
  infoLabel: { fontSize: 7.5, color: C.faint, marginBottom: 2.5, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 10.5, color: C.dark, fontWeight: "bold" },
  infoValueSub: { fontSize: 9, color: C.muted, marginTop: 1 },

  // ── Assessment summary ──────────────────────────────────────────────────────
  assessmentBg: {
    backgroundColor: C.bgPurple,
    borderRadius: 6,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 0,
  },
  assessRight: { flex: 1 },
  scoreCaption: { fontSize: 7.5, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 3, textAlign: "center" },
  riskBadge: { borderRadius: 30, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 5, flexDirection: "row", alignItems: "center", gap: 5 },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskText: { fontSize: 8.5, fontWeight: "bold" },
  riskPct: { fontSize: 9, color: C.muted, marginBottom: 4 },
  diagLabel: { fontSize: 7.5, color: C.faint, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  diagValue: { fontSize: 10, fontWeight: "bold", color: C.dark },

  // ── Health indicators ───────────────────────────────────────────────────────
  indRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6.5, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  indRowLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6.5 },
  indLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  indDot: { width: 8, height: 8, borderRadius: 4 },
  indLabel: { fontSize: 9.5, color: C.dark },
  indValuePill: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  indValueText: { fontSize: 9, fontWeight: "bold" },

  // ── Q&A ─────────────────────────────────────────────────────────────────────
  qaItem: { paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  qaItemLast: { paddingVertical: 9, paddingHorizontal: 12 },
  qaNum: { fontSize: 7.5, color: C.faint, marginBottom: 2.5, textTransform: "uppercase", letterSpacing: 0.4 },
  qaQuestion: { fontSize: 9.5, fontWeight: "bold", color: C.dark, marginBottom: 4, lineHeight: 1.5 },
  qaAnswer: { fontSize: 10, color: C.purple, fontWeight: "bold", lineHeight: 1.5 },
  qaAnswerEmpty: { fontSize: 9.5, color: C.faint, fontStyle: "italic" },

  // ── Diagnoses ───────────────────────────────────────────────────────────────
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: C.bgPink, borderWidth: 1, borderColor: C.pinkBorder, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 9, color: C.pink, fontWeight: "bold" },

  // ── Nutrition ───────────────────────────────────────────────────────────────
  calRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginBottom: 4 },
  calNum: { fontSize: 26, fontWeight: "bold", color: C.purple },
  calLabel: { fontSize: 9, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 },
  planDates: { fontSize: 8.5, color: C.muted, marginBottom: 10 },
  macroRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  macroCell: { flex: 1, backgroundColor: C.bgPurple, borderRadius: 6, paddingVertical: 8, alignItems: "center" },
  macroNum: { fontSize: 15, fontWeight: "bold", color: C.purple },
  macroUnit: { fontSize: 7.5, color: C.muted },
  macroLabel: { fontSize: 7.5, color: C.faint, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  planNotes: { fontSize: 9.5, color: C.muted, lineHeight: 1.6 },

  // ── Consultations ───────────────────────────────────────────────────────────
  consultCard: { backgroundColor: C.rowAlt, borderRadius: 5, borderWidth: 1, borderColor: C.borderLight, padding: 10, marginBottom: 8 },
  consultMeta: { flexDirection: "row", gap: 6, marginBottom: 5, flexWrap: "wrap" },
  consultBadge: { backgroundColor: C.bgPurple, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  consultBadgeText: { fontSize: 8, color: C.purple, fontWeight: "bold" },
  consultNotes: { fontSize: 9.5, color: C.muted, lineHeight: 1.5 },

  // ── Notes ───────────────────────────────────────────────────────────────────
  notesText: { fontSize: 10, color: C.muted, lineHeight: 1.7 },

  // ── Divider line ────────────────────────────────────────────────────────────
  divider: { borderTopWidth: 1, borderTopColor: C.borderLight, marginVertical: 10 },
});

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, children, isAr, wrap: wrapProp = false }: {
  title: string;
  children: React.ReactNode;
  isAr: boolean;
  wrap?: boolean;
}) {
  return (
    <View style={S.card} wrap={wrapProp}>
      <View style={[S.cardHead, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <View style={[S.cardHeadDot, { backgroundColor: C.purple }]} />
        <Text style={[S.cardTitle, { textAlign: isAr ? "right" : "left" }]}>{title}</Text>
      </View>
      <View style={S.cardBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value, sub, half }: {
  label: string; value: string; sub?: string; half?: boolean;
}) {
  return (
    <View style={half ? S.infoCellHalf : S.infoCell}>
      <Text style={S.infoLabel}>{label}</Text>
      <Text style={S.infoValue}>{value}</Text>
      {sub ? <Text style={S.infoValueSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Score circle (SVG arc) ──────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const cx = 44, cy = 44, r = 33;
  const color = scoreColor(score);
  const pct = Math.min(score / 100, 0.9998);
  const start = -Math.PI / 2;
  const end   = start + pct * 2 * Math.PI;
  const sx = cx + r * Math.cos(start);
  const sy = cy + r * Math.sin(start);
  const ex = cx + r * Math.cos(end);
  const ey = cy + r * Math.sin(end);
  const large = score > 50 ? 1 : 0;
  const d = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;

  return (
    <View style={{ width: 88, height: 88, position: "relative" }}>
      <Svg width={88} height={88} viewBox="0 0 88 88">
        <Circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth={6} fill="none" />
        <Path d={d} stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, width: 88, height: 88, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color, fontFamily: "Cairo" }}>{score}</Text>
      </View>
    </View>
  );
}

// ─── Section 1: Client Information ───────────────────────────────────────────
function ClientInfoSection({ client, isAr }: { client: Client; isAr: boolean }) {
  return (
    <SectionCard title={t("Client Information", "معلومات المريض", isAr)} isAr={isAr}>
      <View style={[S.infoGrid, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <InfoRow label={t("Full Name", "الاسم الكامل", isAr)} value={isAr ? client.fullNameAr : client.fullName} half />
        <InfoRow label={t("Email", "البريد الإلكتروني", isAr)} value={client.email} half />
        <InfoRow label={t("Phone", "الهاتف", isAr)} value={client.phone || "—"} />
        <InfoRow label={t("Gender", "الجنس", isAr)} value={t(client.gender, client.gender === "Female" ? "أنثى" : "ذكر", isAr)} />
        <InfoRow label={t("Age", "العمر", isAr)} value={`${client.age} ${t("years", "سنة", isAr)}`} />
        <InfoRow label={t("Country", "الدولة", isAr)} value={isAr ? client.countryAr : client.country} />
        <InfoRow label={t("Status", "الحالة", isAr)} value={t(client.status, {
          Active: "نشط", Inactive: "غير نشط", Waiting: "في الانتظار", Completed: "مكتمل"
        }[client.status] ?? client.status, isAr)} half />
        <InfoRow label={t("Member Since", "عضو منذ", isAr)} value={client.joinedDate} half />
        {client.currentPlan ? (
          <InfoRow
            label={t("Current Plan", "الخطة الحالية", isAr)}
            value={isAr ? client.currentPlanAr : client.currentPlan}
            half
          />
        ) : null}
        {client.lastAppointment ? (
          <InfoRow label={t("Last Appointment", "آخر موعد", isAr)} value={client.lastAppointment} half />
        ) : null}
      </View>
    </SectionCard>
  );
}

// ─── Section 2: Assessment Summary ───────────────────────────────────────────
function AssessmentSummarySection({
  client, response, isAr,
}: { client: Client; response: ResponseWithAnswers | null; isAr: boolean }) {
  // Prefer live DB data; fall back to CRM summary.
  // Only use client.riskLevel as fallback when the client has a real assessment
  // record — otherwise every new client (riskLevel defaults to "Low" in the DB)
  // would show a spurious "Low Risk" badge with no score or diagnosis.
  const score       = response?.score           ?? client.assessment?.score         ?? null;
  const riskLevel   = response?.risk_level       ?? (client.assessment ? client.riskLevel : null) ?? null;
  const riskPct     = response?.risk_percentage  ?? client.assessment?.riskPercentage ?? null;
  const diagnosis   = isAr
    ? (response?.diagnosis_category_ar ?? client.assessment?.diagnosisCategoryAr ?? "")
    : (response?.diagnosis_category    ?? client.assessment?.diagnosisCategory    ?? "");
  const completedAt = response?.submitted_at
    ? new Date(response.submitted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : client.assessment?.completedDate ?? "";

  if (score === null && !riskLevel && !diagnosis) return null;

  const theme = RISK_THEMES[riskLevel ?? ""] ?? RISK_FALLBACK;

  return (
    <SectionCard title={t("Assessment Summary", "ملخص التقييم", isAr)} isAr={isAr}>
      <View style={[S.assessmentBg, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        {/* Score arc */}
        {score !== null && (
          <View style={{ alignItems: "center" }}>
            <ScoreCircle score={score} />
            <Text style={S.scoreCaption}>{t("Score", "النتيجة", isAr)}</Text>
          </View>
        )}

        {/* Risk + Diagnosis */}
        <View style={S.assessRight}>
          {riskLevel ? (
            <View style={[S.riskBadge, { backgroundColor: theme.bg, flexDirection: isAr ? "row-reverse" : "row" }]}>
              <View style={[S.riskDot, { backgroundColor: theme.dot }]} />
              <Text style={[S.riskText, { color: theme.text }]}>
                {isAr ? theme.label_ar : theme.label_en}
              </Text>
            </View>
          ) : null}

          {riskPct !== null ? (
            <Text style={[S.riskPct, { textAlign: isAr ? "right" : "left" }]}>
              {t("Risk Percentage", "نسبة الخطر", isAr)}: {riskPct}%
            </Text>
          ) : null}

          {diagnosis ? (
            <View>
              <Text style={[S.diagLabel, { textAlign: isAr ? "right" : "left" }]}>
                {t("Diagnosis", "التشخيص", isAr)}
              </Text>
              <Text style={[S.diagValue, { textAlign: isAr ? "right" : "left" }]}>{diagnosis}</Text>
            </View>
          ) : null}

          {completedAt ? (
            <Text style={[{ fontSize: 8, color: C.faint, marginTop: 6 }, { textAlign: isAr ? "right" : "left" }]}>
              {t("Completed", "أُكمل", isAr)}: {completedAt}
            </Text>
          ) : null}
        </View>
      </View>
    </SectionCard>
  );
}

// ─── Section 3: Health Indicators ────────────────────────────────────────────
function HealthIndicatorsSection({ client, isAr }: { client: Client; isAr: boolean }) {
  if (!client.riskIndicators?.length) return null;
  const indicators = client.riskIndicators;

  return (
    <SectionCard title={t("Health Indicators", "المؤشرات الصحية", isAr)} isAr={isAr}>
      {indicators.map((ind, idx) => {
        const theme = IND_THEMES[ind.level] ?? IND_FALLBACK;
        const isLast = idx === indicators.length - 1;
        return (
          <View key={idx} style={[isLast ? S.indRowLast : S.indRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <View style={[S.indLeft, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <View style={[S.indDot, { backgroundColor: theme.dot }]} />
              <Text style={[S.indLabel, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? ind.labelAr : ind.label}
              </Text>
            </View>
            <View style={[S.indValuePill, { backgroundColor: theme.bg }]}>
              <Text style={[S.indValueText, { color: theme.text }]}>{ind.value}</Text>
            </View>
          </View>
        );
      })}
    </SectionCard>
  );
}

// ─── Section 4: Diagnoses ─────────────────────────────────────────────────────
function DiagnosesSection({ client, isAr }: { client: Client; isAr: boolean }) {
  const items = isAr ? client.diagnosesAr : client.diagnoses;
  if (!items?.length) return null;

  return (
    <SectionCard title={t("Diagnoses", "التشخيصات", isAr)} isAr={isAr}>
      <View style={[S.tagRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        {items.map((d, i) => (
          <View key={i} style={S.tag}>
            <Text style={S.tagText}>{d}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

// ─── Section 5: Full Assessment Q&A ──────────────────────────────────────────
function QASection({
  response, templateName, isAr,
}: { response: ResponseWithAnswers; templateName: string; isAr: boolean }) {
  // Filter out answers whose question was deleted from the template after submission.
  // The repository spreads `undefined` into {}, so `a.question` is always a non-null
  // object — checking `!= null` is therefore insufficient.  The reliable signal of a
  // deleted question is that `label_en` (a required TemplateQuestionRow field) is absent.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answers = (response.answers ?? []).filter((a) => !!(a.question as any)?.label_en);
  if (!answers.length) return null;

  return (
    <View style={S.card} wrap>
      {/* Card header — NOT fixed so it stays with its body */}
      <View style={[S.cardHead, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <View style={[S.cardHeadDot, { backgroundColor: C.purple }]} />
        <View style={{ flex: 1 }}>
          <Text style={[S.cardTitle, { textAlign: isAr ? "right" : "left" }]}>
            {t("Assessment Questionnaire", "استبيان التقييم", isAr)}
          </Text>
          {templateName ? (
            <Text style={{ fontSize: 7.5, color: C.faint, marginTop: 1, textAlign: isAr ? "right" : "left" }}>
              {templateName}
            </Text>
          ) : null}
        </View>
        <Text style={{ fontSize: 7.5, color: C.faint }}>
          {answers.length} {t("answers", "إجابات", isAr)}
        </Text>
      </View>

      {/* Q&A items — each one stays together */}
      {answers.map((ans, idx) => {
        const q = ans.question;
        // qLabel must be a string — react-pdf v4 throws if <Text> receives undefined.
        const qLabel   = ((isAr && q.label_ar) ? q.label_ar : q.label_en) ?? "—";
        const ansText  = resolveAnswer(ans, isAr);
        const isLast   = idx === answers.length - 1;

        return (
          <View key={ans.id} style={isLast ? S.qaItemLast : S.qaItem} wrap={false}>
            <Text style={[S.qaNum, { textAlign: isAr ? "right" : "left" }]}>
              {t(`Q${idx + 1}`, `س${idx + 1}`, isAr)}
            </Text>
            <Text style={[S.qaQuestion, { textAlign: isAr ? "right" : "left" }]}>
              {qLabel}
            </Text>
            {ansText !== "—" ? (
              <Text style={[S.qaAnswer, { textAlign: isAr ? "right" : "left" }]}>
                {ansText}
              </Text>
            ) : (
              <Text style={[S.qaAnswerEmpty, { textAlign: isAr ? "right" : "left" }]}>
                {t("No answer provided", "لا توجد إجابة", isAr)}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Section 6: Nutrition Plan ────────────────────────────────────────────────
function NutritionSection({ plan, isAr }: { plan: NutritionPlan; isAr: boolean }) {
  const name = isAr ? plan.nameAr : plan.name;
  const notes = isAr ? plan.notesAr : plan.notes;

  return (
    <SectionCard title={t("Nutrition Plan", "خطة التغذية", isAr)} isAr={isAr}>
      <Text style={[{ fontSize: 11, fontWeight: "bold", color: C.dark, marginBottom: 4 }, { textAlign: isAr ? "right" : "left" }]}>
        {name}
      </Text>
      <Text style={[S.planDates, { textAlign: isAr ? "right" : "left" }]}>
        {t("Period", "الفترة", isAr)}: {plan.startDate} → {plan.endDate}
      </Text>

      {/* Calories — only shown when a real value is stored (v2 schema stores
           calories per meal, so plan-level calories may be 0 / omitted) */}
      {plan.calories > 0 && (
        <View style={[S.calRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <Text style={S.calNum}>{plan.calories}</Text>
          <Text style={S.calLabel}>{t("kcal / day", "سعرة / يوم", isAr)}</Text>
        </View>
      )}

      {/* Macros */}
      {plan.macros?.length ? (
        <View style={[S.macroRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          {plan.macros.map((m, i) => (
            <View key={i} style={S.macroCell}>
              <Text style={S.macroNum}>{m.value}</Text>
              <Text style={S.macroUnit}>{m.unit}</Text>
              <Text style={S.macroLabel}>{isAr ? m.labelAr : m.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Notes */}
      {notes ? (
        <Text style={[S.planNotes, { textAlign: isAr ? "right" : "left" }]}>{notes}</Text>
      ) : null}
    </SectionCard>
  );
}

// ─── Section 7: Consultations ─────────────────────────────────────────────────
function ConsultationsSection({ consultations, isAr }: { consultations: Consultation[]; isAr: boolean }) {
  if (!consultations?.length) return null;

  return (
    <SectionCard title={t("Consultation History", "سجل الاستشارات", isAr)} isAr={isAr} wrap>
      {consultations.map((c) => {
        const notes = isAr ? (c.notesAr ?? c.notes) : c.notes;
        // typeAr may be absent in older JSONB records — fall back to the EN label
        // so we never pass undefined to a <Text> node (react-pdf v4 throws on undefined children).
        const type  = (isAr ? (c.typeAr ?? c.type) : c.type) ?? "—";
        // c.date may also be absent in malformed JSONB; guard with a dash.
        const date  = c.date ?? "—";
        return (
          <View key={c.id} style={S.consultCard} wrap={false}>
            <View style={[S.consultMeta, { flexDirection: isAr ? "row-reverse" : "row" }]}>
              <View style={S.consultBadge}>
                <Text style={S.consultBadgeText}>{date}</Text>
              </View>
              <View style={[S.consultBadge, { backgroundColor: C.bgPink }]}>
                <Text style={[S.consultBadgeText, { color: C.pink }]}>{type}</Text>
              </View>
              {c.duration ? (
                <View style={S.consultBadge}>
                  <Text style={S.consultBadgeText}>{c.duration}</Text>
                </View>
              ) : null}
            </View>
            {notes ? (
              <Text style={[S.consultNotes, { textAlign: isAr ? "right" : "left" }]}>{notes}</Text>
            ) : null}
          </View>
        );
      })}
    </SectionCard>
  );
}

// ─── Section 8: Medical Notes ─────────────────────────────────────────────────
function MedicalNotesSection({ notesEn, notesAr, isAr }: { notesEn: string; notesAr: string; isAr: boolean }) {
  const notes = isAr ? notesAr : notesEn;
  if (!notes?.trim()) return null;

  return (
    <SectionCard title={t("Medical & Follow-up Notes", "الملاحظات الطبية والمتابعة", isAr)} isAr={isAr}>
      <Text style={[S.notesText, { textAlign: isAr ? "right" : "left" }]}>{notes}</Text>
    </SectionCard>
  );
}

// ─── Fixed Header ─────────────────────────────────────────────────────────────
function ReportHeader({ logoUrl, isAr, clientName, generatedAt }: {
  logoUrl: string; isAr: boolean; clientName: string; generatedAt: string;
}) {
  return (
    <View style={[S.header, { flexDirection: isAr ? "row-reverse" : "row" }]} fixed>
      {/* Left / trailing — logo + clinic name */}
      <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
        <Image src={logoUrl} style={S.headerLogo} />
        <View>
          <Text style={[S.hClinicName, { textAlign: isAr ? "right" : "left" }]}>
            {t("SHELAN", "شيلان", isAr)}
          </Text>
          <Text style={[S.hClinicSub, { textAlign: isAr ? "right" : "left" }]}>
            {t("Nutrition Clinic", "عيادة التغذية", isAr)}
          </Text>
        </View>
      </View>

      {/* Right / leading — report title + client + date */}
      <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
        <Text style={[S.hReportTitle, { textAlign: isAr ? "left" : "right" }]}>
          {t("Client Health Report", "تقرير صحة المريض", isAr)}
        </Text>
        <Text style={[S.hDate, { textAlign: isAr ? "left" : "right" }]}>
          {clientName} · {generatedAt}
        </Text>
      </View>
    </View>
  );
}

// ─── Fixed Footer ─────────────────────────────────────────────────────────────
function ReportFooter({ isAr }: { isAr: boolean }) {
  return (
    <View style={[S.footer, { flexDirection: isAr ? "row-reverse" : "row" }]} fixed>
      <Text style={S.footerText}>
        {t(
          "SHELAN Nutrition Clinic — Confidential Medical Report",
          "عيادة شيلان للتغذية — تقرير طبي سري",
          isAr,
        )}
      </Text>
      <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
        <Text style={S.footerText}>
          {t("Generated automatically from SHELAN Platform", "تم إنشاؤه تلقائياً من منصة شيلان", isAr)}
        </Text>
        <Text
          style={S.footerBrand}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />
      </View>
    </View>
  );
}

// ─── Main document ────────────────────────────────────────────────────────────
export default function ClinicReportDocument({
  client,
  isAr,
  response,
  templateName,
  logoUrl,
  generatedAt,
  sections: sectionsProp,
}: ReportData) {
  const clientName = isAr ? client.fullNameAr : client.fullName;
  // Fall back to all-on when no sections prop is provided.
  const sec: ReportSections = sectionsProp ?? ALL_SECTIONS_ON;

  return (
    <Document
      title={`${clientName} — ${t("Health Report", "تقرير صحي", isAr)}`}
      author="SHELAN Nutrition Clinic"
      subject={t("Client Health Report", "تقرير صحة المريض", isAr)}
      creator="SHELAN Platform"
    >
      <Page size="A4" style={S.page}>
        {/* Fixed elements — repeat on every page */}
        <ReportHeader
          logoUrl={logoUrl}
          isAr={isAr}
          clientName={clientName}
          generatedAt={generatedAt}
        />
        <ReportFooter isAr={isAr} />

        {/* ── Content sections — each gated by its toggle ── */}
        {sec.clientInfo && (
          <ClientInfoSection client={client} isAr={isAr} />
        )}

        {sec.assessmentSummary && (
          <AssessmentSummarySection client={client} response={response} isAr={isAr} />
        )}

        {sec.healthIndicators && (
          <HealthIndicatorsSection client={client} isAr={isAr} />
        )}

        {sec.diagnoses && (
          <DiagnosesSection client={client} isAr={isAr} />
        )}

        {sec.qa && response && response.answers.length > 0 && (
          <QASection response={response} templateName={templateName} isAr={isAr} />
        )}

        {sec.nutritionPlan && client.nutritionPlan && (
          <NutritionSection plan={client.nutritionPlan} isAr={isAr} />
        )}

        {sec.consultations && client.consultations?.length > 0 && (
          <ConsultationsSection consultations={client.consultations} isAr={isAr} />
        )}

        {sec.medicalNotes && (
          <MedicalNotesSection
            notesEn={client.medicalNotes}
            notesAr={client.medicalNotesAr}
            isAr={isAr}
          />
        )}
      </Page>
    </Document>
  );
}
