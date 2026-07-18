/**
 * Built-in assessment template bundles.
 *
 * These are self-contained question snapshots — NOT live references to the
 * Question Library. Selecting a bundle creates an independent copy so that
 * future library edits never retroactively modify an existing template.
 */

import type { QuestionType } from "@/types/database.types";

export interface BundleQuestion {
  type: QuestionType;
  label_en: string;
  label_ar: string;
  placeholder_en: string;
  placeholder_ar: string;
  help_en: string;
  help_ar: string;
  required: boolean;
  options: { label_en: string; label_ar: string; value: string }[];
}

export interface AssessmentBundle {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  emoji: string;
  color: string; // Tailwind bg class
  questions: BundleQuestion[];
}

// ─── Bundle helpers ───────────────────────────────────────────────────────────

function q(
  type: QuestionType,
  label_en: string,
  label_ar: string,
  opts: Partial<BundleQuestion> = {}
): BundleQuestion {
  return {
    type,
    label_en,
    label_ar,
    placeholder_en: opts.placeholder_en ?? "",
    placeholder_ar: opts.placeholder_ar ?? "",
    help_en: opts.help_en ?? "",
    help_ar: opts.help_ar ?? "",
    required: opts.required ?? false,
    options: opts.options ?? [],
  };
}

function choice(label_en: string, label_ar: string, value?: string) {
  return { label_en, label_ar, value: value ?? label_en.toLowerCase().replace(/\s+/g, "_") };
}

// ─── Bundles ──────────────────────────────────────────────────────────────────

