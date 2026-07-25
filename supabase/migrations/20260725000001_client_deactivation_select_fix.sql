-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Fix account deactivation blocked by SELECT RLS policy
--
-- Root cause discovered via isolation testing:
--   PostgreSQL applies every FOR SELECT policy's USING expression as an
--   implicit AND constraint on the NEW ROW during any UPDATE.
--
--   The current client_own_select policy:
--     USING (user_id = auth.uid())
--
--   When deactivateOwnAccount sets user_id → NULL, the new row has
--   user_id = NULL.  PostgreSQL evaluates:
--     NULL = auth.uid()  →  NULL  →  treated as FALSE
--
--   This raises HTTP 403 / Postgres error 42501
--   "new row violates row-level security policy for table 'clients'"
--   even though client_own_update.WITH_CHECK correctly allows user_id IS NULL.
--
-- Fix:
--   Extend client_own_select USING to also accept deactivated rows that
--   belong to the calling user by email.  The second condition
--   (user_id IS NULL AND email = auth.email()) is email-scoped:
--
--   • No user can see another user's deactivated row — they'd need
--     auth.email() to match the row's email, which is unique per user.
--   • The deactivating user can complete the UPDATE (new-row check passes
--     via the second condition).
--   • An already-inactive row surfaced to its original owner is benign:
--     the app signs the user out immediately after deactivation.
--   • Unclaimed pre-portal rows (user_id IS NULL) are also matched by
--     email — this is intentional and already relied upon by
--     upsert_client_from_auth for back-filling user_id on first login.
--
-- No application code changes required.
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "client_own_select" ON public.clients;

CREATE POLICY "client_own_select"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    -- Active / linked rows: user owns this row
    user_id = auth.uid()
    OR
    -- Deactivated / unclaimed rows: row email matches this user's verified email.
    -- Secure because auth.email() is per-user; no user can satisfy this for
    -- another user's email.
    (user_id IS NULL AND email = auth.email())
  );
