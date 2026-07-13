// Centralized bilingual content for the entire site.
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
    { id: "faq", label: "FAQ" },
    { id: "booking", label: "Book Now" },
  ],
  ar: [
    { id: "about", label: "من أنا" },
    { id: "services", label: "الخدمات" },
    { id: "info-hub", label: "المصادر" },
    { id: "success-stories", label: "قصص نجاح" },
    { id: "faq", label: "الأسئلة الشائعة" },
    { id: "booking", label: "احجزي الآن" },
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

export const successStoriesSection = {
  en: {
    kicker: "Real Journeys",
    title: "Success Stories",
    subtitle:
      "Real experiences shared by women who followed the conservative treatment approach and reclaimed their health and confidence.",
  },
  ar: {
    kicker: "رحلات حقيقية",
    title: "قصص نجاح",
    subtitle:
      "تجارب حقيقية شاركتها نساء التزمن بالعلاج التحفظي واستعدن صحتهن وثقتهن بأنفسهن.",
  },
};

export const successStories = [
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
];

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

export const testimonials = [
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
  "الكلمات ما تكفي حتى أوصف الامتنان. شكراً على كل معلومة، وكل نصيحة، وكل دعم كان سببًا بعد الله في تغيير حياتي للأفضل."
];

export const footer = {
  en: {
    tagline: "Personalized nutrition. Compassionate care.",
    contactTitle: "Contact",
    email: "hello@shelannutrition.com",
    phone: "+1 (555) 123-4567",
    location: "Available for in-person & virtual consultations",
    socialTitle: "Follow",
    rights: "All rights reserved.",
  },
  ar: {
    tagline: "تغذية شخصية. رعاية بكل تعاطف.",
    contactTitle: "التواصل",
    email: "hello@shelannutrition.com",
    phone: "+1 (555) 123-4567",
    location: "متوفرة للاستشارات الحضورية والإلكترونية",
    socialTitle: "تابعينا",
    rights: "جميع الحقوق محفوظة.",
  },
};
