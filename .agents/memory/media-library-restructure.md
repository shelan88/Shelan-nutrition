---
name: Media Library restructure
description: Architecture of how client files are uploaded and browsed across the admin dashboard.
---

## Upload sources (unchanged)
- **Client Files** — Client Profile → Files tab (`ClientProfilePage.tsx` / `FilesTab` component)
  → writes to `uploaded_files` table via `uploadClientFile()` in `client-files.repository.ts`
- **Nutrition Plan Files** — Nutrition Plans tab → Files modal (`NutritionPlansTab.tsx` / `FilesModal`)
  → writes to `nutrition_plan_files` table via `uploadPlanFile()` in `nutrition-plans.repository.ts`

## Media Library page (read-only browser)
- `src/admin/pages/MediaLibraryPage.tsx` — completely rewritten; no upload zone, no delete.
- Split pane: left = searchable client list, right = selected client's files in two sections.
- Sections: "Client Files" (uploaded_files) and "Nutrition Plan Files" (nutrition_plan_files).
- Mobile: single-column master-detail (left panel hides when client selected, back button to return).
- Preview modal for images, videos, PDFs. Download button on each file row.

## New repository functions added
- `getClientFiles(clientId)` → `src/admin/repositories/client-files.repository.ts`
  Queries `uploaded_files WHERE client_id = clientId ORDER BY created_at DESC`.
- `getClientPlanFiles(clientId)` → `src/admin/repositories/nutrition-plans.repository.ts`
  Two-step: (1) `nutrition_plan_files WHERE client_id`, (2) `nutrition_plans` name lookup by plan_id.
  Returns `PlanFileWithName[]` (NutritionPlanFileRow + `plan_name: string | null`).
- `PlanFileWithName` type also exported from `nutrition-plans.repository.ts`.

**Why:** media_library table is for CMS assets (blog/service images) — not client files. Client and plan files live in separate tables and needed a unified read-only browser view.
