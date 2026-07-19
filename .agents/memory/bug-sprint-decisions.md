---
name: Bug Sprint Decisions
description: Key fixes and decisions from the stabilization bug-fix sprint — data flow corrections, missing pages, and broken workflows.
---

## Appointments table schema
- Columns are `date` (DATE) and `time` (TEXT), NOT `appointment_date`/`appointment_time`.
- Status values: `scheduled | confirmed | completed | cancelled`.
- **Why:** BookingFlow.tsx dynamic slot query must use `.eq("date", selectedDate)` and `.select("time")`.

## nutrition_plans schema (v2)
- Old schema (v1): `(id, client_id UNIQUE, plan_data JSONB)` — replaced by migration 20260718000001.
- New schema (v2): 17 columns — `plan_group_id`, `version`, `name`, `start_date`, `end_date`, `status`, `meals` (JSONB), `general_instructions`, etc.
- `NutritionPlan` type in clients.ts now has optional `status?: string` and `planId?: string`.
- Mapper in clients.repository.ts populates `nutritionPlan` from joined nutrition_plans rows (active → draft → first). Calories=0, macros=[] for v2 rows.

## Admin Settings page
- `AdminSettingsPage` covers: working hours, appointment config, notifications.
- Reads/writes to `website_settings` table using keys: `working_hours`, `appointment_config`, `notification_config`.
- Does NOT overlap with `WebsiteSettingsPage` (content) or `AdminProfilePage` (personal/auth).

## Sidebar live data
- `SidebarUser` now accepts `name`, `initials`, `role` props — no longer hardcoded.
- Messages badge reads from `getUnreadCount()` (messages.repository) — refreshed every 60s.
- Admin user name/role fetched from `supabase.auth.getUser()` + `admin_profiles` table on mount.

## Navigation canonical routes
- `/admin/website-builder` route REMOVED — canonical is `/admin/website-settings`.
- Nav item href updated from `/admin/website-builder` to `/admin/website-settings`.

## Client Edit in drawer
- Edit overlay uses absolute positioning inside the drawer panel (`position: absolute, inset: 0`).
- Fields: fullName, fullNameAr, phone, email, age, gender, country, status, medicalNotes, medicalNotesAr.
- Calls `updateClient(client.id, editForm)` then `onRefresh()`.
- Uses `form-input` + `form-input-label` CSS utilities (both now exist in index.css).

## form-input-label CSS class
- Added to `src/index.css` scoped under `.admin-shell`.
- `form-input` existed; `form-input-label` was missing — added in bug sprint.

## Dashboard flagged count
- Replaced hardcoded "2 flagged" with live count: `store.assessmentEntries.filter(e => e.risk === "High").length`.
