-- Allow paid bookings to be created before an appointment is coordinated.
-- Existing appointments keep their date/time and continue using the current
-- availability and timezone behavior.
ALTER TABLE public.appointments
  ALTER COLUMN date DROP NOT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_phone TEXT;