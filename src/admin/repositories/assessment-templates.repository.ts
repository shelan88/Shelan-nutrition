/**
 * assessment-templates.repository.ts
 * Full CRUD for assessment_templates, template_questions, question_options,
 * and service_template_assignments.
 */

import { supabase } from "@/lib/supabase";
import type {
  AssessmentTemplateRow,
  TemplateQuestionRow,
  QuestionOptionRow,
} from "@/types/database.types";

export type { AssessmentTemplateRow, TemplateQuestionRow, QuestionOptionRow };

// ─── Enriched UI types ────────────────────────────────────────────────────────

export interface QuestionWithOptions extends TemplateQuestionRow {
  options: QuestionOptionRow[];
}

export interface TemplateWithDetails extends AssessmentTemplateRow {
  questions: QuestionWithOptions[];
  assignedServiceIds: string[];
  questionCount: number;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function getAllTemplates(): Promise<TemplateWithDetails[]> {
  const { data: templates, error } = await supabase
    .from("assessment_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("[assessment-templates] getAllTemplates:", error.message); return []; }
  if (!templates?.length) return [];

  const ids = templates.map((t) => t.id);
  const [{ data: questions }, { data: assignments }] = await Promise.all([
    supabase.from("template_questions").select("id, template_id").in("template_id", ids),
    supabase.from("service_template_assignments").select("service_id, template_id").in("template_id", ids),
  ]);

  return templates.map((t) => ({
    ...t,
    questions: [],
    questionCount: (questions ?? []).filter((q) => q.template_id === t.id).length,
    assignedServiceIds: (assignments ?? []).filter((a) => a.template_id === t.id).map((a) => a.service_id),
  }));
}

export async function getTemplateWithDetails(id: string): Promise<TemplateWithDetails | null> {
  const { data: template, error } = await supabase
    .from("assessment_templates").select("*").eq("id", id).maybeSingle();

  if (error || !template) {
    if (error) console.error("[assessment-templates] getTemplateWithDetails:", error.message);
    return null;
  }

  const { data: questions } = await supabase
    .from("template_questions").select("*").eq("template_id", id).order("sort_order", { ascending: true });

  const questionIds = (questions ?? []).map((q) => q.id);
  const [{ data: options }, { data: assignments }] = await Promise.all([
    questionIds.length
      ? supabase.from("question_options").select("*").in("question_id", questionIds).order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as QuestionOptionRow[] }),
    supabase.from("service_template_assignments").select("service_id").eq("template_id", id),
  ]);

  const allOptions = options ?? [];
  const questionsWithOptions: QuestionWithOptions[] = (questions ?? []).map((q) => ({
    ...q,
    options: allOptions.filter((o) => o.question_id === q.id),
  }));

  return {
    ...template,
    questions: questionsWithOptions,
    questionCount: questionsWithOptions.length,
    assignedServiceIds: (assignments ?? []).map((a) => a.service_id),
  };
}

export async function createTemplate(
  data: Pick<AssessmentTemplateRow, "name_en" | "name_ar" | "description_en" | "description_ar" | "active">
): Promise<AssessmentTemplateRow | null> {
  const { data: row, error } = await supabase
    .from("assessment_templates").insert(data).select().single();
  if (error) { console.error("[assessment-templates] createTemplate:", error.message); return null; }
  return row;
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<AssessmentTemplateRow, "name_en" | "name_ar" | "description_en" | "description_ar" | "active">>
): Promise<boolean> {
  const { error } = await supabase.from("assessment_templates").update(data).eq("id", id);
  if (error) { console.error("[assessment-templates] updateTemplate:", error.message); return false; }
  return true;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const { error } = await supabase.from("assessment_templates").delete().eq("id", id);
  if (error) { console.error("[assessment-templates] deleteTemplate:", error.message); return false; }
  return true;
}

export async function setTemplateActive(id: string, active: boolean): Promise<boolean> {
  return updateTemplate(id, { active });
}

