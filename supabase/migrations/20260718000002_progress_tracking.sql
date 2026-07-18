-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Progress Tracking module
-- Tables: progress_entries, progress_photos
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── progress_entries ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS progress_entries (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  entry_date          DATE        NOT NULL DEFAULT CURRENT_DATE,

  -- Body weight & height
  weight_kg           NUMERIC(6,2),
  height_cm           NUMERIC(5,1),
  bmi                 NUMERIC(5,2),   -- auto-calculated: weight / (height/100)^2

  -- Circumferences
  waist_cm            NUMERIC(5,1),
  hip_cm              NUMERIC(5,1),
  thigh_cm            NUMERIC(5,1),
  arm_cm              NUMERIC(5,1),
  chest_cm            NUMERIC(5,1),

  -- Optional body composition
  body_fat_pct        NUMERIC(5,2),
  muscle_mass_pct     NUMERIC(5,2),
  water_pct           NUMERIC(5,2),

  -- Goal
  goal_weight_kg      NUMERIC(6,2),

  -- Notes
  nutritionist_notes  TEXT,
  client_notes        TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_entries_client_id
  ON progress_entries (client_id, entry_date DESC);

-- ─── progress_photos ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS progress_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    UUID        NOT NULL REFERENCES progress_entries(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photo_type  TEXT        NOT NULL CHECK (photo_type IN ('front', 'side', 'back')),
  url         TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_entry_id
  ON progress_photos (entry_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_progress_entries"
  ON progress_entries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_progress_photos"
  ON progress_photos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

-- Reuse the function created by the nutrition plans migration if it exists,
-- otherwise create it.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER progress_entries_updated_at
  BEFORE UPDATE ON progress_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
