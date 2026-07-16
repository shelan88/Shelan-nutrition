/**
 * ClientDrawer — premium slide-in side panel for full client detail.
 *
 * Sections (single scrollable view):
 *   Header · Personal Info · Assessment Summary · Risk Indicators ·
 *   Diagnosis · Timeline · Consultations · Nutrition Plan · Files · Notes
 */
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, MapPin, Phone, Mail, Calendar, FileText,
  AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Flame, Dumbbell, Wheat, Droplets, Paperclip,
  Image as ImageIcon, FlaskConical, MessageSquare,
  ShieldCheck, Stethoscope, Lock, Printer, Download,
  Edit2, Archive, Trash2,
} from "lucide-react";
import type { Client, RiskLevel, TimelineType, FileType, RiskIndicatorLevel } from "../data/clients";

// ─── Risk helpers ──────────────────────────────────────────────────────────────

const riskColors: Record<RiskLevel, string> = {
  Low:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  High:   "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const riskDot: Record<RiskLevel, string> = {
  Low: "bg-emerald-500", Medium: "bg-amber-400", High: "bg-red-500",
};

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
  "PDF":        { icon: FileText,    color: "bg-red-100 text-red-500"     },
  "Image":      { icon: ImageIcon,   color: "bg-blue-100 text-blue-500"  },
  "Lab Report": { icon: FlaskConical,color: "bg-purple-100 text-purple-600" },
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface ClientDrawerProps {
  client: Client | null;
  isAr: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ClientDrawer({ client, isAr, onClose }: ClientDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
              {[
                { label: isAr ? "تعديل"   : "Edit",           icon: Edit2,    cls: "text-[var(--admin-text-muted)] border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)]" },
                { label: isAr ? "أرشفة"   : "Archive",        icon: Archive,  cls: "text-[var(--admin-text-muted)] border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)]" },
                { label: isAr ? "طباعة"   : "Print",          icon: Printer,  cls: "text-[var(--admin-text-muted)] border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)]" },
                { label: isAr ? "تصدير"   : "Export PDF",     icon: Download, cls: "text-[var(--admin-text-muted)] border-[var(--admin-border)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface)]" },
              ].map(({ label, icon: Icon, cls }) => (
                <button
                  key={label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all whitespace-nowrap shrink-0 ${cls}`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {label}
                </button>
              ))}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all whitespace-nowrap shrink-0 ms-auto">
                <Trash2 size={12} strokeWidth={2} />
                {isAr ? "حذف" : "Delete"}
              </button>
            </div>

            {/* ── Scrollable body ───────────────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-0">

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
                    <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-[var(--admin-border)] text-[12.5px] font-semibold text-primary-pink hover:bg-primary-pink hover:text-white hover:border-primary-pink transition-all">
                      {isAr ? "عرض التقييم الكامل" : "View Full Assessment"}
                      <ChevronRight size={13} className="rtl:rotate-180" />
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
                      <div>
                        <p className="text-[13.5px] font-bold text-[var(--admin-text)]">
                          {isAr ? client.nutritionPlan.nameAr : client.nutritionPlan.name}
                        </p>
                        <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-0.5">
                          {client.nutritionPlan.startDate} → {client.nutritionPlan.endDate}
                        </p>
                      </div>
                      <span className="text-[12px] font-bold text-primary-pink bg-primary-pink/10 px-2.5 py-0.5 rounded-full">
                        {client.nutritionPlan.calories} {isAr ? "سعرة" : "kcal"}
                      </span>
                    </div>

                    {/* Macros */}
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

                    <p className="text-[12px] text-[var(--admin-text-muted)] leading-relaxed">
                      {isAr ? client.nutritionPlan.notesAr : client.nutritionPlan.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--admin-text-faint)] italic">
                    {isAr ? "لا توجد خطة تغذية نشطة." : "No active nutrition plan."}
                  </p>
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
