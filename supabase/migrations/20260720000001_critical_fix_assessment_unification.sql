-- ============================================================
-- Critical Fix Pack 1 — Assessment Unification & DB Integrity
-- ============================================================
--
-- Problems fixed:
--   1. assessment_responses lacks score/risk columns → all scoring
--      data lived only in the legacy `assessments` table
--   2. Dashboard and client overview read from `assessments` (wrong);
--      assessment wizard writes to `assessment_responses` (right)
--   3. template_questions.type CHECK excludes `scale` and `rating`
--   4. appointments.user_id and client_email columns have no migrations
--      (added to DB via dashboard but never versioned)
--   5. appointments.user_id has no FK to auth.users
--   6. Missing performance indexes on high-frequency RLS join columns
--   7. Legacy assessments data never migrated to assessment_responses
-- ============================================================

-- ─── 1. Add scoring columns to assessment_responses ────────────────────────
-- These mirror the legacy `assessments` table columns so the new system
-- can store the same risk-scoring data after a questionnaire is scored.

ALTER TABLE assessment_responses
  ADD COLUMN IF NOT EXISTS score                NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS risk_level           TEXT,
  ADD COLUMN IF NOT EXISTS risk_percentage      NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS diagnosis_category   TEXT,
  ADD COLUMN IF NOT EXISTS diagnosis_category_ar TEXT;

-- ─── 2. Fix template_questions.type CHECK — add scale and rating ────────────
-- C-4: Inserting a scale or rating question silently failed with a constraint
-- violation. The CHECK must match the full set of types the UI offers.

ALTER TABLE template_questions
  DROP CONSTRAINT IF EXISTS template_questions_type_check;

ALTER TABLE template_questions
  ADD CONSTRAINT template_questions_type_check
  CHECK (type IN (
    'short_text','paragraph','yes_no',
    'single_choice','multiple_choice','dropdown',
    'number','date','file_upload','image_upload',
    'scale','rating'
  ));

-- ─── 3. Add missing appointments columns to version control ────────────────
-- user_id and client_email exist in the live DB and TypeScript types but
-- were never in a migration. This makes them reproducible.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS user_id      UUID,
  ADD COLUMN IF NOT EXISTS client_email TEXT;

-- ─── 4. Add FK: appointments.user_id → auth.users(id) ─────────────────────
-- Without this FK, referential integrity between bookings and auth users is
-- not enforced at the database level. Use SET NULL on delete so cancelling
-- an auth account does not cascade-delete the appointment record.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'appointments_user_id_fkey'
       AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 5. Create legacy template for migrating old assessments data ───────────
-- Old assessments (from the pre-template wizard) don't have a template_id,
-- but assessment_responses.template_id is NOT NULL. We insert a sentinel
-- "Legacy Assessment" template row with a well-known UUID so the migration
-- can reference it without violating the FK.

INSERT INTO assessment_templates (id, name_en, name_ar, description_en, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Legacy Assessment',
  'تقييم قديم',
  'Migrated from pre-template assessment wizard',
  false
)
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Migrate legacy assessments → assessment_responses ──────────────────
-- Copy every legacy assessment row into assessment_responses so that the
-- dashboard, client overview, and all other reads have ONE canonical table.
-- Guard with NOT EXISTS to make this idempotent (safe to re-run).

INSERT INTO assessment_responses (
  template_id,
  client_id,
  status,
  submitted_at,
  created_at,
  score,
  risk_level,
  risk_percentage,
  diagnosis_category,
  diagnosis_category_ar
)
SELECT
  '00000000-0000-0000-0000-000000000001' AS template_id,
  a.client_id,
  'submitted'                            AS status,
  a.submitted_at,
  a.created_at,
  a.score,
  a.risk_level,
  a.risk_percentage,
  a.diagnosis_category,
  a.diagnosis_category_ar
FROM assessments a
WHERE a.client_id IS NOT NULL
  AND NOT EXISTS (
    -- Skip if already migrated (same client + same submitted_at timestamp)
    SELECT 1
    FROM assessment_responses ar
    WHERE ar.client_id      = a.client_id
      AND ar.template_id    = '00000000-0000-0000-0000-000000000001'
      AND ar.submitted_at   = a.submitted_at
  );

-- ─── 7. Performance indexes ─────────────────────────────────────────────────
-- clients.user_id — hit by EVERY RLS policy on nutrition_plans, progress_*,
-- uploaded_files, appointments, timeline_events (all do subquery
-- "SELECT id FROM clients WHERE user_id = auth.uid()").
-- Without this index every portal page load is a full seq-scan on clients.

CREATE INDEX IF NOT EXISTS idx_clients_user_id
  ON clients (user_id);

-- assessment_responses — queried by client_id on every portal and admin page.
CREATE INDEX IF NOT EXISTS idx_assessment_responses_client_id
  ON assessment_responses (client_id);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_status
  ON assessment_responses (status);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_submitted_at
  ON assessment_responses (submitted_at DESC);

-- appointments — portal and admin filter by both user_id and client_id.
CREATE INDEX IF NOT EXISTS idx_appointments_user_id
  ON appointments (user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id
  ON appointments (client_id);

-- ─── 8. Tighten RLS for assessment_responses ────────────────────────────────
-- The original broad "auth_all_assessment_responses" policy allows any
-- authenticated user to read every response. Replace with admin-full /
-- client-own scoping that matches the rest of the system.

DROP POLICY IF EXISTS "auth_all_assessment_responses"  ON assessment_responses;
DROP POLICY IF EXISTS "admin_all_assessment_responses" ON assessment_responses;
DROP POLICY IF EXISTS "client_own_assessment_responses" ON assessment_responses;

CREATE POLICY "admin_all_assessment_responses"
  ON assessment_responses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  );

CREATE POLICY "client_own_assessment_responses"
  ON assessment_responses FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- anon policies for the public wizard are kept as-is from assessment_system migration.

-- ─── 9. Tighten RLS for response_answers (same pattern) ────────────────────
DROP POLICY IF EXISTS "auth_all_response_answers"   ON response_answers;
DROP POLICY IF EXISTS "admin_all_response_answers"  ON response_answers;
DROP POLICY IF EXISTS "client_own_response_answers" ON response_answers;

CREATE POLICY "admin_all_response_answers"
  ON response_answers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  );

CREATE POLICY "client_own_response_answers"
  ON response_answers FOR SELECT TO authenticated
  USING (
    response_id IN (
      SELECT id FROM assessment_responses
       WHERE client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
          OR user_id = auth.uid()
    )
  );
