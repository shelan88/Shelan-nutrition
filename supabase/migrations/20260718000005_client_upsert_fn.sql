-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Safe client self-registration RPC
--
-- Problem: The clients RLS (migration 20260718000003) removed broad INSERT/UPDATE
-- access. `upsertClientFromAuth` runs from the browser as the signed-in user, so:
--   • INSERT: blocked — no client INSERT policy exists.
--   • Backfill UPDATE: blocked — USING (user_id = auth.uid()) does not match rows
--     where user_id IS NULL (unclaimed, pre-portal accounts).
--   • Deactivation: blocked — WITH CHECK (user_id = auth.uid()) rejects setting
--     user_id to null.
--
-- Fix A — SECURITY DEFINER function that derives identity entirely from JWT claims
--   (auth.uid() / auth.email()) inside the function body; never trusts any
--   caller-supplied identity parameters. Runs with elevated privileges to
--   bypass RLS, but is tightly scoped to the calling user's own data.
--
-- Fix B — Relax clients UPDATE WITH CHECK to allow user_id = NULL (soft-delete).
-- ──────────────────────────────────────────────────────────────────────────────

-- Drop the old version (different signature) if it exists
DROP FUNCTION IF EXISTS public.upsert_client_from_auth(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- ─── A. SECURITY DEFINER upsert — identity derived from JWT, not parameters ───

CREATE OR REPLACE FUNCTION public.upsert_client_from_auth(
  p_name        TEXT,
  p_initials    TEXT,
  p_color       TEXT,
  p_status      TEXT,
  p_risk_level  TEXT,
  p_join_date   TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID;
  v_email     TEXT;
  v_client_id UUID;
BEGIN
  -- Identity is derived exclusively from the JWT — caller cannot override this.
  v_uid   := auth.uid();
  v_email := auth.email();

  IF v_uid IS NULL OR v_email IS NULL THEN
    RAISE EXCEPTION 'upsert_client_from_auth: caller is not authenticated';
  END IF;

  -- Look for an existing client row with this verified email.
  SELECT id INTO v_client_id
  FROM clients
  WHERE email = v_email
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    -- Back-fill user_id if unclaimed (user_id IS NULL) OR already this user.
    -- Never reassigns a row already claimed by a different user.
    UPDATE clients
    SET user_id = v_uid
    WHERE id = v_client_id
      AND (user_id IS NULL OR user_id = v_uid);
  ELSE
    -- Create a minimal client row linked to the authenticated user.
    INSERT INTO clients (
      user_id, full_name, email, initials, avatar_color,
      status, risk_level, join_date, risk_indicators, consultations
    ) VALUES (
      v_uid, p_name, v_email, p_initials, p_color,
      p_status, p_risk_level, p_join_date::DATE, '[]'::jsonb, '[]'::jsonb
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_client_id;

    -- Handle race condition: if another concurrent request inserted first, find it.
    IF v_client_id IS NULL THEN
      SELECT id INTO v_client_id
      FROM clients
      WHERE email = v_email
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_client_id;
END;
$$;

-- Only authenticated users may call this function.
REVOKE ALL ON FUNCTION public.upsert_client_from_auth(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.upsert_client_from_auth(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ─── B. Relax clients UPDATE WITH CHECK for account deactivation ──────────────
-- USING (user_id = auth.uid()) ensures only the row owner can touch it.
-- WITH CHECK is relaxed to allow user_id = NULL (soft-delete / deactivation)
-- while blocking any other UID from being written into the row.

DROP POLICY IF EXISTS "client_own_update" ON clients;
CREATE POLICY "client_own_update"
  ON clients FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
