/**
 * Services CMS data — placeholder content.
 *
 * To connect Supabase:
 *   const { data } = await supabase.from('services').select('*').eq('locale', lang)
 */
import type { CMSServicesData } from "@/types/cms.types";

export const servicesData: { en: CMSServicesData; ar: CMSServicesData } = {
  en: {
    hero: {
      kicker: "What I Offer",
      headline: "Services Built Around You.",
      subheadline:
        "Three specialized pathways, each designed to meet you exactly where you are — with the science, compassion, and personalization you deserve.",
    },
    services: [
      {
        id: "svc-001",
        slug: "general-nutrition",
        title: "General Nutrition",
        shortDescription:
          "Personalized nutrition plans to help you build sustainable habits, improve energy, and reach your wellness goals.",
        accentFrom: "from-soft-pink",
        accentTo: "to-primary-pink",
        iconName: "Salad",
        fullDescription:
          "General nutrition counseling is the foundation of lasting health. Whether you're looking to manage weight, improve energy levels, reduce inflammation, or simply feel better in your body — this service delivers a fully personalized plan built around your biology, your lifestyle, and your goals. No generic templates, no one-size-fits-all approaches. Every recommendation is evidence-based, culturally sensitive, and designed to fit seamlessly into your real life.",
        whoIsItFor: {
          headline: "Is This Right for You?",
          description:
            "This service is ideal for women who want a science-backed, personalized nutrition foundation — without the confusion, restriction, or overwhelm that most diet plans bring.",
          points: [
            "You feel tired, sluggish, or low on energy despite eating what seems like a 'healthy' diet",
            "You want to manage your weight sustainably without extreme restriction",
            "You've tried multiple diets and nothing has worked long-term",
            "You want to understand what your body actually needs",
            "You're ready to build habits that last beyond 30 days",
            "You want expert guidance tailored to your culture and food preferences",
          ],
        },
        benefits: {
          headline: "What You'll Gain",
          items: [
            "A fully personalized meal plan built around your specific health goals and food preferences",
            "Clarity on your macronutrient and micronutrient needs",
            "Strategies to manage cravings, energy dips, and emotional eating",
            "A sustainable relationship with food — free from guilt and confusion",
            "Ongoing support and plan adjustments as your body responds",
            "Tools to make smart choices in social settings, restaurants, and travel",
          ],
        },
        consultation: {
          headline: "What Happens in Your Consultation",
          steps: [
            {
              title: "Comprehensive Intake",
              description:
                "We review your full health history, current eating patterns, lifestyle factors, sleep quality, stress levels, and any relevant lab work.",
            },
            {
              title: "Goal Setting",
              description:
                "Together we define clear, measurable, and realistic goals — both short-term and long-term — that genuinely motivate you.",
            },
            {
              title: "Personalized Plan Design",
              description:
                "I build your nutrition protocol from scratch: meal ideas, portion guidance, food swaps, supplement recommendations (if needed), and a realistic implementation schedule.",
            },
            {
              title: "Education Session",
              description:
                "You'll leave with a deep understanding of how food affects your specific body, so you can make confident decisions independently.",
            },
            {
              title: "Follow-Up Protocol",
              description:
                "Regular check-ins to track your progress, answer questions, adjust the plan, and keep you motivated and accountable.",
            },
          ],
        },
        faq: [
          {
            question: "How long before I see results?",
            answer:
              "Most clients notice meaningful changes in energy and digestion within 2–3 weeks. Longer-term goals like weight management or chronic inflammation reduction typically take 8–12 weeks of consistent implementation.",
          },
          {
            question: "Do I have to follow a specific diet type?",
            answer:
              "Absolutely not. There's no mandatory diet style. Your plan is built around your food preferences, cultural background, and what's realistic for your daily life.",
          },
          {
            question: "What if I have food intolerances or allergies?",
            answer:
              "All food sensitivities are noted during the intake process and fully accounted for in your plan. We also explore whether certain intolerances may be addressable through gut-healing protocols.",
          },
          {
            question: "How many sessions do I need?",
            answer:
              "The Initial Consultation includes everything needed to start. Most clients benefit most from the 3-month program, which includes regular follow-ups and plan iterations for optimal results.",
          },
        ],
        cta: {
          headline: "Ready to Build Your Foundation?",
          description:
            "Start with a personalized nutrition consultation and discover what your body has been asking for.",
          buttonLabel: "Book Your Consultation",
        },
      },
      {
        id: "svc-002",
        slug: "lipedema-specialized-plan",
        title: "Lipedema Specialized Plan",
        shortDescription:
          "A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema, developed with clinical care.",
        accentFrom: "from-soft-purple",
        accentTo: "to-lavender-purple",
        iconName: "HeartPulse",
        fullDescription:
          "Lipedema is one of the most underdiagnosed and misunderstood conditions affecting women — and standard nutrition advice often makes it worse, not better. This specialized program is built entirely around the unique pathophysiology of Lipedema: its hormonal drivers, inflammatory mechanisms, lymphatic considerations, and the emotional toll of living in a body that doesn't respond the way others do. As a Lipedema patient herself, Shelan brings both clinical expertise and lived experience to every protocol she designs.",
        whoIsItFor: {
          headline: "Is This Right for You?",
          description:
            "This program is specifically designed for women diagnosed with — or suspected to have — Lipedema, particularly those who have found that conventional diets don't work for their body.",
          points: [
            "You have a diagnosis of Lipedema (Stage 1, 2, or 3)",
            "You struggle with disproportionate fat distribution in your legs, hips, or arms",
            "Conventional dieting hasn't reduced the affected areas despite caloric restriction",
            "You experience chronic pain, heaviness, or easy bruising in affected areas",
            "You've been told to 'just lose weight' without understanding the underlying condition",
            "You want a protocol that works with your condition, not against your body",
          ],
        },
        benefits: {
          headline: "What This Protocol Addresses",
          items: [
            "Anti-inflammatory nutrition specifically targeting Lipedema-related inflammation",
            "Lymphatic-supportive eating strategies to reduce swelling and heaviness",
            "Hormonal balance through targeted dietary interventions",
            "Gut health optimization — directly linked to Lipedema symptom severity",
            "Pain management through food — reducing reliance on anti-inflammatory medications",
            "Emotional support and community connection with other Lipedema patients",
          ],
        },
        consultation: {
          headline: "What Happens in Your Consultation",
          steps: [
            {
              title: "Lipedema-Specific Assessment",
              description:
                "A detailed intake covering Lipedema stage, affected areas, symptom severity, hormone history, and previous dietary interventions — with a focus on what has and hasn't worked.",
            },
            {
              title: "Inflammation Profiling",
              description:
                "We review relevant labs (if available) and assess dietary and lifestyle factors contributing to your inflammatory load.",
            },
            {
              title: "Custom Anti-Inflammatory Protocol",
              description:
                "Your nutrition plan is built around the ketogenic-adjacent, anti-inflammatory, and lymphatic-supportive dietary patterns shown to benefit Lipedema most — adapted to your preferences.",
            },
            {
              title: "Supplement & Lifestyle Guidance",
              description:
                "Evidence-based supplement recommendations for Lipedema (flavonoids, omega-3s, selenium, etc.) plus lifestyle modifications to amplify nutritional results.",
            },
            {
              title: "Long-Term Management Plan",
              description:
                "Lipedema is a lifelong condition. Your plan is designed for the long term, with quarterly review protocols and adaptations as your body and needs evolve.",
            },
          ],
        },
        faq: [
          {
            question: "Can nutrition cure Lipedema?",
            answer:
              "Lipedema is a chronic, progressive condition with no known cure. However, targeted nutrition significantly reduces inflammation, slows progression, manages symptoms, and dramatically improves quality of life. The goal is management and thriving — not cure.",
          },
          {
            question: "Is a ketogenic diet mandatory for Lipedema?",
            answer:
              "Not mandatory, but often highly beneficial. Research shows that ketogenic and low-carbohydrate, anti-inflammatory diets tend to work best for Lipedema. Your plan will incorporate these principles in a way that's sustainable and realistic for you.",
          },
          {
            question: "Do I need a formal Lipedema diagnosis?",
            answer:
              "A formal diagnosis is helpful but not required. Many clients come with suspected Lipedema. We work from your symptoms and history, and I can provide guidance on how to pursue a formal diagnosis if needed.",
          },
          {
            question: "Can I do this alongside other Lipedema treatments?",
            answer:
              "Absolutely. Nutrition works best as part of a comprehensive approach that may include lymphatic drainage, compression garments, or surgery. I coordinate guidance to support, not conflict with, your other treatments.",
          },
        ],
        cta: {
          headline: "Finally, Care That Understands You.",
          description:
            "Book a Lipedema-specific consultation with someone who has lived the journey and built the clinical expertise to guide yours.",
          buttonLabel: "Book Your Lipedema Consultation",
        },
      },
      {
        id: "svc-003",
        slug: "holistic-health-consultation",
        title: "Holistic Health Consultation",
        shortDescription:
          "A whole-body approach combining nutrition, lifestyle, and mindset guidance for lasting, balanced well-being.",
        accentFrom: "from-primary-pink",
        accentTo: "to-lavender-purple",
        iconName: "Sparkles",
        fullDescription:
          "True wellness lives at the intersection of what you eat, how you move, how you sleep, how you manage stress, and the story you tell yourself about your body. The Holistic Health Consultation weaves all of these threads together into a comprehensive, integrated wellness plan. This is for the woman who is ready to go beyond meal plans and explore the deeper lifestyle shifts that create lasting, radiant health — from the inside out.",
        whoIsItFor: {
          headline: "Is This Right for You?",
          description:
            "This service is ideal for women who feel that food alone isn't the full picture — and who want support across the whole spectrum of their wellbeing.",
          points: [
            "You feel stuck despite eating well and exercising",
            "Chronic stress, poor sleep, or anxiety is affecting your health and weight",
            "You want to understand the connection between your gut, hormones, and mood",
            "You're dealing with burnout and want a sustainable wellness reset",
            "You want personalized guidance on supplements, sleep, stress, and movement",
            "You're ready to invest in a whole-life transformation, not just a diet",
          ],
        },
        benefits: {
          headline: "What This Service Covers",
          items: [
            "Comprehensive nutrition plan integrated with lifestyle optimization",
            "Sleep quality assessment and evidence-based improvement protocol",
            "Stress management strategies through nutrition and lifestyle",
            "Gut microbiome support and digestive health optimization",
            "Hormonal balance guidance through targeted dietary and lifestyle adjustments",
            "Mindset coaching to build a sustainable, positive relationship with health",
          ],
        },
        consultation: {
          headline: "What Happens in Your Consultation",
          steps: [
            {
              title: "360° Wellness Assessment",
              description:
                "A comprehensive review of nutrition, sleep, stress, movement, relationships, and mental wellbeing — the full picture of where you are today.",
            },
            {
              title: "Priority Mapping",
              description:
                "Together we identify the 2–3 highest-impact areas to focus on first, so your energy is directed where it will make the biggest difference.",
            },
            {
              title: "Integrated Wellness Plan",
              description:
                "A holistic plan that connects your nutrition protocol with sleep hygiene, stress management, gut healing, and mindset practices — all working in harmony.",
            },
            {
              title: "Habit Architecture",
              description:
                "We design a realistic habit implementation strategy using behavior science — making healthy choices easier and more automatic over time.",
            },
            {
              title: "Ongoing Accountability",
              description:
                "Regular holistic check-ins that assess every dimension of your wellbeing, keeping your plan adaptive and your momentum strong.",
            },
          ],
        },
        faq: [
          {
            question: "How is this different from a regular nutrition consultation?",
            answer:
              "Regular nutrition consultations focus primarily on food. The Holistic Consultation looks at the full spectrum of your wellbeing — including sleep, stress, movement, gut health, and mindset — as interconnected systems that all affect each other.",
          },
          {
            question: "Do I need to change my entire lifestyle at once?",
            answer:
              "Not at all. We prioritize and implement changes gradually, in an order that builds momentum without overwhelm. Sustainable transformation is a marathon, not a sprint.",
          },
          {
            question: "Is this service available remotely?",
            answer:
              "Yes — all consultations are conducted via video call, making this available to clients worldwide regardless of location.",
          },
          {
            question: "How long does the holistic program last?",
            answer:
              "The foundational program runs for 3 months, which is the minimum time needed to see genuine lifestyle transformation. Extended 6-month programs are available for deeper work.",
          },
        ],
        cta: {
          headline: "Ready for a Full-Life Transformation?",
          description:
            "The Holistic Health Consultation is for the woman who knows there's more to health than what's on her plate — and is ready to discover it.",
          buttonLabel: "Book Your Holistic Consultation",
        },
      },
    ],
  },

  // ─── Arabic ──────────────────────────────────────────────────────────────────
  ar: {
    hero: {
      kicker: "ما أقدمه",
      headline: "خدمات مبنية حولك.",
      subheadline:
        "ثلاثة مسارات متخصصة، كل منها مصمم لمقابلتك بالضبط حيث أنتِ — بالعلم والتعاطف والتخصيص الذي تستحقينه.",
    },
    services: [
      {
        id: "svc-001",
        slug: "general-nutrition",
        title: "التغذية العامة",
        shortDescription:
          "خطط تغذية مخصصة لمساعدتك في بناء عادات مستدامة وتحسين الطاقة والوصول إلى أهداف الرفاهية.",
        accentFrom: "from-soft-pink",
        accentTo: "to-primary-pink",
        iconName: "Salad",
        fullDescription:
          "إرشاد التغذية العامة هو أساس الصحة الدائمة. سواء كنتِ تسعين لإدارة وزنك، أو تحسين مستويات الطاقة، أو تقليل الالتهابات، أو مجرد الشعور بشكل أفضل في جسمك — تقدم هذه الخدمة خطة مخصصة بالكامل مبنية حول بيولوجيتك ونمط حياتك وأهدافك. لا قوالب عامة، لا مناهج واحدة للجميع. كل توصية مبنية على الأدلة، حساسة ثقافياً، ومصممة لتتناسب بسلاسة مع حياتك الحقيقية.",
        whoIsItFor: {
          headline: "هل هذا مناسب لكِ؟",
          description:
            "هذه الخدمة مثالية للنساء اللواتي يردن أساساً تغذوياً مدعوماً علمياً ومخصصاً — بدون الارتباك أو القيود أو الإرهاق الذي تجلبه معظم خطط الحمية.",
          points: [
            "تشعرين بالتعب أو الخمول أو انخفاض الطاقة رغم تناول ما يبدو نظاماً غذائياً 'صحياً'",
            "تريدين إدارة وزنك باستدامة بدون قيود مفرطة",
            "جربتِ حميات متعددة ولم ينجح أي منها على المدى البعيد",
            "تريدين أن تفهمي ما يحتاجه جسمك فعلاً",
            "أنتِ مستعدة لبناء عادات تدوم أكثر من 30 يوماً",
            "تريدين إرشاداً خبيراً مراعياً لثقافتك وتفضيلاتك الغذائية",
          ],
        },
        benefits: {
          headline: "ما ستكتسبينه",
          items: [
            "خطة وجبات مخصصة بالكامل مبنية حول أهدافك الصحية المحددة وتفضيلاتك الغذائية",
            "وضوح بشأن احتياجاتك من المغذيات الكبرى والصغرى",
            "استراتيجيات لإدارة الرغبات الشديدة وتراجع الطاقة والأكل العاطفي",
            "علاقة مستدامة مع الطعام — خالية من الذنب والارتباك",
            "دعم مستمر وتعديلات الخطة مع استجابة جسمك",
            "أدوات لاتخاذ خيارات ذكية في المناسبات الاجتماعية والمطاعم والسفر",
          ],
        },
        consultation: {
          headline: "ما يحدث في استشارتك",
          steps: [
            {
              title: "استقبال شامل",
              description:
                "نستعرض تاريخك الصحي الكامل وأنماط الأكل الحالية وعوامل نمط الحياة وجودة النوم ومستويات التوتر وأي نتائج مخبرية ذات صلة.",
            },
            {
              title: "تحديد الأهداف",
              description:
                "نحدد معاً أهدافاً واضحة وقابلة للقياس وواقعية — قصيرة وطويلة المدى — تحفزك حقاً.",
            },
            {
              title: "تصميم الخطة المخصصة",
              description:
                "أبني بروتوكولك الغذائي من الصفر: أفكار وجبات، توجيه الحصص، بدائل الأطعمة، توصيات المكملات (إذا لزم الأمر)، وجدول تطبيق واقعي.",
            },
            {
              title: "جلسة تثقيف",
              description:
                "ستغادرين بفهم عميق لكيفية تأثير الطعام على جسمك تحديداً، حتى تتمكني من اتخاذ قرارات واثقة باستقلالية.",
            },
            {
              title: "بروتوكول المتابعة",
              description:
                "متابعات منتظمة لتتبع تقدمك والإجابة على الأسئلة وضبط الخطة وإبقائك متحمسة ومحاسبة.",
            },
          ],
        },
        faq: [
          {
            question: "كم من الوقت قبل أرى نتائج؟",
            answer:
              "تلاحظ معظم العميلات تغييرات ذات معنى في الطاقة والهضم خلال أسبوعين إلى ثلاثة أسابيع. الأهداف طويلة المدى مثل إدارة الوزن أو تقليل الالتهاب المزمن تستغرق عادةً 8-12 أسبوعاً من التطبيق المتسق.",
          },
          {
            question: "هل يجب اتباع نوع نظام غذائي محدد؟",
            answer:
              "بالتأكيد لا. لا يوجد نمط غذائي إلزامي. تُبنى خطتك حول تفضيلاتك الغذائية وخلفيتك الثقافية وما هو واقعي في حياتك اليومية.",
          },
          {
            question: "ماذا لو كانت لدي حساسيات أو حساسيات غذائية؟",
            answer:
              "تُسجَّل جميع الحساسيات الغذائية أثناء عملية الاستقبال وتُؤخذ بالاعتبار الكامل في خطتك. نستكشف أيضاً ما إذا كانت بعض الحساسيات قابلة للمعالجة من خلال بروتوكولات شفاء الأمعاء.",
          },
          {
            question: "كم عدد الجلسات التي أحتاجها؟",
            answer:
              "تتضمن الاستشارة الأولية كل ما تحتاجينه للبدء. تستفيد معظم العميلات أكثر من برنامج 3 أشهر الذي يتضمن متابعات منتظمة وتكرارات الخطة للحصول على أفضل النتائج.",
          },
        ],
        cta: {
          headline: "هل أنتِ مستعدة لبناء أساسك؟",
          description:
            "ابدأي باستشارة تغذية مخصصة واكتشفي ما كان جسمك يطلبه.",
          buttonLabel: "احجزي استشارتك",
        },
      },
      {
        id: "svc-002",
        slug: "lipedema-specialized-plan",
        title: "خطة الليبيديما المتخصصة",
        shortDescription:
          "بروتوكول تغذية مخصص يعالج الاحتياجات الالتهابية والأيضية الفريدة للليبيديما، مطور بعناية سريرية.",
        accentFrom: "from-soft-purple",
        accentTo: "to-lavender-purple",
        iconName: "HeartPulse",
        fullDescription:
          "الليبيديما هي أحد أكثر الحالات التي تؤثر على النساء نقصاً في التشخيص وسوء الفهم — وكثيراً ما تجعل نصائح التغذية القياسية الأمور أسوأ لا أفضل. هذا البرنامج المتخصص مبني بالكامل حول الفيزيولوجيا المرضية الفريدة للليبيديما: محركاتها الهرمونية وآلياتها الالتهابية واعتبارات الجهاز اللمفاوي والعبء العاطفي للعيش في جسد لا يستجيب كالآخرين. بوصفها مريضة ليبيديما نفسها، تجلب شيلان الخبرة السريرية والتجربة المعاشة لكل بروتوكول تصممه.",
        whoIsItFor: {
          headline: "هل هذا مناسب لكِ؟",
          description:
            "هذا البرنامج مصمم خصيصاً للنساء المشخصات بـ — أو المشتبه في إصابتهن بـ — الليبيديما، لا سيما اللواتي وجدن أن الحميات التقليدية لا تناسب أجسامهن.",
          points: [
            "لديكِ تشخيص بالليبيديما (المرحلة 1 أو 2 أو 3)",
            "تعانين من توزيع شحوم غير متناسب في ساقيكِ أو وركيكِ أو ذراعيكِ",
            "الحمية التقليدية لم تقلل المناطق المصابة رغم تقييد السعرات الحرارية",
            "تعانين من آلام مزمنة أو ثقل أو كدمات سهلة في المناطق المصابة",
            "قيل لكِ 'فقط أنقصي وزنكِ' بدون فهم الحالة الكامنة",
            "تريدين بروتوكولاً يعمل مع حالتكِ، لا ضد جسمكِ",
          ],
        },
        benefits: {
          headline: "ما يعالجه هذا البروتوكول",
          items: [
            "التغذية المضادة للالتهابات المستهدفة تحديداً للالتهاب المرتبط بالليبيديما",
            "استراتيجيات الأكل الداعمة للجهاز اللمفاوي لتقليل التورم والثقل",
            "التوازن الهرموني من خلال تدخلات غذائية مستهدفة",
            "تحسين صحة الأمعاء — مرتبط مباشرة بشدة أعراض الليبيديما",
            "إدارة الألم من خلال الطعام — تقليل الاعتماد على الأدوية المضادة للالتهابات",
            "الدعم العاطفي والتواصل المجتمعي مع مريضات الليبيديما الأخريات",
          ],
        },
        consultation: {
          headline: "ما يحدث في استشارتك",
          steps: [
            {
              title: "تقييم خاص بالليبيديما",
              description:
                "استقبال مفصل يغطي مرحلة الليبيديما والمناطق المصابة وشدة الأعراض والتاريخ الهرموني والتدخلات الغذائية السابقة — مع التركيز على ما نجح وما لم ينجح.",
            },
            {
              title: "تحديد ملف الالتهاب",
              description:
                "نراجع المختبرات ذات الصلة (إذا كانت متاحة) ونقيم العوامل الغذائية ونمط الحياة التي تساهم في حملك الالتهابي.",
            },
            {
              title: "بروتوكول مضاد للالتهابات مخصص",
              description:
                "تُبنى خطتك الغذائية حول الأنماط الغذائية الكيتونية المجاورة والمضادة للالتهابات والداعمة للجهاز اللمفاوي التي أثبتت أكبر فائدة للليبيديما — مكيّفة وفق تفضيلاتكِ.",
            },
            {
              title: "توجيه المكملات ونمط الحياة",
              description:
                "توصيات مكملات مبنية على الأدلة لليبيديما (الفلافونويدات، أوميغا-3، السيلينيوم، إلخ) بالإضافة إلى تعديلات نمط الحياة لتضخيم النتائج الغذائية.",
            },
            {
              title: "خطة الإدارة طويلة الأمد",
              description:
                "الليبيديما حالة مدى الحياة. خطتكِ مصممة للمدى الطويل، مع بروتوكولات مراجعة ربع سنوية وتكيفات مع تطور جسمكِ واحتياجاتكِ.",
            },
          ],
        },
        faq: [
          {
            question: "هل يمكن للتغذية أن تشفي الليبيديما؟",
            answer:
              "الليبيديما حالة مزمنة تقدمية لا علاج معروف لها. ومع ذلك، تقلل التغذية المستهدفة الالتهاب بشكل ملحوظ، وتبطئ التقدم، وتدير الأعراض، وتحسن جودة الحياة بشكل كبير. الهدف هو الإدارة والازدهار — لا الشفاء.",
          },
          {
            question: "هل النظام الغذائي الكيتوني إلزامي لليبيديما؟",
            answer:
              "ليس إلزامياً، لكنه غالباً مفيد جداً. تظهر الأبحاث أن الأنظمة الغذائية الكيتونية ومنخفضة الكربوهيدرات والمضادة للالتهابات تميل إلى الأداء الأفضل مع الليبيديما. ستدمج خطتكِ هذه المبادئ بطريقة مستدامة وواقعية لكِ.",
          },
          {
            question: "هل أحتاج تشخيصاً رسمياً لليبيديما؟",
            answer:
              "التشخيص الرسمي مفيد لكنه ليس مطلوباً. كثير من العميلات يأتين بليبيديما مشتبه بها. نعمل من أعراضكِ وتاريخكِ، ويمكنني تقديم إرشادات حول كيفية السعي للحصول على تشخيص رسمي إذا لزم الأمر.",
          },
          {
            question: "هل يمكنني القيام بذلك جنباً إلى جنب مع علاجات الليبيديما الأخرى؟",
            answer:
              "بالتأكيد. التغذية تعمل بشكل أفضل كجزء من نهج شامل قد يشمل الصرف اللمفاوي أو جوارب الضغط أو الجراحة. أنسق الإرشادات لدعم علاجاتكِ الأخرى لا التعارض معها.",
          },
        ],
        cta: {
          headline: "أخيراً، رعاية تفهمكِ.",
          description:
            "احجزي استشارة متخصصة للليبيديما مع شخص عاش الرحلة وبنى الخبرة السريرية لإرشاد رحلتكِ.",
          buttonLabel: "احجزي استشارة الليبيديما",
        },
      },
      {
        id: "svc-003",
        slug: "holistic-health-consultation",
        title: "الاستشارة الصحية الشمولية",
        shortDescription:
          "نهج شامل يجمع التغذية ونمط الحياة وإرشادات العقلية لرفاهية متوازنة ودائمة.",
        accentFrom: "from-primary-pink",
        accentTo: "to-lavender-purple",
        iconName: "Sparkles",
        fullDescription:
          "الصحة الحقيقية تعيش عند تقاطع ما تأكلينه وكيف تتحركين وكيف تنامين وكيف تديرين التوتر والقصة التي ترويها لنفسكِ عن جسمكِ. تنسج الاستشارة الصحية الشمولية كل هذه الخيوط معاً في خطة رفاهية شاملة ومتكاملة. هذا للمرأة المستعدة للذهاب أبعد من جداول الوجبات واستكشاف التحولات العميقة في نمط الحياة التي تخلق صحة راسخة ومشرقة — من الداخل إلى الخارج.",
        whoIsItFor: {
          headline: "هل هذا مناسب لكِ؟",
          description:
            "هذه الخدمة مثالية للنساء اللواتي يشعرن أن الطعام وحده ليس الصورة الكاملة — واللواتي يردن دعماً عبر الطيف الكامل لرفاهيتهن.",
          points: [
            "تشعرين بالتوقف رغم الأكل الجيد والتمرين",
            "التوتر المزمن أو ضعف النوم أو القلق يؤثر على صحتكِ ووزنكِ",
            "تريدين فهم العلاقة بين أمعائكِ وهرموناتكِ ومزاجكِ",
            "تتعاملين مع الإرهاق وتريدين إعادة ضبط رفاهية مستدامة",
            "تريدين إرشاداً مخصصاً بشأن المكملات والنوم والتوتر والحركة",
            "أنتِ مستعدة للاستثمار في تحول الحياة بالكامل، ليس مجرد نظام غذائي",
          ],
        },
        benefits: {
          headline: "ما تغطيه هذه الخدمة",
          items: [
            "خطة تغذية شاملة متكاملة مع تحسين نمط الحياة",
            "تقييم جودة النوم وبروتوكول تحسين مبني على الأدلة",
            "استراتيجيات إدارة التوتر من خلال التغذية ونمط الحياة",
            "دعم ميكروبيوم الأمعاء وتحسين صحة الجهاز الهضمي",
            "إرشاد التوازن الهرموني من خلال تعديلات غذائية ونمط حياة مستهدفة",
            "التدريب العقلي لبناء علاقة إيجابية مستدامة مع الصحة",
          ],
        },
        consultation: {
          headline: "ما يحدث في استشارتك",
          steps: [
            {
              title: "تقييم رفاهية 360°",
              description:
                "مراجعة شاملة للتغذية والنوم والتوتر والحركة والعلاقات والرفاهية العقلية — الصورة الكاملة لأين أنتِ اليوم.",
            },
            {
              title: "رسم خريطة الأولويات",
              description:
                "نحدد معاً مجالين إلى ثلاثة مجالات ذات التأثير الأعلى للتركيز عليها أولاً، بحيث يتوجه طاقتكِ نحو ما سيحدث أكبر فرق.",
            },
            {
              title: "خطة رفاهية متكاملة",
              description:
                "خطة شمولية تربط بروتوكولك الغذائي بنظافة النوم وإدارة التوتر وشفاء الأمعاء وممارسات العقلية — كلها تعمل في تناغم.",
            },
            {
              title: "هندسة العادات",
              description:
                "نصمم استراتيجية واقعية لتطبيق العادات باستخدام علم السلوك — مما يجعل الخيارات الصحية أسهل وأكثر تلقائية مع مرور الوقت.",
            },
            {
              title: "المساءلة المستمرة",
              description:
                "متابعات شمولية منتظمة تقيّم كل بُعد من أبعاد رفاهيتكِ، مما يجعل خطتكِ قابلة للتكيف وزخمكِ قوياً.",
            },
          ],
        },
        faq: [
          {
            question: "كيف يختلف هذا عن استشارة التغذية العادية؟",
            answer:
              "تركز استشارات التغذية العادية بشكل رئيسي على الطعام. تنظر الاستشارة الشمولية إلى الطيف الكامل لرفاهيتكِ — بما في ذلك النوم والتوتر والحركة وصحة الأمعاء والعقلية — كأنظمة مترابطة تؤثر على بعضها جميعاً.",
          },
          {
            question: "هل أحتاج تغيير نمط حياتي بالكامل دفعة واحدة؟",
            answer:
              "بالتأكيد لا. نحن نحدد الأولويات وننفذ التغييرات تدريجياً، بترتيب يبني الزخم بدون إرهاق. التحول المستدام سباق مضمار، ليس سباق سرعة.",
          },
          {
            question: "هل هذه الخدمة متاحة عن بُعد؟",
            answer:
              "نعم — جميع الاستشارات تُجرى عبر مكالمة فيديو، مما يجعلها متاحة للعميلات في جميع أنحاء العالم بغض النظر عن الموقع.",
          },
          {
            question: "كم تستمر برامج الاستشارة الشمولية؟",
            answer:
              "يمتد البرنامج التأسيسي لمدة 3 أشهر، وهو الحد الأدنى من الوقت اللازم لرؤية تحول حقيقي في نمط الحياة. تتوفر برامج موسعة لمدة 6 أشهر للعمل الأعمق.",
          },
        ],
        cta: {
          headline: "هل أنتِ مستعدة لتحول الحياة الكاملة؟",
          description:
            "الاستشارة الصحية الشمولية للمرأة التي تعرف أن الصحة أكثر مما يوجد في طبقها — وهي مستعدة لاكتشاف ذلك.",
          buttonLabel: "احجزي استشارتك الشمولية",
        },
      },
    ],
  },
};
