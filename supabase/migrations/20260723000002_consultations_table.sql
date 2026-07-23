-- ─── Consultations table ──────────────────────────────────────────────────────
-- Separate from `programs` — these are bookable consultation packages shown in
-- the Booking / Pricing section of the public site.

-- Ensure the shared updated_at trigger helper exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS consultations (
  id               uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en         text          NOT NULL,
  title_ar         text,
  subtitle_en      text,
  subtitle_ar      text,
  description_en   text,
  description_ar   text,
  price            numeric(10,2),
  currency         text          DEFAULT '$',
  period_en        text,         -- e.g. "one-time", "/ month"
  period_ar        text,
  duration_en      text,         -- e.g. "45 minutes", "4 sessions monthly"
  duration_ar      text,
  features_en      text[]        DEFAULT '{}',
  features_ar      text[]        DEFAULT '{}',
  cta_text_en      text,
  cta_text_ar      text,
  badge_en         text,         -- e.g. "Most Popular"; NULL = no badge
  badge_ar         text,
  icon             text,
  gradient         text,
  discount_enabled boolean       NOT NULL DEFAULT false,
  discount_percent numeric(5,2),
  active           boolean       NOT NULL DEFAULT false,
  sort_order       integer       DEFAULT 0,
  created_at       timestamptz   DEFAULT now(),
  updated_at       timestamptz   DEFAULT now()
);

-- Enforce valid discount range (0–100)
ALTER TABLE consultations
  ADD CONSTRAINT consultations_discount_percent_check
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

-- Auto-update timestamp
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'consultations_updated_at'
  ) THEN
    CREATE TRIGGER consultations_updated_at
      BEFORE UPDATE ON consultations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Public visitors can read active packages
CREATE POLICY "Public read active consultations"
  ON consultations FOR SELECT
  USING (active = true);

-- Authenticated admin gets full access
CREATE POLICY "Admin full access consultations"
  ON consultations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Seed with the three existing hardcoded plans ─────────────────────────────
-- Only inserts when the table is empty (safe to re-run)
INSERT INTO consultations
  (title_en, title_ar, price, currency,
   period_en, period_ar, duration_en, duration_ar,
   features_en, features_ar,
   cta_text_en, cta_text_ar,
   badge_en, badge_ar,
   active, sort_order)
SELECT * FROM (VALUES
  (
    'Single Diagnostic Session', 'جلسة تشخيصية واحدة',
    120::numeric, '$',
    'one-time', 'دفعة واحدة',
    '45 minutes', '٤٥ دقيقة',
    ARRAY['In-depth health & lifestyle assessment','Personalized initial recommendations','Written session summary'],
    ARRAY['تقييم شامل للحالة الصحية ونمط الحياة','توصيات أولية مخصصة لكِ','ملخص مكتوب للجلسة'],
    'Book Now', 'احجزي الآن',
    NULL::text, NULL::text,
    true, 0
  ),
  (
    'Comprehensive Follow-up Package', 'باقة المتابعة الشاملة',
    350::numeric, '$',
    '/ month', '/ شهريًا',
    '4 sessions monthly', '٤ جلسات شهريًا',
    ARRAY['Full personalized nutrition plan','Weekly check-ins & adjustments','Direct messaging support','Lipedema-specific progress tracking','Printable meal & movement guides'],
    ARRAY['خطة تغذية شخصية متكاملة','متابعة أسبوعية وتعديل الخطة','دعم مباشر عبر الرسائل','تتبع تقدّم خاص بالليبيديما','أدلة قابلة للطباعة للأكل والحركة'],
    'Book Now', 'احجزي الآن',
    'Most Popular', 'الأكثر طلبًا',
    true, 1
  ),
  (
    'Ready-Made Custom Plan', 'الخطة المخصصة الجاهزة',
    65::numeric, '$',
    'one-time', 'دفعة واحدة',
    'PDF delivery', 'تسليم PDF',
    ARRAY['Tailored nutrition plan (PDF)','Delivered within 48 hours','One follow-up question included'],
    ARRAY['خطة تغذية مخصصة بصيغة PDF','التسليم خلال ٤٨ ساعة','سؤال متابعة واحد مُتضمّن'],
    'Book Now', 'احجزي الآن',
    NULL::text, NULL::text,
    true, 2
  )
) AS v(title_en,title_ar,price,currency,period_en,period_ar,duration_en,duration_ar,
       features_en,features_ar,cta_text_en,cta_text_ar,badge_en,badge_ar,active,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM consultations LIMIT 1);
