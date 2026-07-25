-- Add deleted_at column to clients table for archival tracking
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
