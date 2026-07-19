-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Storage upload fixes
--
-- Problems fixed:
--   1. Bucket file_size_limit was 10 MB but UI advertises 50 MB →
--      raise limit to 52 428 800 bytes (50 MiB) to match.
--   2. admin_all_storage policy used a plain subquery on admin_profiles,
--      which relies on admin_profiles RLS being SELECT-permissive for the
--      calling user's own row. A SECURITY DEFINER helper function is more
--      explicit, bypasses row-level security on admin_profiles, and avoids
--      subtle "0 rows returned" failures when the RLS filter is evaluated
--      in the storage policy context.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── 1. Raise the bucket size limit to 50 MiB ────────────────────────────────
UPDATE storage.buckets
SET file_size_limit = 52428800   -- 50 MiB
WHERE id = 'media';

-- ─── 2. SECURITY DEFINER helper: is the current user an admin / staff? ────────
--
-- Runs as the function owner (postgres superuser), so it reads admin_profiles
-- without being filtered by the table's own row-level security.  The function
-- is STABLE (no side effects, same result within a statement) and SECURITY
-- DEFINER (elevated privileges for the SELECT only).
CREATE OR REPLACE FUNCTION public.is_shelan_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
  );
$$;

-- ─── 3. Replace admin_all_storage with the helper-based version ───────────────
DROP POLICY IF EXISTS "admin_all_storage" ON storage.objects;

CREATE POLICY "admin_all_storage"
  ON storage.objects FOR ALL TO authenticated
  USING  (bucket_id = 'media' AND public.is_shelan_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_shelan_admin());
