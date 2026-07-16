-- CMS migration — run via psql
-- Idempotent: safe to re-run

-- ── New tables ───────────────────────────────────────────────────────────────

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

-- ── Extend existing tables ────────────────────────────────────────────────────

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

-- ── Unique slug on services ───────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='services' AND indexname='services_slug_key'
  ) THEN
    CREATE UNIQUE INDEX services_slug_key ON services(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE programs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS programs_public_read  ON programs;
DROP POLICY IF EXISTS programs_auth_all     ON programs;
DROP POLICY IF EXISTS stories_public_read   ON success_stories;
DROP POLICY IF EXISTS stories_auth_all      ON success_stories;
DROP POLICY IF EXISTS faqs_public_read      ON faqs;
DROP POLICY IF EXISTS faqs_auth_all         ON faqs;

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
  'Personalized nutrition counseling built around your biology, your lifestyle, and your goals.',
  'استشارة تغذية مخصصة مبنية حول جسمكِ ونمط حياتكِ وأهدافكِ.',
  'Personalized nutrition plans to help you build sustainable habits, improve energy, and reach your wellness goals.',
  'خطط تغذية مخصصة تساعدكِ على بناء عادات مستدامة وتحسين الطاقة.',
  150, 60, true, 1, 'Salad', 'general-nutrition',
  '{"accentFrom":"from-soft-pink","accentTo":"to-primary-pink","whoIsItFor":{"headline":"Is This Right for You?","headlineAr":"هل هذا مناسب لكِ؟","description":"Ideal for women who want a science-backed, personalized nutrition foundation.","descriptionAr":"مثالي للنساء اللواتي يردن أساساً تغذوياً مخصصاً.","points":["You feel tired or low on energy","You want to manage your weight sustainably","You want expert guidance tailored to your lifestyle"],"pointsAr":["تشعرين بالتعب أو انخفاض الطاقة","تريدين إدارة وزنك بشكل مستدام","تريدين توجيهاً مكيفاً لنمط حياتك"]},"benefits":{"headline":"What You Will Gain","headlineAr":"ما ستحصلين عليه","items":["A fully personalized meal plan","Clarity on your macronutrient needs","Strategies to manage cravings and energy dips"],"itemsAr":["خطة وجبات مخصصة بالكامل","وضوح حول احتياجاتك من المغذيات","استراتيجيات لإدارة الرغبات"]},"cta":{"headline":"Ready to Build Your Foundation?","headlineAr":"مستعدة لبناء أساسك؟","description":"Start with a personalized nutrition consultation.","descriptionAr":"ابدأي باستشارة تغذية مخصصة.","buttonLabel":"Book Your Consultation","buttonLabelAr":"احجزي استشارتكِ"}}'::jsonb
),
(
  'Lipedema Specialized Plan',
  'خطة الليبيديما المتخصصة',
  'A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema.',
  'بروتوكول تغذية مخصص يعالج الاحتياجات الفريدة للليبيديما.',
  'A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema.',
  'بروتوكول تغذية مخصص لاحتياجات الليبيديما الفريدة.',
  200, 90, true, 2, 'HeartPulse', 'lipedema-specialized-plan',
  '{"accentFrom":"from-soft-purple","accentTo":"to-lavender-purple","whoIsItFor":{"headline":"Is This Right for You?","headlineAr":"هل هذا مناسب لكِ؟","description":"Designed for women diagnosed with Lipedema.","descriptionAr":"مصمم للنساء المصابات بالليبيديما.","points":["You have a diagnosis of Lipedema","Conventional dieting has not worked for you","You experience chronic pain in affected areas"],"pointsAr":["لديكِ تشخيص بالليبيديما","لم تنجح الحميات التقليدية","تعانين من ألم مزمن"]},"benefits":{"headline":"What This Protocol Addresses","headlineAr":"ما يعالجه هذا البروتوكول","items":["Anti-inflammatory nutrition targeting Lipedema","Lymphatic-supportive eating strategies","Hormonal balance through dietary interventions"],"itemsAr":["التغذية المضادة للالتهاب","استراتيجيات الأكل اللمفاوية","التوازن الهرموني"]},"cta":{"headline":"Finally, Care That Understands You.","headlineAr":"أخيراً، رعاية تفهمكِ.","description":"Work with a specialist with both expertise and lived experience.","descriptionAr":"اعملي مع متخصصة لديها الخبرة والتجربة.","buttonLabel":"Book Your Consultation","buttonLabelAr":"احجزي استشارتكِ"}}'::jsonb
),
(
  'Holistic Wellness Program',
  'برنامج العافية الشمولية',
  'A comprehensive wellness program integrating nutrition, mindset, stress management, and lifestyle optimization.',
  'برنامج عافية شامل يدمج التغذية والعقلية وإدارة الإجهاد وتحسين نمط الحياة.',
  'A comprehensive wellness approach integrating nutrition, mindset, and lifestyle for sustainable transformation.',
  'نهج عافية شامل يدمج التغذية والعقلية ونمط الحياة.',
  250, 90, true, 3, 'Sparkles', 'holistic-wellness-program',
  '{"accentFrom":"from-primary-pink","accentTo":"to-lavender-purple","whoIsItFor":{"headline":"Is This Right for You?","headlineAr":"هل هذا مناسب لكِ؟","description":"For women who understand that true health is more than a number on the scale.","descriptionAr":"للنساء اللواتي يفهمن أن الصحة الحقيقية أكثر من رقم.","points":["You want a holistic approach beyond just food","You are ready for deep lifestyle change","You want to integrate mindset and sleep"],"pointsAr":["تريدين نهجاً شاملاً","مستعدة للتغيير العميق","تريدين دمج العقلية والنوم"]},"benefits":{"headline":"What You Will Gain","headlineAr":"ما ستحصلين عليه","items":["Comprehensive nutritional guidance","Stress and sleep optimization","Mindset tools for lasting change"],"itemsAr":["توجيه غذائي شامل","تحسين الإجهاد والنوم","أدوات العقلية للتغيير الدائم"]},"cta":{"headline":"Transform Your Whole Health.","headlineAr":"حوّلي صحتكِ كاملاً.","description":"Begin a journey addressing every dimension of your wellbeing.","descriptionAr":"ابدأي رحلة تعالج كل جانب من جوانب عافيتك.","buttonLabel":"Book Your Consultation","buttonLabelAr":"احجزي استشارتكِ"}}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: blog posts ──────────────────────────────────────────────────────────

INSERT INTO blog_posts
  (title_en, title_ar, slug, excerpt_en, excerpt_ar,
   content_en, content_ar, published, published_at, tags,
   read_time_minutes, category, author_name, details)
VALUES
(
  'Understanding Lipedema: The Complete Nutrition Guide',
  'فهم الليبيديما: دليل التغذية الشامل',
  'understanding-lipedema-nutrition-guide',
  'Lipedema affects an estimated 11% of women worldwide — yet most have never heard its name. Here is everything you need to know and how targeted nutrition can transform your quality of life.',
  'الليبيديما تصيب 1 من كل 9 نساء — ومع ذلك لم تسمع بها معظمهن. إليكِ كل ما تحتاجين معرفته.',
  E'Lipedema is a chronic condition that affects an estimated 11% of women worldwide — yet the vast majority of those living with it have never heard its name.\n\nFor years, women with Lipedema are told they simply need to eat less and move more, when in reality, the fat deposits associated with Lipedema are largely resistant to conventional diet and exercise.\n\nLipedema is a disorder of adipose (fat) tissue — a medical condition, not a lifestyle choice. It is characterized by the abnormal accumulation of fat cells, particularly in the lower body.\n\nWhile nutrition cannot cure Lipedema, it plays an enormously powerful role in managing symptoms, slowing progression, and improving quality of life. The key mechanism is inflammation — Lipedema tissue is characterized by chronic, low-grade inflammation, and everything we eat either adds to or reduces that inflammatory burden.\n\nAnti-inflammatory dietary patterns produce the most benefit for Lipedema patients. This includes Mediterranean-style eating, ketogenic approaches, and low-carbohydrate diets. The common thread is minimizing foods that drive inflammation while maximizing those that reduce it.',
  E'الليبيديما هي حالة مزمنة تؤثر على ما يقدر بنحو 11٪ من النساء في جميع أنحاء العالم.\n\nلسنوات، يُقال للنساء المصابات بالليبيديما أنهن يحتجن فقط إلى تناول طعام أقل وتحريك أكثر، في حين أن الرواسب الدهنية مقاومة للحميات التقليدية.\n\nالليبيديما هي اضطراب في الأنسجة الدهنية — حالة طبية، وليست خياراً في نمط الحياة.\n\nبينما لا يمكن للتغذية أن تعالج الليبيديما، فإنها تلعب دوراً قوياً في إدارة الأعراض وإبطاء التقدم وتحسين جودة الحياة.',
  true, '2026-06-15',
  ARRAY['Lipedema','Anti-Inflammatory','Nutrition','Chronic Conditions'],
  12, 'Lipedema', 'Shelan',
  '{"accentFrom":"from-soft-purple","accentTo":"to-lavender-purple","featured":true}'::jsonb
),
(
  '5 Anti-Inflammatory Foods Every Lipedema Patient Should Know',
  '5 أطعمة مضادة للالتهاب يجب أن تعرفها كل مريضة ليبيديما',
  '5-anti-inflammatory-foods-lipedema',
  'Fighting inflammation is one of the most powerful things you can do to manage Lipedema. These five foods should be staples in your kitchen.',
  'مكافحة الالتهاب هي من أقوى الأشياء التي يمكنكِ فعلها لإدارة الليبيديما.',
  E'Fighting inflammation is one of the most powerful things you can do to manage Lipedema.\n\nSalmon and other fatty fish are among the richest dietary sources of omega-3 fatty acids. These are powerful anti-inflammatory agents that directly counteract the inflammatory processes driving Lipedema symptoms.\n\nExtra virgin olive oil contains oleocanthal, a compound with anti-inflammatory properties comparable to ibuprofen.\n\nTurmeric contains curcumin, one of the most well-studied natural anti-inflammatory compounds. Combined with black pepper it becomes a potent addition to any anti-inflammatory protocol.\n\nBlueberries and other dark berries are among the highest antioxidant foods available. Their anthocyanins directly combat oxidative stress at the cellular level.\n\nLeafy greens like spinach, arugula, and kale are packed with vitamins, minerals, and phytonutrients that support every anti-inflammatory pathway in the body.',
  E'مكافحة الالتهاب هي من أقوى الأشياء التي يمكنكِ فعلها لإدارة الليبيديما.\n\nالسمك الدهني كالسلمون من أغنى المصادر بأحماض أوميغا 3 المضادة للالتهاب.\n\nزيت الزيتون البكر يحتوي على مركب مضاد للالتهاب مماثل للإيبوبروفين.\n\nالكركم يحتوي على الكوركومين، أحد أكثر المركبات الطبيعية المضادة للالتهاب دراسةً.\n\nالتوت الداكن من أعلى الأطعمة بمضادات الأكسدة.\n\nالخضروات الورقية مليئة بالمغذيات التي تدعم جميع مسارات مكافحة الالتهاب.',
  true, '2026-06-01',
  ARRAY['Lipedema','Anti-Inflammatory','Foods'],
  7, 'Lipedema', 'Shelan',
  '{"accentFrom":"from-primary-pink","accentTo":"to-soft-pink","featured":false}'::jsonb
),
(
  'Gut Health & The Microbiome: Why It Matters More Than You Think',
  'صحة الأمعاء: لماذا الميكروبيوم أهم مما تعتقدين',
  'gut-health-connection',
  'Your gut bacteria affect everything from your immunity to your mood to your weight. Here is what the latest research reveals — and how to support your microbiome naturally.',
  'بكتيريا أمعائكِ تؤثر على كل شيء من مناعتكِ إلى مزاجكِ إلى وزنكِ.',
  E'The gut microbiome — the trillions of bacteria and other microorganisms living in your digestive tract — has emerged as one of the most important factors in overall health.\n\nFor women with Lipedema specifically, gut health is particularly relevant. Research suggests that gut dysbiosis may contribute to systemic inflammation — one of the core drivers of Lipedema symptoms.\n\nThe most powerful thing you can do to support your microbiome is to eat a wide variety of plants. Microbiome diversity correlates with better health outcomes and is best predicted by the variety of plant foods you eat. Aim for at least 30 different plant foods per week.\n\nFermented foods like yogurt, kefir, kimchi, and sauerkraut contain live cultures that can directly support microbiome diversity.',
  E'الميكروبيوم في الأمعاء أصبح أحد أهم العوامل في الصحة العامة.\n\nبالنسبة للنساء المصابات بالليبيديما تحديداً، صحة الأمعاء ذات أهمية خاصة.\n\nأقوى شيء يمكنكِ فعله لدعم الميكروبيوم هو تناول مجموعة واسعة من النباتات. استهدفي 30 نوعاً مختلفاً من الأطعمة النباتية أسبوعياً.\n\nالأطعمة المخمرة تحتوي على ثقافات حية يمكنها دعم تنوع الميكروبيوم بشكل مباشر.',
  true, '2026-05-20',
  ARRAY['Gut Health','Microbiome','Inflammation','Probiotics'],
  9, 'Gut Health', 'Shelan',
  '{"accentFrom":"from-soft-pink","accentTo":"to-lavender-purple","featured":false}'::jsonb
),
(
  'Building Sustainable Habits: The Science of Lasting Change',
  'بناء عادات مستدامة: علم التغيير الدائم',
  'building-sustainable-habits',
  'Why do most diets fail within weeks? The answer is not willpower — it is neuroscience. Here is how to build nutrition habits that actually stick.',
  'لماذا تفشل معظم الحميات في غضون أسابيع؟ الجواب ليس الإرادة — بل علم الأعصاب.',
  E'Most diets fail not because of lack of willpower, but because they work against the brain rather than with it.\n\nHabit formation is governed by a neurological loop: cue → routine → reward. When we understand this loop, we can design nutrition changes that the brain will actually accept and reinforce.\n\nThe most sustainable dietary changes are those that feel manageable, enjoyable, and connected to your existing routines. Radical overhauls almost always trigger resistance — the brain interprets them as threats to homeostasis.\n\nStart with one small change and execute it consistently for 21 days. Then add another. This stacking approach respects the brain''s capacity for change without overwhelming it.\n\nIdentity-based habits are the most durable. Instead of "I am trying to eat healthier," shift to "I am someone who prioritizes nutrition." This subtle reframe changes the motivation from external to internal.',
  E'معظم الحميات تفشل ليس بسبب نقص الإرادة، بل لأنها تعمل ضد الدماغ لا معه.\n\nتكوين العادات يتحكم فيه حلقة عصبية: المحفز → الروتين → المكافأة.\n\nالتغييرات الغذائية الأكثر استدامة هي تلك التي تبدو قابلة للإدارة ومرتبطة بروتينك الحالي.\n\nابدأي بتغيير صغير واحد ونفذيه بثبات لمدة 21 يوماً. ثم أضيفي تغييراً آخر.\n\nالعادات المبنية على الهوية هي الأكثر ديمومة.',
  true, '2026-05-08',
  ARRAY['Habits','Behavior Change','Mindset','Sustainable Living'],
  8, 'Wellness', 'Shelan',
  '{"accentFrom":"from-soft-purple","accentTo":"to-primary-pink","featured":false}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: testimonials ────────────────────────────────────────────────────────

INSERT INTO testimonials (client_name, client_name_ar, content_en, content_ar, rating, published, role_en, role_ar)
VALUES
(
  'Lara H.',
  'لارا ح.',
  'Working with Shelan completely changed how I understand my body. For the first time, I have a plan that actually makes sense for my Lipedema — and I finally feel like someone truly gets it.',
  'العمل مع شيلان غيّر تماماً كيفية فهمي لجسدي. للمرة الأولى لدي خطة منطقية لليبيديما.',
  5, true, 'Lipedema Patient', 'مريضة ليبيديما'
),
(
  'Nora M.',
  'نورا م.',
  'I lost 12 kg in 3 months following Shelan''s plan — but more importantly, I learned how to eat for my body for life. The energy difference alone was worth it.',
  'خسرت 12 كجم في 3 أشهر. لكن الأهم أنني تعلمت كيف آكل لجسدي مدى الحياة.',
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

INSERT INTO faqs (question_en, question_ar, answer_en, answer_ar, category, sort_order, published) VALUES
('How long before I see results?','متى سأرى النتائج؟','Most clients notice meaningful changes in energy and digestion within 2–3 weeks. Weight management goals typically take 8–12 weeks.','يلاحظ معظم العملاء تغييرات ملموسة في الطاقة خلال 2-3 أسابيع.','general',1,true),
('Do I have to follow a specific diet?','هل يجب أن أتبع نظاماً غذائياً محدداً؟','Absolutely not. Your plan is built around your food preferences, cultural background, and what is realistic for your daily life.','بالطبع لا. خطتكِ مبنية حول تفضيلاتكِ الغذائية وخلفيتكِ الثقافية.','general',2,true),
('Can nutrition cure Lipedema?','هل يمكن للتغذية علاج الليبيديما؟','Lipedema has no known cure. However, targeted nutrition significantly reduces inflammation, slows progression, and improves quality of life.','الليبيديما لا علاج معروف لها. لكن التغذية المستهدفة تقلل الالتهاب بشكل كبير.','lipedema',3,true),
('Are online consultations available?','هل الاستشارات عبر الإنترنت متاحة؟','Yes! All consultations are available both online and in-person. Online sessions are just as effective.','نعم! جميع الاستشارات متاحة عبر الإنترنت وشخصياً.','general',4,true),
('What is included in the first consultation?','ما الذي يشمله الاستشارة الأولى؟','Your first consultation includes a comprehensive health history review, eating patterns assessment, goal setting, and the start of your personalized plan.','تشمل استشارتكِ الأولى مراجعة شاملة للتاريخ الصحي وتقييم أنماط الأكل وتحديد الأهداف.','general',5,true),
('Do you work with clients outside Kuwait?','هل تعملين مع عملاء خارج الكويت؟','Yes! I work with clients across the GCC and internationally through online consultations.','نعم! أعمل مع عملاء في جميع أنحاء الخليج ودولياً.','general',6,true)
ON CONFLICT DO NOTHING;

-- ── Seed: website_settings ────────────────────────────────────────────────────

INSERT INTO website_settings (key, value) VALUES
('site.hero', '{"kicker_en":"Certified Holistic Nutritionist","kicker_ar":"أخصائية تغذية شمولية معتمدة","heading_en":"Nourish Your Body, Transform Your Life.","heading_ar":"غذّي جسمكِ، حوّلي حياتكِ.","subheading_en":"Evidence-based, deeply personal nutrition care — for women ready to understand their bodies and build lasting health.","subheading_ar":"رعاية تغذوية مبنية على الأدلة وشخصية للغاية — للنساء المستعدات لفهم أجسادهن وبناء صحة دائمة.","cta_primary_label_en":"Book a Consultation","cta_primary_label_ar":"احجزي استشارة","cta_primary_href":"/booking","cta_secondary_label_en":"Take the Free Assessment","cta_secondary_label_ar":"خذي التقييم المجاني","cta_secondary_href":"/assessment"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.about', '{"name_en":"Shelan","name_ar":"شيلان","title_en":"Certified Holistic Nutritionist & Lipedema Specialist","title_ar":"أخصائية تغذية شمولية معتمدة ومتخصصة في الليبيديما","bio_en":"I am a certified holistic nutritionist specializing in Lipedema, gut health, and sustainable weight management. Having navigated Lipedema myself, I bring both clinical expertise and lived experience to every client relationship.","bio_ar":"أنا أخصائية تغذية شمولية معتمدة متخصصة في الليبيديما وصحة الأمعاء وإدارة الوزن المستدامة. بتجربتي الشخصية مع الليبيديما، أجمع بين الخبرة السريرية والتجربة المعاشة.","portrait_url":"/portrait.jpg"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.contact', '{"phone":"+965 0000 0000","whatsapp":"+96500000000","email":"hello@shelan.com","address_en":"Kuwait City, Kuwait","address_ar":"مدينة الكويت، الكويت","hours_en":"Sun–Thu: 9:00 AM – 5:00 PM","hours_ar":"الأحد–الخميس: 9:00 ص – 5:00 م","map_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO website_settings (key, value) VALUES
('site.social', '{"instagram":"https://instagram.com/shelan","tiktok":"","youtube":"","facebook":"","snapchat":"","twitter":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