export async function duplicateTemplate(id: string): Promise<AssessmentTemplateRow | null> {
  const original = await getTemplateWithDetails(id);
  if (!original) return null;

  const { data: newTemplate, error } = await supabase
    .from("assessment_templates")
    .insert({
      name_en: `${original.name_en} (Copy)`,
      name_ar: original.name_ar ? `${original.name_ar} (نسخة)` : null,
      description_en: original.description_en,
      description_ar: original.description_ar,
      active: false,
    })
    .select().single();

  if (error || !newTemplate) { console.error("[assessment-templates] duplicateTemplate:", error?.message); return null; }

  // First pass: create all questions and build old_id → new_id map
  const idMap: Record<string, string> = {};
  for (const q of original.questions) {
    const { data: newQ } = await supabase
      .from("template_questions")
      .insert({
        template_id: newTemplate.id,
        type: q.type, label_en: q.label_en, label_ar: q.label_ar,
        placeholder_en: q.placeholder_en, placeholder_ar: q.placeholder_ar,
        help_en: q.help_en, help_ar: q.help_ar,
        required: q.required, sort_order: q.sort_order,
        enabled: q.enabled ?? true,
        library_question_id: null, // clear library tracking on duplicate
        // conditional fields are wired in the second pass after all IDs are known
        conditional_question_id: null,
        conditional_value: null,
      })
      .select().single();

    if (!newQ) continue;
    idMap[q.id] = newQ.id;

    if (q.options.length) {
      await supabase.from("question_options").insert(
        q.options.map((o) => ({ question_id: newQ.id, label_en: o.label_en, label_ar: o.label_ar, value: o.value, sort_order: o.sort_order }))
      );
    }
  }

  // Second pass: re-wire conditional visibility using remapped IDs
  for (const q of original.questions) {
    if (q.conditional_question_id && idMap[q.conditional_question_id] && idMap[q.id]) {
      await supabase.from("template_questions").update({
        conditional_question_id: idMap[q.conditional_question_id],
        conditional_value: q.conditional_value,
      }).eq("id", idMap[q.id]);
    }
  }

  return newTemplate;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function upsertQuestion(
  data: Omit<TemplateQuestionRow, "id" | "created_at"> & { id?: string }
): Promise<TemplateQuestionRow | null> {
  const { id, ...rest } = data;
  const payload = rest;
  if (id) {
    const { data: row, error } = await supabase.from("template_questions").update(payload).eq("id", id).select().single();
    if (error) { console.error("[assessment-templates] updateQuestion:", error.message); return null; }
    return row;
  }
  const { data: row, error } = await supabase.from("template_questions").insert(payload).select().single();
  if (error) { console.error("[assessment-templates] insertQuestion:", error.message); return null; }
  return row;
}

export async function toggleQuestionEnabled(id: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase.from("template_questions").update({ enabled }).eq("id", id);
  if (error) { console.error("[assessment-templates] toggleQuestionEnabled:", error.message); return false; }
  return true;
}

/** Bulk-update template_questions that came from a My Library question. */
export async function updateTemplateQuestionsFromLibrary(
  libraryQuestionId: string,
  updates: Partial<Pick<TemplateQuestionRow, "type" | "label_en" | "label_ar" | "placeholder_en" | "placeholder_ar" | "help_en" | "help_ar" | "required">>
): Promise<number> {
  const { data, error } = await supabase
    .from("template_questions")
    .update(updates)
    .eq("library_question_id", libraryQuestionId)
    .select("id");
  if (error) { console.error("[assessment-templates] updateTemplateQuestionsFromLibrary:", error.message); return 0; }
  return data?.length ?? 0;
}

/** Count how many template_questions were imported from a given library question. */
export async function countTemplateUsesOfLibraryQuestion(libraryQuestionId: string): Promise<number> {
  const { count, error } = await supabase
    .from("template_questions")
    .select("id", { count: "exact", head: true })
    .eq("library_question_id", libraryQuestionId);
  if (error) return 0;
  return count ?? 0;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from("template_questions").delete().eq("id", id);
  if (error) { console.error("[assessment-templates] deleteQuestion:", error.message); return false; }
  return true;
}

export async function reorderQuestions(templateId: string, orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("template_questions").update({ sort_order: idx }).eq("id", id).eq("template_id", templateId)
    )
  );
}

// ─── Options ──────────────────────────────────────────────────────────────────

export async function replaceOptions(
  questionId: string,
  options: Array<{ label_en: string; label_ar: string; value: string; sort_order: number }>
): Promise<void> {
  await supabase.from("question_options").delete().eq("question_id", questionId);
  if (options.length) {
    await supabase.from("question_options").insert(options.map((o) => ({ ...o, question_id: questionId })));
  }
}

// ─── Service assignments ──────────────────────────────────────────────────────

export async function getTemplateForService(serviceId: string): Promise<TemplateWithDetails | null> {
  const { data, error } = await supabase
    .from("service_template_assignments").select("template_id").eq("service_id", serviceId).maybeSingle();
  if (error || !data) return null;
  return getTemplateWithDetails(data.template_id);
}

/**
 * Returns the first active template that has at least one service assignment.
 * Used as a fallback when no specific serviceId can be resolved (e.g. pricing-page
 * plan names don't match admin service names).
 */
export async function getFirstAssignedActiveTemplate(): Promise<TemplateWithDetails | null> {
  const { data, error } = await supabase
    .from("service_template_assignments")
    .select("template_id")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const template = await getTemplateWithDetails(data.template_id);
  if (!template?.active) return null;
  return template;
}

export async function setServiceAssignments(templateId: string, serviceIds: string[]): Promise<void> {
  await supabase.from("service_template_assignments").delete().eq("template_id", templateId);
  for (const serviceId of serviceIds) {
    await supabase.from("service_template_assignments").delete().eq("service_id", serviceId);
    await supabase.from("service_template_assignments").insert({ template_id: templateId, service_id: serviceId });
  }
}
