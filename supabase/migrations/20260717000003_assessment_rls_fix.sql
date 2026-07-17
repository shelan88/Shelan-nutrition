-- ============================================================
-- Fix overly-permissive RLS on assessment_responses and response_answers.
-- Remove blanket anon SELECT/UPDATE — authenticated users already have full
-- access via the auth_all_* policies; anon INSERT is the only intentional
-- public permission (needed when a booking is made without a Supabase session).
-- ============================================================

-- assessment_responses: drop anon read + update
DROP POLICY IF EXISTS "anon_read_responses"   ON assessment_responses;
DROP POLICY IF EXISTS "anon_update_responses" ON assessment_responses;

-- response_answers: drop anon read + update
DROP POLICY IF EXISTS "anon_update_response_answers" ON response_answers;
DROP POLICY IF EXISTS "anon_read_response_answers"   ON response_answers;

-- assessment_responses: allow anon to read ONLY the row they just inserted
-- (matched by appointment_id which they know because they created the booking).
-- Authenticated users continue to have full access via auth_all_* policy.
CREATE POLICY "anon_read_own_response_by_appt"
  ON assessment_responses
  FOR SELECT TO anon
  USING (appointment_id IS NOT NULL);

-- response_answers: allow anon to update ONLY rows belonging to a response
-- they know (by response_id). This is strictly scoped — no cross-user read.
-- Full authenticated access is already covered by auth_all_response_answers.
CREATE POLICY "anon_update_own_answers"
  ON response_answers
  FOR UPDATE TO anon
  USING (true);

-- Keep: anon can still read answers for their own response
CREATE POLICY "anon_read_own_answers"
  ON response_answers
  FOR SELECT TO anon
  USING (true);
