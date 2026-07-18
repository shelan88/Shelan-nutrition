---
name: Critical Fix Pack 1 — Assessment Unification & DB Integrity
description: All decisions and patterns from the Critical Fix Pack 1 implementation. Covers assessment table unification, DB integrity FKs, CMS table migrations, CheckoutModal client_id fix.
---

# Critical Fix Pack 1 — Durable Decisions

## Assessment system — single canonical table

**Rule:** `assessment_responses` is the ONE canonical table. `assessments` is legacy and frozen.

- Dashboard reads from `assessment_responses` (filter `status = 'submitted'`)
- `clients.repository.ts` FULL_SELECT joins `assessment_responses`, not `assessments`
- `createClient` and `saveAssessment` write to `assessment_responses` using legacy template UUID `00000000-0000-0000-0000-000000000001`
- Portal `AssessmentsPage` and admin `ClientProfilePage` AssessmentsTab already read from `assessment_responses` — no change needed

**Why:** Dashboard was reading from `assessments` (old manual-entry table) while the questionnaire wizard writes to `assessment_responses`. Metrics were always zero even with real submissions.

**Legacy template UUID:** `00000000-0000-0000-0000-000000000001` — a sentinel "Legacy Assessment" row (active=false) that satisfies the NOT NULL FK on `assessment_responses.template_id` for legacy data writes. Never delete this row.

## FULL_SELECT nested join ordering

When using PostgREST nested selects for assessment data, `assessment_responses` returns an array. `mapRowToClient` sorts by `submitted_at DESC NULLS LAST` and takes `[0]` for the most recent. Filter to `status = 'submitted' OR score != null` before sorting.

## CheckoutModal — client_id must always be resolved

**Rule:** Before creating an appointment in CheckoutModal, look up `client_id` from `supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle()`. Pass this resolved `client_id` to both `createAppointment` and `createResponse`.

**Why:** Without client_id on assessment_responses, the portal AssessmentsPage could not find the response by client_id — it relied only on appointment_id or user_id, which broke for clients who completed the portal profile flow before booking.

## Assessment after booking — always create response + redirect

If `hasTemplate` is true after booking, ALWAYS: (1) create blank response with client_id, (2) close modal, (3) navigate to `/assessment/respond/:appointmentId`. No "success" screen until the assessment redirect path is fully executed. If `createResponse` fails, fall through to success state (don't leave user stuck).

## template_questions.type CHECK — includes scale and rating

Added `scale` and `rating` to the CHECK constraint in migration `20260720000001`. Always include these when recreating or seeding question type constraints.

## DB integrity — appointments

- `appointments.user_id` FK → `auth.users(id) ON DELETE SET NULL` — added in migration `20260720000001`
- `appointments.user_id` and `client_email` columns were not in any migration before this fix pack — they existed only in the live DB (added via dashboard)

## CMS tables — migrations required

`programs`, `faqs`, `success_stories` tables MUST be in `20260720000002` migration. Without these migrations a fresh DB setup leaves three admin pages broken. Tables have admin-scoped RLS (EXISTS on admin_profiles) and anon SELECT on published/active rows only.

## RLS on assessment_responses

After fix: `admin_all_assessment_responses` (ALL for admin/staff), `client_own_assessment_responses` (SELECT where client_id in own clients or user_id = auth.uid()), plus kept anon INSERT/UPDATE policies from original assessment migration.

## Performance indexes added

- `idx_clients_user_id` — critical; hit by EVERY portal RLS subquery
- `idx_assessment_responses_client_id`, `_status`, `_submitted_at`
- `idx_appointments_user_id`, `idx_appointments_client_id`