export const ASSESSMENT_BUNDLES: AssessmentBundle[] = [
  // ─── 1. Initial Consultation ───────────────────────────────────────────────
  {
    id: "bundle-initial-consultation",
    name_en: "Initial Consultation",
    name_ar: "الاستشارة الأولى",
    description_en: "Comprehensive intake form covering personal details, medical history, current diet and lifestyle.",
    description_ar: "نموذج شامل يغطي التفاصيل الشخصية والتاريخ الطبي والنظام الغذائي الحالي ونمط الحياة.",
    emoji: "🩺",
    color: "bg-blue-50",
    questions: [
      q("short_text", "Full Name", "الاسم الكامل", { required: true, placeholder_en: "Your full name", placeholder_ar: "اسمك الكامل" }),
      q("number", "Age", "العمر", { required: true, placeholder_en: "Your age in years", placeholder_ar: "عمرك بالسنوات" }),
      q("single_choice", "Gender", "الجنس", {
        required: true,
        options: [choice("Female", "أنثى", "female"), choice("Male", "ذكر", "male"), choice("Prefer not to say", "أفضل عدم الإفصاح", "no_say")],
      }),
      q("number", "Current Weight (kg)", "الوزن الحالي (كجم)", { placeholder_en: "e.g. 70", placeholder_ar: "مثال: 70" }),
      q("number", "Height (cm)", "الطول (سم)", { placeholder_en: "e.g. 165", placeholder_ar: "مثال: 165" }),
      q("paragraph", "What are your main health goals?", "ما هي أهدافك الصحية الرئيسية؟", {
        required: true,
        placeholder_en: "Describe what you hope to achieve…",
        placeholder_ar: "صفي ما تأملين تحقيقه…",
      }),
      q("multiple_choice", "Do you have any of the following diagnosed conditions?", "هل لديك أي من الحالات التالية المشخصة؟", {
        options: [
          choice("Diabetes / Pre-diabetes", "السكري / ما قبل السكري", "diabetes"),
          choice("Hypertension", "ارتفاع ضغط الدم", "hypertension"),
          choice("Thyroid disorder", "اضطراب الغدة الدرقية", "thyroid"),
          choice("PCOS", "متلازمة المبيض المتعدد الكيسات", "pcos"),
          choice("Lipedema", "الليبيديما", "lipedema"),
          choice("IBS / Gut issues", "متلازمة القولون العصبي / مشاكل الأمعاء", "ibs"),
          choice("None of the above", "لا شيء مما سبق", "none"),
        ],
      }),
      q("paragraph", "List any current medications or supplements", "اذكري أي أدوية أو مكملات غذائية حالية", {
        placeholder_en: "Name, dose, and how long you have been taking them…",
        placeholder_ar: "الاسم والجرعة ومدة الاستخدام…",
      }),
      q("single_choice", "How would you describe your current eating pattern?", "كيف تصفين نمط غذائك الحالي؟", {
        options: [
          choice("Regular meals, mostly home-cooked", "وجبات منتظمة، معظمها منزلية", "home_cook"),
          choice("Irregular — I often skip meals", "غير منتظم — كثيراً ما أتخطى وجبات", "skip_meals"),
          choice("Mix of home and eating out", "مزيج من المنزل والمطاعم", "mixed"),
          choice("Mostly eating out / takeaway", "أكثره خارج المنزل / وجبات جاهزة", "takeaway"),
        ],
      }),
      q("yes_no", "Do you have any food allergies or intolerances?", "هل لديك أي حساسية أو عدم تحمل للطعام؟"),
      q("paragraph", "If yes, please list your food allergies / intolerances", "إذا نعم، يرجى ذكر حساسياتك أو عدم تحمّلك للطعام", {
        placeholder_en: "e.g. lactose, gluten, nuts…",
        placeholder_ar: "مثال: اللاكتوز، الجلوتين، المكسرات…",
      }),
      q("single_choice", "How many glasses of water do you drink per day?", "كم كوباً من الماء تشربين يومياً؟", {
        options: [
          choice("Less than 4", "أقل من 4", "lt4"),
          choice("4 – 6", "4 – 6", "4_6"),
          choice("7 – 8", "7 – 8", "7_8"),
          choice("More than 8", "أكثر من 8", "gt8"),
        ],
      }),
      q("single_choice", "How would you rate your stress level on average?", "كيف تقيّمين مستوى توترك في المتوسط؟", {
        options: [
          choice("Low", "منخفض", "low"),
          choice("Moderate", "متوسط", "moderate"),
          choice("High", "مرتفع", "high"),
          choice("Very high", "مرتفع جداً", "very_high"),
        ],
      }),
      q("single_choice", "How many hours of sleep do you get on average?", "كم ساعة تنامين في المتوسط؟", {
        options: [
          choice("Less than 5", "أقل من 5", "lt5"),
          choice("5 – 6", "5 – 6", "5_6"),
          choice("7 – 8", "7 – 8", "7_8"),
          choice("More than 8", "أكثر من 8", "gt8"),
        ],
      }),
      q("paragraph", "Is there anything else you would like your nutritionist to know before your first session?", "هل هناك أي شيء آخر تودّين إطلاع أخصائية التغذية عليه قبل جلستك الأولى؟", {
        placeholder_en: "Any additional information…",
        placeholder_ar: "أي معلومات إضافية…",
      }),
    ],
  },

  // ─── 2. Lipedema Assessment ────────────────────────────────────────────────
  {
    id: "bundle-lipedema-assessment",
    name_en: "Lipedema Assessment",
    name_ar: "تقييم الليبيديما",
    description_en: "In-depth symptom screening and history for clients with suspected or diagnosed Lipedema.",
    description_ar: "فحص متعمق للأعراض والتاريخ للعملاء المشتبه بإصابتهم أو المشخصين بالليبيديما.",
    emoji: "🩷",
    color: "bg-rose-50",
    questions: [
      q("short_text", "Full Name", "الاسم الكامل", { required: true }),
      q("single_choice", "Has Lipedema been formally diagnosed by a doctor?", "هل تم تشخيص الليبيديما رسمياً من قِبل طبيب؟", {
        required: true,
        options: [
          choice("Yes, confirmed diagnosis", "نعم، تشخيص مؤكد", "diagnosed"),
          choice("Suspected but not confirmed", "مشتبه به لكن غير مؤكد", "suspected"),
          choice("Not yet evaluated by a doctor", "لم يتم تقييمه من قِبل طبيب بعد", "not_evaluated"),
        ],
      }),
      q("single_choice", "If diagnosed, which Lipedema stage were you told?", "إذا كان مشخصاً، ما المرحلة التي أُخبرتِ بها؟", {
        options: [
          choice("Stage 1", "المرحلة 1", "stage_1"),
          choice("Stage 2", "المرحلة 2", "stage_2"),
          choice("Stage 3", "المرحلة 3", "stage_3"),
          choice("Stage 4 (Lipo-lymphedema)", "المرحلة 4 (ليبو-لمفيديما)", "stage_4"),
          choice("Not told / not sure", "لم أُخبَر / لست متأكدة", "unknown"),
        ],
      }),
      q("multiple_choice", "Which areas of the body are affected?", "ما المناطق من الجسم المتأثرة؟", {
        options: [
          choice("Hips & buttocks", "الوركان والأرداف", "hips"),
          choice("Thighs", "الفخذان", "thighs"),
          choice("Lower legs / calves", "الساقان السفليتان / الربلتان", "calves"),
          choice("Upper arms", "أعلى الذراعين", "arms"),
          choice("Abdomen", "البطن", "abdomen"),
        ],
      }),
      q("multiple_choice", "Which symptoms do you experience? (check all that apply)", "ما الأعراض التي تعانين منها؟ (اختاري كل ما ينطبق)", {
        options: [
          choice("Pain or tenderness in affected areas", "ألم أو حساسية في المناطق المتأثرة", "pain"),
          choice("Easy bruising", "سهولة الكدمات", "bruising"),
          choice("Heaviness or fatigue in legs/arms", "ثقل أو إرهاق في الساقين/الذراعين", "heaviness"),
          choice("Swelling that worsens during the day", "تورم يزداد سوءاً خلال النهار", "swelling"),
          choice("Skin texture changes (orange peel, nodules)", "تغيرات في ملمس الجلد (قشر البرتقال، عقيدات)", "skin_changes"),
          choice("Disproportionate fat distribution", "توزيع دهون غير متناسب", "disproportionate"),
        ],
      }),
      q("single_choice", "When did symptoms first appear?", "متى ظهرت الأعراض لأول مرة؟", {
        options: [
          choice("Puberty", "البلوغ", "puberty"),
          choice("Pregnancy", "الحمل", "pregnancy"),
          choice("Menopause", "انقطاع الطمث", "menopause"),
          choice("After significant weight gain", "بعد زيادة وزن كبيرة", "weight_gain"),
          choice("Gradually over many years", "تدريجياً على مدى سنوات", "gradual"),
          choice("Not sure", "غير متأكدة", "unknown"),
        ],
      }),
      q("yes_no", "Do you have a family history of Lipedema?", "هل لديك تاريخ عائلي للإصابة بالليبيديما؟"),
      q("multiple_choice", "Have you tried any of the following treatments?", "هل جربتِ أياً من العلاجات التالية؟", {
        options: [
          choice("MLD (Manual Lymphatic Drainage)", "تصريف الليمف اليدوي", "mld"),
          choice("Compression garments", "ملابس الضغط", "compression"),
          choice("Liposuction (WAL or SAL)", "شفط الدهون", "liposuction"),
          choice("Anti-inflammatory diet", "حمية مضادة للالتهاب", "anti_inflam_diet"),
          choice("None", "لا شيء", "none"),
        ],
      }),
      q("single_choice", "How much does Lipedema impact your daily life?", "كم تؤثر الليبيديما على حياتك اليومية؟", {
        options: [
          choice("Minimal impact", "تأثير بسيط", "minimal"),
          choice("Moderate — some activities are limited", "متوسط — بعض الأنشطة محدودة", "moderate"),
          choice("Significant — daily pain or mobility issues", "كبير — ألم يومي أو مشاكل في الحركة", "significant"),
          choice("Severe — unable to perform basic activities", "شديد — غير قادرة على أداء الأنشطة الأساسية", "severe"),
        ],
      }),
      q("paragraph", "What are your goals for your Lipedema nutrition plan?", "ما أهدافك من خطة التغذية الخاصة بالليبيديما؟", {
        required: true,
        placeholder_en: "e.g. reduce pain, slow progression, anti-inflammatory diet…",
        placeholder_ar: "مثال: تقليل الألم، إبطاء التقدم، نظام مضاد للالتهاب…",
      }),
    ],
  },

  // ─── 3. Follow-up Assessment ───────────────────────────────────────────────
  {
    id: "bundle-followup-assessment",
    name_en: "Follow-up Assessment",
    name_ar: "تقييم المتابعة",
    description_en: "Progress check-in for returning clients — tracks changes since the last session.",
    description_ar: "متابعة التقدم للعملاء العائدين — يتتبع التغييرات منذ الجلسة الأخيرة.",
    emoji: "📊",
    color: "bg-emerald-50",
    questions: [
      q("short_text", "Full Name", "الاسم الكامل", { required: true }),
      q("number", "Current Weight (kg)", "الوزن الحالي (كجم)", { placeholder_en: "Your weight today", placeholder_ar: "وزنك اليوم" }),
      q("single_choice", "Overall, how do you feel since your last session?", "بشكل عام، كيف تشعرين منذ جلستك الأخيرة؟", {
        required: true,
        options: [
          choice("Much better", "أفضل بكثير", "much_better"),
          choice("Slightly better", "أفضل قليلاً", "slightly_better"),
          choice("About the same", "تقريباً كما كان", "same"),
          choice("Slightly worse", "أسوأ قليلاً", "slightly_worse"),
          choice("Much worse", "أسوأ بكثير", "much_worse"),
        ],
      }),
      q("single_choice", "How closely did you follow the nutrition plan?", "إلى أي مدى التزمتِ بخطة التغذية؟", {
        options: [
          choice("Very closely (80–100%)", "بدقة شديدة (80–100%)", "very_closely"),
          choice("Mostly (60–80%)", "في معظمه (60–80%)", "mostly"),
          choice("Partially (40–60%)", "جزئياً (40–60%)", "partially"),
          choice("Minimally (less than 40%)", "بشكل طفيف (أقل من 40%)", "minimally"),
          choice("Did not follow", "لم ألتزم", "no"),
        ],
      }),
      q("paragraph", "What went well since the last session?", "ما الذي سار بشكل جيد منذ الجلسة الأخيرة؟", {
        placeholder_en: "Describe any positive changes, habits formed, meals you enjoyed…",
        placeholder_ar: "صفي أي تغييرات إيجابية، عادات تكونت، وجبات أعجبتك…",
      }),
      q("paragraph", "What challenges did you face?", "ما التحديات التي واجهتيها؟", {
        placeholder_en: "Any difficulties with the plan, cravings, social situations…",
        placeholder_ar: "أي صعوبات مع الخطة، أو الرغبات الشديدة، أو المواقف الاجتماعية…",
      }),
      q("multiple_choice", "Which symptoms have improved since your last session?", "ما الأعراض التي تحسنت منذ جلستك الأخيرة؟", {
        options: [
          choice("Energy levels", "مستويات الطاقة", "energy"),
          choice("Digestion / bloating", "الهضم / الانتفاخ", "digestion"),
          choice("Sleep quality", "جودة النوم", "sleep"),
          choice("Mood / emotional wellbeing", "المزاج / العافية العاطفية", "mood"),
          choice("Pain / inflammation", "الألم / الالتهاب", "pain"),
          choice("None yet", "لا شيء حتى الآن", "none"),
        ],
      }),
      q("yes_no", "Have there been any changes to your medications or supplements?", "هل طرأت أي تغييرات على أدويتك أو مكملاتك الغذائية؟"),
      q("paragraph", "If yes, please describe the changes", "إذا نعم، يرجى وصف التغييرات", {
        placeholder_en: "New medications, stopped supplements, changed doses…",
        placeholder_ar: "أدوية جديدة، توقف عن مكملات، تغيير جرعات…",
      }),
      q("single_choice", "How is your stress level compared to last session?", "كيف مستوى توترك مقارنة بالجلسة الأخيرة؟", {
        options: [
          choice("Lower", "أقل", "lower"),
          choice("About the same", "تقريباً كما كان", "same"),
          choice("Higher", "أعلى", "higher"),
        ],
      }),
      q("paragraph", "What goals would you like to focus on this session?", "ما الأهداف التي تودين التركيز عليها في هذه الجلسة؟", {
        placeholder_en: "Any specific areas you want to work on…",
        placeholder_ar: "أي مجالات محددة تودين العمل عليها…",
      }),
    ],
  },

  // ─── 4. Weight Loss Assessment ────────────────────────────────────────────
  {
    id: "bundle-weight-loss-assessment",
    name_en: "Weight Loss Assessment",
    name_ar: "تقييم إدارة الوزن",
    description_en: "Detailed intake for clients with weight management goals — habits, history, and readiness.",
    description_ar: "استبيان تفصيلي للعملاء الراغبين في إدارة الوزن — العادات والتاريخ والاستعداد.",
    emoji: "⚖️",
    color: "bg-violet-50",
    questions: [
      q("short_text", "Full Name", "الاسم الكامل", { required: true }),
      q("number", "Current Weight (kg)", "الوزن الحالي (كجم)", { required: true }),
      q("number", "Height (cm)", "الطول (سم)", { required: true }),
      q("number", "Target Weight (kg)", "الوزن المستهدف (كجم)", {
        placeholder_en: "Your goal weight",
        placeholder_ar: "وزنك المستهدف",
      }),
      q("single_choice", "How long have you been trying to lose weight?", "منذ متى وأنتِ تحاولين إنقاص الوزن؟", {
        options: [
          choice("Less than 6 months", "أقل من 6 أشهر", "lt6m"),
          choice("6 months – 2 years", "6 أشهر – سنتان", "6m_2y"),
          choice("2 – 5 years", "2 – 5 سنوات", "2_5y"),
          choice("More than 5 years", "أكثر من 5 سنوات", "gt5y"),
        ],
      }),
      q("multiple_choice", "What approaches have you tried before?", "ما الأساليب التي جربتِها من قبل؟", {
        options: [
          choice("Calorie restriction", "تقييد السعرات الحرارية", "calorie"),
          choice("Low-carb / Keto", "قليل الكربوهيدرات / كيتو", "keto"),
          choice("Intermittent fasting", "الصيام المتقطع", "if"),
          choice("Weight loss medication", "أدوية إنقاص الوزن", "meds"),
          choice("Bariatric surgery", "جراحة السمنة", "surgery"),
          choice("Commercial diet programmes", "برامج الحمية التجارية", "commercial"),
          choice("None", "لا شيء", "none"),
        ],
      }),
      q("single_choice", "Do you have a history of emotional eating?", "هل لديك تاريخ مع الأكل العاطفي؟", {
        options: [
          choice("Yes, frequently", "نعم، بشكل متكرر", "yes_freq"),
          choice("Sometimes", "أحياناً", "sometimes"),
          choice("Rarely", "نادراً", "rarely"),
          choice("No", "لا", "no"),
        ],
      }),
      q("single_choice", "How often do you exercise per week?", "كم مرة تمارسين الرياضة في الأسبوع؟", {
        options: [
          choice("Not at all", "لا أمارس", "none"),
          choice("1 – 2 times", "1 – 2 مرات", "1_2"),
          choice("3 – 4 times", "3 – 4 مرات", "3_4"),
          choice("5 or more times", "5 مرات أو أكثر", "5plus"),
        ],
      }),
      q("multiple_choice", "Which factors do you think contribute most to your weight?", "ما العوامل التي تعتقدين أنها تساهم أكثر في وزنك؟", {
        options: [
          choice("Eating habits", "عادات الأكل", "eating"),
          choice("Sedentary lifestyle", "نمط حياة قليل الحركة", "sedentary"),
          choice("Hormonal imbalances", "اختلالات هرمونية", "hormonal"),
          choice("Stress / emotional eating", "التوتر / الأكل العاطفي", "stress"),
          choice("Medications", "الأدوية", "meds"),
          choice("Medical conditions", "حالات طبية", "medical"),
          choice("Sleep issues", "مشاكل النوم", "sleep"),
        ],
      }),
      q("paragraph", "Describe a typical day of eating for you", "صفي يوماً نموذجياً من الأكل بالنسبة لكِ", {
        placeholder_en: "Breakfast, lunch, dinner, snacks…",
        placeholder_ar: "الفطور، الغداء، العشاء، الوجبات الخفيفة…",
      }),
      q("single_choice", "How motivated are you to make lifestyle changes right now?", "كم أنتِ متحمسة لإجراء تغييرات في نمط حياتك الآن؟", {
        options: [
          choice("Extremely motivated", "متحمسة جداً", "very"),
          choice("Quite motivated", "متحمسة", "quite"),
          choice("Somewhat motivated", "متحمسة نسبياً", "somewhat"),
          choice("Not very motivated", "غير متحمسة كثيراً", "low"),
        ],
      }),
    ],
  },

  // ─── 5. Women's Wellness Assessment ───────────────────────────────────────
  {
    id: "bundle-womens-wellness",
    name_en: "Women's Wellness Assessment",
    name_ar: "تقييم صحة المرأة",
    description_en: "Hormonal health, menstrual cycle, gut health and wellbeing intake for female clients.",
    description_ar: "استبيان الصحة الهرمونية ودورة الطمث وصحة الأمعاء والعافية للعميلات.",
    emoji: "🌸",
    color: "bg-pink-50",
    questions: [
      q("short_text", "Full Name", "الاسم الكامل", { required: true }),
      q("number", "Age", "العمر", { required: true }),
      q("single_choice", "What is your current hormonal / reproductive status?", "ما وضعك الهرموني / الإنجابي الحالي؟", {
        required: true,
        options: [
          choice("Pre-menopausal (regular cycles)", "قبل انقطاع الطمث (دورات منتظمة)", "premenopause"),
          choice("Peri-menopausal (irregular cycles)", "حول انقطاع الطمث (دورات غير منتظمة)", "perimenopause"),
          choice("Post-menopausal", "بعد انقطاع الطمث", "postmenopause"),
          choice("Pregnant / breastfeeding", "حامل / مرضعة", "pregnant"),
          choice("On hormonal contraception", "تستخدم وسائل منع الحمل الهرمونية", "contraception"),
        ],
      }),
      q("yes_no", "Are your menstrual cycles regular?", "هل دوراتك الشهرية منتظمة؟"),
      q("multiple_choice", "Do you experience any of the following menstrual symptoms?", "هل تعانين من أي من أعراض الدورة الشهرية التالية؟", {
        options: [
          choice("Heavy bleeding", "نزيف غزير", "heavy"),
          choice("Severe cramps", "تقلصات شديدة", "cramps"),
          choice("PMS / PMDD", "متلازمة ما قبل الحيض", "pms"),
          choice("Irregular cycles", "دورات غير منتظمة", "irregular"),
          choice("None significant", "لا شيء مهم", "none"),
        ],
      }),
      q("yes_no", "Have you been diagnosed with PCOS or endometriosis?", "هل تم تشخيصك بمتلازمة المبيض المتعدد الكيسات أو بطانة الرحم المهاجرة؟"),
      q("multiple_choice", "Which gut / digestive symptoms do you regularly experience?", "ما أعراض الجهاز الهضمي التي تعانين منها بانتظام؟", {
        options: [
          choice("Bloating", "الانتفاخ", "bloating"),
          choice("Constipation", "الإمساك", "constipation"),
          choice("Diarrhea", "الإسهال", "diarrhea"),
          choice("Acid reflux / heartburn", "ارتداد الحمض / حرقة المعدة", "reflux"),
          choice("Nausea", "الغثيان", "nausea"),
          choice("None", "لا شيء", "none"),
        ],
      }),
      q("single_choice", "How would you rate your energy levels throughout the day?", "كيف تقيّمين مستويات طاقتك خلال اليوم؟", {
        options: [
          choice("Consistently high", "مرتفعة باستمرار", "high"),
          choice("Good in the morning, tired by afternoon", "جيدة في الصباح، متعبة بعد الظهر", "morning"),
          choice("Low throughout the day", "منخفضة طوال اليوم", "low"),
          choice("Very inconsistent / unpredictable", "غير منتظمة جداً / غير متوقعة", "inconsistent"),
        ],
      }),
      q("yes_no", "Do you experience anxiety or depressive symptoms?", "هل تعانين من القلق أو أعراض الاكتئاب؟"),
      q("single_choice", "How is your skin health?", "كيف صحة بشرتك؟", {
        options: [
          choice("Clear / generally good", "صافية / جيدة عموماً", "good"),
          choice("Occasional breakouts", "حبوب عرضية", "occasional"),
          choice("Frequent acne", "حب شباب متكرر", "frequent_acne"),
          choice("Dryness / eczema", "جفاف / إكزيما", "dry"),
          choice("Other skin concerns", "مشاكل جلدية أخرى", "other"),
        ],
      }),
      q("multiple_choice", "What are your main wellness goals? (select all that apply)", "ما أهدافك الصحية الرئيسية؟ (اختاري كل ما ينطبق)", {
        required: true,
        options: [
          choice("Balance hormones", "توازن الهرمونات", "hormones"),
          choice("Improve gut health", "تحسين صحة الأمعاء", "gut"),
          choice("Manage weight", "إدارة الوزن", "weight"),
          choice("Boost energy", "تعزيز الطاقة", "energy"),
          choice("Better skin", "بشرة أفضل", "skin"),
          choice("Reduce inflammation", "تقليل الالتهاب", "inflammation"),
          choice("Improve fertility", "تحسين الخصوبة", "fertility"),
        ],
      }),
      q("paragraph", "Anything else you would like to share about your health?", "أي شيء آخر تودين مشاركته بشأن صحتك؟", {
        placeholder_en: "Any additional context…",
        placeholder_ar: "أي سياق إضافي…",
      }),
    ],
  },
];
