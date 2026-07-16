/**
 * Blog CMS data — placeholder content.
 *
 * To connect Supabase:
 *   const { data } = await supabase.from('blog_posts').select('*').eq('locale', lang).order('published_at', { ascending: false })
 *   For detail: .eq('slug', slug).single()
 */
import type { CMSBlogData } from "@/types/cms.types";

const shelanAuthor = {
  en: {
    name: "Shelan",
    avatarUrl: "/portrait.jpg",
    bio: "Certified Holistic Nutritionist & Lipedema Specialist",
  },
  ar: {
    name: "شيلان",
    avatarUrl: "/portrait.jpg",
    bio: "أخصائية تغذية شمولية معتمدة ومتخصصة في الليبيديما",
  },
};

const featuredPostBody = [
  {
    type: "paragraph" as const,
    content:
      "Lipedema is a chronic condition that affects an estimated 11% of women worldwide — yet the vast majority of those living with it have never heard its name. For years, women with Lipedema are told they simply need to eat less and move more, when in reality, the fat deposits associated with Lipedema are largely resistant to conventional diet and exercise.",
  },
  {
    type: "heading2" as const,
    content: "What Exactly Is Lipedema?",
  },
  {
    type: "paragraph" as const,
    content:
      "Lipedema is a disorder of adipose (fat) tissue — a medical condition, not a lifestyle choice. It is characterized by the abnormal accumulation of fat cells, particularly in the lower body (legs, hips, buttocks) and sometimes the arms. This fat is structurally different from regular body fat and does not respond normally to caloric restriction or physical activity.",
  },
  {
    type: "list" as const,
    content: "Key characteristics of Lipedema include:",
    items: [
      "Bilateral and symmetric distribution (affects both legs equally)",
      "Hands and feet are typically spared",
      "Significant pain, tenderness, and easy bruising in affected areas",
      "Swelling that worsens throughout the day",
      "Strong hormonal link — often triggered or worsened by puberty, pregnancy, or menopause",
    ],
  },
  {
    type: "heading2" as const,
    content: "The Role of Nutrition in Lipedema Management",
  },
  {
    type: "paragraph" as const,
    content:
      "While nutrition cannot cure Lipedema, it plays an enormously powerful role in managing symptoms, slowing progression, and improving quality of life. The key mechanism is inflammation — Lipedema tissue is characterized by chronic, low-grade inflammation, and everything we eat either adds to or reduces that inflammatory burden.",
  },
  {
    type: "heading3" as const,
    content: "Anti-Inflammatory Eating Patterns",
  },
  {
    type: "paragraph" as const,
    content:
      "Research consistently shows that anti-inflammatory dietary patterns produce the most benefit for Lipedema patients. This includes Mediterranean-style eating, ketogenic approaches, and low-carbohydrate diets. The common thread is minimizing foods that drive inflammation — refined sugars, processed oils, ultra-processed foods — while maximizing those that reduce it.",
  },
  {
    type: "list" as const,
    content: "Top anti-inflammatory foods for Lipedema:",
    items: [
      "Fatty fish (salmon, sardines, mackerel) — rich in anti-inflammatory omega-3s",
      "Leafy greens (spinach, arugula, kale) — packed with antioxidants and phytonutrients",
      "Berries — among the highest antioxidant content of any food",
      "Olive oil — oleocanthal has comparable anti-inflammatory properties to ibuprofen",
      "Turmeric and ginger — natural COX-2 inhibitors",
      "Nuts and seeds — especially walnuts and flaxseeds for omega-3 content",
    ],
  },
  {
    type: "quote" as const,
    content:
      "The goal isn't to fight your body. It's to create the internal environment where your body can feel as good as possible — reducing pain, reducing inflammation, and giving you back your energy and your life.",
  },
  {
    type: "heading2" as const,
    content: "The Gut-Lipedema Connection",
  },
  {
    type: "paragraph" as const,
    content:
      "Emerging research highlights a significant relationship between gut microbiome health and Lipedema symptom severity. Dysbiosis — an imbalance of gut bacteria — can amplify systemic inflammation and worsen Lipedema symptoms. Incorporating gut-supportive foods (fermented foods, prebiotic fiber, diverse plant foods) is an essential pillar of any Lipedema nutrition protocol.",
  },
  {
    type: "heading2" as const,
    content: "Getting Started: Practical First Steps",
  },
  {
    type: "list" as const,
    content: "If you're new to Lipedema nutrition, start here:",
    items: [
      "Eliminate sugar-sweetened beverages and ultra-processed snacks first — the highest inflammatory-load foods with the least nutritional value",
      "Increase your omega-3 intake through fatty fish 2–3 times per week or a high-quality supplement",
      "Add one serving of leafy greens to every meal",
      "Prioritize adequate hydration — supports lymphatic function which is impaired in Lipedema",
      "Consider a food sensitivity elimination trial — many Lipedema patients see significant improvement",
    ],
  },
  {
    type: "paragraph" as const,
    content:
      "Remember: Lipedema nutrition is highly individual. What works brilliantly for one person may not work for another. This is why personalized guidance is so valuable — a specialist can help you identify your specific inflammatory triggers and build a protocol that works with your unique body.",
  },
];

