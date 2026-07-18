/**
 * Portal — My Assessments
 * Lists completed and pending assessment responses for the authenticated client.
 * Answers are lazy-loaded when a completed response is expanded.
 */

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle2, Clock, ChevronDown, ChevronUp, CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useLanguage } from "@/context/LanguageContext";
import {
  getOwnAssessmentResponses,
  getOwnFullResponse,
  type PortalAssessmentResponse,
  type FullPortalResponse,
} from "@/portal/repositories/assessments.repository";

// ── Response card ─────────────────────────────────────────────────────────────

function ResponseCard({ response, isAr }: { response: PortalAssessmentResponse; isAr: boolean }) {
  const [open,        setOpen]        = useState(false);
  const [full,        setFull]        = useState<FullPortalResponse | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  const submitted = response.status === "submitted";

  const date = response.submittedAt
    ? new Date(response.submittedAt).toLocaleDateString(isAr ? "ar-KW" : "en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;

  const handleToggle = async () => {
    if (!submitted) return;
    const next = !open;
    setOpen(next);
    if (next && !full) {
      setLoadingFull(true);
      const data = await getOwnFullResponse(response.id);
      setFull(data);
      setLoadingFull(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-start gap-4 p-5 text-start ${submitted ? "hover:bg-white/3 transition-colors cursor-pointer" : "cursor-default"}`}
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          submitted ? "bg-emerald-500/10" : "bg-amber-500/10"
        }`}>
          {submitted
            ? <CheckCircle2 className="text-emerald-400" size={18} />
            : <Clock className="text-amber-400" size={18} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-ivory text-sm">{response.templateName}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              submitted
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {submitted ? (isAr ? "مكتمل" : "Completed") : (isAr ? "في انتظار الإكمال" : "Pending")}
            </span>
          </div>
          {date && (
            <p className="text-xs text-ivory/40">
              {isAr ? `تم الإرسال: ${date}` : `Submitted: ${date}`}
            </p>
          )}
        </div>
        {submitted && (
          open
            ? <ChevronUp size={16} className="text-ivory/30 shrink-0 mt-1" />
            : <ChevronDown size={16} className="text-ivory/30 shrink-0 mt-1" />
        )}
      </button>

      {/* Expanded answers */}
      {open && submitted && (
        <div className="border-t border-white/8 px-5 pb-4 pt-3">
          {loadingFull ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
            </div>
          ) : full && full.answers.length > 0 ? (
            <div className="space-y-3">
              {full.answers.map((a) => {
                const val = a.answer_text ?? (
                  Array.isArray(a.answer_json)
                    ? (a.answer_json as string[]).join(", ")
                    : a.answer_json != null ? String(a.answer_json) : ""
                );
                if (!val) return null;
                return (
                  <div key={a.id} className="pb-3 border-b border-white/5 last:border-0">
                    <p className="text-xs text-ivory/40 mb-0.5">
                      {(a.question as any)?.label ?? (a.question as any)?.text ?? "Question"}
                    </p>
                    <p className="text-sm text-ivory/80">{val}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ivory/40 text-center py-3">
              {isAr ? "لا توجد إجابات مسجلة." : "No answers recorded."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyAssessments({ isAr }: { isAr: boolean }) {
  return (
    <div className="py-16 flex flex-col items-center text-center bg-white/3 border border-white/8 rounded-2xl px-6">
      <div className="w-14 h-14 rounded-2xl bg-lavender-purple/15 flex items-center justify-center mb-4">
        <ClipboardList className="text-lavender-purple/60" size={26} />
      </div>
      <h3 className="font-heading text-base font-semibold text-ivory mb-2">
        {isAr ? "لا توجد تقييمات بعد" : "No assessments yet"}
      </h3>
      <p className="text-sm text-ivory/40 max-w-xs mb-6">
        {isAr
          ? "يتم إرسال التقييمات إليك بعد حجز موعدك. ستظهر هنا بمجرد توفرها."
          : "Assessments are sent to you after booking a consultation and will appear here once available."}
      </p>
      <Link
        to="/booking"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 text-sm font-medium text-ivory/70 hover:text-ivory hover:border-white/30 transition-colors"
      >
        <CalendarPlus size={14} />
        {isAr ? "احجزي موعداً" : "Book a Consultation"}
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssessmentsPage() {
  const { profile, loading: profileLoading } = useClientProfile();
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [responses, setResponses] = useState<PortalAssessmentResponse[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!profile) {
      if (!profileLoading) setLoading(false);
      return;
    }
    getOwnAssessmentResponses(profile.id).then((data) => {
      setResponses(data);
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

  const completed = responses.filter((r) => r.status === "submitted");
  const pending   = responses.filter((r) => r.status !== "submitted");

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-ivory">
        {isAr ? "تقييماتي" : "My Assessments"}
      </h1>

      {responses.length === 0 ? (
        <EmptyAssessments isAr={isAr} />
      ) : (
        <>
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h2 className="font-heading text-base font-semibold text-ivory">
                  {isAr ? "المكتملة" : "Completed"}
                </h2>
                <span className="text-xs font-medium text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
                  {completed.length}
                </span>
              </div>
              <div className="space-y-3">
                {completed.map((r) => <ResponseCard key={r.id} response={r} isAr={isAr} />)}
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-amber-400" />
                <h2 className="font-heading text-base font-semibold text-ivory">
                  {isAr ? "في الانتظار" : "Pending"}
                </h2>
                <span className="text-xs font-medium text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              </div>
              <div className="space-y-3">
                {pending.map((r) => <ResponseCard key={r.id} response={r} isAr={isAr} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
