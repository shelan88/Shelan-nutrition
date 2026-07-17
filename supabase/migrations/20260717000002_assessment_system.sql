-- ============================================================
-- Assessment System Schema — Task #22
-- New tables: assessment_templates, template_questions, question_options,
--             service_template_assignments, assessment_responses, response_answers
-- Extends:    appointments (3 new columns)
-- ============================================================

-- 1. assessment_templates
CREATE TABLE IF NOT EXISTS assessment_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en        TEXT NOT NULL,
  name_ar        TEXT,
  description_en TEXT,
  description_ar TEXT,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_assessment_templates"
  ON assessment_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_active_templates"
  ON assessment_templates FOR SELECT TO anon USING (active = true);

-- 2. template_questions
CREATE TABLE IF NOT EXISTS template_questions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id             UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL CHECK (type IN (
                            'short_text','paragraph','yes_no',
                            'single_choice','multiple_choice','dropdown',
                            'number','date','file_upload','image_upload')),
  label_en                TEXT NOT NULL DEFAULT '',
  label_ar                TEXT,
  placeholder_en          TEXT,
  placeholder_ar          TEXT,
  help_en                 TEXT,
  help_ar                 TEXT,
  required                BOOLEAN NOT NULL DEFAULT false,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  conditional_question_id UUID,
  conditional_value       TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_template_questions"
  ON template_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_template_questions"
  ON template_questions FOR SELECT TO anon USING (true);

-- 3. question_options (for single_choice, multiple_choice, dropdown)
CREATE TABLE IF NOT EXISTS question_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES template_questions(id) ON DELETE CASCADE,
  label_en    TEXT NOT NULL DEFAULT '',
  label_ar    TEXT,
  value       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_question_options"
  ON question_options FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_question_options"
  ON question_options FOR SELECT TO anon USING (true);

-- 4. service_template_assignments (one template per service)
CREATE TABLE IF NOT EXISTS service_template_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_id)
);

ALTER TABLE service_template_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_service_template_assignments"
  ON service_template_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_service_template_assignments"
  ON service_template_assignments FOR SELECT TO anon USING (true);

-- 5. assessment_responses
CREATE TABLE IF NOT EXISTS assessment_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template_id    UUID NOT NULL REFERENCES assessment_templates(id),
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id        UUID,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','in_progress','submitted')),
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_assessment_responses"
  ON assessment_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_assessment_responses"
  ON assessment_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_read_responses"
  ON assessment_responses FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_responses"
  ON assessment_responses FOR UPDATE TO anon USING (true);

-- 6. response_answers
CREATE TABLE IF NOT EXISTS response_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES template_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_json JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(response_id, question_id)
);

ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_response_answers"
  ON response_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_insert_response_answers"
  ON response_answers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_response_answers"
  ON response_answers FOR UPDATE TO anon USING (true);
CREATE POLICY "anon_read_response_answers"
  ON response_answers FOR SELECT TO anon USING (true);

-- 7. Extend appointments with assessment columns
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS assessment_template_id UUID REFERENCES assessment_templates(id),
  ADD COLUMN IF NOT EXISTS assessment_response_id  UUID REFERENCES assessment_responses(id),
  ADD COLUMN IF NOT EXISTS assessment_status        TEXT DEFAULT 'none'
    CHECK (assessment_status IN ('none','awaiting_assessment','assessment_submitted'));

-- 8. updated_at trigger for assessment_templates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS assessment_templates_updated_at ON assessment_templates;
CREATE TRIGGER assessment_templates_updated_at
  BEFORE UPDATE ON assessment_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
