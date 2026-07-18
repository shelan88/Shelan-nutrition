/**
 * Portal — My Assessments
 * Lists submitted and pending assessment responses with expandable answer view.
 */

import { useState, useEffect } from "react";
import { ClipboardList, ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useClientProfile } from "@/hooks/useClientProfile";
import {
  getOwnAssessmentResponses,
  getOwnFullResponse,
  type PortalAssessmentResponse,
  type FullPortalResponse,
} from "@/portal/repositories/assessments.repository";

function StatusChip({ status }: { status: PortalAssessmentResponse["status"] }) {
  const cfg =
    status === "submitted"   ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" :
    status === "in_progress" ? "bg-amber-500/15 text-amber-300 border-amber-500/20" :
                               "bg-white/10 text-ivory/50 border-white/10";
  const label =
    status === "submitted"   ? "Completed" :
    status === "in_progress" ? "In Progress" : "Pending";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg}`}>
      {label}
    </span>
  );
}

function AnswerRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-white/5 py-2.5 last:border-0">
      <p className="text-xs text-ivory/40 mb-0.5">{label}</p>
      <p className="text-sm text-ivory/80">{value}</p>
    </div>
  );
}

function ResponseCard({ response }: { response: PortalAssessmentResponse }) {
  const [expanded, setExpanded] = useState(false);
  const [full,     setFull]     = useState<FullPortalResponse | null>(null);
  const [loading,  setLoading]  = useState(false);

  const toggle = async () => {
    if (response.status !== "submitted") return;
    if (!expanded && !full) {
      setLoading(true);
      const data = await getOwnFullResponse(response.id);
      setFull(data);
      setLoading(false);
    }
    setExpanded((v) => !v);
  };

  const date = response.submittedAt
    ? new Date(response.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date(response.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-4 p-5 text-start"
        disabled={response.status !== "submitted"}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-lavender-purple/15 flex items-center justify-center">
          <ClipboardList className="text-lavender-purple" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-semibold text-ivory text-sm truncate">{response.templateName}</span>
            <StatusChip status={response.status} />
          </div>
          <p className="text-xs text-ivory/40 flex items-center gap-1">
            {response.status === "submitted"
              ? <CheckCircle2 size={11} className="text-emerald-400" />
              : <Clock size={11} />}
            {response.status === "submitted" ? "Submitted" : "Created"}: {date}
          </p>
        </div>
        {response.status === "submitted" && (
          <span className="text-ivory/30 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 rounded-full border-2 border-primary-pink border-t-transparent animate-spin" />
            </div>
          ) : full && full.answers.length > 0 ? (
            <div>
              {full.answers.map((ans) => (
                <AnswerRow
                  key={ans.id}
                  label={ans.question?.label_en ?? "Question"}
                  value={ans.answer_text ?? (ans.answer_json ? JSON.stringify(ans.answer_json) : null)}
                />
              ))}
            </div>
          ) : (
            <p className="text-ivory/40 text-sm text-center py-4">No answers recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentsPage() {
  const { profile, loading: profileLoading } = useClientProfile();
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

  const EmptyState = ({ label }: { label: string }) => (
    <div className="py-10 text-center bg-white/3 border border-white/8 rounded-2xl">
      <AlertCircle className="mx-auto text-ivory/20 mb-3" size={28} />
      <p className="text-ivory/40 text-sm">{label}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-ivory">My Assessments</h1>

      {responses.length === 0 ? (
        <EmptyState label="No assessments found." />
      ) : (
        <>
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <h2 className="font-heading text-base font-semibold text-ivory">
                  Completed
                  <span className="ms-2 text-xs font-normal text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {completed.length}
                  </span>
                </h2>
              </div>
              <div className="space-y-3">
                {completed.map((r) => <ResponseCard key={r.id} response={r} />)}
              </div>
            </section>
          )}

          {pending.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-amber-400" />
                <h2 className="font-heading text-base font-semibold text-ivory">
                  Pending
                  <span className="ms-2 text-xs font-normal text-ivory/40 bg-white/5 px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                </h2>
              </div>
              <div className="space-y-3">
                {pending.map((r) => <ResponseCard key={r.id} response={r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
