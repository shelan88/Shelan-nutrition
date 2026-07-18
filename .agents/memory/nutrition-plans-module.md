---
name: Nutrition Plans module
description: Architecture decisions for the Nutrition Plans feature inside Client Profile.
---

# Nutrition Plans Module

## Version History Design
**Rule:** Editing plan content inserts a new row, never overwrites.
All versions share a `plan_group_id` UUID. Latest version = max `version` per group.
Status changes (archive, complete, restore) update the existing row in-place — they are workflow state, not content.

**Why:** Preserves historical plans for clinician review without complex audit tables.

**How to apply:** `getClientNutritionPlans()` queries all rows, deduplicates by `plan_group_id` keeping the highest `version`. `updateNutritionPlan()` calls `createNutritionPlan()` with the same `plan_group_id` and `version + 1`.

## Key Tables
- `nutrition_plans` — all versions, indexed on (plan_group_id, version DESC)
- `nutrition_plan_files` — files per plan version; stored in Supabase Storage under `nutrition-plans/{planId}/`

## Meals Storage
Meals are JSONB keyed by slot: `breakfast | morning_snack | lunch | afternoon_snack | dinner | evening_snack`.
Each value: `{ title, description, instructions, notes }`.

## CSS
`form-input` utility class lives in `src/index.css` under `.admin-shell .form-input`. It is NOT a Tailwind class. Used by the plan editor modal.

## Files
- `src/admin/repositories/nutrition-plans.repository.ts` — all DB + storage operations
- `src/admin/pages/NutritionPlansTab.tsx` — self-contained tab (editor modal, history modal, files modal)
- `supabase/migrations/20260718000001_nutrition_plans.sql` — schema (run successfully)
- `ClientProfilePage.tsx` — passes `clientId` and `onCountChange` to `NutritionPlansTab`
