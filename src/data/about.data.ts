/**
 * About page CMS data — placeholder content.
 *
 * To connect Supabase: replace this export with an async fetch in AboutPage.tsx:
 *   const { data } = await supabase.from('about_page').select('*').eq('locale', lang).single();
 */
import type { CMSAboutData } from "@/types/cms.types";

export const aboutData: { en: CMSAboutData; ar: CMSAboutData } = {
  en: {
    hero: {
      kicker: "My Story",
      headline: "Beyond Nutrition.\nA Journey of Healing.",
      subheadline:
        "Certified holistic nutritionist, Lipedema specialist, and the compassionate guide I wished I had from the very beginning.",
      coverImage: "/portrait.jpg",
      coverImageAlt: "Shelan, holistic nutritionist",
    },

    story: {
      kicker: "Who I Am",
      headline: "From Pain to Purpose",
      paragraphs: [
        "My name is Shelan — and before I became a nutritionist, I was someone who spent years searching for answers that no one could give me. I struggled with unexplained pain, chronic inflammation, and a body that felt like a stranger to me. Every diet I tried made things worse, not better.",
        "It wasn't until I discovered I had Lipedema — a chronic condition affecting millions of women, yet severely underdiagnosed — that everything finally made sense. That diagnosis wasn't the end of my story. It was the beginning of a complete transformation in how I understood health, my body, and what it truly means to heal.",
        "I went back to school with new purpose. I earned my certifications in holistic nutrition, gut health, and Lipedema-specific care. I combined clinical science with deep empathy — because I know what it's like to sit on the other side of the table, scared and exhausted.",
        "Today, I've built a practice where every client feels seen, heard, and supported. Because genuine healing isn't just about what you eat — it's about understanding your body, your story, and building a relationship with health that can actually last a lifetime.",
      ],
      imageUrl: "/portrait.jpg",
      imageAlt: "Shelan in her wellness practice",
    },

    missionVision: {
      kicker: "What Drives Me",
      headline: "Mission & Vision",
      missionLabel: "My Mission",
      missionText:
        "To provide every woman with evidence-based, deeply personalized nutrition guidance that honors her unique biology, lived experience, and long-term wellbeing — especially those navigating complex conditions like Lipedema that mainstream medicine so often overlooks.",
      visionLabel: "My Vision",
      visionText:
        "A world where every woman has access to a nutrition specialist who truly understands her — where holistic health is the standard, not the exception, and where the journey to wellbeing is built on compassion rather than shame.",
    },

    philosophy: {
      kicker: "How I Work",
      headline: "My Philosophy of Care",
      subtitle:
        "Every principle I practice was shaped by my own healing journey and years of clinical experience.",
      pillars: [
        {
          iconName: "Heart",
          title: "Compassion First",
          description:
            "Every consultation begins with listening — truly listening. Your story, your pain, your goals. No judgment, no shortcuts.",
        },
        {
          iconName: "Microscope",
          title: "Evidence-Based",
          description:
            "All recommendations are grounded in current clinical research, adapted to your individual health picture and validated by science.",
        },
        {
          iconName: "Leaf",
          title: "Holistic Approach",
          description:
            "We look at the whole person — gut health, hormones, inflammation, sleep, stress, and emotional wellbeing — not just what's on your plate.",
        },
        {
          iconName: "RefreshCw",
          title: "Sustainable Change",
          description:
            "No crash diets, no punishing restrictions. We build habits that last because they fit your real life, your culture, and your preferences.",
        },
        {
          iconName: "Users",
          title: "Ongoing Partnership",
          description:
            "My support doesn't end when the session ends. You have continuous access to guidance, adjustments, and encouragement throughout your journey.",
        },
        {
          iconName: "Sparkles",
          title: "Body Positivity",
          description:
            "We heal the relationship with your body first. Nourishment from a place of care, not punishment, is the foundation of everything we do.",
        },
      ],
    },

    approach: {
      kicker: "My Method",
      headline: "A Structured Path to Your Transformation",
      subtitle:
        "A clear, clinical process that balances scientific rigor with genuine human care.",
      steps: [
        {
          number: "01",
          title: "Deep-Dive Health Assessment",
          description:
            "We start with a comprehensive review of your health history, symptoms, lifestyle, and goals — including any relevant lab work — to build a complete clinical picture.",
        },
        {
          number: "02",
          title: "Root Cause Analysis",
          description:
            "Instead of treating symptoms, we identify the underlying drivers: inflammation, gut dysbiosis, hormonal patterns, nutrient deficiencies, or Lipedema-specific factors.",
        },
        {
          number: "03",
          title: "Personalized Nutrition Protocol",
          description:
            "Your plan is built around your biology, not a generic template. Anti-inflammatory strategies, gut-healing foods, and macro targets are all tailored specifically to you.",
        },
        {
          number: "04",
          title: "Education & Empowerment",
          description:
            "I teach you the 'why' behind every recommendation so you can make confident, informed choices independently — long after our sessions end.",
        },
        {
          number: "05",
          title: "Iterative Follow-Up & Refinement",
          description:
            "We review progress regularly, adjust the plan based on your response, and celebrate every milestone — because sustainable transformation takes consistent, compassionate iteration.",
        },
      ],
    },

    certifications: {
      kicker: "Credentials",
      headline: "Training & Certifications",
      subtitle:
        "A foundation of clinical education combined with specialized expertise in the conditions that matter most to my clients.",
      items: [
        {
          title: "Certified Holistic Nutritionist",
          issuer: "American College of Healthcare Sciences",
          year: "2019",
          iconName: "Award",
        },
        {
          title: "Master Health Consultant",
          issuer: "Institute for Integrative Nutrition",
          year: "2020",
          iconName: "BadgeCheck",
        },
        {
          title: "Lipedema Nutrition Specialist",
          issuer: "Lipedema Foundation",
          year: "2021",
          iconName: "Stethoscope",
        },
        {
          title: "Gut Health & Microbiome Certificate",
          issuer: "AFPA Nutrition",
          year: "2021",
          iconName: "Microscope",
        },
        {
          title: "Functional Nutrition Alliance",
          issuer: "Full Body Systems Program",
          year: "2022",
          iconName: "BookOpen",
        },
        {
          title: "Anti-Inflammatory Nutrition",
          issuer: "Precision Nutrition",
          year: "2023",
          iconName: "Leaf",
        },
      ],
    },

    whyTrust: {
      kicker: "Why Shelan",
      headline: "What Makes This Different",
      subtitle:
        "Clients don't stay because of meal plans. They stay because of how they feel understood.",
      reasons: [
        {
          iconName: "PersonStanding",
          title: "I've Lived It",
          description:
            "I'm not just a practitioner — I'm a Lipedema patient. I understand the frustration, the misdiagnoses, and the path to genuine healing from the inside out.",
          stat: "Personal Experience",
        },
        {
          iconName: "FlaskConical",
          title: "Clinically Grounded",
          description:
            "Every protocol I design is based on current evidence, not trends. I stay updated with the latest research so you don't have to.",
          stat: "5+ Years Practice",
        },
        {
          iconName: "Heart",
          title: "Truly Personalized",
          description:
            "No two clients receive the same plan. Your biology, culture, lifestyle, and goals are the blueprint for everything we build together.",
          stat: "300+ Custom Plans",
        },
        {
          iconName: "Users",
          title: "Community of Support",
          description:
            "You join a community of women on similar journeys — sharing wins, challenges, and encouragement in a safe, judgment-free space.",
          stat: "200+ Happy Clients",
        },
        {
          iconName: "MessageCircle",
          title: "Always Reachable",
          description:
            "Questions don't wait until the next session. Direct messaging support means you're never left without guidance when you need it most.",
          stat: "24hr Response Time",
        },
        {
          iconName: "TrendingUp",
          title: "Proven Results",
          description:
            "94% of clients report significant improvement in their primary health goals within the first 90 days of working together.",
          stat: "94% Success Rate",
        },
      ],
    },

    cta: {
      kicker: "Ready to Begin?",
      headline: "Your Healing Journey Starts Here.",
      description:
        "Book a free 15-minute discovery call. No pressure, no commitment — just a genuine conversation about where you are and where you want to be.",
      buttonLabel: "Book a Free Call",
      buttonHref: "/booking",
    },
  },

  // ─── Arabic ──────────────────────────────────────────────────────────────────
  ar: {
    hero: {
      kicker: "قصتي",
      headline: "أبعد من التغذية.\nرحلة شفاء حقيقية.",
      subheadline:
        "أخصائية تغذية شمولية معتمدة، متخصصة في الليبيديما، والمرشدة التي تمنيتُ وجودها منذ البداية.",
      coverImage: "/portrait.jpg",
      coverImageAlt: "شيلان، أخصائية تغذية شمولية",
    },

    story: {
      kicker: "من أنا",
      headline: "من الألم إلى الهدف",
      paragraphs: [
        "اسمي شيلان — وقبل أن أصبح أخصائية تغذية، كنتُ شخصاً قضيتُ سنوات في البحث عن إجابات لا أحد يستطيع تقديمها لي. عانيتُ من آلام غير مفسرة والتهابات مزمنة، وجسد بدا غريباً عني. كل نظام غذائي جربته جعل الأمور أسوأ، لا أفضل.",
        "لم يكن حتى اكتشافي بأنني مصابة بالليبيديما — وهي حالة مزمنة تؤثر على ملايين النساء لكنها نادراً ما يُشخَّص — أن كل شيء أصبح منطقياً. لم يكن ذلك التشخيص نهاية قصتي، بل كان بداية تحول كامل في طريقة فهمي للصحة وجسدي ومعنى الشفاء الحقيقي.",
        "عدتُ إلى الدراسة بهدف جديد. حصلتُ على شهاداتي في التغذية الشمولية وصحة الأمعاء والرعاية المتخصصة للليبيديما. جمعتُ العلم السريري مع التعاطف العميق — لأنني أعرف كيف يبدو الجلوس على الجانب الآخر من الطاولة، خائفةً ومرهقة.",
        "اليوم، بنيتُ ممارسة مهنية يشعر فيها كل عميل بأنه مرئي ومسموع ومدعوم. لأن الشفاء الحقيقي لا يتعلق فقط بما تأكله — بل بفهم جسدك وقصتك وبناء علاقة مع الصحة يمكن أن تستمر مدى الحياة.",
      ],
      imageUrl: "/portrait.jpg",
      imageAlt: "شيلان في ممارستها الصحية",
    },

    missionVision: {
      kicker: "ما يحرّكني",
      headline: "الرسالة والرؤية",
      missionLabel: "رسالتي",
      missionText:
        "تقديم توجيه تغذوي مبني على الأدلة ومخصص بعمق لكل امرأة، يحترم بيولوجيتها الفريدة وتجربتها الحياتية ورفاهيتها على المدى البعيد — خاصةً اللواتي يتعاملن مع حالات معقدة مثل الليبيديما التي كثيراً ما تتجاهلها الطب الرئيسي.",
      visionLabel: "رؤيتي",
      visionText:
        "عالم تتمتع فيه كل امرأة بإمكانية الوصول إلى أخصائية تغذية تفهمها حقاً — حيث تكون الصحة الشمولية هي المعيار لا الاستثناء، وحيث تُبنى رحلة الرفاهية على التعاطف لا الخزي.",
    },

    philosophy: {
      kicker: "طريقة عملي",
      headline: "فلسفتي في الرعاية",
      subtitle: "كل مبدأ أتبعه شكّلته رحلتي الشخصية في الشفاء وسنوات من الخبرة السريرية.",
      pillars: [
        {
          iconName: "Heart",
          title: "التعاطف أولاً",
          description: "تبدأ كل استشارة بالاستماع — الاستماع الحقيقي. قصتك، ألمك، أهدافك. بلا أحكام، بلا اختصارات.",
        },
        {
          iconName: "Microscope",
          title: "مبني على الأدلة",
          description: "جميع التوصيات مبنية على البحث السريري الحديث، مكيّفة وفق صورتك الصحية الفردية ومُثبتة بالعلم.",
        },
        {
          iconName: "Leaf",
          title: "النهج الشمولي",
          description: "ننظر إلى الشخص بأكمله — صحة الأمعاء، الهرمونات، الالتهاب، النوم، التوتر، والرفاهية العاطفية — ليس فقط ما يوجد في طبقك.",
        },
        {
          iconName: "RefreshCw",
          title: "تغيير مستدام",
          description: "لا حميات قاسية، لا قيود مؤلمة. نبني عادات تدوم لأنها تناسب حياتك الحقيقية وثقافتك وتفضيلاتك.",
        },
        {
          iconName: "Users",
          title: "شراكة مستمرة",
          description: "دعمي لا ينتهي عند نهاية الجلسة. لديك وصول مستمر للتوجيه والتعديلات والتشجيع طوال رحلتك.",
        },
        {
          iconName: "Sparkles",
          title: "إيجابية الجسد",
          description: "نشفي العلاقة مع جسدك أولاً. التغذية من مكان الرعاية لا العقاب هي أساس كل ما نقوم به.",
        },
      ],
    },

    approach: {
      kicker: "منهجيتي",
      headline: "مسار منظم نحو تحولك",
      subtitle: "عملية سريرية واضحة توازن بين الدقة العلمية والرعاية الإنسانية الحقيقية.",
      steps: [
        {
          number: "٠١",
          title: "تقييم صحي معمق",
          description: "نبدأ بمراجعة شاملة لتاريخك الصحي والأعراض ونمط الحياة والأهداف — بما في ذلك أي نتائج مخبرية ذات صلة — لبناء صورة سريرية كاملة.",
        },
        {
          number: "٠٢",
          title: "تحليل الأسباب الجذرية",
          description: "بدلاً من معالجة الأعراض، نحدد المحركات الأساسية: الالتهاب، خلل بكتيريا الأمعاء، الأنماط الهرمونية، نقص العناصر الغذائية، أو العوامل المرتبطة بالليبيديما.",
        },
        {
          number: "٠٣",
          title: "بروتوكول تغذية مخصص",
          description: "خطتك مبنية على بيولوجيتك، ليس قالباً عاماً. الاستراتيجيات المضادة للالتهاب، وأغذية شفاء الأمعاء، وأهداف المغذيات الكبرى — كلها مُصمَّمة خصيصاً لك.",
        },
        {
          number: "٠٤",
          title: "التثقيف والتمكين",
          description: "أعلمك 'لماذا' كل توصية حتى تتمكني من اتخاذ خيارات واثقة ومدروسة باستقلالية — بعد انتهاء جلساتنا بفترة طويلة.",
        },
        {
          number: "٠٥",
          title: "متابعة وتحسين مستمر",
          description: "نراجع التقدم بانتظام، ونعدّل الخطة بناءً على استجابتك، ونحتفل بكل إنجاز — لأن التحول المستدام يتطلب تكراراً متواصلاً ومتعاطفاً.",
        },
      ],
    },

    certifications: {
      kicker: "المؤهلات",
      headline: "التدريب والشهادات",
      subtitle: "أساس من التعليم السريري مع خبرة متخصصة في الحالات الأكثر أهمية لعملائي.",
      items: [
        {
          title: "أخصائية تغذية شمولية معتمدة",
          issuer: "American College of Healthcare Sciences",
          year: "٢٠١٩",
          iconName: "Award",
        },
        {
          title: "كبير مستشاري الصحة",
          issuer: "Institute for Integrative Nutrition",
          year: "٢٠٢٠",
          iconName: "BadgeCheck",
        },
        {
          title: "متخصصة في تغذية الليبيديما",
          issuer: "Lipedema Foundation",
          year: "٢٠٢١",
          iconName: "Stethoscope",
        },
        {
          title: "شهادة صحة الأمعاء والميكروبيوم",
          issuer: "AFPA Nutrition",
          year: "٢٠٢١",
          iconName: "Microscope",
        },
        {
          title: "تحالف التغذية الوظيفية",
          issuer: "Full Body Systems Program",
          year: "٢٠٢٢",
          iconName: "BookOpen",
        },
        {
          title: "التغذية المضادة للالتهابات",
          issuer: "Precision Nutrition",
          year: "٢٠٢٣",
          iconName: "Leaf",
        },
      ],
    },

    whyTrust: {
      kicker: "لماذا شيلان",
      headline: "ما الذي يجعل هذا مختلفاً",
      subtitle: "العملاء لا يبقون بسبب جداول الوجبات، بل لأنهم يشعرون أنهم مفهومون حقاً.",
      reasons: [
        {
          iconName: "PersonStanding",
          title: "عشتُ التجربة بنفسي",
          description: "أنا لست مجرد ممارسة مهنية — أنا مريضة بالليبيديما. أفهم الإحباط والتشخيصات الخاطئة ومسار الشفاء الحقيقي من الداخل.",
          stat: "تجربة شخصية",
        },
        {
          iconName: "FlaskConical",
          title: "مؤسسة سريرياً",
          description: "كل بروتوكول أصممه مبني على أدلة حديثة، لا على صيحات. أواكب أحدث الأبحاث حتى لا تضطري أنتِ إلى ذلك.",
          stat: "5+ سنوات ممارسة",
        },
        {
          iconName: "Heart",
          title: "مخصص حقاً",
          description: "لا يوجد عميلتان تحصلان على نفس الخطة. بيولوجيتك وثقافتك ونمط حياتك وأهدافك هي المخطط لكل ما نبنيه معاً.",
          stat: "+300 خطة مخصصة",
        },
        {
          iconName: "Users",
          title: "مجتمع دعم",
          description: "تنضمين إلى مجتمع من النساء في رحلات مماثلة — يتشاركن الانتصارات والتحديات والتشجيع في فضاء آمن وخالٍ من الأحكام.",
          stat: "+200 عميلة سعيدة",
        },
        {
          iconName: "MessageCircle",
          title: "دائماً متاحة",
          description: "الأسئلة لا تنتظر حتى الجلسة القادمة. دعم المراسلة المباشرة يعني أنكِ لست بدون توجيه عندما تحتاجينه.",
          stat: "وقت استجابة 24 ساعة",
        },
        {
          iconName: "TrendingUp",
          title: "نتائج مثبتة",
          description: "94% من العملاء يُبلّغن عن تحسن ملحوظ في أهدافهن الصحية الرئيسية خلال أول 90 يوماً من العمل معاً.",
          stat: "معدل نجاح 94%",
        },
      ],
    },

    cta: {
      kicker: "مستعدة للبدء؟",
      headline: "رحلة شفائك تبدأ هنا.",
      description: "احجزي مكالمة استكشافية مجانية لمدة 15 دقيقة. بلا ضغط، بلا التزام — مجرد محادثة صادقة حول أين أنتِ الآن وأين تريدين أن تكوني.",
      buttonLabel: "احجزي مكالمة مجانية",
      buttonHref: "/booking",
    },
  },
};
