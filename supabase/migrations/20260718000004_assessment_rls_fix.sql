-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Assessment RLS tightening (client portal security)
--
-- Problem: assessment_responses and response_answers had "auth_all_*" policies
-- (FOR ALL TO authenticated USING (true)) from the initial assessment migration.
-- The client portal migration added client-own SELECT policies, but since Postgres
-- ORs permissive policies, the broad auth_all policies let any authenticated user
-- read ALL responses/answers from all clients.
--
-- Fix: replace broad policies with:
--   • admin_all_*          — admin/staff get unrestricted full access
--   • client_own_select_*  — authenticated client reads only their own rows
--   • client_own_insert_*  — authenticated client inserts rows linked to themselves
--   • client_own_update_*  — authenticated client updates only their own rows
--
-- Anon INSERT policies (assessment wizard for unauthenticated users) are preserved.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── assessment_responses ─────────────────────────────────────────────────────

-- Drop the old broad policy (allows any authenticated user to read/write all rows)
DROP POLICY IF EXISTS "auth_all_assessment_responses" ON assessment_responses;

-- Admin/staff: full access
DROP POLICY IF EXISTS "admin_all_assessment_responses" ON assessment_responses;
CREATE POLICY "admin_all_assessment_responses"
  ON assessment_responses FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Authenticated clients: read only their own responses
DROP POLICY IF EXISTS "client_own_assessment_responses" ON assessment_responses;
CREATE POLICY "client_own_assessment_responses"
  ON assessment_responses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Authenticated clients: insert a new response linked to themselves
-- (assessment wizard runs while authenticated; user_id is set to auth.uid())
DROP POLICY IF EXISTS "client_own_insert_assessment_responses" ON assessment_responses;
CREATE POLICY "client_own_insert_assessment_responses"
  ON assessment_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Authenticated clients: update (submit) only their own responses
DROP POLICY IF EXISTS "client_own_update_assessment_responses" ON assessment_responses;
CREATE POLICY "client_own_update_assessment_responses"
  ON assessment_responses FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- ─── response_answers ─────────────────────────────────────────────────────────

-- Drop the old broad policy
DROP POLICY IF EXISTS "auth_all_response_answers" ON response_answers;

-- Admin/staff: full access
DROP POLICY IF EXISTS "admin_all_response_answers" ON response_answers;
CREATE POLICY "admin_all_response_answers"
  ON response_answers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Authenticated clients: read answers for their own responses only
DROP POLICY IF EXISTS "client_own_response_answers" ON response_answers;
CREATE POLICY "client_own_response_answers"
  ON response_answers FOR SELECT
  TO authenticated
  USING (
    response_id IN (
      SELECT id FROM assessment_responses
      WHERE user_id = auth.uid()
         OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  );

-- Authenticated clients: insert answers into their own responses (assessment wizard)
DROP POLICY IF EXISTS "client_own_insert_response_answers" ON response_answers;
CREATE POLICY "client_own_insert_response_answers"
  ON response_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    response_id IN (
      SELECT id FROM assessment_responses
      WHERE user_id = auth.uid()
         OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  );

-- Authenticated clients: update (save/upsert) answers in their own responses
DROP POLICY IF EXISTS "client_own_update_response_answers" ON response_answers;
CREATE POLICY "client_own_update_response_answers"
  ON response_answers FOR UPDATE
  TO authenticated
  USING (
    response_id IN (
      SELECT id FROM assessment_responses
      WHERE user_id = auth.uid()
         OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    response_id IN (
      SELECT id FROM assessment_responses
      WHERE user_id = auth.uid()
         OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    )
  );

-- ─── Anon policies preserved (unchanged) ──────────────────────────────────────
-- "anon_insert_assessment_responses" — kept (assessment wizard, unauthenticated INSERT)
-- "anon_insert_response_answers"     — kept (assessment wizard, unauthenticated INSERT)
