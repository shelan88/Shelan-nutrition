-- ─────────────────────────────────────────────────────────────────────────────
-- About page CMS — qualifications, expertise, certifications
-- ─────────────────────────────────────────────────────────────────────────────

-- ── about_qualifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_qualifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  text_en    text        NOT NULL DEFAULT '',
  text_ar    text        NOT NULL DEFAULT '',
  active     boolean     NOT NULL DEFAULT true,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── about_expertise ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_expertise (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  text_en    text        NOT NULL DEFAULT '',
  text_ar    text        NOT NULL DEFAULT '',
  active     boolean     NOT NULL DEFAULT true,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── about_certifications_settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_certifications_settings (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  visible        boolean     NOT NULL DEFAULT true,
  heading_en     text        NOT NULL DEFAULT 'Training & Certifications',
  heading_ar     text        NOT NULL DEFAULT 'التدريب والشهادات',
  description_en text,
  description_ar text,
  bg_color       text        NOT NULL DEFAULT '#fdf0f5',
  note_en        text,
  note_ar        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── about_certifications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_certifications (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en     text        NOT NULL DEFAULT '',
  title_ar     text        NOT NULL DEFAULT '',
  subtitle_en  text,
  subtitle_ar  text,
  logo_url     text,
  initials     text,
  display_mode text        NOT NULL DEFAULT 'initials',  -- 'logo' | 'initials'
  active       boolean     NOT NULL DEFAULT true,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.about_qualifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_expertise               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_certifications_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_certifications          ENABLE ROW LEVEL SECURITY;

-- Public read (active items shown on the website)
CREATE POLICY "public_read_about_qualifications"
  ON public.about_qualifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_about_expertise"
  ON public.about_expertise      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_about_cert_settings"
  ON public.about_certifications_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_about_certifications"
  ON public.about_certifications FOR SELECT TO anon, authenticated USING (true);

-- Admin full access
CREATE POLICY "admin_all_about_qualifications"
  ON public.about_qualifications FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_about_expertise"
  ON public.about_expertise      FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_about_cert_settings"
  ON public.about_certifications_settings FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));
CREATE POLICY "admin_all_about_certifications"
  ON public.about_certifications FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));

-- ── updated_at triggers ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_about_qualifications_updated_at  ON public.about_qualifications;
DROP TRIGGER IF EXISTS set_about_expertise_updated_at        ON public.about_expertise;
DROP TRIGGER IF EXISTS set_about_cert_settings_updated_at    ON public.about_certifications_settings;
DROP TRIGGER IF EXISTS set_about_certifications_updated_at   ON public.about_certifications;

CREATE TRIGGER set_about_qualifications_updated_at
  BEFORE UPDATE ON public.about_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_about_expertise_updated_at
  BEFORE UPDATE ON public.about_expertise
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_about_cert_settings_updated_at
  BEFORE UPDATE ON public.about_certifications_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_about_certifications_updated_at
  BEFORE UPDATE ON public.about_certifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Storage bucket for certification logos ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cert-logos', 'cert-logos', true, 5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_cert_logos"      ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_cert_logos"     ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_cert_logos"     ON storage.objects;

CREATE POLICY "public_read_cert_logos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'cert-logos');
CREATE POLICY "admin_upload_cert_logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cert-logos' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "admin_delete_cert_logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cert-logos' AND
    EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid())
  );

-- ── Seed qualifications ───────────────────────────────────────────────────────
INSERT INTO public.about_qualifications (text_en, text_ar, sort_order) SELECT * FROM (VALUES
  ('Certified Holistic Nutritionist (CHN)',          'أخصائية تغذية شمولية معتمدة (CHN)',        0),
  ('Master Health Consultant',                       'كبيرة مستشاري الصحة',                       1),
  ('Lipedema Nutrition Specialist',                  'متخصصة في تغذية الليبيديما',                2),
  ('Gut Health & Microbiome Certificate',            'شهادة صحة الأمعاء والميكروبيوم',            3),
  ('Functional Nutrition Alliance — Full Body Systems', 'تحالف التغذية الوظيفية — Full Body Systems', 4),
  ('Anti-Inflammatory Nutrition (Precision Nutrition)', 'التغذية المضادة للالتهابات (Precision Nutrition)', 5)
) AS v(text_en, text_ar, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.about_qualifications LIMIT 1);

-- ── Seed expertise ────────────────────────────────────────────────────────────
INSERT INTO public.about_expertise (text_en, text_ar, sort_order) SELECT * FROM (VALUES
  ('Lipedema & Lymphedema Management',   'إدارة الليبيديما واللمفيديما',    0),
  ('Anti-Inflammatory Nutrition',        'التغذية المضادة للالتهابات',      1),
  ('Gut Health & Microbiome Restoration','استعادة صحة الأمعاء والميكروبيوم', 2),
  ('Hormonal Balance & Women''s Health', 'التوازن الهرموني وصحة المرأة',    3),
  ('Weight Management & Body Composition','إدارة الوزن وتركيب الجسم',      4),
  ('Chronic Inflammation & Autoimmune Support','دعم الالتهاب المزمن والمناعة الذاتية', 5)
) AS v(text_en, text_ar, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.about_expertise LIMIT 1);

-- ── Seed certifications settings ──────────────────────────────────────────────
INSERT INTO public.about_certifications_settings (
  visible, heading_en, heading_ar, description_en, description_ar, bg_color
)
SELECT true,
  'Training & Certifications',
  'التدريب والشهادات',
  'A foundation of clinical education combined with specialized expertise in the conditions that matter most to my clients.',
  'أساس من التعليم السريري مع خبرة متخصصة في الحالات الأكثر أهمية لعملائي.',
  '#fdf0f5'
WHERE NOT EXISTS (SELECT 1 FROM public.about_certifications_settings LIMIT 1);

-- ── Seed certification cards ──────────────────────────────────────────────────
INSERT INTO public.about_certifications (title_en, title_ar, subtitle_en, subtitle_ar, initials, display_mode, sort_order)
SELECT * FROM (VALUES
  ('Certified Holistic Nutritionist',     'أخصائية تغذية شمولية معتمدة',      'American College of Healthcare Sciences', 'American College of Healthcare Sciences', 'ACHS', 'initials', 0),
  ('Master Health Consultant',            'كبير مستشاري الصحة',               'Institute for Integrative Nutrition',    'Institute for Integrative Nutrition',    'IIN',  'initials', 1),
  ('Lipedema Nutrition Specialist',       'متخصصة في تغذية الليبيديما',        'Lipedema Foundation',                    'Lipedema Foundation',                    'LF',   'initials', 2),
  ('Gut Health & Microbiome Certificate', 'شهادة صحة الأمعاء والميكروبيوم',   'AFPA Nutrition',                         'AFPA Nutrition',                         'AFPA', 'initials', 3),
  ('Functional Nutrition Alliance',       'تحالف التغذية الوظيفية',            'Full Body Systems Program',               'Full Body Systems Program',              'FNA',  'initials', 4),
  ('Anti-Inflammatory Nutrition',         'التغذية المضادة للالتهابات',         'Precision Nutrition',                    'Precision Nutrition',                    'PN',   'initials', 5)
) AS v(title_en, title_ar, subtitle_en, subtitle_ar, initials, display_mode, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.about_certifications LIMIT 1);
