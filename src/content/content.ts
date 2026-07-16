// Centralized bilingual content for the entire site.
// This file contains UI strings only (labels, placeholders, nav, aria-labels).
// Page content (headlines, body copy, images) lives in src/data/*.data.ts.

// Edit the strings here to update copy across the whole app — no component
// changes required. `en` = English (LTR), `ar` = Arabic (RTL).

export type Lang = "en" | "ar";

export const siteMeta = {
  en: {
    name: "SHELAN",
    tagline: "Nutritionist & Lipedema Specialist",
  },
  ar: {
    name: "SHELAN",
    tagline: "أخصائية تغذية ومتخصصة في الليبيديما",
  },
};

export const nav = {
  en: [
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "info-hub", label: "Resources" },
    { id: "success-stories", label: "Success Stories" },
    { id: "testimonials", label: "Testimonials" },
    { id: "faq", label: "FAQ" },
    { id: "booking", label: "Book Now" },
    { id: "site-footer", label: "Contact Me" },
  ],
  ar: [
    { id: "about", label: "من أنا" },
    { id: "services", label: "الخدمات" },
    { id: "info-hub", label: "المصادر" },
    { id: "success-stories", label: "قصص نجاح" },
    { id: "testimonials", label: "آراء العميلات" },
    { id: "faq", label: "الأسئلة الشائعة" },
    { id: "booking", label: "احجزي الآن" },
    { id: "site-footer", label: "تواصلي معي" },
  ],
};

export const hero = {
  en: {
    eyebrow: "Personalized Nutrition & Lipedema Care",
    headline: "Nourish Your Body. Reclaim Your Health.",
    subheadline:
      "Evidence-based nutrition plans and specialized Lipedema management, designed around your body and your life — with Shelan.",
    ctaPrimary: "Book Your Consultation",
    ctaSecondary: "Learn About Lipedema Care",
    imageAlt: "Shelan, professional nutritionist",
  },
  ar: {
    eyebrow: "تغذية شخصية ورعاية متخصصة لليبيديما",
    headline: "غذّي جسدك. استعيدي صحتك.",
    subheadline:
      "خطط تغذية مبنية على الأدلة العلمية وإدارة متخصصة لليبيديما، مصممة خصيصًا لجسدك وحياتك — مع شيلان.",
    ctaPrimary: "احجزي استشارتك",
    ctaSecondary: "تعرفي على رعاية الليبيديما",
    imageAlt: "شيلان، أخصائية تغذية محترفة",
  },
};

export const about = {
  en: {
    title: "Meet Shelan",
    kicker: "About Your Nutritionist",
    bio: [
      "Shelan.. A journey that began with pain, and ended with understanding and embrace.",
      "Welcome to my own space. I'm Shelan, a holistic nutritionist and health coach — but before that, I was one of you. For many years, I lived in a struggle with unexplained physical and emotional pain, believing all along that my only problem was \"being overweight\" — until I discovered the truth: I have Lipedema.",
      "That moment was my turning point. I learned that my body didn't need a harsh war or constant punishment, but rather understanding, support, balance, and real acceptance.",
      "Today, I've chosen to dedicate my expertise and knowledge to being the friend and guide I wished I'd had beside me on my own journey. My goal isn't just to hand out meal plans — it's to spread holistic health awareness and support every woman who feels tired or lost in her journey with her body. My work with you is built on mindful nutrition, gut health, and a holistic approach connecting physical health with emotional well-being, because I truly believe that health awareness is the key that can change an entire life.",
    ],
    credentialsLabel: "Credentials & Focus Areas",
    credentials: [
      "Certified Clinical Nutritionist",
      "Lipedema Nutrition Specialist",
      "Holistic Health Practitioner",
    ],
    imageAlt: "Portrait of Shelan",
  },
  ar: {
    title: "تعرفي على شيلان (SHELAN)",
    kicker: "عن أخصائية التغذية",
    bio: [
      "شيلان.. رحلة بدأت من الألم، وانتهت بالتفهم والاحتواء.",
      "أهلاً بكِ في مساحتي الخاصة. أنا شيلان، أخصائية تغذية شمولية ومدربة صحة، ولكن قبل ذلك، أنا كنت واحدة منكنّ. لسنوات طويلة، عشت في صراع مع ألم جسدي ونفسي لا يُفسر، وكنت أعتقد طوال الوقت أن مشكلتي تكمن في \"زيادة الوزن\" فقط، حتى اكتشفت حقيقة مرضي بالليبيديميا.",
      "تلك اللحظة كانت نقطة التحول؛ تعلمت فيها أن جسدي لم يكن بحاجة إلى حرب قاسية أو عقاب مستمر، بل كان يحتاج إلى الفهم، الدعم، التوازن، والاحتواء الحقيقي.",
      "اليوم، قررت أن أكرس خبرتي وعلمي لأكون الصديقة والموجهة التي تمنيت وجودها بجانبي في رحلتي. هدفي ليس مجرد وضع جداول غذائية، بل نشر الوعي الصحي الشمولي ودعم كل فتاة تشعر بالتعب أو الضياع في رحلة التعامل مع جسدها. رحلتي معكم ترتكز على التغذية الواعية، صحة الأمعاء، والنهج الشمولي الذي يربط بين صحة الجسد وسلامة النفس، لأنني أؤمن حقاً أن الوعي الصحي هو المفتاح الذي قد يُغير حياة كاملة.",
    ],
    credentialsLabel: "المؤهلات ومجالات التركيز",
    credentials: [
      "#الاخصائية_شيلان",
      "أخصائية تغذية شمولية وكبير مستشاري الصحة",
      "🇺🇸 US-Certified Holistic Nutritionist & Master Health Consultant",
      "🌱 Gut Health Specialist & Wellness Coach",
    ],
    imageAlt: "صورة شخصية لشيلان",
  },
};

export const services = {
  en: {
    title: "Services",
    kicker: "How I Can Help You",
    items: [
      {
        title: "General Nutrition",
        description:
          "Personalized nutrition plans to help you build sustainable habits, improve energy, and reach your wellness goals.",
      },
      {
        title: "Lipedema Specialized Plan",
        description:
          "A dedicated nutrition protocol addressing the unique inflammatory and metabolic needs of Lipedema, developed with clinical care.",
      },
      {
        title: "Holistic Health Consultation",
        description:
          "A whole-body approach combining nutrition, lifestyle, and mindset guidance for lasting, balanced well-being.",
      },
    ],
  },
  ar: {
    title: "الخدمات",
    kicker: "كيف يمكنني مساعدتك",
    items: [
      {
        title: "التغذية العامة",
        description:
          "خطط تغذية شخصية تساعدك على بناء عادات مستدامة، وتحسين مستوى الطاقة، وتحقيق أهدافك الصحية.",
      },
      {
        title: "خطة متخصصة لليبيديما",
        description:
          "بروتوكول تغذية مخصص يعالج الاحتياجات الالتهابية والأيضية الفريدة لحالة الليبيديما، مطوّر برعاية سريرية.",
      },
      {
        title: "استشارة صحية شاملة",
        description:
          "نهج شامل يجمع بين التغذية ونمط الحياة والإرشاد الذهني من أجل صحة متوازنة ودائمة.",
      },
    ],
  },
};

