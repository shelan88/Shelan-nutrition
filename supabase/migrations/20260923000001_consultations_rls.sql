-- ============================================================
-- SHELAN — consultations RLS
-- ============================================================
--
-- Access model:
--   * Anonymous and signed-in public visitors may read active
--     consultation packages only.
--   * Admin/staff users identified by admin_profiles may read all
--     rows and perform the existing CMS CRUD/reorder operations.
--
-- The browser continues to use the normal Supabase anon client.
-- No service_role key is required or exposed.
--
-- This migration changes only RLS configuration. It does not change
-- the consultations schema or data.
-- ============================================================

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Replace the policies from the original table migration, if present.
-- These drops are safe when the live database currently has no policies.
DROP POLICY IF EXISTS "Public read active consultations" ON public.consultations;
DROP POLICY IF EXISTS "Admin full access consultations" ON public.consultations;
DROP POLICY IF EXISTS "consultations_public_select_active" ON public.consultations;
DROP POLICY IF EXISTS "consultations_admin_all" ON public.consultations;

-- Public website and booking flow:
-- applies to both logged-out visitors (anon) and signed-in clients
-- (authenticated), while exposing active packages only.
CREATE POLICY "consultations_public_select_active"
  ON public.consultations
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Existing admin authorization mechanism:
-- AuthGuard requires the same admin_profiles row and role before
-- rendering the admin portal. RLS repeats that check at the database
-- boundary so a non-admin authenticated user cannot use the browser
-- client to read or mutate CMS rows.
CREATE POLICY "consultations_admin_all"
  ON public.consultations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
        AND admin_profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_profiles
      WHERE admin_profiles.user_id = auth.uid()
        AND admin_profiles.role IN ('admin', 'staff')
    )
  );