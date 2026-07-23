-- Add flexible duration unit to programs table
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS duration_unit text NOT NULL DEFAULT 'weeks';
-- Existing rows automatically get 'weeks' via the DEFAULT