export const infoHub = {
  en: {
    title: "Resources & Information Hub",
    kicker: "Learn More",
    sections: [
      {
        title: "Nutrition Basics",
        description:
          "Understand the fundamentals of balanced eating — macronutrients, hydration, and building meals that fuel your body well.",
        points: [
          "Balancing proteins, fats, and carbohydrates",
          "The role of hydration in metabolic health",
          "Reading labels and avoiding common pitfalls",
        ],
      },
      {
        title: "Lipedema Management",
        description:
          "Explore how targeted nutrition can support inflammation reduction and symptom management alongside medical care.",
        points: [
          "Anti-inflammatory food strategies",
          "Nutrition's role alongside compression & movement",
          "Building a long-term, sustainable plan",
        ],
      },
    ],
  },
  ar: {
    title: "مركز المصادر والمعلومات",
    kicker: "تعرفي أكثر",
    sections: [
      {
        title: "أساسيات التغذية",
        description:
          "افهمي أساسيات التغذية المتوازنة — العناصر الكبرى، والترطيب، وبناء وجبات تدعم جسدك بشكل صحيح.",
        points: [
          "الموازنة بين البروتينات والدهون والكربوهيدرات",
          "دور الترطيب في الصحة الأيضية",
          "قراءة الملصقات الغذائية وتجنب الأخطاء الشائعة",
        ],
      },
      {
        title: "إدارة الليبيديما",
        description:
          "اكتشفي كيف يمكن للتغذية الموجهة أن تدعم تقليل الالتهاب وإدارة الأعراض جنبًا إلى جنب مع الرعاية الطبية.",
        points: [
          "استراتيجيات الأطعمة المضادة للالتهاب",
          "دور التغذية إلى جانب الضغط والحركة",
          "بناء خطة مستدامة على المدى الطويل",
        ],
      },
    ],
  },
};

export const faq = {
  en: {
    title: "Frequently Asked Questions",
    kicker: "Nutrition & Lipedema",
    items: [
      {
        question: "How is nutrition connected to Lipedema?",
        answer:
          "While nutrition cannot cure Lipedema, an anti-inflammatory, well-structured eating plan can help manage symptoms, reduce inflammation, and support overall mobility and comfort.",
      },
      {
        question: "Will I need to follow a strict diet?",
        answer:
          "No. Plans are built around sustainable, realistic habits tailored to your lifestyle — not restrictive diets that are hard to maintain long-term.",
      },
      {
        question: "Do you work alongside my doctor or specialist?",
        answer:
          "Yes. Nutrition support is designed to complement, not replace, medical treatment. I encourage collaboration with your healthcare team for the best outcomes.",
      },
      {
        question: "How soon can I expect to see results?",
        answer:
          "Every body responds differently, but many clients notice improvements in energy and comfort within the first few weeks of a consistent, personalized plan.",
      },
      {
        question: "How do I get started?",
        answer:
          "Simply book a consultation using the button on this page. We'll begin with an in-depth assessment of your health history and goals.",
      },
    ],
  },
  ar: {
    title: "الأسئلة الشائعة",
    kicker: "التغذية والليبيديما",
    items: [
      {
        question: "كيف ترتبط التغذية بالليبيديما؟",
        answer:
          "على الرغم من أن التغذية لا تعالج الليبيديما، إلا أن خطة أكل مضادة للالتهاب ومنظمة جيدًا يمكن أن تساعد في إدارة الأعراض، وتقليل الالتهاب، ودعم الحركة والراحة بشكل عام.",
      },
      {
        question: "هل سأحتاج لاتباع حمية صارمة؟",
        answer:
          "لا. يتم بناء الخطط حول عادات مستدامة وواقعية مصممة خصيصًا لنمط حياتك — وليس حميات مقيدة يصعب الاستمرار بها على المدى الطويل.",
      },
      {
        question: "هل تتعاونين مع طبيبي أو أخصائيي؟",
        answer:
          "نعم. الدعم الغذائي مصمم ليكمل العلاج الطبي وليس ليحل محله. أشجع دائمًا على التعاون مع فريقك الطبي لتحقيق أفضل النتائج.",
      },
      {
        question: "متى يمكنني توقع رؤية نتائج؟",
        answer:
          "كل جسد يستجيب بشكل مختلف، لكن العديد من العميلات يلاحظن تحسنًا في الطاقة والراحة خلال الأسابيع الأولى من اتباع خطة شخصية ومنتظمة.",
      },
      {
        question: "كيف أبدأ؟",
        answer:
          "ببساطة احجزي استشارة باستخدام الزر الموجود في هذه الصفحة. سنبدأ بتقييم متعمق لتاريخك الصحي وأهدافك.",
      },
    ],
  },
};

export const booking = {
  en: {
    title: "Ready to Start Your Journey?",
    description:
      "Book a one-on-one consultation with Shelan and take the first step toward a personalized nutrition plan built around you.",
    cta: "Book Your Consultation",
  },
  ar: {
    title: "هل أنتِ مستعدة لبدء رحلتك؟",
    description:
      "احجزي استشارة فردية مع شيلان واتخذي الخطوة الأولى نحو خطة تغذية شخصية مصممة خصيصًا لكِ.",
    cta: "احجزي استشارتك",
  },
};

export const pricingSection = {
  en: {
    kicker: "Consultation Packages",
    title: "Choose Your Path to Healing",
    subtitle:
      "Flexible plans designed around your journey — from a single diagnostic session to full ongoing support.",
  },
  ar: {
    kicker: "باقات الاستشارة",
    title: "اختاري رحلتكِ نحو الشفاء",
    subtitle:
      "خطط مرنة مصممة حول رحلتكِ — من جلسة تشخيصية واحدة إلى دعم شامل ومستمر.",
  },
};

