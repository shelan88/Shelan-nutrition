-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Storage bucket policies for the media bucket
--
-- Root cause: no storage.objects policies existed for authenticated users,
-- so avatar uploads from the client portal silently failed with a 403.
--
-- Strategy:
--   • Ensure the `media` bucket exists and is public (images served directly).
--   • Clients may INSERT/UPDATE/DELETE ONLY within avatars/{their-uid}/.
--   • Admins (admin_profiles) may INSERT/UPDATE/DELETE anywhere in the bucket.
--   • Everyone (anon + authenticated) may SELECT from the bucket (public CDN).
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── 1. Ensure bucket exists ──────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('media', 'media', true, 10485760)   -- 10 MB limit
ON CONFLICT (id) DO UPDATE
  SET public          = true,
      file_size_limit = 10485760;

-- ─── 2. Drop old / conflicting policies ──────────────────────────────────────

DROP POLICY IF EXISTS "auth_insert_avatars"  ON storage.objects;
DROP POLICY IF EXISTS "auth_update_avatars"  ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_avatars"  ON storage.objects;
DROP POLICY IF EXISTS "admin_all_storage"    ON storage.objects;
DROP POLICY IF EXISTS "public_select_media"  ON storage.objects;

-- ─── 3. Clients — their own avatars folder only ───────────────────────────────

CREATE POLICY "auth_insert_avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND name LIKE 'avatars/' || auth.uid()::text || '/%'
  );

CREATE POLICY "auth_update_avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND name LIKE 'avatars/' || auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'media'
    AND name LIKE 'avatars/' || auth.uid()::text || '/%'
  );

CREATE POLICY "auth_delete_avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND name LIKE 'avatars/' || auth.uid()::text || '/%'
  );

-- ─── 4. Admins — full access to the whole bucket ─────────────────────────────

CREATE POLICY "admin_all_storage"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'staff')
    )
  );

-- ─── 5. Public read (avatars and files are served via public CDN) ─────────────

CREATE POLICY "public_select_media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');
