-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Client Portal
-- Adds profile columns to clients, links auth.users, tightens RLS so clients
-- can only read/update their own records.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── 1. Extend clients table ──────────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS user_id            UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url         TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth      DATE,
  ADD COLUMN IF NOT EXISTS city               TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS bio                TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id);

-- ─── Helper: is the current user an admin or staff? ───────────────────────────
-- Used in all admin USING clauses below.
-- EXISTS is safe — returns false when admin_profiles has no matching row.

-- ─── 2. clients — admin full access + client self-access ─────────────────────

DROP POLICY IF EXISTS "auth_all_clients"   ON clients;
DROP POLICY IF EXISTS "admin_all_clients"  ON clients;
DROP POLICY IF EXISTS "client_own_select"  ON clients;
DROP POLICY IF EXISTS "client_own_update"  ON clients;

-- Admins/staff: all operations on all rows
CREATE POLICY "admin_all_clients"
  ON clients FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
  ));

-- Clients: read their own row
CREATE POLICY "client_own_select"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Clients: update their own row (profile editing)
CREATE POLICY "client_own_update"
  ON clients FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── 3. nutrition_plans ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_all_plans"     ON nutrition_plans;
DROP POLICY IF EXISTS "admin_all_plans"    ON nutrition_plans;
DROP POLICY IF EXISTS "client_own_plans"   ON nutrition_plans;

CREATE POLICY "admin_all_plans"
  ON nutrition_plans FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_plans"
  ON nutrition_plans FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 4. nutrition_plan_files ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_all_plan_files"   ON nutrition_plan_files;
DROP POLICY IF EXISTS "admin_all_plan_files"  ON nutrition_plan_files;
DROP POLICY IF EXISTS "client_own_plan_files" ON nutrition_plan_files;

ALTER TABLE nutrition_plan_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_plan_files"
  ON nutrition_plan_files FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_plan_files"
  ON nutrition_plan_files FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 5. uploaded_files ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_all_files"    ON uploaded_files;
DROP POLICY IF EXISTS "admin_all_files"   ON uploaded_files;
DROP POLICY IF EXISTS "client_own_files"  ON uploaded_files;

CREATE POLICY "admin_all_files"
  ON uploaded_files FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 6. appointments ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_all_appointments"    ON appointments;
DROP POLICY IF EXISTS "admin_all_appointments"   ON appointments;
DROP POLICY IF EXISTS "client_own_appointments"  ON appointments;

CREATE POLICY "admin_all_appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- Clients see their own appointments (matched by user_id OR by linked client row)
CREATE POLICY "client_own_appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- ─── 7. timeline_events ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_all_timeline"   ON timeline_events;
DROP POLICY IF EXISTS "admin_all_timeline"  ON timeline_events;
DROP POLICY IF EXISTS "client_own_timeline" ON timeline_events;

CREATE POLICY "admin_all_timeline"
  ON timeline_events FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_timeline"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 8. progress_entries ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_all_progress_entries"  ON progress_entries;
DROP POLICY IF EXISTS "client_own_progress_entries" ON progress_entries;

CREATE POLICY "admin_all_progress_entries"
  ON progress_entries FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_progress_entries"
  ON progress_entries FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 9. progress_photos ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admin_all_progress_photos"  ON progress_photos;
DROP POLICY IF EXISTS "client_own_progress_photos" ON progress_photos;

CREATE POLICY "admin_all_progress_photos"
  ON progress_photos FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "client_own_progress_photos"
  ON progress_photos FOR SELECT
  TO authenticated
  USING (client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  ));

-- ─── 10. assessment_responses — add client self-read policy ──────────────────

DROP POLICY IF EXISTS "client_own_assessment_responses" ON assessment_responses;

CREATE POLICY "client_own_assessment_responses"
  ON assessment_responses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