export const pricingPlans = {
  en: [
    {
      name: "Single Diagnostic Session",
      price: "$120",
      period: "one-time",
      duration: "45 minutes",
      badge: null as string | null,
      features: [
        "In-depth health & lifestyle assessment",
        "Personalized initial recommendations",
        "Written session summary",
      ],
      cta: "Book Now",
    },
    {
      name: "Comprehensive Follow-up Package",
      price: "$350",
      period: "/ month",
      duration: "4 sessions monthly",
      badge: "Most Popular" as string | null,
      features: [
        "Full personalized nutrition plan",
        "Weekly check-ins & adjustments",
        "Direct messaging support",
        "Lipedema-specific progress tracking",
        "Printable meal & movement guides",
      ],
      cta: "Book Now",
    },
    {
      name: "Ready-Made Custom Plan",
      price: "$65",
      period: "one-time",
      duration: "PDF delivery",
      badge: null as string | null,
      features: [
        "Tailored nutrition plan (PDF)",
        "Delivered within 48 hours",
        "One follow-up question included",
      ],
      cta: "Book Now",
    },
  ],
  ar: [
    {
      name: "جلسة تشخيصية واحدة",
      price: "$120",
      period: "دفعة واحدة",
      duration: "٤٥ دقيقة",
      badge: null as string | null,
      features: [
        "تقييم شامل للحالة الصحية ونمط الحياة",
        "توصيات أولية مخصصة لكِ",
        "ملخص مكتوب للجلسة",
      ],
      cta: "احجزي الآن",
    },
    {
      name: "باقة المتابعة الشاملة",
      price: "$350",
      period: "/ شهريًا",
      duration: "٤ جلسات شهريًا",
      badge: "الأكثر طلبًا" as string | null,
      features: [
        "خطة تغذية شخصية متكاملة",
        "متابعة أسبوعية وتعديل الخطة",
        "دعم مباشر عبر الرسائل",
        "تتبع تقدّم خاص بالليبيديما",
        "أدلة قابلة للطباعة للأكل والحركة",
      ],
      cta: "احجزي الآن",
    },
    {
      name: "الخطة المخصصة الجاهزة",
      price: "$65",
      period: "دفعة واحدة",
      duration: "تسليم PDF",
      badge: null as string | null,
      features: [
        "خطة تغذية مخصصة بصيغة PDF",
        "التسليم خلال ٤٨ ساعة",
        "سؤال متابعة واحد مُتضمّن",
      ],
      cta: "احجزي الآن",
    },
  ],
};

export const checkoutModal = {
  en: {
    title: "Secure Checkout",
    subtitle: "Complete your booking with a secure payment.",
    cardNumber: "Card Number",
    expiry: "Expiry Date",
    cvc: "CVC",
    nameOnCard: "Name on Card",
    namePlaceholder: "Full name",
    payButton: "Pay Securely via Stripe",
    processing: "Processing…",
    success: "Payment Successful!",
    successNote: "Your consultation is booked. A confirmation email is on its way.",
    securedBy: "Secured by",
    close: "Close",
    total: "Total",
  },
  ar: {
    title: "الدفع الآمن",
    subtitle: "أكملي حجزكِ بدفع آمن.",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ الانتهاء",
    cvc: "CVC",
    nameOnCard: "الاسم على البطاقة",
    namePlaceholder: "الاسم الكامل",
    payButton: "دفع آمن عبر Stripe",
    processing: "جارٍ المعالجة…",
    success: "تمت عملية الدفع بنجاح!",
    successNote: "تم حجز استشارتكِ. سيصلكِ بريد إلكتروني للتأكيد قريبًا.",
    securedBy: "بحماية",
    close: "إغلاق",
    total: "الإجمالي",
  },
};

export const authModal = {
  en: {
    trigger: "Login / Sign Up",
    loginTab: "Login",
    signupTab: "Create Account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Full Name",
    loginButton: "Login",
    signupButton: "Create Account",
    forgotPassword: "Forgot Password?",
    forgotTitle: "Reset Your Password",
    forgotSubtitle: "Enter your email and we'll send you a reset link.",
    resetButton: "Send Reset Link",
    resetSent: "Reset link sent! Check your inbox.",
    backToLogin: "Back to Login",
  },
  ar: {
    trigger: "تسجيل الدخول / حساب جديد",
    loginTab: "تسجيل الدخول",
    signupTab: "إنشاء حساب جديد",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    name: "الاسم الكامل",
    loginButton: "تسجيل الدخول",
    signupButton: "إنشاء حساب",
    forgotPassword: "نسيت كلمة السر؟",
    forgotTitle: "إعادة تعيين كلمة السر",
    forgotSubtitle: "أدخلي بريدكِ الإلكتروني وسنرسل لكِ رابط إعادة التعيين.",
    resetButton: "إعادة تعيين كلمة السر",
    resetSent: "تم إرسال رابط إعادة التعيين! تحققي من بريدكِ.",
    backToLogin: "العودة لتسجيل الدخول",
  },
};

export const successStoriesSection = {
  en: {
    kicker: "Real Journeys",
    title: "Success Stories",
    subtitle:
      "Real experiences shared by women who followed the conservative treatment approach and reclaimed their health and confidence.",
    loadMoreCta: "Discover More Success Stories",
    showLessCta: "Show Less",
  },
  ar: {
    kicker: "رحلات حقيقية",
    title: "قصص نجاح",
    subtitle:
      "تجارب حقيقية شاركتها نساء التزمن بالعلاج التحفظي واستعدن صحتهن وثقتهن بأنفسهن.",
    loadMoreCta: "اكتشفي المزيد من قصص النجاح",
    showLessCta: "عرض أقل",
  },
};

