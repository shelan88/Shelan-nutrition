-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — Nutrition Plans module
-- Creates nutrition_plans and nutrition_plan_files tables.
-- Replaces the old placeholder nutrition_plans table (plan_data JSONB schema)
-- which contained no real data.
-- ──────────────────────────────────────────────────────────────────────────────

-- Drop old placeholder table (safe — had no production data)
DROP TABLE IF EXISTS nutrition_plans CASCADE;

-- ─── nutrition_plans ─────────────────────────────────────────────────────────
-- Each logical "plan" can have multiple versions (same plan_group_id).
-- Creating a new version inserts a new row; old rows are preserved as history.

CREATE TABLE nutrition_plans (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Version tracking
  plan_group_id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  version                    INTEGER     NOT NULL DEFAULT 1,

  -- Plan metadata
  name                       TEXT        NOT NULL,
  description                TEXT,
  start_date                 DATE,
  end_date                   DATE,
  status                     TEXT        NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'active', 'completed', 'archived')),

  -- Meals: JSONB keyed by meal slot
  -- { breakfast, morning_snack, lunch, afternoon_snack, dinner, evening_snack }
  -- Each value: { title, description, instructions, notes }
  meals                      JSONB       NOT NULL DEFAULT '{}',

  -- Additional content
  water_intake_goal          TEXT,
  steps_goal                 TEXT,
  exercise_recommendations   TEXT,
  supplement_recommendations TEXT,
  general_instructions       TEXT,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nutrition_plans_client_id     ON nutrition_plans (client_id);
CREATE INDEX idx_nutrition_plans_plan_group_id ON nutrition_plans (plan_group_id, version DESC);
CREATE INDEX idx_nutrition_plans_status        ON nutrition_plans (status);

-- ─── nutrition_plan_files ────────────────────────────────────────────────────

CREATE TABLE nutrition_plan_files (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID        NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  client_id   UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  filename    TEXT        NOT NULL,
  url         TEXT        NOT NULL,
  file_type   TEXT        NOT NULL DEFAULT 'document'
              CHECK (file_type IN ('pdf', 'image', 'document')),
  size        INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nutrition_plan_files_plan_id   ON nutrition_plan_files (plan_id);
CREATE INDEX idx_nutrition_plan_files_client_id ON nutrition_plan_files (client_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE nutrition_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plan_files ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admins) can do everything
CREATE POLICY "admin_manage_nutrition_plans"
  ON nutrition_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "admin_manage_nutrition_plan_files"
  ON nutrition_plan_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Helper: updated_at trigger ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER nutrition_plans_updated_at
  BEFORE UPDATE ON nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
