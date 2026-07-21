/**
 * clients.ts — SHELAN Admin CRM
 *
 * Single source of truth for all client-related types and mock data.
 * Replace MOCK_CLIENTS with Supabase queries when the backend is ready.
 * Every field maps 1-to-1 with a future database column.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel    = "Low" | "Medium" | "High";
export type ClientStatus = "Active" | "Inactive" | "Waiting" | "Completed";
export type Gender       = "Female" | "Male";
export type FileType     = "PDF" | "Image" | "Lab Report" | "Video" | "Document";
export type TimelineType = "assessment" | "booking" | "consultation" | "plan" | "followup";
export type RiskIndicatorLevel = "normal" | "warning" | "critical";

export interface Consultation {
  id: string;
  date: string;
  type: string;
  typeAr: string;
  notes: string;
  notesAr: string;
  duration: string;
}

export interface MacroItem {
  label: string;
  labelAr: string;
  value: number;
  unit: string;
}

export interface NutritionPlan {
  name: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  calories: number;
  macros: MacroItem[];
  notes: string;
  notesAr: string;
  /** Status from new nutrition_plans schema: draft | active | completed | archived */
  status?: string;
  /** DB id — used to deep-link into the Nutrition Plans tab */
  planId?: string;
}

export interface ClientFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploadedAt: string;
  url: string | null;
}

export interface TimelineEvent {
  id: string;
  event: string;
  eventAr: string;
  date: string;
  type: TimelineType;
}

export interface AssessmentDetails {
  completedDate: string;
  score: number;           // 0–100
  riskPercentage: number;  // 0–100
  diagnosisCategory: string;
  diagnosisCategoryAr: string;
}

export interface RiskIndicator {
  label: string;
  labelAr: string;
  value: string;
  level: RiskIndicatorLevel;
}

export interface Client {
  // ── Identity ──────────────────────────────────────────────────────────────
  id: string;
  fullName: string;
  fullNameAr: string;
  gender: Gender;
  age: number;
  country: string;
  countryAr: string;
  phone: string;
  email: string;
  avatarInitials: string;
  avatarGradient: string;   // Tailwind gradient classes

  // ── CRM overview ──────────────────────────────────────────────────────────
  assessmentScore: number | null;
  riskLevel: RiskLevel;
  currentPlan: string;
  currentPlanAr: string;
  lastAppointment: string;
  status: ClientStatus;
  joinedDate: string;       // ISO date string

  // ── Drawer: detail sections ───────────────────────────────────────────────
  diagnoses: string[];
  diagnosesAr: string[];
  riskIndicators: RiskIndicator[];
  medicalNotes: string;
  medicalNotesAr: string;
  privateNotes: string;
  privateNotesAr: string;
  consultations: Consultation[];
  nutritionPlan: NutritionPlan | null;
  files: ClientFile[];
  timeline: TimelineEvent[];
  assessment: AssessmentDetails | null;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c-001",
    fullName: "Lara Hassan",
    fullNameAr: "لارا حسن",
    gender: "Female",
    age: 29,
    country: "Kuwait",
    countryAr: "الكويت",
    phone: "+965 9900 1234",
    email: "lara.hassan@email.com",
    avatarInitials: "LH",
    avatarGradient: "bg-gradient-to-br from-primary-pink to-soft-pink",
    assessmentScore: 82,
    riskLevel: "Low",
    currentPlan: "Weight Management",
    currentPlanAr: "إدارة الوزن",
    lastAppointment: "Jul 14, 2026",
    status: "Active",
    joinedDate: "2026-03-10",
    diagnoses: ["Overweight (BMI 27.4)", "Mild insulin resistance"],
    diagnosesAr: ["زيادة الوزن (مؤشر كتلة الجسم 27.4)", "مقاومة طفيفة للأنسولين"],
    riskIndicators: [
      { label: "BMI",          labelAr: "مؤشر كتلة الجسم", value: "27.4", level: "warning"  },
      { label: "Blood Sugar",  labelAr: "سكر الدم",         value: "98 mg/dL", level: "normal"  },
      { label: "Blood Pressure",labelAr: "ضغط الدم",       value: "118/76", level: "normal"  },
      { label: "Cholesterol",  labelAr: "الكوليسترول",      value: "190 mg/dL", level: "normal" },
    ],
    medicalNotes: "Patient responds well to a low-GI dietary approach. No known food allergies. Mild lactose sensitivity — avoid high-dairy recommendations.",
    medicalNotesAr: "تستجيب المريضة بشكل جيد لنهج غذائي منخفض المؤشر الجلايسيمي. لا توجد حساسية غذائية معروفة. حساسية طفيفة تجاه اللاكتوز.",
    privateNotes: "Very motivated. Responds best to weekly check-ins. Prefers evening appointments.",
    privateNotesAr: "متحفزة جداً. تستجيب بشكل أفضل للمتابعة الأسبوعية. تفضل المواعيد المسائية.",
    consultations: [
      { id: "cn-1", date: "Jul 14, 2026", type: "Follow-up Session",    typeAr: "جلسة متابعة",      notes: "Weight down 1.2 kg. Good adherence to meal plan.", notesAr: "انخفاض الوزن 1.2 كجم. التزام جيد بالخطة.", duration: "45 min" },
      { id: "cn-2", date: "Jun 28, 2026", type: "Initial Consultation", typeAr: "استشارة أولية",    notes: "Full health assessment conducted. Goals set for 3 months.", notesAr: "تقييم صحي شامل. وضع الأهداف لـ 3 أشهر.", duration: "60 min" },
    ],
    nutritionPlan: {
      name: "Weight Management Phase 1",
      nameAr: "إدارة الوزن — المرحلة الأولى",
      startDate: "Jun 28, 2026",
      endDate: "Sep 28, 2026",
      calories: 1600,
      macros: [
        { label: "Protein", labelAr: "بروتين", value: 120, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 160, unit: "g" },
        { label: "Fat",     labelAr: "دهون", value: 55,  unit: "g" },
      ],
      notes: "Low-GI carbs only. Avoid refined sugars. Hydration goal: 2.5 L/day.",
      notesAr: "كربوهيدرات منخفضة المؤشر الجلايسيمي فقط. تجنب السكريات المكررة. هدف الترطيب: 2.5 لتر/يوم.",
    },
    files: [
      { id: "f-1", name: "Blood Test Results.pdf",    type: "Lab Report", size: "1.2 MB", uploadedAt: "Jun 25, 2026", url: null },
      { id: "f-2", name: "Body Composition Scan.pdf", type: "PDF",        size: "0.8 MB", uploadedAt: "Jun 28, 2026", url: null },
    ],
    timeline: [
      { id: "t-1", event: "Assessment Submitted",      eventAr: "تم تقديم التقييم",        date: "Jun 20, 2026", type: "assessment"    },
      { id: "t-2", event: "Consultation Booked",        eventAr: "تم حجز الاستشارة",         date: "Jun 22, 2026", type: "booking"       },
      { id: "t-3", event: "Initial Consultation",       eventAr: "الاستشارة الأولية",        date: "Jun 28, 2026", type: "consultation"  },
      { id: "t-4", event: "Nutrition Plan Created",     eventAr: "تم إنشاء خطة التغذية",    date: "Jun 28, 2026", type: "plan"         },
      { id: "t-5", event: "Follow-up Scheduled",        eventAr: "تمت جدولة المتابعة",       date: "Jul 14, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Jun 20, 2026", score: 82, riskPercentage: 18, diagnosisCategory: "Overweight — Low Risk", diagnosisCategoryAr: "زيادة الوزن — خطر منخفض" },
  },