export const successStories = {
  en: [
    { title: "Years of pain… until I finally found an explanation for what was happening to me", content: "I didn't know that what I was going through even had a name. I believed the pain, heaviness, and swelling were just a normal part of my life, so I endured it in silence. I tried countless diets and lost weight more than once, but my legs and arms never changed — I always ended up back where I started. I felt discouraged and blamed myself, convinced I simply wasn't trying hard enough. After learning about conservative treatment and finally understanding the nature of Lipedema, my entire outlook changed. The journey hasn't been easy, but for the first time I feel like I'm on the right path. With commitment, the inflammation began to ease, movement became easier, and I regained a sense of comfort I hadn't felt in years. Today I feel reborn — not because I became perfect, but because I finally understood my body and stopped fighting it. Thank you, from the bottom of my heart." },
    { title: "After I started following the page and applying the advice step by step, my entire view of my body changed.", content: "I committed to conservative treatment and began paying attention to anti-inflammatory eating, walking, and all the small details I once thought wouldn't make a difference. Over time the pain eased, the swelling decreased, and I could move with far more comfort — and most importantly, I stopped blaming myself after years of frustration. Today I feel like I understand my body better, I know how to care for it, and I feel like I'm finally getting myself back. From the bottom of my heart, thank you for all the time and effort put into spreading this awareness — I pray it's rewarded, and that it helps every woman still searching for the hope I once searched for." },
    { title: "Before discovering this content, I was living in a cycle of confusion.", content: "I tried countless diets and saw more doctors than I can count, and each time I believed the problem was my own willpower or lack of effort. After I started following the page and applying the advice step by step, I understood — for the first time — what conservative treatment really means, and how daily habits can make a real difference. Over time my body began to feel lighter, the pain and inflammation gradually eased, and most importantly, I stopped blaming myself. Today I feel like I'm living my journey with far more confidence and hope. From the depths of my heart, thank you for every piece of information and every effort made to bring this awareness to us." },
    { title: "I believed Lipedema was a sentence I'd live with forever without any improvement, so I lost hope for a long time.", content: "When I started following the page and committing to the advice, I didn't expect to see any real difference — but within weeks I began noticing the swelling decrease, movement becoming easier, and sleeping more comfortably. The change wasn't only in my body, but in my mindset too, because I finally understood what was happening to me. Thank you from the heart for this knowledge that gave me back my hope, and I pray this effort helps every woman suffering the way I once did." },
    { title: "Years of moving between diets and deprivation with no real results — and every time I failed, I blamed myself even more.", content: "After following the page and committing to conservative treatment as I learned it, my entire outlook changed. I began to understand that my body needed a lifestyle suited to it, not harsh deprivation. Today I feel more energy, the inflammation has eased, and I treat my body with love instead of harshness. Thank you for every piece of information you shared with us — it changed the way I think before it ever changed my health." },
    { title: "I was living in confusion because I couldn't find anyone who explained Lipedema in a way I could understand.", content: "After following the page, the picture became clearer, and I learned what helps me and what harms me. I committed to the advice, and I began noticing improvement in inflammation and in my daily activity — and best of all, I found hope I hadn't felt in years. Thank you for this honest content, and I pray every piece of information that changed my life is counted in your favor." },
    { title: "I lived 29 years without knowing what I was dealing with", content: "From the age of 16, my legs and arms began to swell, and everyone around me assumed it was simply weight gain or laziness. I tried medications, diets, and saw many doctors, until I reached a point where I hated my own body and lost all confidence in myself. After discovering Shelan's page, I understood for the first time that what I had a name — Lipedema — and that conservative treatment could help ease the symptoms. I committed to anti-inflammatory eating, lymphatic drainage, electrolytes, and appropriate movement. Today I can say I understand my body, I've regained hope, and I know how to manage my condition instead of fearing it. Thank you, Shelan — after God, you're the reason I understood my body and stopped blaming myself." },
    { title: "In just 90 days… I lost 10 kilograms", content: "After only 90 days of committing to conservative treatment, I lost 10 kilograms calmly and healthily, without deprivation or stress. I gradually added walking to my routine, and over time, commitment became a way of life. It wasn't just my weight that changed — my mindset changed too, and I began to love myself and understand my body. Thank you from the heart, and I pray every bit of your effort and knowledge is rewarded." },
    { title: "For years I suffered from recurring infections and urinary tract infections, until I was told I might need surgery.", content: "After following Shelan's guidance and starting conservative treatment, lymphatic drainage, and electrolytes, the infections eased dramatically, the fluid retention disappeared, and I no longer needed surgery. I could move comfortably again, the swelling decreased, and even my rings started fitting easily again. Thank you, thank you, thank you — after God, you changed my health, my awareness, and my life." },
    { title: "I discovered Shelan's page by chance, and I never expected that chance would change my life.", content: "In just two months I lost 6 kilograms, the swelling visibly decreased, and I began to understand my body far better. I learned how to commit to conservative treatment without feeling deprived. Thank you, Shelan — you taught us how to understand ourselves, love our bodies, and keep going." },
    { title: "I kept moving from one diet to another, always ending up back at square one.", content: "After following Shelan, I understood that Lipedema needs a complete lifestyle, not just a diet. I applied conservative treatment and paid attention to movement, electrolytes, and every small detail. The inflammation eased, my measurements went down, and I regained hope. Today I know the real achievement isn't just losing weight — it's that I learned to love myself and understand my body." },
    { title: "Before discovering Shelan, I was living in a cycle of confusion.", content: "Every time a diet failed, I blamed myself. But after committing to the advice and anti-inflammatory eating, the swelling began to ease, I could move with ease, and I woke up with more energy. I learned that this journey isn't a race, but a way of life. Thank you, Shelan — I pray everything you offer is rewarded." },
    { title: "For years I searched for the reason behind my pain and fatigue, but never found an answer.", content: "After following Shelan, I understood that my body needed a different approach. Over time the bloating and pain eased, I could move comfortably, and even the people around me noticed the change. I started smiling again and accepting myself after years of frustration. Thank you from the heart." },
    { title: "I was diagnosed with Lipedema two months ago, and I felt completely lost.", content: "I searched for a long time for Arabic content that explained the condition, until I found Shelan's page. I began applying the advice, learning, and understanding the reality of the condition. I learned to love myself, accept my body, and wear my compression garment correctly, and the pain began to ease. Thank you, Shelan — you've been the greatest Arabic advocate for Lipedema patients." },
    { title: "I've had Lipedema for more than 13 years.", content: "I saw many doctors without ever getting a proper diagnosis. After finding Shelan's page, I finally understood the condition and committed to conservative treatment. Within just ten days, the swelling began to ease and movement became easier. Thank you, Shelan — you restored my confidence in my own body." },
    { title: "After just one month of following Shelan's guidance, I lost 3.5 kilograms.", content: "I used a compression garment, a vibration device, and electrolyte water, and I committed to healthy eating. The swelling eased, my energy increased, and I now have a lifestyle I can actually sustain. Thank you, Shelan — you taught us that treatment isn't deprivation, it's a way of life." },
    { title: "I was living in emotional darkness because of Lipedema.", content: "Despite seeing many doctors, no one diagnosed my condition correctly. After following Shelan's guidance, the swelling and pain eased, and my migraines, sinus infections, digestive issues, and bloating all improved. But the biggest change was in my mindset. I understood that Lipedema is a real condition, and that conservative treatment is a flexible way of life. Thank you, Shelan — you lit the way for us, and I pray every piece of knowledge you share is rewarded." },
  ],
  ar: [
    { title: "سنوات من الألم… حتى وجدت تفسيرًا لما يحدث لي", content: "لم أكن أعرف أن ما أمر به له اسم. كنت أعتقد أن الألم والثقل والتورم جزء طبيعي من حياتي، لذلك كنت أتحمل بصمت. جربت حميات كثيرة، وخسرت من وزني أكثر من مرة، لكن ساقي وذراعاي لم تتغيرا، وكنت أعود دائمًا إلى نقطة البداية. شعرت بالإحباط، وبدأت ألوم نفسي لأنني كنت أعتقد أنني لا أبذل جهدًا كافيًا. بعد أن تعرفت على العلاج التحفظي وبدأت أفهم طبيعة الليبيديما، تغيرت نظرتي بالكامل. لم تكن رحلتي سهلة، لكنها كانت أول مرة أشعر فيها أنني أسير في الطريق الصحيح. مع الالتزام بدأت الالتهابات تخف، وأصبحت الحركة أسهل، واستعدت جزءًا من راحتي التي فقدتها منذ سنوات. اليوم أشعر أنني وُلدت من جديد، ليس لأنني أصبحت مثالية، بل لأنني أخيرًا فهمت جسمي وتوقفت عن محاربته. شكرًا من القلب." },
    { title: "بعد أن بدأت أتابع الصفحة وأطبق النصائح خطوة بخطوة، تغيرت نظرتي لجسمي بالكامل.", content: "التزمت بالعلاج التحفظي، وبدأت أهتم بالأكل المضاد للالتهاب، والمشي، وكل التفاصيل الصغيرة التي كنت أعتقد أنها لن تصنع فرقًا. مع مرور الوقت خف الألم، وقل التورم، وأصبحت أتحرك براحة أكبر، والأهم أنني توقفت عن لوم نفسي بعد سنوات طويلة من الإحباط. اليوم أشعر أنني أفهم جسمي أكثر، وأعرف كيف أعتني به، وأشعر أنني بدأت أستعيد نفسي من جديد. من كل قلبي أشكر كل الوقت والجهد الذي يُبذل لنشر هذا الوعي، وأسأل الله أن يجعله في ميزان الحسنات، وأن ينفع به كل امرأة ما زالت تبحث عن الأمل كما كنت أبحث عنه يومًا." },
    { title: "قبل أن أتعرف على هذا المحتوى كنت أعيش في دوامة من الحيرة.", content: "جربت أنظمة غذائية كثيرة، وراجعت أكثر من طبيب، وفي كل مرة كنت أعتقد أن المشكلة في إرادتي أو أنني لا أبذل جهدًا كافيًا. بعد أن بدأت أتابع الصفحة وأطبق النصائح خطوة بخطوة، فهمت لأول مرة معنى العلاج التحفظي، وكيف يمكن للعادات اليومية أن تصنع فرقًا حقيقيًا. مع مرور الوقت بدأت أشعر بخفة في جسمي، وخف الألم والالتهاب تدريجيًا، والأهم أنني توقفت عن لوم نفسي. اليوم أشعر أنني أعيش رحلتي بثقة وأمل أكبر. من أعماق قلبي شكرًا على كل معلومة، وعلى كل جهد بُذل حتى يصل هذا الوعي إلينا. وأسأل الله أن يحفظ لكِ عائلتك، ويرزقكِ من حيث لا تحتسبين." },
    { title: "كنت أعتقد أن الليبيديما حكم سأعيش معه دون أي تحسن، لذلك فقدت الأمل لفترة طويلة.", content: "عندما بدأت أتابع الصفحة وألتزم بالنصائح، لم أكن أتوقع أن أرى فرقًا حقيقيًا، لكن مع الأسابيع بدأت ألاحظ أن التورم يقل، والحركة أصبحت أسهل، وأصبحت أنام براحة أكثر. لم يكن التغيير في جسمي فقط، بل في نفسيتي أيضًا، لأنني أخيرًا فهمت ما الذي يحدث لي. شكرًا من القلب على هذا العلم الذي أعاد لي الأمل، وأسأل الله أن يبارك في هذا الجهد وينفع به كل امرأة تعاني كما كنت أعاني." },
    { title: "سنوات وأنا أتنقل بين الحميات والحرمان دون أي نتيجة حقيقية، وكلما فشلت كنت ألوم نفسي أكثر.", content: "بعد متابعة الصفحة والالتزام بالعلاج التحفظي كما تعلمته، تغيرت نظرتي بالكامل. بدأت أفهم أن جسمي يحتاج إلى أسلوب حياة يناسبه، وليس إلى حرمان قاسٍ. اليوم أشعر بطاقة أفضل، والالتهابات خفت، وأصبحت أتعامل مع جسمي بحب بدلًا من القسوة. شكرًا على كل معلومة قدمتِها لنا، فقد غيّرت طريقة تفكيري قبل أن تغيّر صحتي." },
    { title: "كنت أعيش في حيرة لأنني لم أجد أحدًا يشرح الليبيديما بطريقة أفهمها.", content: "بعد متابعة الصفحة بدأت الصورة تتضح أمامي، وأصبحت أعرف ما الذي يفيدني وما الذي يضرني. التزمت بالنصائح، وبدأت ألاحظ تحسنًا في الالتهاب وفي نشاطي اليومي، والأجمل أنني أصبحت أمتلك أملًا لم أشعر به منذ سنوات. شكرًا على هذا المحتوى الصادق، وأسأل الله أن يكتب أجر كل معلومة كانت سببًا في تغيير حياتي." },
    { title: "عشت 29 سنة وأنا لا أعرف ما الذي أعاني منه", content: "من عمر 16 سنة بدأت رجلاي وذراعاي يتضخمان، وكل الناس كانوا يعتقدون أن المشكلة مجرد سمنة أو كسل. جربت أدوية، وحميات، وراجعت أطباء كثيرين، وحتى وصلت إلى مرحلة كرهت فيها جسمي وفقدت ثقتي بنفسي. بعد أن تعرفت على صفحة شيلان، فهمت لأول مرة أن ما أعاني منه اسمه ليبيديما، وأن له علاجًا تحفظيًا يساعد على تخفيف الأعراض. التزمت بالأكل المضاد للالتهاب، وفتح العقد اللمفاوية، والإلكترولايت، والحركة المناسبة. اليوم أستطيع أن أقول إنني فهمت جسمي، واستعدت الأمل، وأصبحت أعرف كيف أتعامل مع مرضي بدلًا من الخوف منه. شكرًا شيلان... كنتِ بعد الله سببًا في أن أفهم جسمي وأتوقف عن لوم نفسي." },
    { title: "بعد 90 يومًا فقط... خسرت 10 كيلو", content: "بعد 90 يومًا فقط من الالتزام بالعلاج التحفظي، خسرت 10 كيلو بهدوء وصحة، دون حرمان أو توتر. بدأت أضيف المشي تدريجيًا إلى روتيني، ومع الأيام أصبح الالتزام أسلوب حياة. لم يتغير وزني فقط، بل تغيرت نفسيتي أيضًا، وأصبحت أحب نفسي وأفهم جسمي. شكرًا من القلب... وأسأل الله أن يجعل كل تعبك وعلمك في ميزان حسناتك." },
    { title: "سنوات طويلة كنت أعاني من التهابات متكررة والتهابات بول، حتى قيل لي إنني قد أحتاج إلى عملية.", content: "بعد أن التزمت بتعليمات شيلان، وبدأت العلاج التحفظي، وفتح العقد اللمفاوية، والإلكترولايت، خفت الالتهابات بشكل كبير، واختفى احتباس السوائل، ولم أعد بحاجة للعملية. رجعت أتحرك براحة، وخف الورم، وحتى خواتمي أصبحت تدخل بسهولة. شكرًا شكرًا شكرًا... بعد الله غيّرتِ صحتي ووعيي وحياتي." },
    { title: "تعرفت على صفحة شيلان بالصدفة، ولم أكن أتوقع أن هذه الصدفة ستغيّر حياتي.", content: "خلال شهرين فقط خسرت 6 كيلو، وخف الورم بشكل واضح، وأصبحت أفهم جسمي أكثر. تعلمت كيف ألتزم بالعلاج التحفظي دون شعور بالحرمان. شكرًا شيلان... لأنك علمتِنا كيف نفهم أنفسنا ونحب أجسامنا ونستمر." },
    { title: "كنت أتنقل بين الحميات، وأعود دائمًا إلى نقطة البداية.", content: "بعد متابعة شيلان، فهمت أن الليبيديما تحتاج أسلوب حياة متكامل، وليس مجرد رجيم. طبقت العلاج التحفظي، واهتممت بالحركة والإلكترولايت والتفاصيل الصغيرة. خف الالتهاب، ونزلت المقاسات، واستعدت الأمل. اليوم أعلم أن الإنجاز الحقيقي ليس نزول الوزن فقط، بل أنني تعلمت أحب نفسي وأفهم جسمي." },
    { title: "قبل أن أتعرف على شيلان، كنت أعيش في دوامة من الحيرة.", content: "كلما فشلت في نظام غذائي، كنت ألوم نفسي. لكن بعد الالتزام بالنصائح والأكل المضاد للالتهاب، بدأ الورم يخف، وأصبحت أتحرك بسهولة، واستيقظ بطاقة أكبر. تعلمت أن الرحلة ليست سباقًا، بل أسلوب حياة. شكرًا شيلان... وأسأل الله أن يجعل كل ما تقدمينه في ميزان حسناتك." },
    { title: "سنوات وأنا أبحث عن سبب للألم والتعب، لكن لم أجد إجابة.", content: "بعد متابعة شيلان، فهمت أن جسمي يحتاج طريقة مختلفة في التعامل. مع الوقت خف الانتفاخ والألم، وأصبحت أتحرك براحة، وحتى من حولي لاحظوا التغيير. رجعت أبتسم وأتقبل نفسي بعد سنوات من الإحباط. شكرًا من القلب." },
    { title: "تم تشخيصي بالوذمة الشحمية قبل شهرين، وكنت تائهة.", content: "بحثت طويلًا عن محتوى عربي يشرح المرض، حتى وجدت حساب شيلان. بدأت أطبق النصائح، وأتعلم، وأفهم حقيقة المرض. تعلمت أحب نفسي، وأتقبل جسمي، وأتعامل مع المشد بطريقة صحيحة، وبدأ الألم يخف. شكرًا شيلان... كنتِ أكبر داعم عربي لمرضى الليبيديما." },
    { title: "أعاني من الوذمة الشحمية منذ أكثر من 13 سنة.", content: "راجعت أطباء كثيرين دون تشخيص صحيح. بعد أن وصلت إلى حساب شيلان، فهمت المرض، والتزمت بالعلاج التحفظي. خلال عشرة أيام فقط بدأ التورم يخف، وأصبحت الحركة أسهل. شكرًا شيلان... لأنكِ أعدتِ لي الثقة بجسمي." },
    { title: "بعد شهر واحد فقط من الالتزام بتعليمات شيلان، خسرت 3.5 كيلو.", content: "استخدمت المشد الضاغط، وجهاز الهزاز، وماء الإلكترولايت، والتزمت بالأكل الصحي. خف التورم، وزادت طاقتي، وأصبح لدي أسلوب حياة أستطيع الاستمرار عليه. شكرًا شيلان... لأنكِ علمتِنا أن العلاج ليس حرمانًا، بل أسلوب حياة." },
    { title: "كنت أعيش في ظلام نفسي بسبب الليبيديما.", content: "رغم مراجعة أطباء كثيرين، لم يشخص أحد حالتي بشكل صحيح. بعد اتباع تعليمات شيلان، خف الورم والألم، وتحسنت الشقيقة، والتهابات الجيوب الأنفية، والقولون، والانتفاخ. لكن أكبر تغيير كان في نفسيتي. فهمت أن الليبيديما مرض حقيقي، وأن العلاج التحفظي أسلوب حياة مرن. شكرًا شيلان... لأنكِ أنرتِ طريقنا، وأسأل الله أن يجعل كل علم تنشرينه في ميزان حسناتك." }
  ],
};

