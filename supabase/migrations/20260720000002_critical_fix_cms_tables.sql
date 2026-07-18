-- ============================================================
-- Critical Fix Pack 1 — CMS Table Migrations (C-2)
-- ============================================================
--
-- programs, faqs, and success_stories tables exist in the live Supabase
-- instance (created via dashboard) but have never had CREATE TABLE migrations.
-- A fresh database setup from migrations would leave these admin pages broken.
-- This migration makes the schema fully reproducible from the migration files.
-- ============================================================

-- ─── programs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en               TEXT NOT NULL DEFAULT '',
  name_ar               TEXT,
  short_description_en  TEXT,
  short_description_ar  TEXT,
  full_description_en   TEXT,
  full_description_ar   TEXT,
  icon                  TEXT,
  price                 NUMERIC(10,2),
  duration_weeks        INTEGER,
  features_en           TEXT[],
  features_ar           TEXT[],
  active                BOOLEAN NOT NULL DEFAULT true,
  sort_order            INTEGER DEFAULT 0,
  image_url             TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_active_programs"
  ON programs FOR SELECT TO anon
  USING (active = true);

CREATE POLICY "admin_all_programs"
  ON programs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  );

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_programs_updated_at'
  ) THEN
    CREATE TRIGGER trg_programs_updated_at
      BEFORE UPDATE ON programs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── faqs ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS faqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en  TEXT NOT NULL DEFAULT '',
  question_ar  TEXT,
  answer_en    TEXT NOT NULL DEFAULT '',
  answer_ar    TEXT,
  category     TEXT,
  sort_order   INTEGER DEFAULT 0,
  published    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_published_faqs"
  ON faqs FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "admin_all_faqs"
  ON faqs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  );

CREATE INDEX IF NOT EXISTS idx_faqs_published    ON faqs (published);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order   ON faqs (sort_order);

-- ─── success_stories ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS success_stories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en         TEXT,
  title_ar         TEXT,
  client_name_en   TEXT,
  client_name_ar   TEXT,
  story_en         TEXT,
  story_ar         TEXT,
  before_image_url TEXT,
  after_image_url  TEXT,
  publish_date     DATE,
  published        BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_published_stories"
  ON success_stories FOR SELECT TO anon
  USING (published = true);

CREATE POLICY "admin_all_success_stories"
  ON success_stories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
       WHERE user_id = auth.uid()
         AND role IN ('admin','staff')
    )
  );

CREATE INDEX IF NOT EXISTS idx_success_stories_published  ON success_stories (published);
CREATE INDEX IF NOT EXISTS idx_success_stories_sort_order ON success_stories (sort_order);

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_success_stories_updated_at'
  ) THEN
    CREATE TRIGGER trg_success_stories_updated_at
      BEFORE UPDATE ON success_stories
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
