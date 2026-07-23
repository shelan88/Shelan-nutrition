-- Programs CMS migration: subtitle, badge, CTA, gradient, currency, discount
-- Idempotent — safe to re-run.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS subtitle_en      text,
  ADD COLUMN IF NOT EXISTS subtitle_ar      text,
  ADD COLUMN IF NOT EXISTS currency         text DEFAULT '$',
  ADD COLUMN IF NOT EXISTS cta_text_en      text,
  ADD COLUMN IF NOT EXISTS cta_text_ar      text,
  ADD COLUMN IF NOT EXISTS badge_en         text,
  ADD COLUMN IF NOT EXISTS badge_ar         text,
  ADD COLUMN IF NOT EXISTS gradient         text,
  ADD COLUMN IF NOT EXISTS discount_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2);

-- Enforce valid discount percentage range (0–100), allow NULL (no discount)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'programs_discount_percent_check'
  ) THEN
    ALTER TABLE programs
      ADD CONSTRAINT programs_discount_percent_check
      CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
  END IF;
END $$;
