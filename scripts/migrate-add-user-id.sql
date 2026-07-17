-- Add user_id and client_email to appointments for authenticated booking linkage.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS user_id      UUID,
  ADD COLUMN IF NOT EXISTS client_email TEXT;
