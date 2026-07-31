-- Migration: Add per-item availability settings to programs and consultations.
-- Run this once in the Supabase SQL Editor (https://supabase.com/dashboard).

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT NULL;

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT NULL;

-- Optional: add a comment describing the expected JSON shape
COMMENT ON COLUMN programs.availability IS
  '{"days":{"0":false,"1":true,"2":true,"3":true,"4":true,"5":true,"6":false},"slots":{"9:00 AM":true,...}}';
COMMENT ON COLUMN consultations.availability IS
  '{"days":{"0":false,"1":true,"2":true,"3":true,"4":true,"5":true,"6":false},"slots":{"9:00 AM":true,...}}';
