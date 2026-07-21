/**
 * ClientDrawer — premium slide-in side panel for full client detail.
 *
 * Sections (single scrollable view):
 *   Header · Personal Info · Assessment Summary · Risk Indicators ·
 *   Diagnosis · Timeline · Consultations · Nutrition Plan · Files · Notes
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSubmittedResponsesWithTemplateNames,
  getResponse,
} from "@/admin/repositories/assessment-responses.repository";
import type {
  ResponseWithAnswers,
  ResponseWithTemplateName,
} from "@/admin/repositories/assessment-responses.repository";
import AssessmentCompareModal from "@/admin/components/AssessmentCompareModal";
import {
  X, User, MapPin, Phone, Mail, Calendar, FileText,
  AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Flame, Wheat, Droplets, Paperclip,
  Image as ImageIcon, FlaskConical, Film as FilmIcon, File as FileIcon,
  ShieldCheck, Stethoscope, Lock, Printer, Download,
  Edit2, Archive, Trash2, ArrowLeftRight, Save, X as XIcon, Loader2,
} from "lucide-react";
import type { Client, TimelineType, FileType, RiskIndicatorLevel, Gender, ClientStatus } from "../data/clients";
import { deleteClient, archiveClient, updateClient } from "@/admin/repositories/clients.repository";
import NutritionPlansTab from "./NutritionPlansTab";
import FullAssessmentModal from "@/admin/components/FullAssessmentModal";
import PdfDebugModal from "@/admin/components/PdfDebugModal";
import { useClientReport } from "@/admin/hooks/useClientReport";
import type { ReportSections, SectionKey } from "@/admin/utils/clinicReport";

// ─── Risk helpers ──────────────────────────────────────────────────────────────

const indicatorBg: Record<RiskIndicatorLevel, string> = {
  normal:   "bg-emerald-50 border-emerald-100 text-emerald-700",
  warning:  "bg-amber-50 border-amber-100 text-amber-700",
  critical: "bg-red-50 border-red-100 text-red-600",
};
const indicatorDot: Record<RiskIndicatorLevel, string> = {
  normal: "bg-emerald-500", warning: "bg-amber-400", critical: "bg-red-500",
};

// ─── Timeline icon map ─────────────────────────────────────────────────────────
const timelineIcon: Record<TimelineType, { icon: React.ElementType; color: string }> = {
  assessment:   { icon: FileText,    color: "bg-lavender-purple" },
  booking:      { icon: Calendar,    color: "bg-primary-pink"    },
  consultation: { icon: Stethoscope, color: "bg-soft-purple"     },
  plan:         { icon: Flame,       color: "bg-deep-purple"     },
  followup:     { icon: CheckCircle2,color: "bg-emerald-500"     },
};

// ─── File type icon ────────────────────────────────────────────────────────────
const fileIcon: Record<FileType, { icon: React.ElementType; color: string }> = {
  "PDF":        { icon: FileText,    color: "bg-red-100 text-red-500"        },
  "Image":      { icon: ImageIcon,   color: "bg-blue-100 text-blue-500"     },
  "Lab Report": { icon: FlaskConical,color: "bg-purple-100 text-purple-600" },
  "Video":      { icon: FilmIcon,    color: "bg-green-100 text-green-600"   },
  "Document":   { icon: FileIcon,    color: "bg-gray-100 text-gray-500"     },
};

// ─── Score arc ─────────────────────────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--admin-border)" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <span className="absolute text-[22px] font-bold text-[var(--admin-text)]">{score}</span>
    </div>
  );
}

// ─── Macro bar ─────────────────────────────────────────────────────────────────
const macroIcons = [Flame, Wheat, Droplets];
const macroColors = [
  "bg-primary-pink", "bg-lavender-purple", "bg-soft-purple",
];

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
        <Icon size={13} className="text-primary-pink" strokeWidth={2} />
      </div>
      <h3 className="text-[13px] font-bold text-[var(--admin-text)] uppercase tracking-wider">{title}</h3>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="my-6 border-t border-[var(--admin-border)]" />;
}

// ─── Report Sections Modal ────────────────────────────────────────────────────

const SECTION_META: { key: SectionKey; labelEn: string; labelAr: string }[] = [
  { key: "clientInfo",        labelEn: "Client Information",   labelAr: "معلومات المريض"       },
  { key: "assessmentSummary", labelEn: "Assessment Summary",   labelAr: "ملخص التقييم"         },
  { key: "healthIndicators",  labelEn: "Health Indicators",    labelAr: "المؤشرات الصحية"       },
  { key: "diagnoses",         labelEn: "Diagnoses",            labelAr: "التشخيصات"            },
  { key: "qa",                labelEn: "Assessment Q&A",       labelAr: "أسئلة التقييم وإجاباته" },
  { key: "nutritionPlan",     labelEn: "Nutrition Plan",       labelAr: "خطة التغذية"           },
  { key: "consultations",     labelEn: "Consultations",        labelAr: "الاستشارات"            },
  { key: "medicalNotes",      labelEn: "Medical Notes",        labelAr: "الملاحظات الطبية"      },
];

interface ReportSectionsModalProps {
  isAr:            boolean;
  initialSections: ReportSections;
  action:          "export" | "print";
  onConfirm:       (sections: ReportSections) => void;
  onCancel:        () => void;
}

function ReportSectionsModal({ isAr, initialSections, action, onConfirm, onCancel }: ReportSectionsModalProps) {
  const [sections, setSections] = useState<ReportSections>({ ...initialSections });

  const allChecked = Object.values(sections).every(Boolean);

  function toggleAll() {
    const next = !allChecked;
    setSections(Object.fromEntries(SECTION_META.map(({ key }) => [key, next])) as ReportSections);
  }

  function toggle(key: SectionKey) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const atLeastOne = Object.values(sections).some(Boolean);

  return (
    /* Backdrop */
    <motion.div
      key="report-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-30 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    >
      <motion.div
        key="report-modal-panel"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm bg-[var(--admin-surface)] rounded-2xl shadow-2xl border border-[var(--admin-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--admin-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center">
              {action === "print"
                ? <Printer size={13} className="text-primary-pink" strokeWidth={2} />
                : <Download size={13} className="text-primary-pink" strokeWidth={2} />}
            </div>
            <p className="text-[13.5px] font-bold text-[var(--admin-text)]">
              {isAr ? "اختيار أقسام التقرير" : "Choose Report Sections"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X size={14} />
          </button>
        </div>

        {/* Section list */}
        <div className="px-5 py-4 space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
          {/* Select all row */}
          <button
            onClick={toggleAll}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--admin-hover-bg)] transition-colors group text-start"
          >
            <span className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              allChecked
                ? "bg-lavender-purple border-lavender-purple"
                : "border-[var(--admin-border)] group-hover:border-lavender-purple/50"
            }`} style={{ width: 18, height: 18 }}>
              {allChecked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-[12px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider">
              {isAr ? "تحديد الكل" : "Select All"}
            </span>
          </button>

          <div className="border-t border-[var(--admin-border)] my-1" />

          {SECTION_META.map(({ key, labelEn, labelAr }) => {
            const checked = sections[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--admin-hover-bg)] transition-colors group text-start"
              >
                <span className={`rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked
                    ? "bg-lavender-purple border-lavender-purple"
                    : "border-[var(--admin-border)] group-hover:border-lavender-purple/50"
                }`} style={{ width: 18, height: 18 }}>
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-[13px] font-semibold transition-colors ${
                  checked ? "text-[var(--admin-text)]" : "text-[var(--admin-text-faint)]"
                }`}>
                  {isAr ? labelAr : labelEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[12.5px] font-semibold rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-all"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={() => onConfirm(sections)}
            disabled={!atLeastOne}
            className="flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold rounded-lg bg-primary-pink text-white hover:bg-primary-pink/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action === "print"
              ? <Printer size={13} strokeWidth={2} />
              : <Download size={13} strokeWidth={2} />}
            {action === "print"
              ? (isAr ? "طباعة" : "Print PDF")
              : (isAr ? "تصدير" : "Export PDF")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClientDrawerProps {
  client: Client | null;
  isAr: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
// ─── Assessments tab ──────────────────────────────────────────────────────────

interface CompareTarget {
  idA: string;
  idB: string;
  templateNameEn: string;
  templateNameAr: string | null;
}

function AssessmentsTab({ client, isAr }: { client: { id: string; email: string }; isAr: boolean }) {
  const [responses,   setResponses]   = useState<ResponseWithTemplateName[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [fullResp,    setFullResp]    = useState<ResponseWithAnswers | null>(null);
  const [loadingExp,  setLoadingExp]  = useState(false);
  // IDs selected for comparison (max 2)
  const [selected,    setSelected]    = useState<string[]>([]);
  // Active comparison modal
  const [comparing,   setComparing]   = useState<CompareTarget | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelected([]);
    getSubmittedResponsesWithTemplateNames(client.email).then((data) => {
      setResponses(data);
      setLoading(false);
    });
  }, [client.email]);

  const handleExpand = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setFullResp(null); return; }
    setExpandedId(id);
    setLoadingExp(true);
    const full = await getResponse(id);
    setFullResp(full);
    setLoadingExp(false);
  }, [expandedId]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, id];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.length !== 2) return;
    const [idA, idB] = selected;
    const rA = responses.find((r) => r.id === idA)!;
    setComparing({
      idA,
      idB,
      templateNameEn: rA.template_name_en,
      templateNameAr: rA.template_name_ar,
    });
  }, [selected, responses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--admin-hover-bg)] flex items-center justify-center mb-1">
          <FileText size={22} className="text-[var(--admin-text-faint)]" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] font-semibold text-[var(--admin-text)]">
          {isAr ? "لا توجد استبيانات" : "No assessments yet"}
        </p>
        <p className="text-[12px] text-[var(--admin-text-faint)]">
          {isAr
            ? "ستظهر الاستبيانات المقدمة هنا بعد الحجز."
            : "Submitted questionnaires will appear here after booking."}
        </p>
      </div>
    );
  }

  // Group submitted responses by template_id
  const groups = new Map<string, { nameEn: string; nameAr: string | null; items: ResponseWithTemplateName[] }>();
  for (const r of responses) {
    if (!groups.has(r.template_id)) {
      groups.set(r.template_id, {
        nameEn: r.template_name_en,
        nameAr: r.template_name_ar,
        items: [],
      });
    }
    groups.get(r.template_id)!.items.push(r);
  }

  const canCompare = selected.length === 2;

  return (
    <>
      {/* ── Compare CTA bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mb-4 flex items-center justify-between px-4 py-3 rounded-xl bg-lavender-purple/8 border border-lavender-purple/20"
          >
            <p className="text-[12px] text-[var(--admin-text-muted)]">
              {canCompare
                ? (isAr ? "تم اختيار استبيانين — اضغطي للمقارنة" : "2 responses selected — ready to compare")
                : (isAr ? `تم اختيار ${selected.length} — اختاري استبياناً آخر` : `${selected.length} selected — pick 1 more`)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected([])}
                className="text-[11.5px] font-semibold text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors px-2 py-1"
              >
                {isAr ? "إلغاء" : "Clear"}
              </button>
              <button
                disabled={!canCompare}
                onClick={handleCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-lavender-purple text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-lavender-purple/90 transition-colors"
              >
                <ArrowLeftRight size={12} strokeWidth={2.2} />
                {isAr ? "قارن" : "Compare"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Template groups ──────────────────────────────────────────── */}
      <div className="space-y-6">
        {[...groups.entries()].map(([templateId, group]) => {
          const groupName = isAr && group.nameAr ? group.nameAr : group.nameEn;
          return (
            <div key={templateId}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center shrink-0">
                  <FileText size={11} className="text-primary-pink" strokeWidth={2} />
                </div>
                <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider truncate flex-1">
                  {groupName}
                </p>
                <span className="text-[10.5px] text-[var(--admin-text-faint)] shrink-0">
                  {group.items.length} {isAr ? "استبيان" : group.items.length === 1 ? "response" : "responses"}
                </span>
              </div>

              {/* Response cards */}
              <div className="space-y-2">
                {group.items.map((resp) => {
                  const isExpanded = expandedId === resp.id;
                  const isChecked  = selected.includes(resp.id);
                  const isDisabled = selected.length >= 2 && !isChecked;
                  const date = resp.submitted_at
                    ? new Date(resp.submitted_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" })
                    : new Date(resp.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" });

                  return (
                    <div
                      key={resp.id}
                      className={`bg-[var(--admin-hover-bg)] rounded-xl border overflow-hidden transition-colors ${
                        isChecked
                          ? "border-lavender-purple/40 ring-1 ring-lavender-purple/20"
                          : "border-[var(--admin-border)]"
                      }`}
                    >
                      {/* Row header */}
                      <div className="flex items-center gap-2 px-3.5 py-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(resp.id)}
                          disabled={isDisabled}
                          aria-label={isChecked ? "Deselect" : "Select for comparison"}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? "bg-lavender-purple border-lavender-purple"
                              : isDisabled
                              ? "border-[var(--admin-border)] opacity-30 cursor-not-allowed"
                              : "border-[var(--admin-border)] hover:border-lavender-purple/60 cursor-pointer"
                          }`}
                        >
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Expand button */}
                        <button
                          onClick={() => handleExpand(resp.id)}
                          className="flex-1 flex items-center gap-2.5 text-start min-w-0"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center shrink-0">
                            <FileText size={12} className="text-primary-pink" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-[var(--admin-text)] truncate">
                              {date}
                            </p>
                            <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                              {isAr ? "تم الإرسال" : "Submitted"}
                            </span>
                          </div>
                          <ChevronRight
                            size={13}
                            className={`text-[var(--admin-text-faint)] shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                      </div>

                      {/* Expanded answer view */}
                      {isExpanded && (
                        <div className="border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4">
                          {loadingExp && expandedId === resp.id ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="w-5 h-5 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin" />
                            </div>
                          ) : fullResp && fullResp.id === resp.id && fullResp.answers.length > 0 ? (
                            <div className="space-y-3">
                              {fullResp.answers.map((ans, i) => {
                                const q = ans.question;
                                const qLabel = isAr && q.label_ar ? q.label_ar : q.label_en;
                                const ansText = Array.isArray(ans.answer_json)
                                  ? (ans.answer_json as string[]).join(", ")
                                  : ans.answer_text;
                                return (
                                  <div key={ans.id}>
                                    <p className="text-[10.5px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-0.5">
                                      Q{i + 1}. {qLabel}
                                    </p>
                                    <p className="text-[12.5px] text-[var(--admin-text)]">{ansText ?? "—"}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[12px] text-[var(--admin-text-faint)] italic">
                              {isAr ? "لا توجد إجابات مسجلة." : "No answers recorded."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Per-group compare hint when ≥2 responses available */}
              {group.items.length >= 2 && selected.length === 0 && (
                <p className="mt-2 text-[10.5px] text-[var(--admin-text-faint)] text-center">
                  {isAr
                    ? "✓ حدّدي استبيانين لمقارنة الإجابات"
                    : "✓ Select two responses to compare answers"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Comparison modal ─────────────────────────────────────────── */}
      {comparing && (
        <AssessmentCompareModal
          idA={comparing.idA}
          idB={comparing.idB}
          templateNameEn={comparing.templateNameEn}
          templateNameAr={comparing.templateNameAr}
          isAr={isAr}
          onClose={() => { setComparing(null); setSelected([]); }}
        />
      )}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
// ─── Edit form state ──────────────────────────────────────────────────────────
interface EditForm {
  fullName:      string;
  fullNameAr:    string;
  phone:         string;
  email:         string;
  age:           number;
  gender:        Gender;
  country:       string;
  status:        ClientStatus;
  medicalNotes:  string;
  medicalNotesAr:string;
}

export default function ClientDrawer({ client, isAr, onClose, onDelete, onRefresh }: ClientDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [tab, setTab] = useState<"profile" | "assessments" | "nutrition">("profile");

  // ── Full assessment modal ───────────────────────────────────────────────────
  interface ViewingAssessment { responseId: string; templateNameEn: string; templateNameAr: string | null; }
  const [viewingAssessment,      setViewingAssessment]      = useState<ViewingAssessment | null>(null);
  const [loadingViewAssessment,  setLoadingViewAssessment]  = useState(false);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const [editMode,  setEditMode]  = useState(false);
  const [editForm,  setEditForm]  = useState<EditForm | null>(null);
  const [editSaving,setEditSaving]= useState(false);

  function openEdit() {
    if (!client) return;
    setEditForm({
      fullName:       client.fullName,
      fullNameAr:     client.fullNameAr,
      phone:          client.phone,
      email:          client.email,
      age:            client.age,
      gender:         client.gender,
      country:        client.country,
      status:         client.status,
      medicalNotes:   client.medicalNotes,
      medicalNotesAr: client.medicalNotesAr,
    });
    setEditMode(true);
  }

  async function saveEdit() {
    if (!client || !editForm) return;
    setEditSaving(true);
    await updateClient(client.id, editForm);
    setEditSaving(false);
    setEditMode(false);
    onRefresh?.();
  }

  async function handleArchive() {
    if (!client) return;
    setActioning("archive");
    const ok = await archiveClient(client.id);
    setActioning(null);
    if (ok) {
      onRefresh?.();
      onClose();
    }
  }

  async function handleDelete() {
    if (!client) return;
    if (!window.confirm(isAr ? "هل تريدين حذف هذه العميلة نهائياً؟" : "Permanently delete this client?")) return;
    setActioning("delete");
    const ok = await deleteClient(client.id);
    setActioning(null);
    if (ok) {
      onDelete?.(client.id);
      onClose();
    }
  }

  const {
    generating: generatingPdf,
    handleExport, handlePrint,
    pdfToast, debugInfo, clearDebug, retryLast, dismissToast,
    pendingAction, lastSections, confirmGenerate, cancelModal,
  } = useClientReport(client, isAr);

  async function handleViewFullAssessment() {
    if (!client) return;
    setLoadingViewAssessment(true);
    const responses = await getSubmittedResponsesWithTemplateNames(client.email);
    setLoadingViewAssessment(false);
    if (responses.length > 0) {
      const latest = responses[0]; // sorted most-recent-first by the repository
      setViewingAssessment({
        responseId:     latest.id,
        templateNameEn: latest.template_name_en,
        templateNameAr: latest.template_name_ar,
      });
    }
  }

  // Reset scroll position on each new client
  useEffect(() => {
    if (client && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [client?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {client && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 end-0 z-50 flex flex-col w-full sm:w-[540px] bg-[var(--admin-surface)] shadow-2xl shadow-black/20"
          >
            {/* ── Sticky header ─────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-bold ${client.avatarGradient}`}>
                  {client.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[var(--admin-text)] truncate">
                    {isAr ? client.fullNameAr : client.fullName}
                  </p>
                  <p className="text-[11.5px] text-[var(--admin-text-faint)] truncate">
                    {isAr ? client.currentPlanAr : client.currentPlan}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text)] transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Action bar ────────────────────────────────────────────── */}
            <div className="shrink-0 flex items-center gap-2 px-6 py-3 border-b border-[var(--admin-border)] bg-[var(--admin-hover-bg)] overflow-x-auto no-scrollbar">
              {/* Edit */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:border-primary-pink/40 hover:bg-primary-pink/5 hover:text-primary-pink transition-all whitespace-nowrap shrink-0"
                onClick={openEdit}
              >
                <Edit2 size={12} strokeWidth={2} />
                {isAr ? "تعديل" : "Edit"}
              </button>

              {/* Archive */}
              <button
                disabled={actioning === "archive"}
                onClick={handleArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)] transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <Archive size={12} strokeWidth={2} />
                {actioning === "archive" ? "…" : (isAr ? "أرشفة" : "Archive")}
              </button>

              {/* Print — opens A4 clinic PDF in new tab */}
              <button
                onClick={handlePrint}
                disabled={generatingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)] transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {generatingPdf
                  ? <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                  : <Printer size={12} strokeWidth={2} />}
                {isAr ? "طباعة" : "Print"}
              </button>

              {/* Export — downloads A4 clinic PDF */}
              <button
                onClick={handleExport}
                disabled={generatingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)] transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {generatingPdf
                  ? <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                  : <Download size={12} strokeWidth={2} />}
                {isAr ? "تصدير" : "Export"}
              </button>

              {/* Delete */}
              <button
                disabled={actioning === "delete"}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all whitespace-nowrap shrink-0 ms-auto disabled:opacity-50"
              >
                <Trash2 size={12} strokeWidth={2} />
                {actioning === "delete" ? "…" : (isAr ? "حذف" : "Delete")}
              </button>
            </div>

            {/* ── Tab bar ───────────────────────────────────────────────── */}
            <div className="shrink-0 flex border-b border-[var(--admin-border)] px-6 bg-[var(--admin-surface)]">
              {(["profile", "nutrition", "assessments"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-3 px-1 me-5 text-[12px] font-bold border-b-2 transition-colors whitespace-nowrap ${
                    tab === t
                      ? "border-primary-pink text-primary-pink"
                      : "border-transparent text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]"
                  }`}
                >
                  {t === "profile"
                    ? (isAr ? "الملف الشخصي" : "Profile")
                    : t === "nutrition"
                    ? (isAr ? "الخطط الغذائية" : "Nutrition Plans")
                    : (isAr ? "الاستبيانات" : "Assessments")}
                </button>
              ))}
            </div>

            {/* ── Scrollable body ───────────────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">

              {/* Assessments tab */}
              {tab === "assessments" && client && (
                <div className="px-6 py-6">
                  <AssessmentsTab client={{ id: client.id, email: client.email }} isAr={isAr} />
                </div>
              )}

              {/* Nutrition Plans tab */}
              {tab === "nutrition" && client && (
                <div className="px-6 py-6">
                  <NutritionPlansTab clientId={client.id} isAr={isAr} />
                </div>
              )}

              {/* Profile tab */}
              {tab === "profile" && <div className="px-6 py-6 space-y-0">

                {/* 1. Personal Information */}
                <SectionHead icon={User} title={isAr ? "المعلومات الشخصية" : "Personal Information"} />
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {[
                    { label: isAr ? "الجنس"        : "Gender",          value: isAr ? (client.gender === "Female" ? "أنثى" : "ذكر") : client.gender },
                    { label: isAr ? "العمر"         : "Age",             value: `${client.age} ${isAr ? "سنة" : "yrs"}` },
                    { label: isAr ? "الدولة"        : "Country",         value: isAr ? client.countryAr : client.country, icon: MapPin },
                    { label: isAr ? "الحالة"        : "Status",          value: isAr
                        ? { Active:"نشطة", Inactive:"غير نشطة", Waiting:"في الانتظار", Completed:"مكتملة" }[client.status]
                        : client.status },
                    { label: isAr ? "تاريخ الانضمام": "Joined",          value: new Date(client.joinedDate).toLocaleDateString(isAr ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" }) },
                    { label: isAr ? "آخر موعد"      : "Last Appointment",value: client.lastAppointment },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[var(--admin-hover-bg)] rounded-xl px-3.5 py-3 border border-[var(--admin-border)]">
                      <p className="text-[10.5px] font-semibold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-[13px] font-semibold text-[var(--admin-text)]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {[
                    { icon: Phone, label: client.phone },
                    { icon: Mail,  label: client.email },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 px-3.5 py-2.5 bg-[var(--admin-hover-bg)] rounded-xl border border-[var(--admin-border)]">
                      <Icon size={14} className="text-[var(--admin-text-faint)] shrink-0" strokeWidth={1.8} />
                      <span className="text-[13px] text-[var(--admin-text-muted)]">{label}</span>
                    </div>
                  ))}
                </div>

                <Divider />

                {/* 2. Assessment Summary */}
                <SectionHead icon={FileText} title={isAr ? "ملخص التقييم" : "Assessment Summary"} />
                {client.assessment ? (
                  <div className="bg-gradient-to-br from-[#fef0f6] to-[#f0eaff] rounded-2xl border border-[var(--admin-border)] p-5">
                    <div className="flex items-center gap-5">
                      <ScoreArc score={client.assessment.score} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-[var(--admin-text-faint)] uppercase tracking-wider mb-1">
                          {isAr ? "النتيجة الإجمالية" : "Overall Score"}
                        </p>
                        <p className="text-[13.5px] font-semibold text-[var(--admin-text)] mb-3">
                          {isAr ? client.assessment.diagnosisCategoryAr : client.assessment.diagnosisCategory}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/80 text-[var(--admin-text-muted)] border border-[var(--admin-border)]">
                            {isAr ? "الخطر:" : "Risk:"} {client.assessment.riskPercentage}%
                          </span>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/80 text-[var(--admin-text-muted)] border border-[var(--admin-border)]">
                            {isAr ? "تاريخ التقييم:" : "Assessed:"} {client.assessment.completedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleViewFullAssessment}
                      disabled={loadingViewAssessment}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-[var(--admin-border)] text-[12.5px] font-semibold text-primary-pink hover:bg-primary-pink hover:text-white hover:border-primary-pink transition-all disabled:opacity-60 disabled:cursor-wait"
                    >
                      {loadingViewAssessment ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <>
                          {isAr ? "عرض التقييم الكامل" : "View Full Assessment"}
                          <ChevronRight size={13} className="rtl:rotate-180" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--admin-text-faint)] italic">
                    {isAr ? "لا يوجد تقييم بعد." : "No assessment on file."}
                  </p>
                )}

                <Divider />

                {/* 3. Risk Indicators */}
                <SectionHead icon={AlertTriangle} title={isAr ? "مؤشرات الخطر" : "Risk Indicators"} />
                <div className="space-y-2">
                  {client.riskIndicators.map((ind) => (
                    <div key={ind.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${indicatorBg[ind.level]}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${indicatorDot[ind.level]}`} />
                        <span className="text-[12.5px] font-semibold">{isAr ? ind.labelAr : ind.label}</span>
                      </div>
                      <span className="text-[13px] font-bold">{ind.value}</span>
                    </div>
                  ))}
                </div>

                <Divider />

                {/* 4. Diagnosis */}
                <SectionHead icon={ShieldCheck} title={isAr ? "التشخيص" : "Diagnosis"} />
                <ul className="space-y-1.5">
                  {(isAr ? client.diagnosesAr : client.diagnoses).map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--admin-text-muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-pink mt-1.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>

                <Divider />

                {/* 5. Timeline */}
                <SectionHead icon={Clock} title={isAr ? "السجل الزمني" : "Timeline"} />
                <div className="space-y-0">
                  {client.timeline.map((evt, i) => {
                    const { icon: TIcon, color } = timelineIcon[evt.type];
                    const isLast = i === client.timeline.length - 1;
                    return (
                      <div key={evt.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                            <TIcon size={13} strokeWidth={2} className="text-white" />
                          </div>
                          {!isLast && <div className="w-px flex-1 my-1 bg-[var(--admin-border)]" />}
                        </div>
                        <div className={`pb-4 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                          <p className="text-[13px] font-semibold text-[var(--admin-text)] leading-snug">
                            {isAr ? evt.eventAr : evt.event}
                          </p>
                          <p className="text-[11px] text-[var(--admin-text-faint)] mt-0.5">{evt.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                {/* 6. Previous Consultations */}
                <SectionHead icon={Stethoscope} title={isAr ? "الاستشارات السابقة" : "Previous Consultations"} />
                <div className="space-y-3">
                  {client.consultations.map((c) => (
                    <div key={c.id} className="bg-[var(--admin-hover-bg)] rounded-xl border border-[var(--admin-border)] px-4 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[13px] font-bold text-[var(--admin-text)]">
                          {isAr ? c.typeAr : c.type}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--admin-text-faint)] flex items-center gap-1">
                            <Clock size={10} /> {c.duration}
                          </span>
                          <span className="text-[11px] font-semibold text-[var(--admin-text-faint)]">{c.date}</span>
                        </div>
                      </div>
                      <p className="text-[12.5px] text-[var(--admin-text-muted)] leading-relaxed">
                        {isAr ? c.notesAr : c.notes}
                      </p>
                    </div>
                  ))}
                </div>

                <Divider />

                {/* 7. Current Nutrition Plan */}
                <SectionHead icon={Flame} title={isAr ? "خطة التغذية الحالية" : "Current Nutrition Plan"} />
                {client.nutritionPlan ? (
                  <div className="bg-[var(--admin-hover-bg)] rounded-2xl border border-[var(--admin-border)] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-[var(--admin-text)] truncate">
                          {isAr ? client.nutritionPlan.nameAr : client.nutritionPlan.name}
                        </p>
                        {(client.nutritionPlan.startDate || client.nutritionPlan.endDate) && (
                          <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
                            {client.nutritionPlan.startDate}{client.nutritionPlan.endDate ? ` → ${client.nutritionPlan.endDate}` : ""}
                          </p>
                        )}
                      </div>
                      {/* Status badge (v2 schema) — calories badge kept for legacy data */}
                      {client.nutritionPlan.status ? (
                        <span className={`ms-2 shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          client.nutritionPlan.status === "active"    ? "bg-emerald-100 text-emerald-700" :
                          client.nutritionPlan.status === "completed" ? "bg-blue-100 text-blue-700"      :
                          client.nutritionPlan.status === "archived"  ? "bg-gray-100 text-gray-600"      :
                                                                        "bg-amber-100 text-amber-700"
                        }`}>
                          {isAr
                            ? ({ active:"نشطة", draft:"مسودة", completed:"مكتملة", archived:"مؤرشفة" } as Record<string,string>)[client.nutritionPlan.status] ?? client.nutritionPlan.status
                            : client.nutritionPlan.status}
                        </span>
                      ) : client.nutritionPlan.calories > 0 ? (
                        <span className="ms-2 shrink-0 text-[12px] font-bold text-primary-pink bg-primary-pink/10 px-2.5 py-0.5 rounded-full">
                          {client.nutritionPlan.calories} {isAr ? "سعرة" : "kcal"}
                        </span>
                      ) : null}
                    </div>

                    {/* Macros — only rendered when present (legacy v1 data) */}
                    {client.nutritionPlan.macros.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {client.nutritionPlan.macros.map((m, i) => {
                          const MacroIcon = macroIcons[i] ?? Flame;
                          return (
                            <div key={m.label} className="bg-[var(--admin-surface)] rounded-xl border border-[var(--admin-border)] px-3 py-2.5 text-center">
                              <div className={`w-6 h-6 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${macroColors[i]}`}>
                                <MacroIcon size={12} className="text-white" strokeWidth={2} />
                              </div>
                              <p className="text-[15px] font-bold text-[var(--admin-text)]">{m.value}<span className="text-[10px] font-semibold text-[var(--admin-text-faint)]">{m.unit}</span></p>
                              <p className="text-[10px] text-[var(--admin-text-faint)]">{isAr ? m.labelAr : m.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(isAr ? client.nutritionPlan.notesAr : client.nutritionPlan.notes) && (
                      <p className="text-[12px] text-[var(--admin-text-muted)] leading-relaxed mb-3">
                        {isAr ? client.nutritionPlan.notesAr : client.nutritionPlan.notes}
                      </p>
                    )}

                    <button
                      onClick={() => setTab("nutrition")}
                      className="text-[12px] font-semibold text-primary-pink hover:underline"
                    >
                      {isAr ? "→ عرض جميع الخطط" : "View All Plans →"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-[var(--admin-text-faint)] italic">
                      {isAr ? "لا توجد خطة تغذية نشطة." : "No active nutrition plan."}
                    </p>
                    <button
                      onClick={() => setTab("nutrition")}
                      className="shrink-0 text-[12px] font-semibold text-primary-pink hover:underline"
                    >
                      {isAr ? "إضافة خطة →" : "Add Plan →"}
                    </button>
                  </div>
                )}

                <Divider />

                {/* 8. Medical Notes */}
                <SectionHead icon={Stethoscope} title={isAr ? "الملاحظات الطبية" : "Medical Notes"} />
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    {isAr ? client.medicalNotesAr : client.medicalNotes}
                  </p>
                </div>

                <Divider />

                {/* 9. Uploaded Files */}
                <SectionHead icon={Paperclip} title={isAr ? "الملفات المرفوعة" : "Uploaded Files"} />
                {client.files.length > 0 ? (
                  <div className="space-y-2">
                    {client.files.map((f) => {
                      const { icon: FIcon, color } = fileIcon[f.type];
                      return (
                        <div key={f.id} className="flex items-center gap-3 px-3.5 py-3 bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] rounded-xl hover:border-[var(--admin-border-strong)] transition-colors group cursor-pointer">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <FIcon size={16} strokeWidth={1.8} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate">{f.name}</p>
                            <p className="text-[11px] text-[var(--admin-text-faint)]">{f.type} · {f.size} · {f.uploadedAt}</p>
                          </div>
                          <Download size={14} className="text-[var(--admin-text-faint)] group-hover:text-primary-pink transition-colors shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center border border-dashed border-[var(--admin-border)] rounded-xl">
                    <Paperclip size={20} className="text-[var(--admin-text-faint)] mb-2" />
                    <p className="text-[12.5px] text-[var(--admin-text-faint)]">
                      {isAr ? "لا توجد ملفات مرفوعة بعد." : "No files uploaded yet."}
                    </p>
                  </div>
                )}

                <Divider />

                {/* 10. Private Notes */}
                <SectionHead icon={Lock} title={isAr ? "ملاحظات خاصة" : "Private Notes"} />
                <div className="bg-[#fef0f6] border border-pink-100 rounded-xl px-4 py-3.5">
                  <p className="text-[13px] text-[#8b2252] leading-relaxed">
                    {isAr ? client.privateNotesAr : client.privateNotes}
                  </p>
                </div>

                {/* Bottom padding */}
                <div className="h-6" />
              </div>}
            </div>

            {/* ── Edit overlay ────────────────────────────────────────── */}
            <AnimatePresence>
              {editMode && editForm && (
                <motion.div
                  key="edit-overlay"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0 z-10 bg-[var(--admin-surface)] flex flex-col"
                >
                  {/* Header */}
                  <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--admin-border)]">
                    <p className="text-[14px] font-bold text-[var(--admin-text)]">
                      {isAr ? "تعديل بيانات العميلة" : "Edit Client"}
                    </p>
                    <button
                      onClick={() => setEditMode(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-input-label">{isAr ? "الاسم (EN)" : "Full Name (EN)"}</label>
                        <input className="form-input" value={editForm.fullName} onChange={e => setEditForm(f => f && ({ ...f, fullName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-input-label">{isAr ? "الاسم (AR)" : "Full Name (AR)"}</label>
                        <input className="form-input" dir="rtl" value={editForm.fullNameAr} onChange={e => setEditForm(f => f && ({ ...f, fullNameAr: e.target.value }))} />
                      </div>
                    </div>
                    {/* Contact row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-input-label">{isAr ? "الهاتف" : "Phone"}</label>
                        <input className="form-input" value={editForm.phone} onChange={e => setEditForm(f => f && ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-input-label">{isAr ? "البريد" : "Email"}</label>
                        <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm(f => f && ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    {/* Demographics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="form-input-label">{isAr ? "العمر" : "Age"}</label>
                        <input className="form-input" type="number" min={1} max={120} value={editForm.age} onChange={e => setEditForm(f => f && ({ ...f, age: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="form-input-label">{isAr ? "الجنس" : "Gender"}</label>
                        <select className="form-input" value={editForm.gender} onChange={e => setEditForm(f => f && ({ ...f, gender: e.target.value as Gender }))}>
                          <option value="Female">{isAr ? "أنثى" : "Female"}</option>
                          <option value="Male">{isAr ? "ذكر" : "Male"}</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-input-label">{isAr ? "الدولة" : "Country"}</label>
                        <input className="form-input" value={editForm.country} onChange={e => setEditForm(f => f && ({ ...f, country: e.target.value }))} />
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <label className="form-input-label">{isAr ? "الحالة" : "Status"}</label>
                      <select className="form-input" value={editForm.status} onChange={e => setEditForm(f => f && ({ ...f, status: e.target.value as ClientStatus }))}>
                        {(["Active", "Inactive", "Waiting", "Completed"] as ClientStatus[]).map(s => (
                          <option key={s} value={s}>{isAr ? ({Active:"نشطة",Inactive:"غير نشطة",Waiting:"في الانتظار",Completed:"مكتملة"} as Record<string,string>)[s] : s}</option>
                        ))}
                      </select>
                    </div>
                    {/* Medical notes */}
                    <div>
                      <label className="form-input-label">{isAr ? "ملاحظات طبية (EN)" : "Medical Notes (EN)"}</label>
                      <textarea className="form-input resize-none" rows={3} value={editForm.medicalNotes} onChange={e => setEditForm(f => f && ({ ...f, medicalNotes: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-input-label">{isAr ? "ملاحظات طبية (AR)" : "Medical Notes (AR)"}</label>
                      <textarea className="form-input resize-none" dir="rtl" rows={3} value={editForm.medicalNotesAr} onChange={e => setEditForm(f => f && ({ ...f, medicalNotesAr: e.target.value }))} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
                    <button
                      onClick={() => setEditMode(false)}
                      disabled={editSaving}
                      className="px-4 py-2 text-[13px] font-semibold rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-all disabled:opacity-50"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={editSaving}
                      className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg bg-primary-pink text-white hover:bg-primary-pink/90 transition-all disabled:opacity-60"
                    >
                      <Save size={14} strokeWidth={2} />
                      {editSaving ? (isAr ? "جاري الحفظ…" : "Saving…") : (isAr ? "حفظ التغييرات" : "Save Changes")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Report sections modal (section picker before PDF gen) ── */}
            <AnimatePresence>
              {pendingAction && (
                <ReportSectionsModal
                  key="report-sections-modal"
                  isAr={isAr}
                  initialSections={lastSections.current}
                  action={pendingAction}
                  onConfirm={confirmGenerate}
                  onCancel={cancelModal}
                />
              )}
            </AnimatePresence>

            {/* ── PDF generating overlay ────────────────────────────── */}
            <AnimatePresence>
              {generatingPdf && (
                <motion.div
                  key="pdf-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
                  style={{ background: "rgba(var(--admin-surface-rgb, 255,255,255), 0.82)", backdropFilter: "blur(6px)" }}
                  aria-busy="true"
                  aria-label={isAr ? "جارٍ إنشاء التقرير" : "Generating PDF"}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-pink/15 to-lavender-purple/15 flex items-center justify-center shadow-sm">
                    <Loader2 size={26} className="animate-spin text-primary-pink" strokeWidth={2} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-[var(--admin-text)]">
                      {isAr ? "جارٍ إنشاء التقرير…" : "Generating your report…"}
                    </p>
                    <p className="text-[12px] text-[var(--admin-text-faint)] mt-1">
                      {isAr ? "قد يستغرق هذا بضع ثوانٍ" : "This may take a few seconds"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PDF error toast ───────────────────────────────────── */}
            <AnimatePresence>
              {pdfToast === "error" && (
                <motion.div
                  key="pdf-error-toast"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border border-red-200 text-[13px] font-semibold whitespace-nowrap bg-[var(--admin-surface)] text-red-600"
                  style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.12)" }}
                  role="alert"
                >
                  <AlertTriangle size={15} className="shrink-0 text-red-500" strokeWidth={2} />
                  <span>
                    {debugInfo ? `STEP FAILED: ${debugInfo.failedStep}` : "STEP FAILED: ?"}
                  </span>
                  {debugInfo && (
                    <button
                      onClick={() => {/* modal is already showing */}}
                      className="ms-1 underline underline-offset-2 text-primary-pink hover:text-primary-pink/80 transition-colors font-bold"
                    >
                      Details ↑
                    </button>
                  )}
                  <button
                    onClick={retryLast}
                    className="ms-1 underline underline-offset-2 text-primary-pink hover:text-primary-pink/80 transition-colors font-bold"
                  >
                    {isAr ? "إعادة المحاولة" : "Retry"}
                  </button>
                  <button
                    onClick={dismissToast}
                    aria-label={isAr ? "إغلاق" : "Dismiss"}
                    className="ms-1 w-5 h-5 flex items-center justify-center rounded-full text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] transition-colors"
                  >
                    <XIcon size={12} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Full Assessment Modal — opened from the Assessment Summary card in the Profile tab */}
          {viewingAssessment && (
            <FullAssessmentModal
              responseId={viewingAssessment.responseId}
              templateNameEn={viewingAssessment.templateNameEn}
              templateNameAr={viewingAssessment.templateNameAr}
              isAr={isAr}
              onClose={() => setViewingAssessment(null)}
            />
          )}

          {/* PDF Debug Modal — on-screen forensic report for export failures.
               Shown whenever debugInfo is set; stays until manually closed. */}
          {debugInfo && (
            <PdfDebugModal info={debugInfo} onClose={clearDebug} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
