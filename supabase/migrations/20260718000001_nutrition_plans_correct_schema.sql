-- ============================================================
-- Fix nutrition_plans schema — drop old single-row-per-client
-- table and replace with the multi-version schema the
-- NutritionPlansTab repository expects.
-- ============================================================

-- Drop old tables if they exist
DROP TABLE IF EXISTS nutrition_plan_files CASCADE;
DROP TABLE IF EXISTS nutrition_plans      CASCADE;

-- ─── nutrition_plans ─────────────────────────────────────────
-- Each logical plan is identified by plan_group_id.
-- Editing content inserts a new row (version++) — old row kept.
CREATE TABLE nutrition_plans (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Version tracking: all versions of one logical plan share plan_group_id
  plan_group_id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  version                    INTEGER     NOT NULL DEFAULT 1,

  -- Metadata
  name                       TEXT        NOT NULL,
  description                TEXT,
  start_date                 DATE,
  end_date                   DATE,
  status                     TEXT        NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','active','completed','archived')),

  -- Meals stored as JSONB keyed by slot name
  meals                      JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- Additional guidance
  water_intake_goal          TEXT,
  steps_goal                 TEXT,
  exercise_recommendations   TEXT,
  supplement_recommendations TEXT,
  general_instructions       TEXT,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_plans_client    ON nutrition_plans (client_id);
CREATE INDEX idx_nutrition_plans_group     ON nutrition_plans (plan_group_id);
CREATE INDEX idx_nutrition_plans_updated   ON nutrition_plans (updated_at DESC);

ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
-- anon: no access (clinical data)
CREATE POLICY "auth_all_nutrition_plans"
  ON nutrition_plans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── nutrition_plan_files ─────────────────────────────────────
CREATE TABLE nutrition_plan_files (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID        NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
  client_id  UUID        NOT NULL REFERENCES clients(id)         ON DELETE CASCADE,
  filename   TEXT        NOT NULL,
  url        TEXT        NOT NULL,
  file_type  TEXT        NOT NULL CHECK (file_type IN ('pdf','image','document')),
  size       BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_plan_files_plan   ON nutrition_plan_files (plan_id);
CREATE INDEX idx_nutrition_plan_files_client ON nutrition_plan_files (client_id);

ALTER TABLE nutrition_plan_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_plan_files"
  ON nutrition_plan_files FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── updated_at trigger ───────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_nutrition_plans_updated_at'
  ) THEN
    CREATE TRIGGER trg_nutrition_plans_updated_at
      BEFORE UPDATE ON nutrition_plans
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END; $$;
