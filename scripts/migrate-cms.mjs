/**
 * migrate-cms.mjs — CMS schema migration
 *
 * Creates new tables (programs, faqs, success_stories) and adds columns to
 * services, blog_posts, and testimonials so the admin CMS can manage all content.
 *
 * Run: node scripts/migrate-cms.mjs
 */
import pg from "pg";

const { Client } = pg;

const PROJECT_REF = "zioslbbneoklfmbbetfn";
const DB_PASSWORD  = process.env.SUPABASE_DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("❌  SUPABASE_DB_PASSWORD not set.");
  process.exit(1);
}

const client = new Client({
  connectionString: `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- ── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en          text        NOT NULL,
  name_ar          text,
  short_description_en text,
  short_description_ar text,
  full_description_en  text,
  full_description_ar  text,
  icon             text        DEFAULT 'Star',
  price            numeric(10,2),
  duration_weeks   integer,
  features_en      text[]      DEFAULT '{}',
  features_ar      text[]      DEFAULT '{}',
  active           boolean     DEFAULT true,
  sort_order       integer     DEFAULT 0,
  image_url        text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS success_stories (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name_en          text        NOT NULL DEFAULT 'Anonymous',
  client_name_ar          text,
  story_en                text,
  story_ar                text,
  before_description_en   text,
  before_description_ar   text,
  result_description_en   text,
  result_description_ar   text,
  image_url               text,
  published               boolean     DEFAULT false,
  sort_order              integer     DEFAULT 0,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text        NOT NULL,
  question_ar text,
  answer_en   text        NOT NULL,
  answer_ar   text,
  category    text        DEFAULT 'general',
  sort_order  integer     DEFAULT 0,
  published   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ── Extend existing tables ───────────────────────────────────────────────────

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS short_description_en text,
  ADD COLUMN IF NOT EXISTS short_description_ar  text,
  ADD COLUMN IF NOT EXISTS icon                  text DEFAULT 'Star',
  ADD COLUMN IF NOT EXISTS image_url             text,
  ADD COLUMN IF NOT EXISTS slug                  text,
  ADD COLUMN IF NOT EXISTS details               jsonb DEFAULT '{}';

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS read_time_minutes integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS category          text    DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS author_name       text    DEFAULT 'Shelan',
  ADD COLUMN IF NOT EXISTS author_avatar     text,
  ADD COLUMN IF NOT EXISTS details           jsonb   DEFAULT '{}';

ALTER TABLE testimonials
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS role_en    text,
  ADD COLUMN IF NOT EXISTS role_ar    text;

-- Unique slug on services (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='services' AND indexname='services_slug_key'
  ) THEN
    CREATE UNIQUE INDEX services_slug_key ON services(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- ── RLS on new tables ────────────────────────────────────────────────────────

ALTER TABLE programs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS programs_public_read      ON programs;
DROP POLICY IF EXISTS programs_auth_all         ON programs;
DROP POLICY IF EXISTS stories_public_read       ON success_stories;
DROP POLICY IF EXISTS stories_auth_all          ON success_stories;
DROP POLICY IF EXISTS faqs_public_read          ON faqs;
DROP POLICY IF EXISTS faqs_auth_all             ON faqs;

CREATE POLICY programs_public_read  ON programs        FOR SELECT USING (true);
CREATE POLICY programs_auth_all     ON programs        FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY stories_public_read   ON success_stories FOR SELECT USING (true);
CREATE POLICY stories_auth_all      ON success_stories FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY faqs_public_read      ON faqs            FOR SELECT USING (true);
CREATE POLICY faqs_auth_all         ON faqs            FOR ALL    USING (auth.role() = 'authenticated');

-- ── Seed: services ────────────────────────────────────────────────────────────

INSERT INTO services
  (name_en, name_ar, description_en, description_ar,
   short_description_en, short_description_ar,
   price, duration_minutes, active, sort_order, icon, slug, details)
VALUES
(
  'General Nutrition',
  'التغذية العامة',
  'Personalized nutrition counseling built around your biology, your lifestyle, and your goals. No generic templates, no one-size-fits-all approaches — every recommendation is evidence-based and designed to fit your real life.',
  'استشارة تغذية مخصصة مبنية حول جسمكِ ونمط حياتكِ وأهدافكِ. لا قوالب جاهزة — كل توصية مبنية على الأدلة.',
  'Personalized nutrition plans to help you build sustainable habits, improve energy, and reach your wellness goals.',
  'خطط تغذية مخصصة تساعدكِ على بناء عادات مستدامة وتحسين الطاقة.',
  150, 60, true, 1, 'Salad', 'general-nutrition',
  '{"accentFrom":"from-soft-pink","accentTo":"to-primary-pink","whoIsItFor":{"headline":"Is This Right for You?","description":"Ideal for women who want a science-backed, personalized nutrition foundation.","points":["You feel tired or low on energy despite eating well","You want to manage your weight sustainably","You want expert guidance tailored to your culture and lifestyle"]},"benefits":{"headline":"What You Will Gain","items":["A fully personalized meal plan built around your goals","Clarity on your macronutrient and micronutrient needs","Strategies to manage cravings, energy dips, and emotional eating"]},"consultation":{"headline":"What Happens in Your Consultation","steps":[{"title":"Comprehensive Intake","description":"We review your full health history, eating patterns, lifestyle factors, sleep, and stress levels."},{"title":"Goal Setting","description":"We define clear, measurable, and realistic goals that genuinely motivate you."},{"title":"Personalized Plan Design","description":"I build your nutrition protocol from scratch: meal ideas, portions, food swaps, and supplements."},{"title":"Follow-Up Protocol","description":"Regular check-ins to track progress, answer questions, and keep you accountable."}]},"faq":[{"question":"How long before I see results?","answer":"Most clients notice changes in energy and digestion within 2–3 weeks. Weight management goals typically take 8–12 weeks."},{"question":"Do I have to follow a specific diet?","answer":"No mandatory diet style. Your plan is built around your food preferences and cultural background."}],"cta":{"headline":"Ready to Build Your Foundation?","description":"Start with a personalized nutrition consultation and discover what your body has been asking for.","buttonLabel":"Book Your Consultation"}}'
),
(
  'Lipedema Specialized Plan',
  'خطة الليبيديما المتخصصة',
  'A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema. As a Lipedema patient herself, Shelan brings both clinical expertise and lived experience to every protocol.',
  'بروتوكول تغذية مخصص يعالج الاحتياجات الالتهابية والأيضية الفريدة للليبيديما. كمريضة ليبيديما بنفسها، تجمع شيلان بين الخبرة السريرية والتجربة المعاشة.',
  'A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema.',
  'بروتوكول تغذية مخصص لاحتياجات الليبيديما الفريدة.',
  200, 90, true, 2, 'HeartPulse', 'lipedema-specialized-plan',
  '{"accentFrom":"from-soft-purple","accentTo":"to-lavender-purple","whoIsItFor":{"headline":"Is This Right for You?","description":"Specifically designed for women diagnosed with — or suspected to have — Lipedema.","points":["You have a diagnosis of Lipedema (Stage 1, 2, or 3)","Conventional dieting has not reduced the affected areas","You experience chronic pain or heaviness in affected areas"]},"benefits":{"headline":"What This Protocol Addresses","items":["Anti-inflammatory nutrition targeting Lipedema-related inflammation","Lymphatic-supportive eating strategies to reduce swelling","Hormonal balance through targeted dietary interventions"]},"consultation":{"headline":"What Happens in Your Consultation","steps":[{"title":"Lipedema-Specific Assessment","description":"A detailed intake covering Lipedema stage, affected areas, symptom severity, and hormone history."},{"title":"Inflammation Profiling","description":"We review relevant labs and assess dietary factors contributing to your inflammatory load."},{"title":"Custom Anti-Inflammatory Protocol","description":"Your nutrition plan is built around ketogenic-adjacent, anti-inflammatory, and lymphatic-supportive dietary patterns."},{"title":"Long-Term Management Plan","description":"Lipedema is lifelong. Your plan is designed for the long term with quarterly review protocols."}]},"faq":[{"question":"Can nutrition cure Lipedema?","answer":"Lipedema has no known cure. However, targeted nutrition significantly reduces inflammation, slows progression, and improves quality of life."},{"question":"Is a ketogenic diet mandatory?","answer":"Not mandatory, but often highly beneficial. Research shows that low-carbohydrate anti-inflammatory diets work best for Lipedema."}],"cta":{"headline":"Finally, Care That Understands You.","description":"Work with a specialist who has both the clinical knowledge and lived experience to guide you.","buttonLabel":"Book Your Consultation"}}'
),
(
  'Holistic Wellness Program',
  'برنامج العافية الشمولية',
  'A comprehensive 360-degree wellness program integrating nutrition, mindset, stress management, and lifestyle optimization into one cohesive plan for sustainable transformation.',
  'برنامج عافية شامل يدمج التغذية والعقلية وإدارة الإجهاد وتحسين نمط الحياة.',
  'A comprehensive wellness approach integrating nutrition, mindset, and lifestyle for sustainable transformation.',
  'نهج عافية شامل يدمج التغذية والعقلية ونمط الحياة للتحول المستدام.',
  250, 90, true, 3, 'Sparkles', 'holistic-wellness-program',
  '{"accentFrom":"from-primary-pink","accentTo":"to-lavender-purple","whoIsItFor":{"headline":"Is This Right for You?","description":"For women who understand that true health is more than a number on the scale.","points":["You want a holistic approach beyond just food","You are ready for deep, sustainable lifestyle change","You want to integrate mindset, stress, and sleep into your health"]},"benefits":{"headline":"What You Will Gain","items":["Comprehensive nutritional guidance tailored to your biology","Stress and sleep optimization strategies","Mindset tools for lasting behavioral change"]},"consultation":{"headline":"What Happens in Your Consultation","steps":[{"title":"360 Health Assessment","description":"We review nutrition, sleep, stress, movement, relationships, and mindset — the full picture."},{"title":"Personalized Wellness Roadmap","description":"A month-by-month plan addressing every pillar of your health systematically."},{"title":"Ongoing Accountability","description":"Regular check-ins, progress reviews, and plan iterations to keep you moving forward."}]},"faq":[{"question":"How is this different from standard nutrition counseling?","answer":"This program addresses your whole life — not just food. We look at stress, sleep, movement, and mindset as equally important pillars of health."},{"question":"How long does the program last?","answer":"The core program runs for 3 months, with optional continuation based on your goals and progress."}],"cta":{"headline":"Transform Your Whole Health.","description":"Begin a journey that goes beyond nutrition to address every dimension of your wellbeing.","buttonLabel":"Book Your Consultation"}}'
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: blog posts ─────────────────────────────────────────────────────────

INSERT INTO blog_posts
  (title_en, title_ar, slug, excerpt_en, excerpt_ar,
   content_en, content_ar, published, published_at, tags,
   read_time_minutes, category, author_name, details)
VALUES
(
  'Understanding Lipedema: The Complete Nutrition Guide',
  'فهم الليبيديما: دليل التغذية الشامل',
  'understanding-lipedema-nutrition-guide',
  'Lipedema affects an estimated 11% of women worldwide — yet most have never heard its name. Here is everything you need to know about the condition and how targeted nutrition can transform your quality of life.',
  'الليبيديما تصيب 1 من كل 9 نساء — ومع ذلك لم تسمع بها معظمهن. إليكِ كل ما تحتاجين معرفته عن الحالة وكيف يمكن للتغذية المستهدفة أن تحول جودة حياتكِ.',
  E'Lipedema is a chronic condition that affects an estimated 11% of women worldwide — yet the vast majority of those living with it have never heard its name. For years, women with Lipedema are told they simply need to eat less and move more, when in reality, the fat deposits associated with Lipedema are largely resistant to conventional diet and exercise.\n\nLipedema is a disorder of adipose (fat) tissue — a medical condition, not a lifestyle choice. It is characterized by the abnormal accumulation of fat cells, particularly in the lower body (legs, hips, buttocks) and sometimes the arms.\n\nWhile nutrition cannot cure Lipedema, it plays an enormously powerful role in managing symptoms, slowing progression, and improving quality of life. The key mechanism is inflammation — Lipedema tissue is characterized by chronic, low-grade inflammation, and everything we eat either adds to or reduces that inflammatory burden.\n\nAnti-inflammatory dietary patterns produce the most benefit for Lipedema patients. This includes Mediterranean-style eating, ketogenic approaches, and low-carbohydrate diets. The common thread is minimizing foods that drive inflammation — refined sugars, processed oils, ultra-processed foods — while maximizing those that reduce it.',
  E'الليبيديما هي حالة مزمنة تؤثر على ما يقدر بنحو 11٪ من النساء في جميع أنحاء العالم — ومع ذلك لم تسمع الغالبية العظمى من المصابات بها باسمها قط.\n\nالليبيديما هي اضطراب في الأنسجة الدهنية — حالة طبية، وليست خياراً في نمط الحياة. تتميز بالتراكم غير الطبيعي للخلايا الدهنية، وخاصة في الجزء السفلي من الجسم.\n\nbينما لا يمكن للتغذية أن تعالج الليبيديما، فإنها تلعب دوراً قوياً للغاية في إدارة الأعراض وإبطاء التقدم وتحسين جودة الحياة.',
  true,
  '2026-06-15',
  ARRAY['Lipedema','Anti-Inflammatory','Nutrition','Chronic Conditions'],
  12, 'Lipedema', 'Shelan',
  '{"accentFrom":"from-soft-purple","accentTo":"to-lavender-purple","featured":true}'
),
(
  '5 Anti-Inflammatory Foods Every Lipedema Patient Should Know',
  '5 أطعمة مضادة للالتهاب يجب أن تعرفها كل مريضة ليبيديما',
  '5-anti-inflammatory-foods-lipedema',
  'Fighting inflammation is one of the most powerful things you can do to manage Lipedema. These five foods should be staples in your kitchen.',
  'مكافحة الالتهاب هي من أقوى الأشياء التي يمكنكِ فعلها لإدارة الليبيديما. هذه الأطعمة الخمسة يجب أن تكون ثوابت في مطبخكِ.',
  E'Fighting inflammation is one of the most powerful things you can do to manage Lipedema. The condition is fundamentally driven by chronic, low-grade inflammation in the fat tissue — which means that what you eat every day either contributes to or helps resolve that inflammatory cycle.\n\nHere are five foods that consistently show up in research as beneficial for Lipedema patients — and that are easy to incorporate into your daily routine.\n\nSalmon and other fatty fish are among the richest dietary sources of omega-3 fatty acids, particularly EPA and DHA. These omega-3s are powerful anti-inflammatory agents that directly counteract the inflammatory processes driving Lipedema symptoms.\n\nExtra virgin olive oil contains oleocanthal, a compound with anti-inflammatory properties comparable to ibuprofen. Studies show that regular consumption of olive oil is associated with reduced markers of systemic inflammation.\n\nTurmeric contains curcumin, one of the most well-studied natural anti-inflammatory compounds. Combined with black pepper (which increases absorption by up to 2000%), it becomes a potent addition to any anti-inflammatory protocol.\n\nBlueberries and other dark berries are among the highest antioxidant foods available. Their anthocyanins directly combat oxidative stress and inflammation at the cellular level.\n\nLeafy greens like spinach, arugula, and kale are packed with vitamins, minerals, and phytonutrients that support every anti-inflammatory pathway in the body.',
  E'مكافحة الالتهاب هي من أقوى الأشياء التي يمكنكِ فعلها لإدارة الليبيديما.\n\nإليكِ خمسة أطعمة تظهر باستمرار في الأبحاث باعتبارها مفيدة لمرضى الليبيديما.\n\nالسمك الدهني كالسلمون والسردين من أغنى المصادر الغذائية بأحماض أوميغا 3 الدهنية.\n\nزيت الزيتون البكر يحتوي على مركب الأوليوكانثال الذي يمتلك خصائص مضادة للالتهاب مماثلة للإيبوبروفين.\n\nالكركم يحتوي على الكوركومين، أحد أكثر المركبات المضادة للالتهاب التي تم دراستها.\n\nالتوت الداكن من أعلى الأطعمة بمحتوى مضادات الأكسدة.',
  true,
  '2026-06-01',
  ARRAY['Lipedema','Anti-Inflammatory','Foods'],
  7, 'Lipedema', 'Shelan',
  '{"accentFrom":"from-primary-pink","accentTo":"to-soft-pink","featured":false}'
),
(
  'Gut Health & The Microbiome: Why It Matters More Than You Think',
  'صحة الأمعاء: لماذا الميكروبيوم أهم مما تعتقدين',
  'gut-health-connection',
  'Your gut bacteria affect everything from your immunity to your mood to your weight. Here is what the latest research reveals — and how to support your microbiome naturally.',
  'بكتيريا أمعائكِ تؤثر على كل شيء من مناعتكِ إلى مزاجكِ إلى وزنكِ. إليكِ ما تكشفه أحدث الأبحاث.',
  E'The gut microbiome — the trillions of bacteria, fungi, and other microorganisms living in your digestive tract — has emerged as one of the most important factors in overall health. Research over the past decade has revealed connections between the microbiome and virtually every aspect of human health, from digestion and immunity to mental health and metabolic function.\n\nFor women with Lipedema specifically, gut health is particularly relevant. Research suggests that gut dysbiosis (an imbalance in gut bacteria) may contribute to systemic inflammation — one of the core drivers of Lipedema symptoms.\n\nThe most powerful thing you can do to support your microbiome is to eat a wide variety of plants. Research consistently shows that microbiome diversity — which correlates with better health outcomes — is best predicted by the variety of plant foods you eat. Aim for at least 30 different plant foods per week.\n\nFermented foods like yogurt, kefir, kimchi, and sauerkraut contain live cultures that can directly support microbiome diversity. Studies show that even short-term consumption of fermented foods can meaningfully shift microbiome composition.',
  E'الميكروبيوم في الأمعاء — تريليونات البكتيريا والفطريات وغيرها من الكائنات الحية الدقيقة في الجهاز الهضمي — أصبح أحد أهم العوامل في الصحة العامة.\n\nبالنسبة للنساء المصابات بالليبيديما تحديداً، صحة الأمعاء ذات أهمية خاصة. تشير الأبحاث إلى أن عدم توازن بكتيريا الأمعاء قد يساهم في الالتهاب الجهازي.\n\nأقوى شيء يمكنكِ فعله لدعم الميكروبيوم هو تناول مجموعة واسعة من النباتات.',
  true,
  '2026-05-20',
  ARRAY['Gut Health','Microbiome','Inflammation','Probiotics'],
  9, 'Gut Health', 'Shelan',
  '{"accentFrom":"from-soft-pink","accentTo":"to-lavender-purple","featured":false}'
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: testimonials ───────────────────────────────────────────────────────

INSERT INTO testimonials
  (client_name, client_name_ar, content_en, content_ar, rating, published, role_en, role_ar)
VALUES
(
  'Lara H.',
  'لارا ح.',
  'Working with Shelan completely changed how I understand my body. For the first time, I have a plan that actually makes sense for my Lipedema — and I finally feel like someone truly gets it.',
  'العمل مع شيلان غيّر تماماً كيفية فهمي لجسدي. للمرة الأولى، لدي خطة منطقية لليبيديما.',
  5, true, 'Lipedema Patient', 'مريضة ليبيديما'
),
(
  'Nora M.',
  'نورا م.',
  'I lost 12 kg in 3 months following Shelan''s plan — but more importantly, I learned how to eat for my body for life. The energy difference alone was worth it.',
  'خسرت 12 كجم في 3 أشهر باتباع خطة شيلان — لكن الأهم أنني تعلمت كيف آكل لجسدي مدى الحياة.',
  5, true, 'Weight Management Client', 'عميلة إدارة الوزن'
),
(
  'Fatima R.',
  'فاطمة ر.',
  'I had tried everything before finding Shelan. Her approach is different — she genuinely listens, understands the science, and tailors everything to your actual life.',
  'جربت كل شيء قبل أن أجد شيلان. نهجها مختلف — هي تستمع حقاً وتفهم العلم.',
  5, true, 'General Nutrition Client', 'عميلة تغذية عامة'
)
ON CONFLICT DO NOTHING;

-- ── Seed: FAQs ────────────────────────────────────────────────────────────────

INSERT INTO faqs (question_en, question_ar, answer_en, answer_ar, category, sort_order, published)
VALUES
('How long before I see results?','متى سأرى النتائج؟','Most clients notice meaningful changes in energy and digestion within 2–3 weeks. Weight management goals typically take 8–12 weeks of consistent implementation.','يلاحظ معظم العملاء تغييرات ملموسة في الطاقة خلال 2-3 أسابيع.','general',1,true),
('Do I have to follow a specific diet?','هل يجب أن أتبع نظاماً غذائياً محدداً؟','Absolutely not. There is no mandatory diet style. Your plan is built around your food preferences, cultural background, and what is realistic for your daily life.','بالطبع لا. خطتكِ مبنية حول تفضيلاتكِ الغذائية وخلفيتكِ الثقافية.','general',2,true),
('Can nutrition cure Lipedema?','هل يمكن للتغذية علاج الليبيديما؟','Lipedema is a chronic condition with no known cure. However, targeted nutrition significantly reduces inflammation, slows progression, and dramatically improves quality of life.','الليبيديما حالة مزمنة لا علاج معروف لها. لكن التغذية المستهدفة تقلل الالتهاب بشكل كبير.','lipedema',3,true),
('Are online consultations available?','هل الاستشارات عبر الإنترنت متاحة؟','Yes! All consultations are available both online and in-person. Online sessions are conducted via video call and are just as effective.','نعم! جميع الاستشارات متاحة عبر الإنترنت وشخصياً.','general',4,true),
('What is included in the first consultation?','ما الذي يشمله الاستشارة الأولى؟','Your first consultation includes a comprehensive health history review, current eating patterns assessment, goal setting, and the start of your personalized nutrition plan.','تشمل استشارتكِ الأولى مراجعة شاملة للتاريخ الصحي وتقييم أنماط الأكل وتحديد الأهداف.','general',5,true),
('Do you work with clients outside Kuwait?','هل تعملين مع عملاء خارج الكويت؟','Yes! I work with clients across the GCC and internationally through online consultations. Location is no barrier to getting the support you need.','نعم! أعمل مع عملاء في جميع أنحاء دول الخليج ودولياً عبر الاستشارات الإلكترونية.','general',6,true)
ON CONFLICT DO NOTHING;

-- ── Seed: website_settings ───────────────────────────────────────────────────

INSERT INTO website_settings (key, value) VALUES
('site.hero', '{
  "kicker_en": "Certified Holistic Nutritionist",
  "kicker_ar": "أخصائية تغذية شمولية معتمدة",
  "heading_en": "Nourish Your Body, Transform Your Life.",
  "heading_ar": "غذّي جسمكِ، حوّلي حياتكِ.",
  "subheading_en": "Evidence-based, deeply personal nutrition care — for women ready to understand their bodies and build lasting health.",
  "subheading_ar": "رعاية تغذوية مبنية على الأدلة وشخصية للغاية — للنساء المستعدات لفهم أجسادهن وبناء صحة دائمة.",
  "cta_primary_label_en": "Book a Consultation",
  "cta_primary_label_ar": "احجزي استشارة",
  "cta_primary_href": "/booking",
  "cta_secondary_label_en": "Take the Free Assessment",
  "cta_secondary_label_ar": "خذي التقييم المجاني",
  "cta_secondary_href": "/assessment"
}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.about', '{
  "name_en": "Shelan",
  "name_ar": "شيلان",
  "title_en": "Certified Holistic Nutritionist & Lipedema Specialist",
  "title_ar": "أخصائية تغذية شمولية معتمدة ومتخصصة في الليبيديما",
  "bio_en": "I am a certified holistic nutritionist specializing in Lipedema, gut health, and sustainable weight management. Having navigated Lipedema myself, I bring both clinical expertise and lived experience to every client relationship. My approach is evidence-based, culturally sensitive, and deeply personal — because lasting change only happens when your plan fits your real life.",
  "bio_ar": "أنا أخصائية تغذية شمولية معتمدة متخصصة في الليبيديما وصحة الأمعاء وإدارة الوزن المستدامة. بتجربتي الشخصية مع الليبيديما، أجمع بين الخبرة السريرية والتجربة المعاشة في كل علاقة مع عميلاتي.",
  "portrait_url": "/portrait.jpg"
}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.contact', '{
  "phone": "+965 0000 0000",
  "whatsapp": "+96500000000",
  "email": "hello@shelan.com",
  "address_en": "Kuwait City, Kuwait",
  "address_ar": "مدينة الكويت، الكويت",
  "hours_en": "Sun–Thu: 9:00 AM – 5:00 PM",
  "hours_ar": "الأحد–الخميس: 9:00 ص – 5:00 م",
  "map_url": ""
}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.social', '{
  "instagram": "https://instagram.com/shelan",
  "tiktok": "",
  "youtube": "",
  "facebook": "",
  "snapchat": "",
  "twitter": ""
}')
ON CONFLICT (key) DO NOTHING;
`;

async function run() {
  try {
    await client.connect();
    console.log("✅  Connected to Supabase PostgreSQL");

    await client.query(SQL);
    console.log("✅  Migration complete");

    // Verify new tables
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('programs', 'success_stories', 'faqs')
      ORDER BY table_name
    `);
    console.log("✅  New tables:", rows.map((r) => r.table_name).join(", "));

    // Verify extended columns
    const { rows: cols } = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('services', 'blog_posts', 'testimonials')
        AND column_name IN ('slug', 'details', 'read_time_minutes', 'category', 'role_en', 'avatar_url')
      ORDER BY table_name, column_name
    `);
    console.log("✅  Extended columns:", cols.map((c) => `${c.table_name}.${c.column_name}`).join(", "));

  } catch (err) {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
