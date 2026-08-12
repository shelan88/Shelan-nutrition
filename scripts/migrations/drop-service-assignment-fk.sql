-- Migration: Drop FK constraint on service_template_assignments.service_id
-- 
-- The service_template_assignments table was originally designed with a FK to
-- the legacy `services` table. Since then, the project evolved to use separate
-- `programs` and `consultations` tables for service records. This FK prevents
-- assigning assessment templates to programs and consultations.
--
-- Run once in the Supabase SQL Editor (project: zioslbbneoklfmbbetfn)

ALTER TABLE service_template_assignments
  DROP CONSTRAINT IF EXISTS service_template_assignments_service_id_fkey;