export const blogData: { en: CMSBlogData; ar: CMSBlogData } = {
  en: {
    hero: {
      kicker: "Evidence-Based Insights",
      headline: "The Wellness Blog",
      subheadline:
        "Practical, science-backed articles on nutrition, Lipedema, gut health, and holistic wellbeing — written for real women, in plain language.",
    },
    categories: ["All", "Nutrition", "Lipedema", "Gut Health", "Wellness", "Mindset", "Recipes"],
    posts: [
      {
        id: "post-001",
        slug: "understanding-lipedema-nutrition-guide",
        title: "Understanding Lipedema: A Complete Nutrition Guide",
        excerpt:
          "Lipedema affects 1 in 9 women — yet most have never heard of it. Here's everything you need to know about the condition and how targeted nutrition can transform your quality of life.",
        accentFrom: "from-soft-purple",
        accentTo: "to-lavender-purple",
        category: "Lipedema",
        readTimeMinutes: 12,
        publishedAt: "2026-06-15",
        author: shelanAuthor.en,
        featured: true,
        tags: ["Lipedema", "Anti-Inflammatory", "Nutrition", "Chronic Conditions"],
        relatedSlugs: [
          "5-anti-inflammatory-foods-lipedema",
          "gut-health-connection",
          "building-sustainable-habits",
        ],
        body: featuredPostBody,
      },
      {
        id: "post-002",
        slug: "5-anti-inflammatory-foods-lipedema",
        title: "5 Anti-Inflammatory Foods Every Lipedema Patient Should Know",
        excerpt:
          "Fighting inflammation is one of the most powerful things you can do for Lipedema management. These five foods should be staples in your kitchen.",
        accentFrom: "from-primary-pink",
        accentTo: "to-soft-pink",
        category: "Lipedema",
        readTimeMinutes: 7,
        publishedAt: "2026-06-01",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Lipedema", "Anti-Inflammatory", "Foods"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide", "gut-health-connection"],
      },
      {
        id: "post-003",
        slug: "gut-health-connection",
        title: "The Gut-Health Connection: Why Your Microbiome Matters More Than You Think",
        excerpt:
          "Your gut bacteria influence everything from your immunity to your mood to your weight. Here's what the latest research reveals — and how to support your microbiome naturally.",
        accentFrom: "from-soft-pink",
        accentTo: "to-lavender-purple",
        category: "Gut Health",
        readTimeMinutes: 9,
        publishedAt: "2026-05-20",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Gut Health", "Microbiome", "Inflammation", "Probiotics"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide", "building-sustainable-habits"],
      },
      {
        id: "post-004",
        slug: "building-sustainable-habits",
        title: "Building Sustainable Habits: The Science of Lasting Change",
        excerpt:
          "Why do most diets fail within weeks? The answer isn't willpower — it's neuroscience. Here's how to build nutrition habits that actually stick, backed by behavioral psychology.",
        accentFrom: "from-soft-purple",
        accentTo: "to-primary-pink",
        category: "Wellness",
        readTimeMinutes: 8,
        publishedAt: "2026-05-08",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Habits", "Behavior Change", "Mindset", "Sustainable Living"],
        relatedSlugs: ["mindful-eating", "protein-and-lipedema"],
      },
      {
        id: "post-005",
        slug: "protein-and-lipedema",
        title: "Protein and Lipedema: Finding the Right Balance for Your Body",
        excerpt:
          "Protein is essential — but for women with Lipedema, the type, timing, and amount matter in specific ways. A clinical breakdown of what the research actually shows.",
        accentFrom: "from-lavender-purple",
        accentTo: "to-soft-pink",
        category: "Lipedema",
        readTimeMinutes: 10,
        publishedAt: "2026-04-22",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Protein", "Lipedema", "Macronutrients"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide", "5-anti-inflammatory-foods-lipedema"],
      },
      {
        id: "post-006",
        slug: "mindful-eating",
        title: "Mindful Eating: The Missing Piece in Your Wellness Journey",
        excerpt:
          "Mindful eating isn't about restriction — it's about reconnecting with your body's signals. How this simple practice can transform your relationship with food.",
        accentFrom: "from-primary-pink",
        accentTo: "to-lavender-purple",
        category: "Mindset",
        readTimeMinutes: 6,
        publishedAt: "2026-04-10",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Mindful Eating", "Mindset", "Intuitive Eating", "Body Awareness"],
        relatedSlugs: ["building-sustainable-habits", "gut-health-connection"],
      },
      {
        id: "post-007",
        slug: "anti-inflammatory-kitchen",
        title: "Your Complete Guide to an Anti-Inflammatory Kitchen",
        excerpt:
          "The anti-inflammatory diet starts before you cook — it starts with what's in your pantry. A practical guide to stocking a kitchen that supports healing.",
        accentFrom: "from-soft-pink",
        accentTo: "to-soft-purple",
        category: "Nutrition",
        readTimeMinutes: 11,
        publishedAt: "2026-03-28",
        author: shelanAuthor.en,
        featured: false,
        tags: ["Anti-Inflammatory", "Kitchen", "Pantry", "Practical Tips"],
        relatedSlugs: ["5-anti-inflammatory-foods-lipedema", "mindful-eating"],
      },
    ],
  },

  // ─── Arabic ──────────────────────────────────────────────────────────────────
  ar: {
    hero: {
      kicker: "رؤى مبنية على الأدلة",
      headline: "مدونة الصحة",
      subheadline:
        "مقالات عملية مدعومة علمياً حول التغذية والليبيديما وصحة الأمعاء والرفاهية الشمولية — مكتوبة لنساء حقيقيات، بلغة واضحة.",
    },
    categories: ["الكل", "التغذية", "الليبيديما", "صحة الأمعاء", "الرفاهية", "العقلية", "الوصفات"],
    posts: [
      {
        id: "post-001",
        slug: "understanding-lipedema-nutrition-guide",
        title: "فهم الليبيديما: دليل التغذية الشامل",
        excerpt:
          "الليبيديما تصيب 1 من كل 9 نساء — ومع ذلك لم تسمع بها معظمهن. إليكِ كل ما تحتاجين معرفته عن الحالة وكيف يمكن للتغذية المستهدفة أن تحول جودة حياتكِ.",
        accentFrom: "from-soft-purple",
        accentTo: "to-lavender-purple",
        category: "الليبيديما",
        readTimeMinutes: 12,
        publishedAt: "2026-06-15",
        author: shelanAuthor.ar,
        featured: true,
        tags: ["الليبيديما", "مضاد للالتهاب", "التغذية", "الحالات المزمنة"],
        relatedSlugs: ["5-anti-inflammatory-foods-lipedema", "gut-health-connection"],
      },
      {
        id: "post-002",
        slug: "5-anti-inflammatory-foods-lipedema",
        title: "5 أطعمة مضادة للالتهاب يجب أن تعرفها كل مريضة ليبيديما",
        excerpt:
          "مكافحة الالتهاب هي من أقوى الأشياء التي يمكنكِ فعلها لإدارة الليبيديما. هذه الأطعمة الخمسة يجب أن تكون ثوابت في مطبخكِ.",
        accentFrom: "from-primary-pink",
        accentTo: "to-soft-pink",
        category: "الليبيديما",
        readTimeMinutes: 7,
        publishedAt: "2026-06-01",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["الليبيديما", "مضاد للالتهاب", "الأطعمة"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide"],
      },
      {
        id: "post-003",
        slug: "gut-health-connection",
        title: "علاقة صحة الأمعاء: لماذا الميكروبيوم أهم مما تعتقدين",
        excerpt:
          "بكتيريا أمعائكِ تؤثر على كل شيء من مناعتكِ إلى مزاجكِ إلى وزنكِ. إليكِ ما تكشفه أحدث الأبحاث — وكيف تدعمين ميكروبيومكِ بشكل طبيعي.",
        accentFrom: "from-soft-pink",
        accentTo: "to-lavender-purple",
        category: "صحة الأمعاء",
        readTimeMinutes: 9,
        publishedAt: "2026-05-20",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["صحة الأمعاء", "الميكروبيوم", "الالتهاب", "البروبيوتيك"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide"],
      },
      {
        id: "post-004",
        slug: "building-sustainable-habits",
        title: "بناء عادات مستدامة: علم التغيير الدائم",
        excerpt:
          "لماذا تفشل معظم الحميات في غضون أسابيع؟ الجواب ليس الإرادة — بل علم الأعصاب. إليكِ كيف تبنين عادات التغذية التي تصمد فعلاً.",
        accentFrom: "from-soft-purple",
        accentTo: "to-primary-pink",
        category: "الرفاهية",
        readTimeMinutes: 8,
        publishedAt: "2026-05-08",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["العادات", "تغيير السلوك", "العقلية", "الحياة المستدامة"],
        relatedSlugs: ["mindful-eating"],
      },
      {
        id: "post-005",
        slug: "protein-and-lipedema",
        title: "البروتين والليبيديما: إيجاد التوازن الصحيح لجسمكِ",
        excerpt:
          "البروتين ضروري — لكن للنساء المصابات بالليبيديما، النوع والتوقيت والكمية مهمة بطرق محددة. تحليل سريري لما تُظهره الأبحاث فعلاً.",
        accentFrom: "from-lavender-purple",
        accentTo: "to-soft-pink",
        category: "الليبيديما",
        readTimeMinutes: 10,
        publishedAt: "2026-04-22",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["البروتين", "الليبيديما", "المغذيات الكبرى"],
        relatedSlugs: ["understanding-lipedema-nutrition-guide"],
      },
      {
        id: "post-006",
        slug: "mindful-eating",
        title: "الأكل الواعي: القطعة المفقودة في رحلتكِ الصحية",
        excerpt:
          "الأكل الواعي لا يتعلق بالقيود — بل بإعادة الاتصال بإشارات جسمكِ. كيف يمكن لهذه الممارسة البسيطة أن تحول علاقتكِ بالطعام.",
        accentFrom: "from-primary-pink",
        accentTo: "to-lavender-purple",
        category: "العقلية",
        readTimeMinutes: 6,
        publishedAt: "2026-04-10",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["الأكل الواعي", "العقلية", "الأكل الحدسي", "الوعي الجسدي"],
        relatedSlugs: ["building-sustainable-habits"],
      },
      {
        id: "post-007",
        slug: "anti-inflammatory-kitchen",
        title: "دليلكِ الكامل لمطبخ مضاد للالتهابات",
        excerpt:
          "النظام الغذائي المضاد للالتهابات يبدأ قبل الطهي — يبدأ بما يوجد في مؤونتكِ. دليل عملي لتخزين مطبخ يدعم الشفاء.",
        accentFrom: "from-soft-pink",
        accentTo: "to-soft-purple",
        category: "التغذية",
        readTimeMinutes: 11,
        publishedAt: "2026-03-28",
        author: shelanAuthor.ar,
        featured: false,
        tags: ["مضاد للالتهاب", "المطبخ", "المؤونة", "نصائح عملية"],
        relatedSlugs: ["5-anti-inflammatory-foods-lipedema"],
      },
    ],
  },
};
