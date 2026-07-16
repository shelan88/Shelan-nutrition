-- ============================================================
-- SHELAN Nutrition Clinic — Initial PostgreSQL Schema
-- Applied via: psql or Supabase Dashboard > SQL Editor
--
-- Enum values use the same casing as the TypeScript interfaces
-- (e.g. 'Female', 'Low', 'Active') so repository inserts work
-- without a mapping layer.
--
-- RLS strategy — LEAST PRIVILEGE:
--   anon  → INSERT on assessments (public wizard)
--           INSERT on messages (public contact form)
--           INSERT on appointments (public booking)
--           SELECT on published blog_posts, active services,
--                   published testimonials, media_library,
--                   website_settings (public website reads)
--           NO access to clients, timeline, nutrition_plans,
--                   uploaded_files, admin_profiles
--   authenticated → full CRUD everywhere (wired in Task #7)
--
-- NOTE: Until Supabase Auth is configured, the admin portal falls
-- back to mock data for all clinical tables. Task #7 wires auth
-- and unlocks the authenticated role policies below.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. clients  — admin-only; no anon access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             TEXT NOT NULL,
  full_name_ar          TEXT,
  email                 TEXT,
  phone                 TEXT,
  age                   INTEGER,
  gender                TEXT CHECK (gender IN ('Female','Male','Other')),
  status                TEXT CHECK (status IN ('Active','Inactive','Waiting','Completed')) DEFAULT 'Waiting',
  risk_level            TEXT CHECK (risk_level IN ('Low','Medium','High','Critical')),
  risk_percentage       NUMERIC(5,2),
  occupation            TEXT,
  location              TEXT,
  height                NUMERIC(5,1),
  weight                NUMERIC(5,1),
  bmi                   NUMERIC(4,1),
  blood_type            TEXT,
  medical_conditions    TEXT[],
  allergies             TEXT[],
  medications           TEXT[],
  initials              TEXT,
  avatar_color          TEXT,
  join_date             DATE,
  last_visit            DATE,
  diagnosis_category    TEXT,
  diagnosis_category_ar TEXT,
  notes                 TEXT,
  notes_ar              TEXT,
  consultations         JSONB DEFAULT '[]'::JSONB,
  risk_indicators       JSONB DEFAULT '[]'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- No anon policy — patient data requires authentication
CREATE POLICY "auth_all_clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2. assessments — anon INSERT (public wizard); admin reads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES clients(id) ON DELETE CASCADE,
  score                 INTEGER,
  risk_level            TEXT CHECK (risk_level IN ('Low','Medium','High','Critical')),
  risk_percentage       NUMERIC(5,2),
  diagnosis_category    TEXT,
  diagnosis_category_ar TEXT,
  answers               JSONB,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
-- anon may only submit new assessments (Assessment Wizard)
CREATE POLICY "anon_insert_assessments" ON assessments FOR INSERT TO anon         WITH CHECK (true);
CREATE POLICY "auth_all_assessments"    ON assessments FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. timeline_events — admin-only; no anon access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID REFERENCES clients(id) ON DELETE CASCADE,
  event      TEXT NOT NULL,
  event_ar   TEXT,
  type       TEXT CHECK (type IN ('appointment','assessment','note','plan','message','system','booking','consultation','followup')),
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_timeline" ON timeline_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. nutrition_plans — admin-only; no anon access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  plan_data  JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_plans" ON nutrition_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. uploaded_files — admin-only; no anon access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  type        TEXT,
  size        BIGINT,
  uploaded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_files" ON uploaded_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. appointments — anon INSERT (public booking); admin reads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  date        DATE NOT NULL,
  time        TEXT,
  type        TEXT,
  status      TEXT CHECK (status IN ('scheduled','confirmed','completed','cancelled')) DEFAULT 'scheduled',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon         WITH CHECK (true);
CREATE POLICY "auth_all_appointments"    ON appointments FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 7. messages — anon INSERT (public contact form); admin reads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name   TEXT NOT NULL,
  sender_email  TEXT,
  sender_phone  TEXT,
  content       TEXT NOT NULL,
  status        TEXT CHECK (status IN ('unread','read','replied')) DEFAULT 'unread',
  source        TEXT CHECK (source IN ('website','assessment','admin')) DEFAULT 'website',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- anon may only submit new contact messages
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon         WITH CHECK (true);
CREATE POLICY "auth_all_messages"    ON messages FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 8. blog_posts — anon SELECT published only (public website)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en     TEXT NOT NULL,
  title_ar     TEXT,
  slug         TEXT UNIQUE NOT NULL,
  excerpt_en   TEXT,
  excerpt_ar   TEXT,
  content_en   TEXT,
  content_ar   TEXT,
  cover_image  TEXT,
  published    BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  tags         TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_blog" ON blog_posts FOR SELECT TO anon         USING (published = true);
CREATE POLICY "auth_all_blog"    ON blog_posts FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 9. services — anon SELECT active only (public website)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en          TEXT NOT NULL,
  name_ar          TEXT,
  description_en   TEXT,
  description_ar   TEXT,
  price            NUMERIC(10,2),
  duration_minutes INTEGER,
  active           BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon         USING (active = true);
CREATE POLICY "auth_all_services"    ON services FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 10. testimonials — anon SELECT published only (public website)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name    TEXT NOT NULL,
  client_name_ar TEXT,
  content_en     TEXT NOT NULL,
  content_ar     TEXT,
  rating         INTEGER CHECK (rating BETWEEN 1 AND 5),
  published      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_testimonials" ON testimonials FOR SELECT TO anon         USING (published = true);
CREATE POLICY "auth_all_testimonials"    ON testimonials FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 11. media_library — anon SELECT (embedded on public website)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  type        TEXT CHECK (type IN ('image','video','document')),
  size        BIGINT,
  uploaded_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_media" ON media_library FOR SELECT TO anon         USING (true);
CREATE POLICY "auth_all_media"    ON media_library FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 12. website_settings — anon SELECT (public website config)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS website_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_settings" ON website_settings FOR SELECT TO anon         USING (true);
CREATE POLICY "auth_all_settings"    ON website_settings FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 13. admin_profiles — authenticated only; no anon access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE,  -- links to auth.users once Supabase Auth is enabled
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT CHECK (role IN ('admin','staff')) DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_admin_profiles" ON admin_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- Indexes for performance
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_email         ON clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_phone         ON clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_status        ON clients (status);
CREATE INDEX IF NOT EXISTS idx_clients_risk_level    ON clients (risk_level);
CREATE INDEX IF NOT EXISTS idx_clients_created_at    ON clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_client    ON assessments (client_id);
CREATE INDEX IF NOT EXISTS idx_assessments_submitted ON assessments (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_client       ON timeline_events (client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date         ON timeline_events (date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status       ON messages (status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_published        ON blog_posts (published, published_at DESC);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clients_updated_at')     THEN CREATE TRIGGER trg_clients_updated_at     BEFORE UPDATE ON clients         FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_nutrition_updated_at')    THEN CREATE TRIGGER trg_nutrition_updated_at    BEFORE UPDATE ON nutrition_plans  FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blog_updated_at')         THEN CREATE TRIGGER trg_blog_updated_at         BEFORE UPDATE ON blog_posts       FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_services_updated_at')     THEN CREATE TRIGGER trg_services_updated_at     BEFORE UPDATE ON services         FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_testimonials_updated_at') THEN CREATE TRIGGER trg_testimonials_updated_at BEFORE UPDATE ON testimonials     FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_settings_updated_at')     THEN CREATE TRIGGER trg_settings_updated_at     BEFORE UPDATE ON website_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_updated_at')        THEN CREATE TRIGGER trg_admin_updated_at        BEFORE UPDATE ON admin_profiles   FOR EACH ROW EXECUTE FUNCTION set_updated_at(); END IF;
END; $$;