  {
    id: "c-002",
    fullName: "Reem Al-Ahmad",
    fullNameAr: "ريم الأحمد",
    gender: "Female",
    age: 42,
    country: "Saudi Arabia",
    countryAr: "المملكة العربية السعودية",
    phone: "+966 5500 9876",
    email: "reem.alahmad@email.com",
    avatarInitials: "RA",
    avatarGradient: "bg-gradient-to-br from-lavender-purple to-soft-purple",
    assessmentScore: 61,
    riskLevel: "Medium",
    currentPlan: "Diabetes Management",
    currentPlanAr: "إدارة السكري",
    lastAppointment: "Jul 10, 2026",
    status: "Active",
    joinedDate: "2026-04-05",
    diagnoses: ["Type 2 Diabetes (controlled)", "Hypertension Stage 1"],
    diagnosesAr: ["السكري من النوع الثاني (مضبوط)", "ارتفاع ضغط الدم - المرحلة الأولى"],
    riskIndicators: [
      { label: "HbA1c",         labelAr: "الهيموجلوبين السكري", value: "7.1%",      level: "warning"  },
      { label: "Fasting Sugar", labelAr: "سكر الصيام",          value: "128 mg/dL", level: "warning"  },
      { label: "Blood Pressure",labelAr: "ضغط الدم",            value: "138/88",    level: "warning"  },
      { label: "Cholesterol",   labelAr: "الكوليسترول",         value: "218 mg/dL", level: "warning"  },
    ],
    medicalNotes: "Managed with Metformin 1000mg twice daily. Monitor carbohydrate intake closely. Low-sodium diet required due to hypertension.",
    medicalNotesAr: "تتناول ميتفورمين 1000 ملغ مرتين يومياً. مراقبة الكربوهيدرات بعناية. نظام غذائي منخفض الصوديوم.",
    privateNotes: "Prefers Arabic-language consultations. Has a very supportive family. Tends to skip breakfast — needs gentle reminders.",
    privateNotesAr: "تفضل الاستشارات باللغة العربية. لديها عائلة داعمة. تميل لتخطي الفطور.",
    consultations: [
      { id: "cn-3", date: "Jul 10, 2026", type: "Follow-up",          typeAr: "متابعة",      notes: "HbA1c improved from 7.4 to 7.1. Blood pressure still elevated.", notesAr: "تحسن HbA1c من 7.4 إلى 7.1. ضغط الدم لا يزال مرتفعاً.", duration: "50 min" },
      { id: "cn-4", date: "May 15, 2026", type: "Initial Consultation",typeAr: "استشارة أولية", notes: "Full metabolic panel reviewed. Diabetes management protocol initiated.", notesAr: "مراجعة الملف الأيضي الكامل. بدء بروتوكول إدارة السكري.", duration: "75 min" },
    ],
    nutritionPlan: {
      name: "Diabetic Control Plan",
      nameAr: "خطة ضبط السكري",
      startDate: "May 15, 2026",
      endDate: "Nov 15, 2026",
      calories: 1750,
      macros: [
        { label: "Protein", labelAr: "بروتين",       value: 100, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات",  value: 175, unit: "g" },
        { label: "Fat",     labelAr: "دهون",         value: 65,  unit: "g" },
      ],
      notes: "Distribute carbs evenly across 5 meals. Limit sodium to 1500mg/day. Mediterranean-style eating pattern.",
      notesAr: "توزيع الكربوهيدرات بالتساوي على 5 وجبات. الحد من الصوديوم إلى 1500 ملغ/يوم.",
    },
    files: [
      { id: "f-3", name: "HbA1c Results May 2026.pdf", type: "Lab Report", size: "0.9 MB", uploadedAt: "May 10, 2026", url: null },
      { id: "f-4", name: "HbA1c Results Jul 2026.pdf",  type: "Lab Report", size: "0.9 MB", uploadedAt: "Jul 8, 2026", url: null  },
    ],
    timeline: [
      { id: "t-6",  event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Apr 28, 2026", type: "assessment"   },
      { id: "t-7",  event: "Consultation Booked",    eventAr: "تم حجز الاستشارة",     date: "May 5, 2026",  type: "booking"      },
      { id: "t-8",  event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "May 15, 2026", type: "consultation" },
      { id: "t-9",  event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "May 15, 2026", type: "plan"         },
      { id: "t-10", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Jul 10, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Apr 28, 2026", score: 61, riskPercentage: 45, diagnosisCategory: "Metabolic Syndrome — Medium Risk", diagnosisCategoryAr: "متلازمة التمثيل الغذائي — خطر متوسط" },
  },

  {
    id: "c-003",
    fullName: "Nora Mohammed",
    fullNameAr: "نورا محمد",
    gender: "Female",
    age: 35,
    country: "UAE",
    countryAr: "الإمارات العربية المتحدة",
    phone: "+971 5022 3344",
    email: "nora.mohammed@email.com",
    avatarInitials: "NM",
    avatarGradient: "bg-gradient-to-br from-soft-purple to-deep-purple",
    assessmentScore: 38,
    riskLevel: "High",
    currentPlan: "Lipedema Care",
    currentPlanAr: "رعاية الليبيديما",
    lastAppointment: "Jul 16, 2026",
    status: "Waiting",
    joinedDate: "2026-06-01",
    diagnoses: ["Lipedema Stage II", "Hypothyroidism", "Obesity Class I"],
    diagnosesAr: ["ليبيديما المرحلة الثانية", "قصور الغدة الدرقية", "السمنة الدرجة الأولى"],
    riskIndicators: [
      { label: "BMI",          labelAr: "مؤشر كتلة الجسم",     value: "34.2",       level: "critical" },
      { label: "TSH (Thyroid)",labelAr: "هرمون الغدة الدرقية", value: "6.8 mIU/L",  level: "critical" },
      { label: "Inflammation", labelAr: "الالتهاب (CRP)",       value: "8.2 mg/L",   level: "critical" },
      { label: "Blood Pressure",labelAr: "ضغط الدم",           value: "145/92",      level: "critical" },
    ],
    medicalNotes: "Lipedema confirmed by specialist. Anti-inflammatory diet essential. Avoid high-impact exercise. Requires coordination with endocrinologist for thyroid management.",
    medicalNotesAr: "تأكدت الليبيديما من قبل متخصص. النظام الغذائي المضاد للالتهابات ضروري. تجنب التمارين عالية التأثير. يتطلب التنسيق مع أخصائي الغدد.",
    privateNotes: "Very anxious about her diagnosis. Requires extra emotional support and clear communication. Prefers morning appointments.",
    privateNotesAr: "قلقة جداً بشأن تشخيصها. تحتاج دعماً عاطفياً إضافياً وتواصلاً واضحاً. تفضل مواعيد الصباح.",
    consultations: [
      { id: "cn-5", date: "Jul 16, 2026", type: "Nutritional Assessment", typeAr: "تقييم تغذوي",  notes: "Detailed body composition analysis. Anti-inflammatory protocol explained.", notesAr: "تحليل تفصيلي لتكوين الجسم. شرح بروتوكول مضاد للالتهابات.", duration: "90 min" },
    ],
    nutritionPlan: {
      name: "Lipedema Anti-Inflammatory Protocol",
      nameAr: "بروتوكول الليبيديما المضاد للالتهابات",
      startDate: "Jul 16, 2026",
      endDate: "Jan 16, 2027",
      calories: 1800,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 130, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 130, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 80,  unit: "g" },
      ],
      notes: "Ketogenic-adjacent. Anti-inflammatory fats. Eliminate gluten and refined sugars. Prioritise omega-3 sources.",
      notesAr: "نهج قريب من الكيتو. دهون مضادة للالتهابات. تخلص من الغلوتين والسكريات المكررة.",
    },
    files: [
      { id: "f-5", name: "Lipedema Specialist Report.pdf", type: "PDF",        size: "2.1 MB", uploadedAt: "Jun 15, 2026", url: null },
      { id: "f-6", name: "Thyroid Panel Results.pdf",      type: "Lab Report", size: "1.0 MB", uploadedAt: "Jun 10, 2026", url: null },
      { id: "f-7", name: "Body Scan Image.jpg",            type: "Image",      size: "3.4 MB", uploadedAt: "Jul 16, 2026", url: null },
    ],
    timeline: [
      { id: "t-11", event: "Assessment Submitted",    eventAr: "تم تقديم التقييم",     date: "Jun 5, 2026",  type: "assessment"   },
      { id: "t-12", event: "Consultation Booked",      eventAr: "تم حجز الاستشارة",     date: "Jun 10, 2026", type: "booking"      },
      { id: "t-13", event: "Initial Consultation",     eventAr: "الاستشارة الأولية",    date: "Jul 16, 2026", type: "consultation" },
      { id: "t-14", event: "Nutrition Plan Created",   eventAr: "تم إنشاء خطة التغذية",date: "Jul 16, 2026", type: "plan"         },
    ],
    assessment: { completedDate: "Jun 5, 2026", score: 38, riskPercentage: 78, diagnosisCategory: "Lipedema + Metabolic — High Risk", diagnosisCategoryAr: "ليبيديما + أيضي — خطر مرتفع" },
  },

  {
    id: "c-004",
    fullName: "Fatima Al-Rashid",
    fullNameAr: "فاطمة الراشد",
    gender: "Female",
    age: 31,
    country: "Bahrain",
    countryAr: "البحرين",
    phone: "+973 3300 5566",
    email: "fatima.rashid@email.com",
    avatarInitials: "FR",
    avatarGradient: "bg-gradient-to-br from-primary-pink to-lavender-purple",
    assessmentScore: 88,
    riskLevel: "Low",
    currentPlan: "General Nutrition",
    currentPlanAr: "تغذية عامة",
    lastAppointment: "Jul 2, 2026",
    status: "Active",
    joinedDate: "2026-05-15",
    diagnoses: ["Healthy — Preventive care"],
    diagnosesAr: ["صحية — رعاية وقائية"],
    riskIndicators: [
      { label: "BMI",           labelAr: "مؤشر كتلة الجسم", value: "22.1",      level: "normal" },
      { label: "Blood Sugar",   labelAr: "سكر الدم",         value: "88 mg/dL",  level: "normal" },
      { label: "Blood Pressure",labelAr: "ضغط الدم",         value: "112/72",    level: "normal" },
      { label: "Cholesterol",   labelAr: "الكوليسترول",      value: "168 mg/dL", level: "normal" },
    ],
    medicalNotes: "Excellent baseline health. Focus on optimisation — energy levels, gut health, and hormonal balance. Considering starting a family in the next 2 years.",
    medicalNotesAr: "صحة أساسية ممتازة. التركيز على التحسين — مستويات الطاقة وصحة الجهاز الهضمي والتوازن الهرموني.",
    privateNotes: "Planning pregnancy — ensure folate and iron optimisation. Very health-conscious.",
    privateNotesAr: "تخطط للحمل — ضمان تحسين مستويات الفولات والحديد. واعية جداً بصحتها.",
    consultations: [
      { id: "cn-6", date: "Jul 2, 2026",  type: "Follow-up",          typeAr: "متابعة",       notes: "All markers excellent. Adjusted plan for hormonal support.", notesAr: "جميع المؤشرات ممتازة. تعديل الخطة للدعم الهرموني.", duration: "40 min" },
      { id: "cn-7", date: "May 22, 2026", type: "Initial Consultation",typeAr: "استشارة أولية",notes: "Preventive nutrition plan initiated.", notesAr: "بدء خطة التغذية الوقائية.", duration: "60 min" },
    ],
    nutritionPlan: {
      name: "Hormonal Balance & Optimisation",
      nameAr: "التوازن الهرموني والتحسين",
      startDate: "May 22, 2026",
      endDate: "Nov 22, 2026",
      calories: 1900,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 110, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 220, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 70,  unit: "g" },
      ],
      notes: "Whole foods approach. High fibre. Iron-rich foods. Supplement: folate 400mcg daily.",
      notesAr: "نهج الأغذية الكاملة. ألياف عالية. أغذية غنية بالحديد. مكمل: حمض الفوليك 400 ميكروجرام يومياً.",
    },
    files: [
      { id: "f-8", name: "Hormone Panel.pdf", type: "Lab Report", size: "1.1 MB", uploadedAt: "May 18, 2026", url: null },
    ],
    timeline: [
      { id: "t-15", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "May 12, 2026", type: "assessment"   },
      { id: "t-16", event: "Consultation Booked",    eventAr: "تم حجز الاستشارة",     date: "May 18, 2026", type: "booking"      },
      { id: "t-17", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "May 22, 2026", type: "consultation" },
      { id: "t-18", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "May 22, 2026", type: "plan"         },
      { id: "t-19", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Jul 2, 2026",  type: "followup"     },
    ],
    assessment: { completedDate: "May 12, 2026", score: 88, riskPercentage: 8, diagnosisCategory: "Healthy — Preventive", diagnosisCategoryAr: "صحية — وقائية" },
  },

  {
    id: "c-005",
    fullName: "Sara Khalid",
    fullNameAr: "سارة خالد",
    gender: "Female",
    age: 26,
    country: "Qatar",
    countryAr: "قطر",
    phone: "+974 5511 7788",
    email: "sara.khalid@email.com",
    avatarInitials: "SK",
    avatarGradient: "bg-gradient-to-br from-soft-pink to-primary-pink",
    assessmentScore: 91,
    riskLevel: "Low",
    currentPlan: "Weight Management",
    currentPlanAr: "إدارة الوزن",
    lastAppointment: "Jun 20, 2026",
    status: "Completed",
    joinedDate: "2026-01-08",
    diagnoses: ["Programme completed successfully"],
    diagnosesAr: ["اكتمل البرنامج بنجاح"],
    riskIndicators: [
      { label: "BMI",           labelAr: "مؤشر كتلة الجسم", value: "23.8",      level: "normal" },
      { label: "Blood Sugar",   labelAr: "سكر الدم",         value: "92 mg/dL",  level: "normal" },
      { label: "Blood Pressure",labelAr: "ضغط الدم",         value: "110/70",    level: "normal" },
    ],
    medicalNotes: "Completed 6-month weight management programme. Lost 8kg total. Excellent compliance throughout.",
    medicalNotesAr: "أتمّت برنامج إدارة الوزن لمدة 6 أشهر. فقدت 8 كجم إجمالاً. التزام ممتاز طوال البرنامج.",
    privateNotes: "Programme graduate. Offered maintenance plan — follow up in 3 months.",
    privateNotesAr: "خريجة البرنامج. عُرض عليها خطة صيانة — متابعة بعد 3 أشهر.",
    consultations: [
      { id: "cn-8", date: "Jun 20, 2026", type: "Discharge Consultation", typeAr: "جلسة الإنهاء", notes: "Programme complete. Maintenance guidelines provided. BMI now healthy.", notesAr: "اكتمل البرنامج. إرشادات الصيانة مقدمة. مؤشر كتلة الجسم طبيعي الآن.", duration: "60 min" },
    ],
    nutritionPlan: null,
    files: [
      { id: "f-9", name: "Final Progress Report.pdf", type: "PDF", size: "1.8 MB", uploadedAt: "Jun 20, 2026", url: null },
    ],
    timeline: [
      { id: "t-20", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Jan 8, 2026",  type: "assessment"   },
      { id: "t-21", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "Jan 15, 2026", type: "consultation" },
      { id: "t-22", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "Jan 15, 2026", type: "plan"         },
      { id: "t-23", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Apr 10, 2026", type: "followup"     },
      { id: "t-24", event: "Programme Completed",    eventAr: "اكتمل البرنامج",       date: "Jun 20, 2026", type: "consultation" },
    ],
    assessment: { completedDate: "Jan 8, 2026", score: 91, riskPercentage: 6, diagnosisCategory: "Healthy — Programme Complete", diagnosisCategoryAr: "صحية — اكتمل البرنامج" },
  },

  {
    id: "c-006",
    fullName: "Mira Al-Ali",
    fullNameAr: "ميرا العلي",
    gender: "Female",
    age: 48,
    country: "Jordan",
    countryAr: "الأردن",
    phone: "+962 7700 4433",
    email: "mira.alali@email.com",
    avatarInitials: "MA",
    avatarGradient: "bg-gradient-to-br from-deep-purple to-lavender-purple",
    assessmentScore: 32,
    riskLevel: "High",
    currentPlan: "Lipedema Care",
    currentPlanAr: "رعاية الليبيديما",
    lastAppointment: "Jul 12, 2026",
    status: "Active",
    joinedDate: "2026-02-20",
    diagnoses: ["Lipedema Stage III", "Type 2 Diabetes", "Hypertension"],
    diagnosesAr: ["ليبيديما المرحلة الثالثة", "السكري من النوع الثاني", "ارتفاع ضغط الدم"],
    riskIndicators: [
      { label: "BMI",          labelAr: "مؤشر كتلة الجسم",     value: "38.5",      level: "critical" },
      { label: "HbA1c",        labelAr: "الهيموجلوبين السكري", value: "8.2%",       level: "critical" },
      { label: "Blood Pressure",labelAr: "ضغط الدم",           value: "152/96",     level: "critical" },
      { label: "Inflammation", labelAr: "الالتهاب (CRP)",      value: "12.4 mg/L",  level: "critical" },
    ],
    medicalNotes: "Complex case requiring multidisciplinary coordination. Lipedema Stage III with metabolic complications. Working alongside Dr. Hani Nasser (Endocrinologist).",
    medicalNotesAr: "حالة معقدة تستوجب التنسيق متعدد التخصصات. ليبيديما المرحلة الثالثة مع مضاعفات أيضية.",
    privateNotes: "Has a history of yo-yo dieting. Needs careful expectation-setting. Very open to lifestyle changes.",
    privateNotesAr: "لديها تاريخ من الحميات المتذبذبة. تحتاج إلى وضع توقعات حذرة. منفتحة جداً على تغييرات نمط الحياة.",
    consultations: [
      { id: "cn-9", date: "Jul 12, 2026", type: "Monthly Review",        typeAr: "مراجعة شهرية",   notes: "Slow but consistent progress. Inflammation markers improving.", notesAr: "تقدم بطيء لكن ثابت. مؤشرات الالتهاب تتحسن.", duration: "60 min" },
      { id: "cn-10",date: "May 20, 2026", type: "Initial Consultation",  typeAr: "استشارة أولية", notes: "Comprehensive multi-condition management plan initiated.", notesAr: "بدء خطة شاملة لإدارة الحالات المتعددة.", duration: "90 min" },
    ],
    nutritionPlan: {
      name: "Lipedema + Diabetes Integrated Protocol",
      nameAr: "بروتوكول ليبيديما + سكري متكامل",
      startDate: "May 20, 2026",
      endDate: "Nov 20, 2026",
      calories: 1600,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 120, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 100, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 70,  unit: "g" },
      ],
      notes: "Modified ketogenic. Strict carb management. Anti-inflammatory focus. Low sodium for BP control.",
      notesAr: "كيتو معدّل. إدارة صارمة للكربوهيدرات. تركيز مضاد للالتهابات. صوديوم منخفض لضبط ضغط الدم.",
    },
    files: [
      { id: "f-10", name: "Specialist Referral Letter.pdf", type: "PDF",        size: "0.5 MB", uploadedAt: "Feb 25, 2026", url: null },
      { id: "f-11", name: "Metabolic Panel Jun 2026.pdf",   type: "Lab Report", size: "1.3 MB", uploadedAt: "Jun 18, 2026", url: null },
    ],
    timeline: [
      { id: "t-25", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Feb 20, 2026", type: "assessment"   },
      { id: "t-26", event: "Consultation Booked",    eventAr: "تم حجز الاستشارة",     date: "Mar 1, 2026",  type: "booking"      },
      { id: "t-27", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "May 20, 2026", type: "consultation" },
      { id: "t-28", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "May 20, 2026", type: "plan"         },
      { id: "t-29", event: "Monthly Review",         eventAr: "المراجعة الشهرية",     date: "Jul 12, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Feb 20, 2026", score: 32, riskPercentage: 85, diagnosisCategory: "Complex Multi-condition — High Risk", diagnosisCategoryAr: "حالات متعددة معقدة — خطر مرتفع" },
  },

  {
    id: "c-007",
    fullName: "Dana Al-Shamri",
    fullNameAr: "دانا الشمري",
    gender: "Female",
    age: 38,
    country: "Kuwait",
    countryAr: "الكويت",
    phone: "+965 6611 2200",
    email: "dana.shamri@email.com",
    avatarInitials: "DS",
    avatarGradient: "bg-gradient-to-br from-primary-pink to-soft-purple",
    assessmentScore: 55,
    riskLevel: "Medium",
    currentPlan: "Diabetes Management",
    currentPlanAr: "إدارة السكري",
    lastAppointment: "Jul 8, 2026",
    status: "Waiting",
    joinedDate: "2026-05-30",
    diagnoses: ["Pre-diabetes", "PCOS"],
    diagnosesAr: ["ما قبل السكري", "تكيس المبايض"],
    riskIndicators: [
      { label: "Fasting Sugar", labelAr: "سكر الصيام",          value: "112 mg/dL", level: "warning" },
      { label: "Insulin",       labelAr: "الأنسولين",           value: "18 µU/mL",  level: "warning" },
      { label: "BMI",           labelAr: "مؤشر كتلة الجسم",     value: "29.1",      level: "warning" },
      { label: "Testosterone",  labelAr: "هرمون التستوستيرون",  value: "64 ng/dL",  level: "warning" },
    ],
    medicalNotes: "PCOS with insulin resistance. Low-GI diet critical. Inositol supplement recommended. Exercise prescription: 150 min moderate/week.",
    medicalNotesAr: "تكيس المبايض مع مقاومة الأنسولين. النظام الغذائي منخفض المؤشر الجلايسيمي ضروري. الإينوزيتول مكمل موصى به.",
    privateNotes: "Waiting for specialist PCOS report before finalising the plan. Currently on dietary guidance only.",
    privateNotesAr: "في انتظار تقرير أخصائي تكيس المبايض قبل وضع اللمسات الأخيرة على الخطة.",
    consultations: [
      { id: "cn-11", date: "Jul 8, 2026",  type: "Dietary Guidance",    typeAr: "إرشادات غذائية",  notes: "Interim dietary advice provided while awaiting specialist report.", notesAr: "تقديم نصائح غذائية مؤقتة ريثما يصل تقرير المختص.", duration: "45 min" },
    ],
    nutritionPlan: null,
    files: [
      { id: "f-12", name: "PCOS Hormonal Panel.pdf", type: "Lab Report", size: "1.4 MB", uploadedAt: "Jun 28, 2026", url: null },
    ],
    timeline: [
      { id: "t-30", event: "Assessment Submitted", eventAr: "تم تقديم التقييم",  date: "May 30, 2026", type: "assessment"   },
      { id: "t-31", event: "Consultation Booked",   eventAr: "تم حجز الاستشارة", date: "Jun 5, 2026",  type: "booking"      },
      { id: "t-32", event: "Dietary Guidance",      eventAr: "إرشادات غذائية",   date: "Jul 8, 2026",  type: "consultation" },
    ],
    assessment: { completedDate: "May 30, 2026", score: 55, riskPercentage: 52, diagnosisCategory: "PCOS + Pre-diabetes — Medium Risk", diagnosisCategoryAr: "تكيس المبايض + ما قبل السكري — خطر متوسط" },
  },

  {
    id: "c-008",
    fullName: "Hana Al-Qahtani",
    fullNameAr: "هنا القحطاني",
    gender: "Female",
    age: 33,
    country: "Saudi Arabia",
    countryAr: "المملكة العربية السعودية",
    phone: "+966 5544 8899",
    email: "hana.qahtani@email.com",
    avatarInitials: "HQ",
    avatarGradient: "bg-gradient-to-br from-lavender-purple to-primary-pink",
    assessmentScore: 68,
    riskLevel: "Medium",
    currentPlan: "Weight Management",
    currentPlanAr: "إدارة الوزن",
    lastAppointment: "Jul 5, 2026",
    status: "Active",
    joinedDate: "2026-04-22",
    diagnoses: ["Overweight (BMI 30.2)", "Fatty liver (Grade 1)"],
    diagnosesAr: ["زيادة الوزن (مؤشر كتلة الجسم 30.2)", "الكبد الدهني (الدرجة الأولى)"],
    riskIndicators: [
      { label: "BMI",       labelAr: "مؤشر كتلة الجسم", value: "30.2",      level: "warning"  },
      { label: "ALT",       labelAr: "إنزيم ALT",        value: "52 U/L",    level: "warning"  },
      { label: "Triglycerides",labelAr: "الدهون الثلاثية",value: "185 mg/dL", level: "warning"  },
    ],
    medicalNotes: "Fatty liver Grade 1 — avoid fructose and saturated fats. Liver-supportive foods: cruciferous vegetables, turmeric, coffee.",
    medicalNotesAr: "كبد دهني درجة أولى — تجنب الفركتوز والدهون المشبعة. أغذية داعمة للكبد: خضروات الكرنب، الكركم، القهوة.",
    privateNotes: "Loves cooking — provide recipe adaptations rather than restriction lists.",
    privateNotesAr: "تحب الطبخ — تقديم تعديلات على الوصفات بدلاً من قوائم الحظر.",
    consultations: [
      { id: "cn-12", date: "Jul 5, 2026",  type: "Follow-up",          typeAr: "متابعة",       notes: "Liver enzymes improving. Weight down 2kg.", notesAr: "إنزيمات الكبد تتحسن. انخفاض الوزن 2 كجم.", duration: "45 min" },
      { id: "cn-13", date: "May 3, 2026",  type: "Initial Consultation",typeAr: "استشارة أولية",notes: "Liver health plan and weight management protocol initiated.", notesAr: "بدء خطة صحة الكبد وبروتوكول إدارة الوزن.", duration: "60 min" },
    ],
    nutritionPlan: {
      name: "Liver Health & Weight Loss",
      nameAr: "صحة الكبد وفقدان الوزن",
      startDate: "May 3, 2026",
      endDate: "Nov 3, 2026",
      calories: 1700,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 115, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 165, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 55,  unit: "g" },
      ],
      notes: "Avoid alcohol (implied). No fructose from added sugars. Mediterranean base. Cruciferous vegetables daily.",
      notesAr: "لا سكريات مضافة. قاعدة متوسطية. خضروات الكرنب يومياً.",
    },
    files: [
      { id: "f-13", name: "Liver Ultrasound Report.pdf", type: "Lab Report", size: "1.6 MB", uploadedAt: "Apr 28, 2026", url: null },
    ],
    timeline: [
      { id: "t-33", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Apr 22, 2026", type: "assessment"   },
      { id: "t-34", event: "Consultation Booked",    eventAr: "تم حجز الاستشارة",     date: "Apr 28, 2026", type: "booking"      },
      { id: "t-35", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "May 3, 2026",  type: "consultation" },
      { id: "t-36", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "May 3, 2026",  type: "plan"         },
      { id: "t-37", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Jul 5, 2026",  type: "followup"     },
    ],
    assessment: { completedDate: "Apr 22, 2026", score: 68, riskPercentage: 38, diagnosisCategory: "Metabolic — Medium Risk", diagnosisCategoryAr: "أيضي — خطر متوسط" },
  },

  {
    id: "c-009",
    fullName: "Salma Al-Dosari",
    fullNameAr: "سلمى الدوسري",
    gender: "Female",
    age: 52,
    country: "Qatar",
    countryAr: "قطر",
    phone: "+974 5533 1122",
    email: "salma.dosari@email.com",
    avatarInitials: "SD",
    avatarGradient: "bg-gradient-to-br from-deep-purple to-soft-purple",
    assessmentScore: 29,
    riskLevel: "High",
    currentPlan: "Lipedema Care",
    currentPlanAr: "رعاية الليبيديما",
    lastAppointment: "Jul 9, 2026",
    status: "Active",
    joinedDate: "2026-03-01",
    diagnoses: ["Lipedema Stage III", "Post-menopausal", "Obesity Class II", "Hypothyroidism"],
    diagnosesAr: ["ليبيديما المرحلة الثالثة", "ما بعد انقطاع الطمث", "سمنة الدرجة الثانية", "قصور الغدة الدرقية"],
    riskIndicators: [
      { label: "BMI",          labelAr: "مؤشر كتلة الجسم",     value: "41.0",      level: "critical" },
      { label: "TSH",          labelAr: "هرمون الغدة الدرقية", value: "8.1 mIU/L", level: "critical" },
      { label: "Blood Pressure",labelAr: "ضغط الدم",           value: "148/94",    level: "critical" },
      { label: "Oedema Score", labelAr: "درجة الوذمة",         value: "Grade 3",   level: "critical" },
    ],
    medicalNotes: "Post-menopausal Lipedema Stage III. Levothyroxine 75mcg. Compression therapy ongoing. Coordinating with lymphedema therapist.",
    medicalNotesAr: "ليبيديما مرحلة ثالثة بعد انقطاع الطمث. ليفوثيروكسين 75 ميكروجرام. العلاج بالضغط جارٍ. التنسيق مع معالج الأوعية اللمفاوية.",
    privateNotes: "Has had the condition for 20+ years undiagnosed. Emotionally relieved to have a name for her condition. Move slowly and compassionately.",
    privateNotesAr: "عانت من الحالة لأكثر من 20 عاماً دون تشخيص. تشعر بارتياح عاطفي لإيجاد اسم لحالتها. تعامل معها بتأنٍّ ورحمة.",
    consultations: [
      { id: "cn-14", date: "Jul 9, 2026",  type: "Monthly Review",      typeAr: "مراجعة شهرية",   notes: "Oedema slightly reduced. Thyroid medication review pending.", notesAr: "الوذمة انخفضت قليلاً. مراجعة دواء الغدة الدرقية معلقة.", duration: "60 min" },
      { id: "cn-15", date: "Apr 5, 2026",  type: "Initial Consultation",typeAr: "استشارة أولية",  notes: "Lipedema education provided. Anti-inflammatory ketogenic protocol started.", notesAr: "تقديم تثقيف حول الليبيديما. بدء بروتوكول الكيتو المضاد للالتهابات.", duration: "90 min" },
    ],
    nutritionPlan: {
      name: "Lipedema Ketogenic Protocol",
      nameAr: "بروتوكول الكيتو لليبيديما",
      startDate: "Apr 5, 2026",
      endDate: "Oct 5, 2026",
      calories: 1500,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 110, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 50,  unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 100, unit: "g" },
      ],
      notes: "Therapeutic ketogenic for lipedema. Prioritise omega-3 and anti-inflammatory fats. Avoid phytoestrogens.",
      notesAr: "كيتو علاجي لليبيديما. إعطاء الأولوية لأوميغا 3 والدهون المضادة للالتهابات. تجنب الفيتوإستروجين.",
    },
    files: [
      { id: "f-14", name: "Lymphatic Assessment.pdf",  type: "PDF",        size: "1.8 MB", uploadedAt: "Mar 8, 2026", url: null  },
      { id: "f-15", name: "Thyroid Panel Results.pdf",  type: "Lab Report", size: "0.9 MB", uploadedAt: "Mar 25, 2026", url: null },
      { id: "f-16", name: "Progress Photos Jun.jpg",    type: "Image",      size: "4.1 MB", uploadedAt: "Jun 30, 2026", url: null },
    ],
    timeline: [
      { id: "t-38", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Mar 1, 2026",  type: "assessment"   },
      { id: "t-39", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "Apr 5, 2026",  type: "consultation" },
      { id: "t-40", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "Apr 5, 2026",  type: "plan"         },
      { id: "t-41", event: "Monthly Review",         eventAr: "المراجعة الشهرية",     date: "Jul 9, 2026",  type: "followup"     },
    ],
    assessment: { completedDate: "Mar 1, 2026", score: 29, riskPercentage: 88, diagnosisCategory: "Complex Lipedema — High Risk", diagnosisCategoryAr: "ليبيديما معقدة — خطر مرتفع" },
  },

  {
    id: "c-010",
    fullName: "Yasmin Al-Farsi",
    fullNameAr: "ياسمين الفارسي",
    gender: "Female",
    age: 27,
    country: "Oman",
    countryAr: "عُمان",
    phone: "+968 9900 6677",
    email: "yasmin.alfarsi@email.com",
    avatarInitials: "YF",
    avatarGradient: "bg-gradient-to-br from-soft-pink to-lavender-purple",
    assessmentScore: 79,
    riskLevel: "Low",
    currentPlan: "General Nutrition",
    currentPlanAr: "تغذية عامة",
    lastAppointment: "Apr 10, 2026",
    status: "Inactive",
    joinedDate: "2026-02-01",
    diagnoses: ["Healthy — Inactive"],
    diagnosesAr: ["صحية — غير نشطة"],
    riskIndicators: [
      { label: "BMI",           labelAr: "مؤشر كتلة الجسم", value: "21.5",     level: "normal" },
      { label: "Blood Sugar",   labelAr: "سكر الدم",         value: "85 mg/dL", level: "normal" },
    ],
    medicalNotes: "Was on a general nutrition plan but went inactive. Last contact: April 2026. Reached out via email — no response.",
    medicalNotesAr: "كانت على خطة تغذية عامة لكنها أصبحت غير نشطة. آخر تواصل: أبريل 2026.",
    privateNotes: "May have relocated. Send re-engagement message.",
    privateNotesAr: "ربما انتقلت إلى مكان آخر. إرسال رسالة إعادة تفاعل.",
    consultations: [
      { id: "cn-16", date: "Apr 10, 2026", type: "Follow-up", typeAr: "متابعة", notes: "Good progress noted. Client went unresponsive after this session.", notesAr: "ملاحظة تقدم جيد. العميلة لم تستجب بعد هذه الجلسة.", duration: "40 min" },
    ],
    nutritionPlan: null,
    files: [],
    timeline: [
      { id: "t-42", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",  date: "Feb 1, 2026",  type: "assessment"   },
      { id: "t-43", event: "Initial Consultation",   eventAr: "الاستشارة الأولية", date: "Feb 10, 2026", type: "consultation" },
      { id: "t-44", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",   date: "Apr 10, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Feb 1, 2026", score: 79, riskPercentage: 12, diagnosisCategory: "Healthy — Inactive", diagnosisCategoryAr: "صحية — غير نشطة" },
  },

  {
    id: "c-011",
    fullName: "Aisha Al-Mansoori",
    fullNameAr: "عائشة المنصوري",
    gender: "Female",
    age: 45,
    country: "UAE",
    countryAr: "الإمارات العربية المتحدة",
    phone: "+971 5033 7799",
    email: "aisha.mansoori@email.com",
    avatarInitials: "AM",
    avatarGradient: "bg-gradient-to-br from-primary-pink to-deep-purple",
    assessmentScore: 59,
    riskLevel: "Medium",
    currentPlan: "Diabetes Management",
    currentPlanAr: "إدارة السكري",
    lastAppointment: "Jul 11, 2026",
    status: "Active",
    joinedDate: "2026-06-10",
    diagnoses: ["Type 2 Diabetes (new diagnosis)", "Overweight (BMI 28.8)"],
    diagnosesAr: ["السكري من النوع الثاني (تشخيص حديث)", "زيادة الوزن (مؤشر كتلة الجسم 28.8)"],
    riskIndicators: [
      { label: "HbA1c",         labelAr: "الهيموجلوبين السكري", value: "7.4%",      level: "warning" },
      { label: "Fasting Sugar", labelAr: "سكر الصيام",          value: "138 mg/dL", level: "warning" },
      { label: "BMI",           labelAr: "مؤشر كتلة الجسم",     value: "28.8",      level: "warning" },
    ],
    medicalNotes: "Newly diagnosed T2D. On Metformin 500mg once daily. Diet is first-line intervention. Good candidate for remission with sustained weight loss.",
    medicalNotesAr: "تشخيص حديث بالسكري من النوع الثاني. تتناول ميتفورمين 500 ملغ مرة يومياً. النظام الغذائي هو الخط الأول للعلاج.",
    privateNotes: "Very motivated by the possibility of remission. Engineer — very data-driven. Provide detailed metrics and progress charts.",
    privateNotesAr: "متحفزة جداً بإمكانية الشفاء. مهندسة — تعتمد على البيانات. تقديم مقاييس تفصيلية وجداول تقدم.",
    consultations: [
      { id: "cn-17", date: "Jul 11, 2026", type: "Follow-up",          typeAr: "متابعة",       notes: "Blood sugars trending down. Lost 1.5kg. Excellent compliance.", notesAr: "مستويات السكر تتراجع. فقدت 1.5 كجم. التزام ممتاز.", duration: "50 min" },
      { id: "cn-18", date: "Jun 18, 2026", type: "Initial Consultation",typeAr: "استشارة أولية",notes: "Diabetes remission roadmap explained. Low-carb protocol initiated.", notesAr: "شرح خارطة طريق الشفاء من السكري. بدء بروتوكول منخفض الكربوهيدرات.", duration: "75 min" },
    ],
    nutritionPlan: {
      name: "T2D Remission Protocol",
      nameAr: "بروتوكول شفاء السكري من النوع الثاني",
      startDate: "Jun 18, 2026",
      endDate: "Dec 18, 2026",
      calories: 1650,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 120, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 100, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 75,  unit: "g" },
      ],
      notes: "Low-carb Mediterranean. No refined carbs. 16:8 intermittent fasting optional. Target: HbA1c < 6.5% by Dec 2026.",
      notesAr: "متوسطي منخفض الكربوهيدرات. لا كربوهيدرات مكررة. صيام متقطع 16:8 اختياري. الهدف: HbA1c < 6.5% بحلول ديسمبر 2026.",
    },
    files: [
      { id: "f-17", name: "Initial Diabetes Panel.pdf", type: "Lab Report", size: "1.1 MB", uploadedAt: "Jun 15, 2026", url: null },
    ],
    timeline: [
      { id: "t-45", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Jun 10, 2026", type: "assessment"   },
      { id: "t-46", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "Jun 18, 2026", type: "consultation" },
      { id: "t-47", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "Jun 18, 2026", type: "plan"         },
      { id: "t-48", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Jul 11, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Jun 10, 2026", score: 59, riskPercentage: 48, diagnosisCategory: "T2D New Onset — Medium Risk", diagnosisCategoryAr: "سكري نوع ثانٍ حديث — خطر متوسط" },
  },

  {
    id: "c-012",
    fullName: "Lina Al-Zahrani",
    fullNameAr: "لينا الزهراني",
    gender: "Female",
    age: 30,
    country: "Saudi Arabia",
    countryAr: "المملكة العربية السعودية",
    phone: "+966 5577 3344",
    email: "lina.zahrani@email.com",
    avatarInitials: "LZ",
    avatarGradient: "bg-gradient-to-br from-lavender-purple to-primary-pink",
    assessmentScore: 85,
    riskLevel: "Low",
    currentPlan: "General Nutrition",
    currentPlanAr: "تغذية عامة",
    lastAppointment: "Jun 30, 2026",
    status: "Active",
    joinedDate: "2026-04-15",
    diagnoses: ["IBS (mild)", "Vitamin D deficiency"],
    diagnosesAr: ["متلازمة القولون العصبي (خفيفة)", "نقص فيتامين D"],
    riskIndicators: [
      { label: "BMI",        labelAr: "مؤشر كتلة الجسم", value: "24.3",      level: "normal"  },
      { label: "Vitamin D",  labelAr: "فيتامين D",        value: "18 ng/mL",  level: "warning" },
      { label: "Iron",       labelAr: "الحديد",           value: "72 µg/dL",  level: "normal"  },
    ],
    medicalNotes: "IBS-C type. Increase soluble fibre gradually. Avoid FODMAP triggers: onion, garlic, wheat. Vitamin D3 4000IU supplementation commenced.",
    medicalNotesAr: "قولون عصبي نوع C. زيادة الألياف القابلة للذوبان تدريجياً. تجنب مثيرات FODMAP: البصل، الثوم، القمح.",
    privateNotes: "Works long shifts as a nurse — meal prep convenience is a priority. Quick, portable meals.",
    privateNotesAr: "تعمل فترات طويلة كممرضة — الراحة في تحضير الوجبات أولوية. وجبات سريعة وقابلة للحمل.",
    consultations: [
      { id: "cn-19", date: "Jun 30, 2026", type: "Follow-up",          typeAr: "متابعة",       notes: "IBS symptoms significantly improved. Vitamin D trending up.", notesAr: "تحسن ملحوظ في أعراض القولون العصبي. فيتامين D في تحسن.", duration: "40 min" },
      { id: "cn-20", date: "Apr 22, 2026", type: "Initial Consultation",typeAr: "استشارة أولية",notes: "Low-FODMAP protocol and gut healing plan initiated.", notesAr: "بدء بروتوكول FODMAP المنخفض وخطة علاج الأمعاء.", duration: "60 min" },
    ],
    nutritionPlan: {
      name: "Gut Healing & Vitamin Optimisation",
      nameAr: "علاج الأمعاء وتحسين الفيتامينات",
      startDate: "Apr 22, 2026",
      endDate: "Oct 22, 2026",
      calories: 1850,
      macros: [
        { label: "Protein", labelAr: "بروتين",      value: 105, unit: "g" },
        { label: "Carbs",   labelAr: "كربوهيدرات", value: 220, unit: "g" },
        { label: "Fat",     labelAr: "دهون",        value: 65,  unit: "g" },
      ],
      notes: "Low-FODMAP phase 1 (6 weeks), then reintroduction phase. Bone broth daily. Probiotic: Lactobacillus rhamnosus.",
      notesAr: "مرحلة FODMAP المنخفض 1 (6 أسابيع)، ثم مرحلة إعادة التقديم. مرق العظام يومياً.",
    },
    files: [
      { id: "f-18", name: "Gut Health Panel.pdf",  type: "Lab Report", size: "1.2 MB", uploadedAt: "Apr 18, 2026", url: null },
      { id: "f-19", name: "Vitamin D Results.pdf",  type: "Lab Report", size: "0.7 MB", uploadedAt: "Jun 25, 2026", url: null },
    ],
    timeline: [
      { id: "t-49", event: "Assessment Submitted",  eventAr: "تم تقديم التقييم",     date: "Apr 15, 2026", type: "assessment"   },
      { id: "t-50", event: "Consultation Booked",    eventAr: "تم حجز الاستشارة",     date: "Apr 18, 2026", type: "booking"      },
      { id: "t-51", event: "Initial Consultation",   eventAr: "الاستشارة الأولية",    date: "Apr 22, 2026", type: "consultation" },
      { id: "t-52", event: "Nutrition Plan Created", eventAr: "تم إنشاء خطة التغذية",date: "Apr 22, 2026", type: "plan"         },
      { id: "t-53", event: "Follow-up Completed",    eventAr: "اكتملت المتابعة",      date: "Jun 30, 2026", type: "followup"     },
    ],
    assessment: { completedDate: "Apr 15, 2026", score: 85, riskPercentage: 14, diagnosisCategory: "Digestive Health — Low Risk", diagnosisCategoryAr: "صحة الجهاز الهضمي — خطر منخفض" },
  },
];

// ─── Derived helpers (Supabase-ready aggregation equivalents) ──────────────────

export function getTotalClients(): number {
  return MOCK_CLIENTS.length;
}

export function getNewThisMonth(): number {
  const now = new Date();
  return MOCK_CLIENTS.filter((c) => {
    const d = new Date(c.joinedDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

export function getHighRiskCount(): number {
  return MOCK_CLIENTS.filter((c) => c.riskLevel === "High").length;
}

export function getActivePlanCount(): number {
  return MOCK_CLIENTS.filter((c) => c.status === "Active").length;
}
