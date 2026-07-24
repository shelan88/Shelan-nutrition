-- ============================================================
-- SHELAN — admin_profiles UPDATE policy
--
-- The tightened RLS in 20260716000002_auth_setup.sql intentionally
-- dropped FOR ALL and replaced it with SELECT-only to prevent
-- privilege escalation via self-INSERT.  That is correct.
--
-- However, it also blocked legitimate self-UPDATE operations such
-- as writing avatar_url after a successful storage upload.  The
-- storage upload returns a URL but the subsequent DB write affects
-- 0 rows silently (no error, no effect) — so avatar_url is never
-- persisted and the public navbar always shows the initials fallback.
--
-- Fix: add a scoped UPDATE policy.
--   • USING      — the row being targeted must belong to the caller
--   • WITH CHECK — the written row must still belong to the caller
--                  (prevents reassigning user_id to another uid)
-- ============================================================

CREATE POLICY "auth_update_own_admin_profile"
  ON admin_profiles FOR UPDATE TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
