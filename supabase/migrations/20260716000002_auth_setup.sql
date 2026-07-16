-- ============================================================
-- SHELAN Nutrition Clinic — Auth Setup Migration
-- Task #7: Wire Supabase Auth to admin portal
--
-- Changes:
--   1. Link admin_profiles.user_id to auth.users(id) via FK
--   2. Tighten admin_profiles RLS so each user can only manage
--      their own profile row (reads own row, admins can read all)
-- ============================================================

-- Add foreign key from admin_profiles.user_id → auth.users(id)
-- Use IF NOT EXISTS pattern via DO block for idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_profiles_user_id_fkey'
      AND table_name = 'admin_profiles'
  ) THEN
    ALTER TABLE admin_profiles
      ADD CONSTRAINT admin_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tighten admin_profiles RLS:
--   Authenticated users may ONLY read their own profile row.
--   No INSERT/UPDATE/DELETE is permitted via the anon key — staff accounts
--   must be provisioned by a superuser/service-role key (e.g. in the
--   Supabase dashboard or a secure server-side admin script).
--
--   This prevents privilege escalation: a freshly-authenticated non-staff
--   user cannot write their own admin_profiles row to gain access.
DROP POLICY IF EXISTS "auth_all_admin_profiles" ON admin_profiles;

CREATE POLICY "auth_select_own_admin_profile"
  ON admin_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