export const testimonialsSection = {
  en: {
    kicker: "In Their Words",
    title: "Testimonials",
    subtitle: "Short reflections from women along their own conservative treatment journey.",
  },
  ar: {
    kicker: "بكلماتهنّ",
    title: "آراء العميلات",
    subtitle: "انطباعات مختصرة من نساء في رحلتهن مع العلاج التحفظي.",
  },
};

export const testimonials = {
  en: [
    "One of the best decisions I ever made was applying the advice step by step. My body changed, my mindset changed, and most importantly, I finally understood Lipedema and how to manage it properly.",
    "I never expected such a small lifestyle change to make such a huge difference. Today I feel lighter, more energetic, and excited to continue my journey without fear or frustration.",
    "I finally found Arabic content that explains Lipedema clearly and simply. Every piece of information answered a question that had confused me for years.",
    "After committing to conservative treatment, I started seeing real change. The pain eased, the swelling decreased, and for the first time my body felt like it was actually responding.",
    "I didn't just lose weight — I lost the frustration and fear I lived with every day. I learned to love my body and care for it instead of blaming myself.",
    "Every video gave me new hope. Today I understand that progress takes patience and consistency, and the results are absolutely worth the effort.",
    "What affected me most was the awareness I gained. I now understand my body and know what helps it and what harms it — it completely changed my life.",
    "I used to believe my condition could never improve, but after committing to the advice, I saw changes I never expected. Thankful for every step of progress.",
    "All my gratitude for this high-quality content. The knowledge I gained saved me years of searching and trial and error.",
    "I learned that treatment isn't deprivation — it's a sustainable lifestyle I can maintain without pressure, and that was the biggest reason for my success.",
    "From the very first week, I felt like I was on the right path. Today, after a period of commitment, I'm seeing results that make me hold on to this approach even more.",
    "The best thing that happened to me was that I stopped trying every system I came across. Now I have real awareness and a clear plan I follow with confidence.",
    "The pain I once thought was just part of my life has started easing gradually, and today I live with more comfort and greater hope.",
    "Every day I discover that it's the small changes that make the biggest difference in my health and my mindset.",
    "Thank you for teaching us to understand our bodies before even thinking about losing weight. It changed my entire outlook on life.",
    "I now enjoy my journey instead of living it in fear and anxiety. Grateful for every piece of information that brought about this change.",
    "Committing to the advice was the best decision I ever made. The results weren't just on the scale — they showed up in my health, my energy, and my mindset.",
    "Today I feel more confident, knowing that every small step I take will reflect positively on my health in the future.",
    "I now encourage every woman living with Lipedema to start her journey with the right knowledge, because that's what truly makes the difference.",
    "Words aren't enough to express my gratitude. Thank you for every piece of information, every piece of advice, and every bit of support that — after God — changed my life for the better.",
  ],
  ar: [
    "من أجمل القرارات اللي أخذتها إني بدأت أطبق النصائح خطوة بخطوة. جسمي تغير، ونفسيتي تغيرت، والأهم إني أخيرًا فهمت طبيعة الليبيديما وكيف أتعامل معها بطريقة صحيحة.",
    "ما كنت أتوقع إن تغيير بسيط في أسلوب حياتي يصنع هذا الفرق الكبير. اليوم أحس بخفة أكثر، وطاقة أفضل، وصرت متحمسة أكمل رحلتي بدون خوف أو إحباط.",
    "أخيرًا لقيت محتوى عربي يشرح الليبيديما بطريقة واضحة وبسيطة. كل معلومة كنت أتعلمها كانت تجاوب على سؤال محيرني من سنوات.",
    "بعد التزامي بالعلاج التحفظي بدأت أشوف فرق حقيقي. الألم خف، والانتفاخ قل، وصرت أحس إن جسمي بدأ يستجيب لأول مرة.",
    "مو بس خسرت وزن، خسرت الإحباط والخوف اللي كنت أعيش بيهم كل يوم. تعلمت أحب جسمي وأعتني بيه بدل ما ألوم نفسي.",
    "كل فيديو كنت أشوفه كان يعطيني أمل جديد. اليوم صرت أعرف إن التحسن يحتاج صبر واستمرار، والحمد لله النتائج تستحق كل التعب.",
    "أكثر شيء أثر فيني هو كمية الوعي اللي اكتسبتها. صرت أفهم جسمي وأعرف شنو يناسبه وشنو يضره، وهذا غير حياتي بالكامل.",
    "كنت أعتقد إن حالتي مستحيل تتحسن، لكن بعد ما التزمت بالنصائح شفت فرق ما كنت أتوقعه. الحمد لله على كل خطوة.",
    "كل الشكر على هذا المحتوى الراقي. كمية المعلومات اللي تعلمتها اختصرت علي سنوات من البحث والتجارب.",
    "تعلمت إن العلاج مو حرمان، وإنما أسلوب حياة أقدر أستمر عليه بدون ضغط، وهذا كان أكبر سبب بنجاحي.",
    "من أول أسبوع حسيت إني ماشية بالطريق الصح. واليوم بعد فترة من الالتزام أشوف نتائج تخليني أتمسك أكثر بهذا الأسلوب.",
    "أفضل شيء حصل لي إني بطلت أجرب كل نظام أشوفه. صار عندي وعي وخطة واضحة أمشي عليها بثقة.",
    "الألم اللي كنت أعتبره جزء من حياتي بدأ يخف تدريجيًا، واليوم أعيش براحة أكثر وأمل أكبر.",
    "كل يوم أكتشف إن التغييرات الصغيرة هي اللي صنعت أكبر فرق في صحتي ونفسيتي.",
    "شكراً لأنج علمتينا نفهم أجسامنا قبل ما نفكر ننزل وزن. هذا الشيء غير نظرتي للحياة كلها.",
    "صرت أستمتع برحلتي بدل ما أعيشها بخوف وتوتر. الحمد لله على كل معلومة تعلمتها وكانت سبب في هذا التغيير.",
    "الالتزام بالنصائح كان أفضل قرار أخذته. النتائج ما كانت بس على الميزان، كانت في صحتي ونشاطي ونفسيتي.",
    "اليوم أشعر بثقة أكبر، وأعرف إن كل خطوة صغيرة أسويها راح تنعكس على صحتي بالمستقبل.",
    "أصبحت أنصح كل بنت تعاني من الليبيديما إنها تبدأ رحلتها بالعلم الصحيح، لأنه هو اللي يصنع الفرق الحقيقي.",
    "الكلمات ما تكفي حتى أوصف الامتنان. شكراً على كل معلومة، وكل نصيحة، وكل دعم كان سببًا بعد الله في تغيير حياتي للأفضل.",
  ],
};

