-- ─────────────────────────────────────────────────────────────────────────────
-- about_section_settings — section-level visibility flags for the About page.
--
-- One row per major section that needs an independent show/hide control:
--   'qualifications'  → the Qualifications bullet list inside About.tsx
--   'expertise'       → the Areas of Expertise bullet list inside About.tsx
--
-- Certifications section visibility is already stored in about_certifications_settings.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.about_section_settings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text        NOT NULL UNIQUE,   -- 'qualifications' | 'expertise'
  visible     boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.about_section_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_about_section_settings"
  ON public.about_section_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_all_about_section_settings"
  ON public.about_section_settings FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));

-- ── updated_at trigger ────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_about_section_settings_updated_at ON public.about_section_settings;

CREATE TRIGGER set_about_section_settings_updated_at
  BEFORE UPDATE ON public.about_section_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Seed ─────────────────────────────────────────────────────────────────────
INSERT INTO public.about_section_settings (section_key, visible) VALUES
  ('qualifications', true),
  ('expertise',      true)
ON CONFLICT (section_key) DO NOTHING;
