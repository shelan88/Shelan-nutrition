// Centralized bilingual content for the entire site.
// Edit the strings here to update copy across the whole app — no component
// changes required. `en` = English (LTR), `ar` = Arabic (RTL).

export type Lang = "en" | "ar";

export const siteMeta = {
  en: {
    name: "Shilan",
    tagline: "Nutritionist & Lipedema Specialist",
  },
  ar: {
    name: "شيلان",
    tagline: "أخصائية تغذية ومتخصصة في الليبيديما",
  },
};

export const nav = {
  en: [
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "info-hub", label: "Resources" },
    { id: "faq", label: "FAQ" },
    { id: "booking", label: "Book Now" },
  ],
  ar: [
    { id: "about", label: "من أنا" },
    { id: "services", label: "الخدمات" },
    { id: "info-hub", label: "المصادر" },
    { id: "faq", label: "الأسئلة الشائعة" },
    { id: "booking", label: "احجزي الآن" },
  ],
};

export const hero = {
  en: {
    eyebrow: "Personalized Nutrition & Lipedema Care",
    headline: "Nourish Your Body. Reclaim Your Health.",
    subheadline:
      "Evidence-based nutrition plans and specialized Lipedema management, designed around your body and your life — with Shilan.",
    ctaPrimary: "Book Your Consultation",
    ctaSecondary: "Learn About Lipedema Care",
    imageAlt: "Shilan, professional nutritionist",
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
    title: "Meet Shilan",
    kicker: "About Your Nutritionist",
    bio: [
      "Shilan is a certified nutritionist dedicated to helping clients build a healthier relationship with food through personalized, evidence-based care.",
      "With specialized training in Lipedema-focused nutrition, she combines clinical knowledge with genuine compassion — supporting clients who often feel unheard elsewhere.",
      "Her philosophy is simple: sustainable health comes from a plan that respects your body, your history, and your goals.",
    ],
    credentialsLabel: "Credentials & Focus Areas",
    credentials: [
      "Certified Clinical Nutritionist",
      "Lipedema Nutrition Specialist",
      "Holistic Health Practitioner",
    ],
    imageAlt: "Portrait of Shilan",
  },
  ar: {
    title: "تعرفي على شيلان",
    kicker: "عن أخصائية التغذية",
    bio: [
      "شيلان أخصائية تغذية معتمدة، متخصصة في مساعدة عميلاتها على بناء علاقة صحية مع الطعام من خلال رعاية شخصية مبنية على الأدلة العلمية.",
      "بفضل تدريبها المتخصص في التغذية المرتبطة بالليبيديما، تجمع بين المعرفة السريرية والتعاطف الحقيقي — لدعم من يشعرن أحيانًا بعدم الفهم في أماكن أخرى.",
      "فلسفتها بسيطة: الصحة المستدامة تأتي من خطة تحترم جسدك وتاريخك وأهدافك.",
    ],
    credentialsLabel: "المؤهلات ومجالات التركيز",
    credentials: [
      "أخصائية تغذية سريرية معتمدة",
      "متخصصة في تغذية الليبيديما",
      "ممارسة صحة شاملة",
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
      "Book a one-on-one consultation with Shilan and take the first step toward a personalized nutrition plan built around you.",
    cta: "Book Your Consultation",
  },
  ar: {
    title: "هل أنتِ مستعدة لبدء رحلتك؟",
    description:
      "احجزي استشارة فردية مع شيلان واتخذي الخطوة الأولى نحو خطة تغذية شخصية مصممة خصيصًا لكِ.",
    cta: "احجزي استشارتك",
  },
};

export const footer = {
  en: {
    tagline: "Personalized nutrition. Compassionate care.",
    contactTitle: "Contact",
    email: "hello@shilannutrition.com",
    phone: "+1 (555) 123-4567",
    location: "Available for in-person & virtual consultations",
    socialTitle: "Follow",
    rights: "All rights reserved.",
  },
  ar: {
    tagline: "تغذية شخصية. رعاية بكل تعاطف.",
    contactTitle: "التواصل",
    email: "hello@shilannutrition.com",
    phone: "+1 (555) 123-4567",
    location: "متوفرة للاستشارات الحضورية والإلكترونية",
    socialTitle: "تابعينا",
    rights: "جميع الحقوق محفوظة.",
  },
};
