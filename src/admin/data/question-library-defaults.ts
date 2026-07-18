/**
 * Pre-seeded Question Library
 * 
 * These questions are injected into the library on first load
 * if the settings key "question_library" doesn't exist yet.
 * Admins can edit, delete, or duplicate any of these.
 */

import type { LibraryQuestion, LibraryCategory } from "@/admin/repositories/question-library.repository";

function q(
  id: string,
  category: LibraryCategory,
  overrides: Partial<LibraryQuestion>
): LibraryQuestion {
  return {
    id,
    category,
    type: "short_text",
    label_en: "",
    label_ar: "",
    placeholder_en: "",
    placeholder_ar: "",
    help_en: "",
    help_ar: "",
    required: false,
    validation_note: "",
    options: [],
    isDefault: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

export const DEFAULT_LIBRARY_QUESTIONS: LibraryQuestion[] = [

  // ── Basic Information ────────────────────────────────────────────────────────

  q("def-bi-01", "basic_info", {
    type: "short_text",
    label_en: "Full Name",
    label_ar: "الاسم الكامل",
    placeholder_en: "Enter your full name",
    placeholder_ar: "أدخلي اسمك الكامل",
    help_en: "Please enter your name as it appears on your ID.",
    help_ar: "يرجى إدخال اسمك كما يظهر على هويتك.",
    required: true,
    validation_note: "2–80 characters",
  }),

  q("def-bi-02", "basic_info", {
    type: "date",
    label_en: "Date of Birth",
    label_ar: "تاريخ الميلاد",
    placeholder_en: "DD / MM / YYYY",
    placeholder_ar: "يوم / شهر / سنة",
    help_en: "Required to tailor your nutrition plan to your age group.",
    help_ar: "مطلوب لتخصيص خطتك الغذائية وفق فئتك العمرية.",
    required: true,
    validation_note: "Must be a valid past date",
  }),

  q("def-bi-03", "basic_info", {
    type: "single_choice",
    label_en: "Gender",
    label_ar: "الجنس",
    help_en: "Your biological sex helps us tailor hormonal and nutritional guidance.",
    help_ar: "جنسك البيولوجي يساعدنا على تخصيص التوجيهات الهرمونية والغذائية.",
    required: true,
    options: [
      { label_en: "Female", label_ar: "أنثى", value: "female" },
      { label_en: "Male", label_ar: "ذكر", value: "male" },
      { label_en: "Non-binary / Other", label_ar: "غير ثنائي / أخرى", value: "other" },
      { label_en: "Prefer not to say", label_ar: "أفضل عدم الإفصاح", value: "prefer_not" },
    ],
  }),

  q("def-bi-04", "basic_info", {
    type: "short_text",
    label_en: "City & Country",
    label_ar: "المدينة والدولة",
    placeholder_en: "e.g. Riyadh, Saudi Arabia",
    placeholder_ar: "مثال: الرياض، المملكة العربية السعودية",
    help_en: "Helps us account for regional food availability and climate.",
    help_ar: "يساعدنا على مراعاة توفر الأغذية والمناخ في منطقتك.",
    required: false,
  }),

  q("def-bi-05", "basic_info", {
    type: "short_text",
    label_en: "Phone Number (WhatsApp preferred)",
    label_ar: "رقم الهاتف (واتساب مفضل)",
    placeholder_en: "+966 5X XXX XXXX",
    placeholder_ar: "+966 5X XXX XXXX",
    help_en: "We use this to send follow-up reminders and session links.",
    help_ar: "نستخدمه لإرسال التذكيرات وروابط الجلسات.",
    required: false,
    validation_note: "International format with country code",
  }),

  q("def-bi-06", "basic_info", {
    type: "single_choice",
    label_en: "How did you hear about us?",
    label_ar: "كيف سمعتِ عنا؟",
    help_en: "",
    help_ar: "",
    required: false,
    options: [
      { label_en: "Instagram", label_ar: "إنستغرام", value: "instagram" },
      { label_en: "TikTok", label_ar: "تيك توك", value: "tiktok" },
      { label_en: "Google Search", label_ar: "بحث جوجل", value: "google" },
      { label_en: "Referral from a friend", label_ar: "توصية من صديقة", value: "referral" },
      { label_en: "Facebook", label_ar: "فيسبوك", value: "facebook" },
      { label_en: "Other", label_ar: "أخرى", value: "other" },
    ],
  }),

  q("def-bi-07", "basic_info", {
    type: "short_text",
    label_en: "Occupation",
    label_ar: "المهنة",
    placeholder_en: "e.g. Teacher, Engineer, Stay-at-home parent",
    placeholder_ar: "مثال: معلمة، مهندسة، ربة منزل",
    help_en: "Helps us understand your daily activity level and meal timing constraints.",
    help_ar: "يساعدنا على فهم مستوى نشاطك اليومي وقيود توقيت الوجبات.",
    required: false,
  }),

  q("def-bi-08", "basic_info", {
    type: "number",
    label_en: "Current Height (cm)",
    label_ar: "الطول الحالي (سم)",
    placeholder_en: "e.g. 165",
    placeholder_ar: "مثال: 165",
    required: false,
    validation_note: "100–220 cm",
  }),

  q("def-bi-09", "basic_info", {
    type: "number",
    label_en: "Current Weight (kg)",
    label_ar: "الوزن الحالي (كجم)",
    placeholder_en: "e.g. 75",
    placeholder_ar: "مثال: 75",
    required: false,
    validation_note: "30–300 kg",
  }),

  // ── Lipedema ─────────────────────────────────────────────────────────────────

  q("def-lip-01", "lipedema", {
    type: "yes_no",
    label_en: "Have you been officially diagnosed with Lipedema?",
    label_ar: "هل حصلتِ على تشخيص رسمي لمرض الليبيديما؟",
    help_en: "A formal diagnosis from a physician or specialist.",
    help_ar: "تشخيص رسمي من طبيب أو متخصص.",
    required: true,
  }),

  q("def-lip-02", "lipedema", {
    type: "single_choice",
    label_en: "Lipedema Stage (if diagnosed)",
    label_ar: "مرحلة الليبيديما (إن كنتِ مشخصة)",
    help_en: "Stages are classified by tissue texture and appearance.",
    help_ar: "المراحل تُصنَّف حسب ملمس الأنسجة ومظهرها.",
    required: false,
    options: [
      { label_en: "Stage 1 – Smooth skin, soft tissue", label_ar: "المرحلة 1 – جلد ناعم، أنسجة ليّنة", value: "stage_1" },
      { label_en: "Stage 2 – Uneven skin, nodules present", label_ar: "المرحلة 2 – جلد غير منتظم، عقيدات موجودة", value: "stage_2" },
      { label_en: "Stage 3 – Large skin folds", label_ar: "المرحلة 3 – طيات جلدية كبيرة", value: "stage_3" },
      { label_en: "Stage 4 – Lipedema + Lymphedema", label_ar: "المرحلة 4 – ليبيديما + ليمفيديما", value: "stage_4" },
      { label_en: "Not sure / Not diagnosed", label_ar: "غير متأكدة / غير مشخصة", value: "unsure" },
    ],
  }),

  q("def-lip-03", "lipedema", {
    type: "multiple_choice",
    label_en: "Which body areas are affected?",
    label_ar: "ما المناطق الجسدية المتأثرة؟",
    help_en: "Select all that apply.",
    help_ar: "حددي كل ما ينطبق.",
    required: false,
    options: [
      { label_en: "Hips", label_ar: "الوركان", value: "hips" },
      { label_en: "Thighs", label_ar: "الفخذان", value: "thighs" },
      { label_en: "Knees", label_ar: "الركبتان", value: "knees" },
      { label_en: "Lower legs / Calves", label_ar: "أسفل الساقين / الساقان", value: "lower_legs" },
      { label_en: "Upper arms", label_ar: "أعلى الذراعين", value: "upper_arms" },
      { label_en: "Abdomen", label_ar: "البطن", value: "abdomen" },
    ],
  }),

  q("def-lip-04", "lipedema", {
    type: "number",
    label_en: "Age when you first noticed symptoms",
    label_ar: "عمرك حين لاحظتِ الأعراض لأول مرة",
    placeholder_en: "e.g. 14",
    placeholder_ar: "مثال: 14",
    help_en: "Lipedema often appears at hormonal transition points (puberty, pregnancy, menopause).",
    help_ar: "تظهر الليبيديما عادةً عند نقاط التحول الهرموني (البلوغ، الحمل، انقطاع الطمث).",
    required: false,
    validation_note: "5–80 years",
  }),

  q("def-lip-05", "lipedema", {
    type: "yes_no",
    label_en: "Is there a family history of Lipedema?",
    label_ar: "هل يوجد تاريخ عائلي للإصابة بالليبيديما؟",
    help_en: "Mother, sister, aunt, or other female relatives.",
    help_ar: "الأم، الأخت، العمة، أو أقارب من الإناث.",
    required: false,
  }),

  q("def-lip-06", "lipedema", {
    type: "yes_no",
    label_en: "Do you currently use compression garments?",
    label_ar: "هل تستخدمين ملابس ضاغطة حالياً؟",
    help_en: "e.g. compression stockings, flat knit garments.",
    help_ar: "مثال: جوارب ضاغطة، ملابس ضغط مسطحة الحياكة.",
    required: false,
  }),

  q("def-lip-07", "lipedema", {
    type: "yes_no",
    label_en: "Have you received Manual Lymphatic Drainage (MLD)?",
    label_ar: "هل تلقيتِ صرفاً ليمفاوياً يدوياً (MLD)؟",
    help_en: "A specialised massage technique to support lymph flow.",
    help_ar: "تقنية تدليك متخصصة لدعم تدفق اللمف.",
    required: false,
  }),

  q("def-lip-08", "lipedema", {
    type: "number",
    label_en: "Current pain level (at rest)",
    label_ar: "مستوى الألم الحالي (في حالة الراحة)",
    placeholder_en: "0 = no pain, 10 = severe",
    placeholder_ar: "0 = لا ألم، 10 = شديد",
    help_en: "Rate your typical daily pain on a scale of 0–10.",
    help_ar: "قيّمي الألم اليومي المعتاد على مقياس من 0 إلى 10.",
    required: false,
    validation_note: "0–10",
  }),

  q("def-lip-09", "lipedema", {
    type: "paragraph",
    label_en: "How does Lipedema impact your daily life?",
    label_ar: "كيف تؤثر الليبيديما على حياتك اليومية؟",
    placeholder_en: "Describe how Lipedema affects your mobility, emotional wellbeing, clothing choices, relationships…",
    placeholder_ar: "صفي كيف تؤثر الليبيديما على حركتك، صحتك النفسية، اختيار ملابسك، علاقاتك…",
    required: false,
  }),

  // ── Medical History ───────────────────────────────────────────────────────────

  q("def-med-01", "medical_history", {
    type: "multiple_choice",
    label_en: "Current diagnosed medical conditions",
    label_ar: "الحالات الطبية المشخصة حالياً",
    help_en: "Select all that apply.",
    help_ar: "حددي كل ما ينطبق.",
    required: false,
    options: [
      { label_en: "Type 2 Diabetes", label_ar: "السكري من النوع 2", value: "diabetes_t2" },
      { label_en: "Insulin Resistance / Prediabetes", label_ar: "مقاومة الأنسولين / ما قبل السكري", value: "insulin_resistance" },
      { label_en: "Hypothyroidism", label_ar: "قصور الغدة الدرقية", value: "hypothyroidism" },
      { label_en: "Hyperthyroidism", label_ar: "فرط الغدة الدرقية", value: "hyperthyroidism" },
      { label_en: "PCOS", label_ar: "تكيس المبايض", value: "pcos" },
      { label_en: "Hypertension (High blood pressure)", label_ar: "ارتفاع ضغط الدم", value: "hypertension" },
      { label_en: "High cholesterol", label_ar: "ارتفاع الكوليسترول", value: "high_cholesterol" },
      { label_en: "Autoimmune condition", label_ar: "مرض مناعي ذاتي", value: "autoimmune" },
      { label_en: "Cardiovascular disease", label_ar: "أمراض قلبية وعائية", value: "cardiovascular" },
      { label_en: "None of the above", label_ar: "لا شيء مما سبق", value: "none" },
    ],
  }),

  q("def-med-02", "medical_history", {
    type: "paragraph",
    label_en: "Current medications and supplements",
    label_ar: "الأدوية والمكملات الغذائية الحالية",
    placeholder_en: "List any medications, vitamins, or supplements you currently take…",
    placeholder_ar: "اذكري أي أدوية أو فيتامينات أو مكملات غذائية تتناولينها حالياً…",
    help_en: "Include dosage if known. This helps us avoid nutrient interactions.",
    help_ar: "اذكري الجرعة إن أمكن. هذا يساعدنا على تجنب التفاعلات الغذائية.",
    required: false,
  }),

  q("def-med-03", "medical_history", {
    type: "paragraph",
    label_en: "Food allergies or intolerances",
    label_ar: "الحساسية الغذائية أو عدم التحمل",
    placeholder_en: "e.g. gluten, lactose, nuts, shellfish…",
    placeholder_ar: "مثال: غلوتين، لاكتوز، مكسرات، مأكولات بحرية…",
    help_en: "We will ensure your plan avoids all listed foods.",
    help_ar: "سنحرص على أن تتجنب خطتك جميع الأطعمة المذكورة.",
    required: false,
  }),

  q("def-med-04", "medical_history", {
    type: "yes_no",
    label_en: "Have you had any surgeries in the past 2 years?",
    label_ar: "هل خضعتِ لأي عمليات جراحية خلال السنتين الماضيتين؟",
    help_en: "Including Liposuction, Lipoedema surgery, or any other procedure.",
    help_ar: "بما في ذلك شفط الدهون، جراحة الليبيديما، أو أي إجراء آخر.",
    required: false,
  }),

  q("def-med-05", "medical_history", {
    type: "yes_no",
    label_en: "Are you currently pregnant or breastfeeding?",
    label_ar: "هل أنتِ حامل أو مرضعة حالياً؟",
    required: false,
  }),

  q("def-med-06", "medical_history", {
    type: "single_choice",
    label_en: "Menstrual cycle status",
    label_ar: "حالة الدورة الشهرية",
    required: false,
    options: [
      { label_en: "Regular cycle", label_ar: "دورة منتظمة", value: "regular" },
      { label_en: "Irregular cycle", label_ar: "دورة غير منتظمة", value: "irregular" },
      { label_en: "Peri-menopause", label_ar: "ما قبل انقطاع الطمث", value: "peri_menopause" },
      { label_en: "Post-menopause", label_ar: "ما بعد انقطاع الطمث", value: "post_menopause" },
      { label_en: "Not applicable", label_ar: "غير قابل للتطبيق", value: "na" },
    ],
  }),

  q("def-med-07", "medical_history", {
    type: "short_text",
    label_en: "Name of your current doctor or specialist",
    label_ar: "اسم طبيبك أو متخصصك الحالي",
    placeholder_en: "Dr. Name (optional)",
    placeholder_ar: "د. الاسم (اختياري)",
    help_en: "We may need to coordinate care recommendations.",
    help_ar: "قد نحتاج إلى التنسيق في توصيات الرعاية.",
    required: false,
  }),

  q("def-med-08", "medical_history", {
    type: "paragraph",
    label_en: "Any other health concerns we should know about?",
    label_ar: "هل هناك مخاوف صحية أخرى يجب أن نعلمها؟",
    placeholder_en: "Share anything relevant to your health that hasn't been covered above…",
    placeholder_ar: "شاركي أي شيء يتعلق بصحتك ولم يُذكر أعلاه…",
    required: false,
  }),

  // ── Nutrition ─────────────────────────────────────────────────────────────────

  q("def-nut-01", "nutrition", {
    type: "single_choice",
    label_en: "Current eating pattern",
    label_ar: "نمط الأكل الحالي",
    help_en: "Select the option that best describes how you currently eat.",
    help_ar: "حددي الخيار الذي يصف طريقة أكلك الحالية.",
    required: false,
    options: [
      { label_en: "No specific pattern – I eat whatever is available", label_ar: "لا نمط محدد – آكل ما هو متاح", value: "no_pattern" },
      { label_en: "Low-carb / Keto", label_ar: "منخفض الكربوهيدرات / كيتو", value: "keto" },
      { label_en: "Mediterranean", label_ar: "متوسطي", value: "mediterranean" },
      { label_en: "Intermittent Fasting", label_ar: "صيام متقطع", value: "intermittent_fasting" },
      { label_en: "Vegetarian", label_ar: "نباتي (بدون لحوم)", value: "vegetarian" },
      { label_en: "Vegan", label_ar: "نباتي صارم", value: "vegan" },
      { label_en: "Gluten-free", label_ar: "خالي من الغلوتين", value: "gluten_free" },
      { label_en: "Other", label_ar: "أخرى", value: "other" },
    ],
  }),

  q("def-nut-02", "nutrition", {
    type: "number",
    label_en: "How many meals do you eat per day?",
    label_ar: "كم وجبة تأكلين يومياً؟",
    placeholder_en: "e.g. 3",
    placeholder_ar: "مثال: 3",
    help_en: "Include main meals and snacks.",
    help_ar: "تضمين الوجبات الرئيسية والوجبات الخفيفة.",
    required: false,
    validation_note: "1–8",
  }),

  q("def-nut-03", "nutrition", {
    type: "number",
    label_en: "Daily water intake (glasses / 250ml each)",
    label_ar: "كمية الماء اليومية (أكواب / 250 مل لكل كوب)",
    placeholder_en: "e.g. 6",
    placeholder_ar: "مثال: 6",
    help_en: "Adequate hydration is especially important for Lipedema management.",
    help_ar: "الترطيب الكافي مهم بشكل خاص في إدارة الليبيديما.",
    required: false,
    validation_note: "0–20 glasses",
  }),

  q("def-nut-04", "nutrition", {
    type: "single_choice",
    label_en: "How often do you eat processed/fast food?",
    label_ar: "كم مرة تأكلين الطعام المصنع أو الوجبات السريعة؟",
    required: false,
    options: [
      { label_en: "Rarely – once a month or less", label_ar: "نادراً – مرة في الشهر أو أقل", value: "rarely" },
      { label_en: "Occasionally – once a week", label_ar: "أحياناً – مرة في الأسبوع", value: "occasionally" },
      { label_en: "Often – 3–4 times a week", label_ar: "كثيراً – 3-4 مرات أسبوعياً", value: "often" },
      { label_en: "Daily – most meals are processed", label_ar: "يومياً – معظم وجباتي مصنعة", value: "daily" },
    ],
  }),

  q("def-nut-05", "nutrition", {
    type: "yes_no",
    label_en: "Have you worked with a nutritionist or dietitian before?",
    label_ar: "هل عملتِ مع اختصاصية تغذية من قبل؟",
    required: false,
  }),

  q("def-nut-06", "nutrition", {
    type: "paragraph",
    label_en: "What are your main nutrition challenges?",
    label_ar: "ما هي أبرز تحدياتك الغذائية؟",
    placeholder_en: "e.g. sugar cravings, emotional eating, lack of meal planning, busy schedule…",
    placeholder_ar: "مثال: الرغبة في السكر، الأكل العاطفي، غياب التخطيط للوجبات، الجدول المزدحم…",
    required: false,
  }),

  q("def-nut-07", "nutrition", {
    type: "paragraph",
    label_en: "What are your nutrition / health goals?",
    label_ar: "ما هي أهدافك الغذائية / الصحية؟",
    placeholder_en: "Describe what success looks like for you after completing the program…",
    placeholder_ar: "صفي كيف يبدو النجاح بالنسبة لكِ بعد إتمام البرنامج…",
    required: true,
  }),

  q("def-nut-08", "nutrition", {
    type: "single_choice",
    label_en: "How would you rate your current cooking skills?",
    label_ar: "كيف تُقيّمين مهاراتك الطبخية الحالية؟",
    required: false,
    options: [
      { label_en: "Beginner – I rarely cook", label_ar: "مبتدئة – نادراً ما أطبخ", value: "beginner" },
      { label_en: "Intermediate – I cook simple meals", label_ar: "متوسطة – أطبخ وجبات بسيطة", value: "intermediate" },
      { label_en: "Confident – I enjoy cooking", label_ar: "واثقة – أستمتع بالطبخ", value: "confident" },
    ],
  }),

  q("def-nut-09", "nutrition", {
    type: "paragraph",
    label_en: "List any foods you dislike or cannot eat (other than allergies)",
    label_ar: "اذكري الأطعمة التي لا تحبينها أو لا تستطيعين تناولها (بخلاف الحساسية)",
    placeholder_en: "e.g. I don't eat liver, raw onion, or spicy food…",
    placeholder_ar: "مثال: لا آكل الكبد، البصل النيء، أو الطعام الحار…",
    required: false,
  }),

  // ── Lifestyle ─────────────────────────────────────────────────────────────────

  q("def-life-01", "lifestyle", {
    type: "single_choice",
    label_en: "Physical activity level",
    label_ar: "مستوى النشاط البدني",
    help_en: "Describe your general activity level outside of structured exercise.",
    help_ar: "صفي مستوى نشاطك العام خارج التمارين المنظمة.",
    required: false,
    options: [
      { label_en: "Sedentary – mostly sitting (desk job, limited movement)", label_ar: "خامل – أجلس معظم الوقت (عمل مكتبي، حركة محدودة)", value: "sedentary" },
      { label_en: "Lightly active – some walking or standing daily", label_ar: "نشط قليلاً – بعض المشي أو الوقوف يومياً", value: "lightly_active" },
      { label_en: "Moderately active – regular walking, household tasks", label_ar: "نشط بشكل معتدل – مشي منتظم، مهام منزلية", value: "moderately_active" },
      { label_en: "Very active – physically demanding job or frequent exercise", label_ar: "نشط جداً – عمل يتطلب مجهوداً بدنياً أو تمارين متكررة", value: "very_active" },
    ],
  }),

  q("def-life-02", "lifestyle", {
    type: "multiple_choice",
    label_en: "Types of exercise you currently do (if any)",
    label_ar: "أنواع التمارين التي تمارسينها حالياً (إن وجدت)",
    help_en: "Select all that apply.",
    help_ar: "حددي كل ما ينطبق.",
    required: false,
    options: [
      { label_en: "Walking", label_ar: "المشي", value: "walking" },
      { label_en: "Swimming", label_ar: "السباحة", value: "swimming" },
      { label_en: "Cycling", label_ar: "ركوب الدراجة", value: "cycling" },
      { label_en: "Yoga / Pilates", label_ar: "يوغا / بيلاتس", value: "yoga" },
      { label_en: "Weight training", label_ar: "رفع الأثقال", value: "weights" },
      { label_en: "Aerobics / Dance", label_ar: "الأيروبيك / الرقص", value: "aerobics" },
      { label_en: "None currently", label_ar: "لا أمارس حالياً", value: "none" },
    ],
  }),

  q("def-life-03", "lifestyle", {
    type: "number",
    label_en: "How many hours do you sleep per night (average)?",
    label_ar: "كم ساعة تنامين في الليلة (في المتوسط)؟",
    placeholder_en: "e.g. 7",
    placeholder_ar: "مثال: 7",
    help_en: "Sleep quality directly affects hormones related to appetite and weight.",
    help_ar: "جودة النوم تؤثر مباشرة على الهرمونات المرتبطة بالشهية والوزن.",
    required: false,
    validation_note: "2–12 hours",
  }),

  q("def-life-04", "lifestyle", {
    type: "number",
    label_en: "Current stress level (daily average)",
    label_ar: "مستوى الضغط النفسي الحالي (المتوسط اليومي)",
    placeholder_en: "0 = very calm, 10 = extremely stressed",
    placeholder_ar: "0 = هادئة جداً، 10 = متوترة للغاية",
    required: false,
    validation_note: "0–10",
  }),

  q("def-life-05", "lifestyle", {
    type: "single_choice",
    label_en: "Work / daily schedule type",
    label_ar: "نوع جدول العمل / اليومي",
    required: false,
    options: [
      { label_en: "Fixed hours (morning shift)", label_ar: "ساعات ثابتة (دوام صباحي)", value: "fixed_morning" },
      { label_en: "Fixed hours (evening/night shift)", label_ar: "ساعات ثابتة (دوام مسائي/ليلي)", value: "fixed_evening" },
      { label_en: "Flexible / Work from home", label_ar: "مرنة / عمل من المنزل", value: "flexible" },
      { label_en: "Stay-at-home / Caregiver", label_ar: "ربة منزل / مقدمة رعاية", value: "stay_home" },
      { label_en: "Student", label_ar: "طالبة", value: "student" },
      { label_en: "Variable / Rotating shifts", label_ar: "متغير / دوام متناوب", value: "variable" },
    ],
  }),

  q("def-life-06", "lifestyle", {
    type: "single_choice",
    label_en: "Smoking status",
    label_ar: "حالة التدخين",
    required: false,
    options: [
      { label_en: "Non-smoker", label_ar: "غير مدخنة", value: "non_smoker" },
      { label_en: "Former smoker (quit > 1 year ago)", label_ar: "مدخنة سابقة (أقلعت منذ > سنة)", value: "former_smoker" },
      { label_en: "Current smoker", label_ar: "مدخنة حالياً", value: "current_smoker" },
      { label_en: "Vaping / e-cigarettes", label_ar: "سجائر إلكترونية", value: "vaping" },
    ],
  }),

  q("def-life-07", "lifestyle", {
    type: "paragraph",
    label_en: "What motivates you to start this program now?",
    label_ar: "ما الذي يحفزك على بدء هذا البرنامج الآن؟",
    placeholder_en: "Share what has inspired you to seek help at this point in time…",
    placeholder_ar: "شاركي ما الذي ألهمك للبحث عن مساعدة في هذه المرحلة…",
    required: false,
  }),

  q("def-life-08", "lifestyle", {
    type: "single_choice",
    label_en: "How would you describe your relationship with food?",
    label_ar: "كيف تصفين علاقتك بالطعام؟",
    required: false,
    options: [
      { label_en: "Healthy – food is nourishment, I rarely stress about it", label_ar: "صحية – الطعام تغذية، ونادراً ما أشعر بالقلق منه", value: "healthy" },
      { label_en: "Emotional – I eat when stressed, bored, or sad", label_ar: "عاطفية – آكل عند التوتر أو الملل أو الحزن", value: "emotional" },
      { label_en: "Restrictive – I often feel guilty after eating", label_ar: "تقييدية – غالباً ما أشعر بالذنب بعد الأكل", value: "restrictive" },
      { label_en: "Complicated – it varies a lot", label_ar: "معقدة – تتفاوت كثيراً", value: "complicated" },
    ],
  }),
];
