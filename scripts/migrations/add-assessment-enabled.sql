-- Migration: add per-item assessment_enabled flag to programs and consultations
-- Run once in the Supabase SQL Editor (project: zioslbbneoklfmbbetfn)

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS assessment_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS assessment_enabled boolean NOT NULL DEFAULT false;
