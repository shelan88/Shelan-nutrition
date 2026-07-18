/**
 * portal/repositories/assessments.repository.ts
 * Returns the authenticated client's assessment responses with template names.
 */

import { supabase } from "@/lib/supabase";
import type { AssessmentResponseRow, ResponseAnswerRow, TemplateQuestionRow, QuestionOptionRow } from "@/types/database.types";

export type { AssessmentResponseRow };

export interface PortalAssessmentResponse {
  id: string;
  templateId: string;
  templateName: string;
  status: AssessmentResponseRow["status"];
  submittedAt: string | null;
  createdAt: string;
}

export interface AnswerWithQuestion extends ResponseAnswerRow {
  question: TemplateQuestionRow & { options: QuestionOptionRow[] };
}

export interface FullPortalResponse extends PortalAssessmentResponse {
  answers: AnswerWithQuestion[];
}

// ─── List own responses ───────────────────────────────────────────────────────

export async function getOwnAssessmentResponses(
  clientId: string,
): Promise<PortalAssessmentResponse[]> {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select("id, template_id, status, submitted_at, created_at, assessment_templates(name_en, name_ar)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[portal/assessments] getOwnAssessmentResponses:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id:           row.id,
    templateId:   row.template_id,
    templateName: row.assessment_templates?.name_en ?? "Assessment",
    status:       row.status,
    submittedAt:  row.submitted_at,
    createdAt:    row.created_at,
  }));
}

// ─── Load one full response with answers ─────────────────────────────────────

export async function getOwnFullResponse(
  responseId: string,
): Promise<FullPortalResponse | null> {
  const { data: response, error } = await supabase
    .from("assessment_responses")
    .select("*, assessment_templates(name_en, name_ar)")
    .eq("id", responseId)
    .maybeSingle();

  if (error || !response) return null;

  const { data: questions } = await supabase
    .from("template_questions")
    .select("*")
    .eq("template_id", response.template_id)
    .order("sort_order");

  const questionIds = (questions ?? []).map((q: any) => q.id);

  const [{ data: options }, { data: answers }] = await Promise.all([
    questionIds.length
      ? supabase.from("question_options").select("*").in("question_id", questionIds).order("sort_order")
      : Promise.resolve({ data: [] }),
    supabase.from("response_answers").select("*").eq("response_id", responseId),
  ]);

  const allOptions  = (options ?? []) as QuestionOptionRow[];
  const allAnswers  = (answers ?? []) as ResponseAnswerRow[];
  const allQuestions = (questions ?? []) as TemplateQuestionRow[];

  const answersWithQuestions: AnswerWithQuestion[] = allAnswers.map((ans) => {
    const question = allQuestions.find((q) => q.id === ans.question_id)!;
    const qOptions = allOptions.filter((o) => o.question_id === ans.question_id);
    return { ...ans, question: { ...question, options: qOptions } };
  });

  return {
    id:           response.id,
    templateId:   response.template_id,
    templateName: (response as any).assessment_templates?.name_en ?? "Assessment",
    status:       response.status,
    submittedAt:  response.submitted_at,
    createdAt:    response.created_at,
    answers:      answersWithQuestions,
  };
}
