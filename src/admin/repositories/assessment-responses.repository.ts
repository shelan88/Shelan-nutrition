/**
 * assessment-responses.repository.ts
 * CRUD for assessment_responses and response_answers.
 * Used by the public questionnaire flow and admin review panels.
 */

import { supabase } from "@/lib/supabase";
import type {
  AssessmentResponseRow,
  ResponseAnswerRow,
  TemplateQuestionRow,
  QuestionOptionRow,
  Json,
} from "@/types/database.types";

export type { AssessmentResponseRow, ResponseAnswerRow };

export interface AnswerWithQuestion extends ResponseAnswerRow {
  question: TemplateQuestionRow & { options: QuestionOptionRow[] };
}

export interface ResponseWithAnswers extends AssessmentResponseRow {
  answers: AnswerWithQuestion[];
}

// ─── Create blank response on booking confirm ─────────────────────────────────

export async function createResponse(
  templateId: string,
  appointmentId: string | null,
  userId: string | null,
  clientId: string | null
): Promise<AssessmentResponseRow | null> {
  const { data, error } = await supabase
    .from("assessment_responses")
    .insert({ template_id: templateId, appointment_id: appointmentId, user_id: userId, client_id: clientId, status: "pending" })
    .select().single();
  if (error) { console.error("[assessment-responses] createResponse:", error.message); return null; }
  return data;
}

// ─── Load full response with questions + answers ──────────────────────────────

export async function getResponse(responseId: string): Promise<ResponseWithAnswers | null> {
  const { data: response, error } = await supabase
    .from("assessment_responses").select("*").eq("id", responseId).maybeSingle();
  if (error || !response) { if (error) console.error("[assessment-responses] getResponse:", error.message); return null; }

  const { data: questions } = await supabase
    .from("template_questions").select("*").eq("template_id", response.template_id).order("sort_order", { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);
  const [{ data: options }, { data: answers }] = await Promise.all([
    questionIds.length
      ? supabase.from("question_options").select("*").in("question_id", questionIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as QuestionOptionRow[] }),
    supabase.from("response_answers").select("*").eq("response_id", responseId),
  ]);

  const allOptions = options ?? [];
  const answersWithQ: AnswerWithQuestion[] = (answers ?? []).map((a) => {
    const q = (questions ?? []).find((q) => q.id === a.question_id)!;
    return { ...a, question: { ...q, options: allOptions.filter((o) => o.question_id === a.question_id) } };
  });

  return { ...response, answers: answersWithQ };
}

export async function getResponsesForClient(clientId: string): Promise<AssessmentResponseRow[]> {
  const { data, error } = await supabase
    .from("assessment_responses").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
  if (error) { console.error("[assessment-responses] getResponsesForClient:", error.message); return []; }
  return data ?? [];
}

export async function getResponseByAppointment(appointmentId: string): Promise<ResponseWithAnswers | null> {
  const { data, error } = await supabase
    .from("assessment_responses").select("*").eq("appointment_id", appointmentId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  return getResponse(data.id);
}

// ─── Save a single answer (upsert) ───────────────────────────────────────────

export async function saveAnswer(
  responseId: string, questionId: string, answerText: string | null, answerJson: unknown | null
): Promise<boolean> {
  const { error } = await supabase.from("response_answers").upsert(
    { response_id: responseId, question_id: questionId, answer_text: answerText, answer_json: answerJson as Json },
    { onConflict: "response_id,question_id" }
  );
  if (error) { console.error("[assessment-responses] saveAnswer:", error.message); return false; }
  return true;
}

// ─── Submit + update appointment ─────────────────────────────────────────────

export async function submitResponse(responseId: string, appointmentId: string | null): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("assessment_responses").update({ status: "submitted", submitted_at: now }).eq("id", responseId);
  if (error) { console.error("[assessment-responses] submitResponse:", error.message); return false; }
  if (appointmentId) {
    await supabase.from("appointments")
      .update({ assessment_status: "assessment_submitted", assessment_response_id: responseId })
      .eq("id", appointmentId);
  }
  return true;
}

export async function markResponseInProgress(responseId: string): Promise<void> {
  await supabase.from("assessment_responses").update({ status: "in_progress" }).eq("id", responseId).eq("status", "pending");
}