export const footer = {
  en: {
    tagline: "Personalized nutrition. Care with love.",
    socialTitle: "Find me on",
    rights: "All rights reserved.",
  },
  ar: {
    tagline: "تغذية شخصية. رعاية بكل حب.",
    socialTitle: "تواصلي معي",
    rights: "جميع الحقوق محفوظة.",
  },
};

export const stats = {
  en: {
    kicker: "Real Results",
    title: "Transforming Lives, One Plan at a Time",
    items: [
      { value: 200, suffix: "+", label: "Happy Clients" },
      { value: 5,   suffix: "+", label: "Years of Experience" },
      { value: 94,  suffix: "%", label: "Success Rate" },
      { value: 300, suffix: "+", label: "Personalized Plans" },
    ],
  },
  ar: {
    kicker: "نتائج حقيقية",
    title: "نغيّر حياة، خطوة تغذوية في كل مرة",
    items: [
      { value: 200, suffix: "+", label: "عميلة سعيدة" },
      { value: 5,   suffix: "+", label: "سنوات خبرة" },
      { value: 94,  suffix: "%", label: "معدل النجاح" },
      { value: 300, suffix: "+", label: "خطة مخصصة" },
    ],
  },
};

export const journey = {
  en: {
    kicker: "Your Path to Wellness",
    title: "How Your Journey Begins",
    subtitle: "A clear, supported process designed around you — from the very first step to your lasting transformation.",
    steps: [
      {
        number: "01",
        title: "Book a Consultation",
        description: "Schedule your first session in minutes. Choose a time that works perfectly for your life.",
      },
      {
        number: "02",
        title: "Health Assessment",
        description: "We explore your health history, lifestyle, and personal goals to build a complete, holistic picture.",
      },
      {
        number: "03",
        title: "Your Nutrition Plan",
        description: "Receive a fully personalized, evidence-based plan crafted specifically for your body and unique needs.",
      },
      {
        number: "04",
        title: "Continuous Follow-up",
        description: "Regular check-ins, plan refinements, and direct support to keep you on track and motivated.",
      },
      {
        number: "05",
        title: "Reach Your Goal",
        description: "Achieve lasting transformation with the confidence and knowledge to maintain it for life.",
      },
    ],
  },
  ar: {
    kicker: "طريقك نحو الصحة",
    title: "كيف تبدأ رحلتك",
    subtitle: "مسار واضح ومدعوم مصمم خصيصًا لكِ — من أول خطوة إلى تحولك الدائم.",
    steps: [
      {
        number: "٠١",
        title: "احجزي استشارتك",
        description: "حددي موعد جلستك الأولى في دقائق واختاري الوقت الذي يناسب حياتك تمامًا.",
      },
      {
        number: "٠٢",
        title: "التقييم الصحي",
        description: "نتعمق في تاريخك الصحي ونمط حياتك وأهدافك الشخصية لبناء صورة شاملة ودقيقة.",
      },
      {
        number: "٠٣",
        title: "خطة تغذيتك المخصصة",
        description: "تحصلين على خطة شخصية مبنية على الأدلة العلمية ومصممة خصيصًا لجسمك واحتياجاتك.",
      },
      {
        number: "٠٤",
        title: "متابعة مستمرة",
        description: "متابعات دورية وتعديل للخطة ودعم مباشر للحفاظ على مسارك وتحفيزك.",
      },
      {
        number: "٠٥",
        title: "حققي هدفك",
        description: "تحقيق تحول حقيقي مع الوعي والثقة اللازمين للحفاظ عليه مدى الحياة.",
      },
    ],
  },
};

