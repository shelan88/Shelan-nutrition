-- Add 'certifications' into about_section_settings so all three About page
-- sections use the same visibility table (qualifications / expertise / certifications).
INSERT INTO public.about_section_settings (section_key, visible)
VALUES ('certifications', true)
ON CONFLICT (section_key) DO NOTHING;
