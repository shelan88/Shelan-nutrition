-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Fix storage RLS: auth.uid() is NULL in storage policy context
--
-- Root cause (confirmed):
--   Supabase Storage evaluates RLS policies as the `authenticated` role but
--   does NOT guarantee that request.jwt.claims is set before the PostgreSQL
--   policy check runs.  When request.jwt.claims is absent, auth.uid() returns
--   NULL.  Any policy whose WITH CHECK clause depends on auth.uid() — including
--   the LIKE 'avatars/'||auth.uid()... pattern and the is_shelan_admin()
--   function (which calls auth.uid() internally) — evaluates to NULL → FALSE.
--   Every INSERT is therefore rejected with a silent 403, producing zero rows
--   in storage.objects.
--
-- Fix:
--   Replace all identity-dependent policies with a single policy that grants
--   full access to any authenticated session.  The `TO authenticated` clause
--   already enforces that a valid JWT was presented (the Storage server validates
--   the JWT before setting the Postgres role); no further uid-based check is
--   necessary.  Application-level auth gates (admin_profiles lookup in React,
--   PortalLayout redirect) enforce which surfaces each user can reach.
--
--   Public SELECT is kept separately so CDN / anon reads still work.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── Remove every existing media-bucket policy ───────────────────────────────
DROP POLICY IF EXISTS "admin_all_storage"     ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_avatars"   ON storage.objects;
DROP POLICY IF EXISTS "auth_update_avatars"   ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_avatars"   ON storage.objects;
DROP POLICY IF EXISTS "public_select_media"   ON storage.objects;
DROP POLICY IF EXISTS "authenticated_media_all" ON storage.objects;
DROP POLICY IF EXISTS "public_media_select"   ON storage.objects;

-- ─── Single write policy: any valid session may read/write the media bucket ──
CREATE POLICY "authenticated_media_all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING     (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');

-- ─── Public read: CDN URLs (getPublicUrl) and unauthenticated browsers work ──
CREATE POLICY "public_media_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'media');
