-- ============================================================
-- Harden assessment RLS to least-privilege.
--
-- Assessment submissions always happen from an authenticated session
-- (booking requires sign-in). Anonymous users never need to read or update
-- existing assessment rows. Remove every anon SELECT/UPDATE policy introduced
-- in the previous migration, keeping only anon INSERT (for edge-case bookings
-- where the session token hasn't propagated yet).
-- ============================================================

-- Remove all anon read/update on assessment_responses
DROP POLICY IF EXISTS "anon_read_own_response_by_appt" ON assessment_responses;
DROP POLICY IF EXISTS "anon_read_responses"             ON assessment_responses;
DROP POLICY IF EXISTS "anon_update_responses"           ON assessment_responses;

-- Remove all anon read/update on response_answers
DROP POLICY IF EXISTS "anon_read_own_answers"     ON response_answers;
DROP POLICY IF EXISTS "anon_update_own_answers"   ON response_answers;
DROP POLICY IF EXISTS "anon_update_response_answers" ON response_answers;
DROP POLICY IF EXISTS "anon_read_response_answers"   ON response_answers;

-- What remains for anon on these tables:
--   assessment_responses → INSERT only  (policy "anon_insert_assessment_responses")
--   response_answers     → INSERT only  (policy "anon_insert_response_answers")
--
-- What remains for authenticated on all tables:
--   Full access via the auth_all_* policies created in the first migration.
--
-- This achieves least privilege: authenticated users own all read/write,
-- anonymous users can only insert (no cross-row read or update).
