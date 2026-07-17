-- ──────────────────────────────────────────────────────────────────────────────
-- SHELAN — schema updates for CMS completions
-- ──────────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────
-- 1. success_stories: redesign for before/after images + title + publish date
-- ──────────────────────────────────────────────
ALTER TABLE success_stories
  ADD COLUMN IF NOT EXISTS title_en        TEXT,
  ADD COLUMN IF NOT EXISTS title_ar        TEXT,
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS publish_date     DATE;

-- Preserve existing image_url as before_image_url
UPDATE success_stories
   SET before_image_url = image_url
 WHERE image_url IS NOT NULL
   AND before_image_url IS NULL;

-- Drop legacy columns
ALTER TABLE success_stories
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS before_description_en,
  DROP COLUMN IF EXISTS before_description_ar,
  DROP COLUMN IF EXISTS result_description_en,
  DROP COLUMN IF EXISTS result_description_ar;

-- ──────────────────────────────────────────────
-- 2. messages: add archived flag
-- ──────────────────────────────────────────────
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_archived ON messages (archived);

-- anon role: allow INSERT (contact form) — already exists.
-- Ensure SELECT is allowed for authenticated only (no change needed).