// ─── Multi-page navigation ────────────────────────────────────────────────────
// Used by Navbar for page-level routing (replaces scroll-anchor nav on sub-pages).

export const pagesNav = {
  en: [
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Book Now", href: "/booking", cta: true as const },
  ],
  ar: [
    { label: "من أنا", href: "/about" },
    { label: "الخدمات", href: "/services" },
    { label: "المدونة", href: "/blog" },
    { label: "تواصلي معي", href: "/contact" },
    { label: "احجزي الآن", href: "/booking", cta: true as const },
  ],
};

// ─── Contact page UI strings ──────────────────────────────────────────────────

export const contactFormStrings = {
  en: {
    nameLabel: "Full Name",
    namePlaceholder: "Your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "your@email.com",
    phoneLabel: "Phone (optional)",
    phonePlaceholder: "+1 234 567 890",
    subjectLabel: "Subject",
    subjects: [
      "General Inquiry",
      "Service Question",
      "Lipedema Care",
      "Booking Help",
      "Other",
    ],
    messageLabel: "Your Message",
    messagePlaceholder:
      "Tell me about your health goals and how I can help...",
    submitLabel: "Send Message",
    submittingLabel: "Sending…",
    successTitle: "Message Received!",
    successText:
      "Thank you for reaching out. I'll respond within 24 business hours.",
    emailLabel2: "Email",
    locationLabel: "Location",
    hoursLabel: "Business Hours",
    closedLabel: "Closed",
  },
  ar: {
    nameLabel: "الاسم الكامل",
    namePlaceholder: "اسمكِ الكامل",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "your@email.com",
    phoneLabel: "الهاتف (اختياري)",
    phonePlaceholder: "+965 9000 0000",
    subjectLabel: "الموضوع",
    subjects: [
      "استفسار عام",
      "سؤال عن خدمة",
      "رعاية الليبيديما",
      "مساعدة في الحجز",
      "أخرى",
    ],
    messageLabel: "رسالتكِ",
    messagePlaceholder:
      "أخبريني عن أهدافكِ الصحية وكيف يمكنني مساعدتكِ…",
    submitLabel: "إرسال الرسالة",
    submittingLabel: "جاري الإرسال…",
    successTitle: "تم استلام الرسالة!",
    successText: "شكراً على تواصلكِ. سأرد خلال 24 ساعة عمل.",
    emailLabel2: "البريد الإلكتروني",
    locationLabel: "الموقع",
    hoursLabel: "ساعات العمل",
    closedLabel: "مغلق",
  },
};

