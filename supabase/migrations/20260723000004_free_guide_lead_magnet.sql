-- ─────────────────────────────────────────────────────────────────────────────
-- Free Guide / Lead Magnet system
-- Tables: free_guide_settings (single-row config) + lead_emails (collected addresses)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── free_guide_settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.free_guide_settings (
  id                       uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en                 text        NOT NULL DEFAULT '5 Steps to Control Lipedema Pain',
  title_ar                 text        NOT NULL DEFAULT '5 خطوات للسيطرة على آلام الليبيديما',
  subtitle_en              text,
  subtitle_ar              text,
  description_en           text,
  description_ar           text,
  cta_text_en              text        NOT NULL DEFAULT 'Download Free Guide',
  cta_text_ar              text        NOT NULL DEFAULT 'تحميل الدليل المجاني',
  pdf_url                  text,                           -- public URL to the uploaded PDF
  email_collection_enabled boolean     NOT NULL DEFAULT true,
  active                   boolean     NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ── lead_emails ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_emails (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.free_guide_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_emails         ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can read guide settings
CREATE POLICY "public_read_free_guide_settings"
  ON public.free_guide_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can do everything to guide settings
CREATE POLICY "admin_all_free_guide_settings"
  ON public.free_guide_settings FOR ALL
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));

-- Anyone (anon visitors) can insert a lead email
CREATE POLICY "public_insert_lead_emails"
  ON public.lead_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read/delete lead emails
CREATE POLICY "admin_manage_lead_emails"
  ON public.lead_emails FOR ALL
  TO authenticated
  USING   (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));

-- ── updated_at trigger ────────────────────────────────────────────────────────
-- (reuse or create the function — CREATE OR REPLACE is idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_free_guide_settings_updated_at ON public.free_guide_settings;
CREATE TRIGGER set_free_guide_settings_updated_at
  BEFORE UPDATE ON public.free_guide_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Seed default row ──────────────────────────────────────────────────────────
-- Only insert if the table is empty (idempotent seed)
INSERT INTO public.free_guide_settings (
  title_en, title_ar,
  subtitle_en, subtitle_ar,
  description_en, description_ar,
  cta_text_en, cta_text_ar,
  email_collection_enabled, active
)
SELECT
  '5 Steps to Control Lipedema Pain',
  '5 خطوات للسيطرة على آلام الليبيديما',
  'Your Complete Free Guide',
  'دليلك الشامل المجاني',
  'A practical comprehensive guide from a specialist — immediately actionable steps to improve your life',
  'دليل عملي شامل من خبيرة متخصصة — خطوات قابلة للتطبيق فوراً لتحسين حياتك',
  'Download Free Guide',
  'تحميل الدليل المجاني',
  true, true
WHERE NOT EXISTS (SELECT 1 FROM public.free_guide_settings);
