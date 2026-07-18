-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — SECURITY DEFINER RPC for client self-profile update
--
-- Root cause: the direct JS supabase.from("clients").update(...).eq("id", …)
-- call relies on RLS (USING user_id = auth.uid()), but .single() returns a
-- "0 rows" error whenever the RLS filter excludes the row — silently failing
-- the write. A SECURITY DEFINER function derives the target row from auth.uid()
-- inside the function body, bypassing the RLS surface entirely.
--
-- Design:
--   • p_avatar_url NULL  → keep existing avatar_url (upload handled separately)
--   • p_avatar_url TEXT  → overwrite avatar_url with new value
--   • Empty strings for date_of_birth are rejected; caller must pass NULL.
--   • Validates gender against allowed values.
--   • Returns the full updated clients row.
-- ──────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.update_own_client_profile(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.update_own_client_profile(
  p_full_name          TEXT    DEFAULT NULL,
  p_phone              TEXT    DEFAULT NULL,   -- NULL = clear phone
  p_gender             TEXT    DEFAULT NULL,   -- NULL = clear gender
  p_location           TEXT    DEFAULT NULL,
  p_city               TEXT    DEFAULT NULL,
  p_date_of_birth      DATE    DEFAULT NULL,   -- NULL = clear DOB
  p_preferred_language TEXT    DEFAULT 'en',
  p_bio                TEXT    DEFAULT NULL,
  p_avatar_url         TEXT    DEFAULT NULL    -- NULL = keep existing avatar
)
RETURNS SETOF clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'update_own_client_profile: caller is not authenticated';
  END IF;

  -- Validate gender
  IF p_gender IS NOT NULL AND p_gender NOT IN ('Male', 'Female', 'Other') THEN
    RAISE EXCEPTION 'Invalid gender value: %', p_gender;
  END IF;

  RETURN QUERY
  UPDATE clients SET
    full_name          = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
    phone              = p_phone,
    gender             = p_gender::TEXT,
    location           = p_location,
    city               = p_city,
    date_of_birth      = p_date_of_birth,
    preferred_language = COALESCE(NULLIF(TRIM(p_preferred_language), ''), 'en'),
    bio                = p_bio,
    -- Only overwrite avatar_url when caller passes a non-NULL value
    avatar_url         = CASE
                           WHEN p_avatar_url IS NOT NULL THEN p_avatar_url
                           ELSE avatar_url
                         END
  WHERE user_id = v_uid
  RETURNING *;
END;
$$;

-- Only authenticated users may call this function
REVOKE ALL ON FUNCTION public.update_own_client_profile(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_client_profile(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT
) TO authenticated;