// ─── Booking page UI strings ──────────────────────────────────────────────────

export const bookingStrings = {
  en: {
    steps: ["Choose Service", "Pick a Time", "Your Details", "Confirm"],
    nextLabel: "Continue",
    backLabel: "Back",
    selectTimeLabel: "Available Times",
    calendarLabel: "Select Date",
    noSlotsMessage: "No available slots for this date.",
    firstNameLabel: "First Name",
    firstNamePlaceholder: "Jane",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Smith",
    emailLabel: "Email Address",
    emailPlaceholder: "your@email.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+1 234 567 890",
    notesLabel: "Additional Notes",
    notesPlaceholder:
      "Any health concerns, conditions, or questions you'd like to share…",
    summaryTitle: "Booking Summary",
    serviceLabel: "Service",
    dateLabel: "Date",
    timeLabel: "Time",
    totalLabel: "Total",
    paymentTitle: "Payment Details",
    cardLabel: "Card Number",
    cardPlaceholder: "•••• •••• •••• ••••",
    secureNote: "Secure payment · No charge until confirmed",
    confirmLabel: "Confirm Booking",
    unavailableLabel: "Unavailable",
  },
  ar: {
    steps: ["اختاري الخدمة", "حددي وقتاً", "بياناتكِ", "تأكيد"],
    nextLabel: "متابعة",
    backLabel: "رجوع",
    selectTimeLabel: "الأوقات المتاحة",
    calendarLabel: "اختاري التاريخ",
    noSlotsMessage: "لا توجد مواعيد متاحة لهذا التاريخ.",
    firstNameLabel: "الاسم الأول",
    firstNamePlaceholder: "اسمكِ",
    lastNameLabel: "الاسم الأخير",
    lastNamePlaceholder: "الاسم العائلي",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "your@email.com",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "+965 9000 0000",
    notesLabel: "ملاحظات إضافية",
    notesPlaceholder: "أي مخاوف صحية أو حالات أو أسئلة تودين مشاركتها…",
    summaryTitle: "ملخص الحجز",
    serviceLabel: "الخدمة",
    dateLabel: "التاريخ",
    timeLabel: "الوقت",
    totalLabel: "الإجمالي",
    paymentTitle: "تفاصيل الدفع",
    cardLabel: "رقم البطاقة",
    cardPlaceholder: "•••• •••• •••• ••••",
    secureNote: "دفع آمن · لا رسوم حتى التأكيد",
    confirmLabel: "تأكيد الحجز",
    unavailableLabel: "غير متاح",
  },
};

// ─── Blog UI strings ──────────────────────────────────────────────────────────

export const blogStrings = {
  en: {
    searchPlaceholder: "Search articles…",
    featuredLabel: "Featured Article",
    readMoreLabel: "Read Article",
    minReadLabel: "min read",
    byLabel: "By",
    noPosts: "No articles found in this category.",
    prevLabel: "Previous",
    nextLabel: "Next",
    relatedTitle: "Related Articles",
    tocTitle: "Table of Contents",
    backToBlog: "Back to Blog",
    publishedLabel: "Published",
  },
  ar: {
    searchPlaceholder: "ابحثي في المقالات…",
    featuredLabel: "المقال المميز",
    readMoreLabel: "اقرأي المقال",
    minReadLabel: "دقيقة قراءة",
    byLabel: "بقلم",
    noPosts: "لا توجد مقالات في هذه الفئة.",
    prevLabel: "السابق",
    nextLabel: "التالي",
    relatedTitle: "مقالات ذات صلة",
    tocTitle: "جدول المحتويات",
    backToBlog: "العودة إلى المدونة",
    publishedLabel: "نُشر",
  },
};

// ─── Services UI strings ──────────────────────────────────────────────────────

export const servicesStrings = {
  en: {
    learnMore: "Learn More",
    bookThis: "Book This Service",
    allServices: "View All Services",
    backToServices: "Back to Services",
  },
  ar: {
    learnMore: "اعرفي أكثر",
    bookThis: "احجزي هذه الخدمة",
    allServices: "عرض كل الخدمات",
    backToServices: "العودة إلى الخدمات",
  },
};

// ─── 404 page ─────────────────────────────────────────────────────────────────

export const notFound = {
  en: {
    kicker: "404",
    headline: "Page Not Found",
    description:
      "The page you're looking for doesn't exist or has been moved.",
    buttonLabel: "Back to Home",
  },
  ar: {
    kicker: "٤٠٤",
    headline: "الصفحة غير موجودة",
    description: "الصفحة التي تبحثين عنها غير موجودة أو تم نقلها.",
    buttonLabel: "العودة للرئيسية",
  },
};

export const cta = {
  en: {
    kicker: "Take the First Step",
    headline: "Ready to Reclaim Your Health?",
    description: "Your journey to a healthier, more balanced life starts with one decision. Shelan is here to guide you every step of the way — with compassion, science, and results that last.",
    button: "Book Your Consultation",
  },
  ar: {
    kicker: "اتخذي الخطوة الأولى",
    headline: "هل أنتِ مستعدة لاستعادة صحتك؟",
    description: "رحلتك نحو حياة أكثر صحة وتوازنًا تبدأ بقرار واحد. شيلان هنا لترشدك في كل خطوة — بدفء ودعم علمي حقيقي ونتائج تدوم.",
    button: "احجزي استشارتك",
  },
};
