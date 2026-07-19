/**
 * nutrition-plans.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for nutrition_plans and nutrition_plan_files tables.
 *
 * Version strategy:
 *   Each logical plan is identified by plan_group_id.
 *   Editing a plan's content inserts a new row (version++) — the old row is
 *   preserved verbatim as history. Status changes update the latest row in place.
 *
 * Storage operations use the unified upload service from @/lib/upload.
 */

import { supabase } from "@/lib/supabase";
import { uploadToStorage, deleteFromStorage, buildPath } from "@/lib/upload";
import type { NutritionPlanRow, NutritionPlanFileRow } from "@/types/database.types";

// ─── Re-exports ────────────────────────────────────────────────────────────────

export type { NutritionPlanRow, NutritionPlanFileRow };

// ─── Meal types ────────────────────────────────────────────────────────────────

export const MEAL_SLOTS = [
  { key: "breakfast",       en: "Breakfast",        ar: "الإفطار"              },
  { key: "morning_snack",   en: "Morning Snack",    ar: "وجبة الصباح الخفيفة"  },
  { key: "lunch",           en: "Lunch",            ar: "الغداء"               },
  { key: "afternoon_snack", en: "Afternoon Snack",  ar: "وجبة العصر الخفيفة"   },
  { key: "dinner",          en: "Dinner",           ar: "العشاء"               },
  { key: "evening_snack",   en: "Evening Snack",    ar: "وجبة المساء الخفيفة"  },
] as const;

export type MealSlotKey = (typeof MEAL_SLOTS)[number]["key"];

export interface MealSlot {
  title: string;
  description: string;
  instructions: string;
  notes: string;
}

export type MealsMap = Partial<Record<MealSlotKey, MealSlot>>;

// ─── Create form shape ────────────────────────────────────────────────────────

export interface NutritionPlanInput {
  client_id: string;
  plan_group_id?: string;
  version?: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: NutritionPlanRow["status"];
  meals: MealsMap;
  water_intake_goal: string;
  steps_goal: string;
  exercise_recommendations: string;
  supplement_recommendations: string;
  general_instructions: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getClientNutritionPlans(
  clientId: string,
): Promise<NutritionPlanRow[]> {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("client_id", clientId)
    .order("plan_group_id")
    .order("version", { ascending: false });

  if (error) {
    console.error("[nutrition-plans] getClientNutritionPlans:", error.message);
    return [];
  }

  const seen = new Set<string>();
  const latest: NutritionPlanRow[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.plan_group_id)) {
      seen.add(row.plan_group_id);
      latest.push(row as NutritionPlanRow);
    }
  }

  return latest.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function getNutritionPlanHistory(
  planGroupId: string,
): Promise<NutritionPlanRow[]> {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("plan_group_id", planGroupId)
    .order("version", { ascending: false });

  if (error) {
    console.error("[nutrition-plans] getNutritionPlanHistory:", error.message);
    return [];
  }
  return (data ?? []) as NutritionPlanRow[];
}

export async function getNutritionPlan(
  planId: string,
): Promise<NutritionPlanRow | null> {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    console.error("[nutrition-plans] getNutritionPlan:", error.message);
    return null;
  }
  return data as NutritionPlanRow | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createNutritionPlan(
  input: NutritionPlanInput,
): Promise<NutritionPlanRow | null> {
  const payload = {
    client_id:                  input.client_id,
    plan_group_id:              input.plan_group_id ?? undefined,
    version:                    1,
    name:                       input.name,
    description:                input.description || null,
    start_date:                 input.start_date || null,
    end_date:                   input.end_date || null,
    status:                     input.status,
    meals:                      input.meals,
    water_intake_goal:          input.water_intake_goal || null,
    steps_goal:                 input.steps_goal || null,
    exercise_recommendations:   input.exercise_recommendations || null,
    supplement_recommendations: input.supplement_recommendations || null,
    general_instructions:       input.general_instructions || null,
  };

  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[nutrition-plans] createNutritionPlan:", error.message);
    return null;
  }
  return data as NutritionPlanRow;
}

export async function updateNutritionPlan(
  current: NutritionPlanRow,
  input: Omit<NutritionPlanInput, "client_id" | "plan_group_id" | "version">,
): Promise<NutritionPlanRow | null> {
  const newVersion: NutritionPlanInput = {
    client_id:    current.client_id,
    plan_group_id: current.plan_group_id,
    version:       current.version + 1,
    ...input,
  };
  return createNutritionPlan(newVersion);
}

export async function setNutritionPlanStatus(
  planId: string,
  status: NutritionPlanRow["status"],
): Promise<boolean> {
  const { error } = await supabase
    .from("nutrition_plans")
    .update({ status })
    .eq("id", planId);

  if (error) {
    console.error("[nutrition-plans] setNutritionPlanStatus:", error.message);
    return false;
  }
  return true;
}

export async function duplicateNutritionPlan(
  source: NutritionPlanRow,
  clientId: string,
): Promise<NutritionPlanRow | null> {
  const input: NutritionPlanInput = {
    client_id:                  clientId,
    name:                       `${source.name} (Copy)`,
    description:                source.description ?? "",
    start_date:                 source.start_date ?? "",
    end_date:                   source.end_date ?? "",
    status:                     "draft",
    meals:                      (source.meals as MealsMap) ?? {},
    water_intake_goal:          source.water_intake_goal ?? "",
    steps_goal:                 source.steps_goal ?? "",
    exercise_recommendations:   source.exercise_recommendations ?? "",
    supplement_recommendations: source.supplement_recommendations ?? "",
    general_instructions:       source.general_instructions ?? "",
  };
  return createNutritionPlan(input);
}

export async function deleteNutritionPlan(planId: string): Promise<boolean> {
  const { error } = await supabase
    .from("nutrition_plans")
    .delete()
    .eq("id", planId)
    .eq("status", "draft");

  if (error) {
    console.error("[nutrition-plans] deleteNutritionPlan:", error.message);
    return false;
  }
  return true;
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function getPlanFiles(
  planId: string,
): Promise<NutritionPlanFileRow[]> {
  const { data, error } = await supabase
    .from("nutrition_plan_files")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[nutrition-plans] getPlanFiles:", error.message);
    return [];
  }
  return (data ?? []) as NutritionPlanFileRow[];
}

export async function uploadPlanFile(
  planId: string,
  clientId: string,
  file: File,
): Promise<NutritionPlanFileRow | null> {
  const path = buildPath(`nutrition-plans/${planId}`, file.name);

  const { url: publicUrl, error: uploadError } = await uploadToStorage(file, {
    path,
    upsert: false,
    maxSizeMb: 50,
  });

  if (uploadError || !publicUrl) {
    console.error("[nutrition-plans] uploadPlanFile:", uploadError);
    return null;
  }

  const fileType: NutritionPlanFileRow["file_type"] =
    file.type === "application/pdf"  ? "pdf"
    : file.type.startsWith("image/") ? "image"
    : "document";

  const { data, error: dbError } = await supabase
    .from("nutrition_plan_files")
    .insert({
      plan_id:   planId,
      client_id: clientId,
      filename:  file.name,
      url:       publicUrl,
      file_type: fileType,
      size:      file.size,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[nutrition-plans] nutrition_plan_files insert:", dbError.message);
    return null;
  }
  return data as NutritionPlanFileRow;
}

export async function deletePlanFile(
  fileId: string,
  url: string,
): Promise<boolean> {
  await deleteFromStorage(url);

  const { error } = await supabase
    .from("nutrition_plan_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    console.error("[nutrition-plans] deletePlanFile:", error.message);
    return false;
  }
  return true;
}
