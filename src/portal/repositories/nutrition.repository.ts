/**
 * portal/repositories/nutrition.repository.ts
 * Read-only view of the client's own nutrition plans and attached files.
 * Wraps the admin nutrition-plans repository with client_id scoping.
 */

import { supabase } from "@/lib/supabase";
import type { NutritionPlanRow, NutritionPlanFileRow } from "@/types/database.types";
import {
  MEAL_SLOTS,
  type MealsMap,
  type MealSlot,
} from "@/admin/repositories/nutrition-plans.repository";

export type { NutritionPlanRow, NutritionPlanFileRow, MealsMap, MealSlot };
export { MEAL_SLOTS };

export interface PortalNutritionPlan extends NutritionPlanRow {
  files: NutritionPlanFileRow[];
  mealsMap: MealsMap;
}

// Returns latest version of every plan group for the client, with files preloaded.
export async function getOwnNutritionPlans(
  clientId: string,
): Promise<PortalNutritionPlan[]> {
  // Fetch all rows for the client
  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("client_id", clientId)
    .order("plan_group_id")
    .order("version", { ascending: false });

  if (error) {
    console.error("[portal/nutrition] getOwnNutritionPlans:", error.message);
    return [];
  }

  // Keep only highest version per group
  const seen = new Set<string>();
  const latest: NutritionPlanRow[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.plan_group_id)) {
      seen.add(row.plan_group_id);
      latest.push(row as NutritionPlanRow);
    }
  }

  // Sort by updated_at DESC
  latest.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  // Load files for each plan in parallel
  const withFiles = await Promise.all(
    latest.map(async (plan) => {
      const { data: files } = await supabase
        .from("nutrition_plan_files")
        .select("*")
        .eq("plan_id", plan.id)
        .order("created_at", { ascending: false });

      return {
        ...plan,
        files:    (files ?? []) as NutritionPlanFileRow[],
        mealsMap: (plan.meals ?? {}) as MealsMap,
      };
    }),
  );

  return withFiles;
}
