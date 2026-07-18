-- ============================================================
-- Fix: appointments INSERT policy missing for authenticated users
-- ============================================================
--
-- Root cause: migration 20260718000003_client_portal.sql dropped
-- the broad "auth_all_appointments" policy and replaced it with
-- "admin_all_appointments" (admins only) + "client_own_appointments"
-- (SELECT only). No INSERT policy was added for authenticated clients.
--
-- Effect: any logged-in client clicking "Book" gets:
--   "new row violates row-level security policy for table appointments"
-- createAppointment() returns null → "Could not create appointment."
--
-- The anon INSERT policy was left intact (for unauthenticated bookings).
-- We need the same for authenticated users, scoped so a user cannot
-- forge another user's user_id on their own booking row.
-- ============================================================

DROP POLICY IF EXISTS "auth_insert_appointments" ON appointments;

CREATE POLICY "auth_insert_appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    -- user_id must be either the caller's own auth.uid() or left NULL
    (user_id = auth.uid() OR user_id IS NULL)
  );
