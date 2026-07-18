/**
 * nutrition-plans.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for nutrition_plans and nutrition_plan_files tables.
 *
 * Version strategy:
 *   Each logical plan is identified by plan_group_id.
 *   Editing a plan's content inserts a new row (version++) — the old row is
 *   preserved verbatim as history. Status changes update the latest row in place.
 */

import { supabase } from "@/lib/supabase";
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
  plan_group_id?: string;          // provided when creating a new version
  version?: number;                // provided when creating a new version
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

/**
 * Returns the latest version of every plan group for a client,
 * ordered by updated_at DESC.
 */
export async function getClientNutritionPlans(
  clientId: string,
): Promise<NutritionPlanRow[]> {
  // Fetch all rows for the client, then filter to latest version per group
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

  // Keep only the first (= highest version) row per group
  const seen = new Set<string>();
  const latest: NutritionPlanRow[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.plan_group_id)) {
      seen.add(row.plan_group_id);
      latest.push(row as NutritionPlanRow);
    }
  }

  // Sort by updated_at DESC so most-recently-touched plans are first
  return latest.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

/**
 * Returns ALL versions of a plan group, newest first.
 */
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

/**
 * Returns a single plan row by id.
 */
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

/**
 * Creates a brand-new plan (version 1, fresh plan_group_id).
 */
export async function createNutritionPlan(
  input: NutritionPlanInput,
): Promise<NutritionPlanRow | null> {
  const payload = {
    client_id:                  input.client_id,
    plan_group_id:              input.plan_group_id ?? undefined, // DB default = new UUID
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

/**
 * Creates a new version of an existing plan (preserves the old row).
 * Returns the new version row.
 */
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

/**
 * Updates the status of a plan in-place (no new version created).
 * Status changes (archive, complete, restore) are workflow state — not content.
 */
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

/**
 * Duplicates the latest version of a plan as a new plan group (version 1, draft).
 */
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

/**
 * Permanently deletes a single plan row.
 * Only allowed for draft status (enforced in UI; guard here too).
 */
export async function deleteNutritionPlan(planId: string): Promise<boolean> {
  const { error } = await supabase
    .from("nutrition_plans")
    .delete()
    .eq("id", planId)
    .eq("status", "draft"); // safety guard

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
  // Upload to Supabase Storage under nutrition-plans/{planId}/
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `nutrition-plans/${planId}/${Date.now()}_${safe}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { upsert: false });

  if (uploadError) {
    console.error("[nutrition-plans] upload:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

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
      url:       urlData.publicUrl,
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
  // Remove from storage
  const marker = `/storage/v1/object/public/media/`;
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    const storagePath = url.slice(idx + marker.length);
    await supabase.storage.from("media").remove([storagePath]);
  }

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
