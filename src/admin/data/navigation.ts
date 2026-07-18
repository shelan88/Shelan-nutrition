/**
 * Admin portal navigation configuration.
 *
 * Each item declares its icon by name (resolved at render time in NavigationItem).
 * Groups map to labeled sections in the sidebar.
 */

export type NavGroup = "main" | "content" | "business" | "insights" | "system";

export interface NavItem {
  id: string;
  label: string;
  labelAr: string;
  href: string;
  iconName: string;   // lucide-react icon name
  group: NavGroup;
  badge?: string;     // optional notification count label
  exact?: boolean;    // use exact match for active state
}

export const NAV_GROUP_LABELS: Record<NavGroup, { en: string; ar: string }> = {
  main:     { en: "",          ar: "" },
  content:  { en: "Content",   ar: "المحتوى" },
  business: { en: "Business",  ar: "الأعمال" },
  insights: { en: "Insights",  ar: "التحليلات" },
  system:   { en: "System",    ar: "النظام" },
};

export const NAV_ITEMS: NavItem[] = [
  // ── Main ──────────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    labelAr: "لوحة التحكم",
    href: "/admin",
    iconName: "LayoutDashboard",
    group: "main",
    exact: true,
  },

  // ── Content ────────────────────────────────────────────────────────────────
  {
    id: "website-builder",
    label: "Website Settings",
    labelAr: "إعدادات الموقع",
    href: "/admin/website-builder",
    iconName: "Globe",
    group: "content",
  },
  {
    id: "social-media",
    label: "Social Media",
    labelAr: "التواصل الاجتماعي",
    href: "/admin/social-media",
    iconName: "Share2",
    group: "content",
  },
  {
    id: "services",
    label: "Services",
    labelAr: "الخدمات",
    href: "/admin/services",
    iconName: "Briefcase",
    group: "content",
  },
  {
    id: "blog",
    label: "Blog",
    labelAr: "المدونة",
    href: "/admin/blog",
    iconName: "BookOpen",
    group: "content",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    labelAr: "الشهادات",
    href: "/admin/testimonials",
    iconName: "Star",
    group: "content",
  },
  {
    id: "programs",
    label: "Programs",
    labelAr: "البرامج",
    href: "/admin/programs",
    iconName: "Target",
    group: "content",
  },
  {
    id: "faqs",
    label: "FAQs",
    labelAr: "الأسئلة الشائعة",
    href: "/admin/faqs",
    iconName: "HelpCircle",
    group: "content",
  },
  {
    id: "success-stories",
    label: "Success Stories",
    labelAr: "قصص النجاح",
    href: "/admin/success-stories",
    iconName: "Trophy",
    group: "content",
  },
  {
    id: "media-library",
    label: "Media Library",
    labelAr: "مكتبة الوسائط",
    href: "/admin/media-library",
    iconName: "Image",
    group: "content",
  },
  {
    id: "assessment-templates",
    label: "Assessments",
    labelAr: "نماذج التقييم",
    href: "/admin/assessment-templates",
    iconName: "ClipboardList",
    group: "content",
  },
  {
    id: "question-library",
    label: "Question Library",
    labelAr: "مكتبة الأسئلة",
    href: "/admin/question-library",
    iconName: "BookOpen",
    group: "content",
  },

  // ── Business ───────────────────────────────────────────────────────────────
  {
    id: "bookings",
    label: "Bookings",
    labelAr: "الحجوزات",
    href: "/admin/bookings",
    iconName: "Calendar",
    group: "business",
  },
  {
    id: "clients",
    label: "Clients",
    labelAr: "العملاء",
    href: "/admin/clients",
    iconName: "Users",
    group: "business",
  },
  {
    id: "payments",
    label: "Payments",
    labelAr: "المدفوعات",
    href: "/admin/payments",
    iconName: "CreditCard",
    group: "business",
  },
  {
    id: "messages",
    label: "Messages",
    labelAr: "الرسائل",
    href: "/admin/messages",
    iconName: "MessageSquare",
    group: "business",
    badge: "3",
  },

  // ── Insights ───────────────────────────────────────────────────────────────
  {
    id: "analytics",
    label: "Analytics",
    labelAr: "التحليلات",
    href: "/admin/analytics",
    iconName: "BarChart3",
    group: "insights",
  },
  {
    id: "seo",
    label: "SEO",
    labelAr: "تحسين البحث",
    href: "/admin/seo",
    iconName: "TrendingUp",
    group: "insights",
  },

  // ── System ─────────────────────────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    labelAr: "الإعدادات",
    href: "/admin/settings",
    iconName: "Settings2",
    group: "system",
  },
];

/**
 * Page metadata for placeholder pages — title, description, and illustration type.
 * Keyed by navItem id.
 */
export interface PageMeta {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  illustrationVariant: string;
}

export const PAGE_META: Record<string, PageMeta> = {
  dashboard: {
    title: "Dashboard",
    titleAr: "لوحة التحكم",
    description: "Your practice at a glance — metrics, recent activity, and quick actions.",
    descriptionAr: "نظرة عامة على عيادتك — المقاييس والنشاط الأخير والإجراءات السريعة.",
    illustrationVariant: "dashboard",
  },
  "website-builder": {
    title: "Website Settings",
    titleAr: "إعدادات الموقع",
    description: "Edit your public website content — hero, about, contact, and social media.",
    descriptionAr: "تعديل محتوى موقعك العام — الرئيسية، من أنا، التواصل، والتواصل الاجتماعي.",
    illustrationVariant: "builder",
  },
  services: {
    title: "Services",
    titleAr: "الخدمات",
    description: "Create, edit, and manage the nutrition services and packages you offer to clients.",
    descriptionAr: "إنشاء وتعديل وإدارة خدمات وحزم التغذية التي تقدمها للعملاء.",
    illustrationVariant: "services",
  },
  "assessment-templates": {
    title: "Assessment Templates",
    titleAr: "قوالب التقييم",
    description: "Design and manage dynamic health questionnaires that power the client assessment flow.",
    descriptionAr: "تصميم وإدارة استبيانات الصحة الديناميكية التي تشغّل تدفق تقييم العملاء.",
    illustrationVariant: "assessment",
  },
  blog: {
    title: "Blog",
    titleAr: "المدونة",
    description: "Write, schedule, and publish articles on nutrition, lipedema care, and holistic wellness.",
    descriptionAr: "كتابة وجدولة ونشر مقالات حول التغذية ورعاية الليبيديما والعافية الشاملة.",
    illustrationVariant: "blog",
  },
  testimonials: {
    title: "Testimonials",
    titleAr: "الشهادات",
    description: "Curate and showcase client success stories and reviews on your public website.",
    descriptionAr: "تنظيم وعرض قصص نجاح العملاء والمراجعات على موقعك العام.",
    illustrationVariant: "testimonials",
  },
  programs: {
    title: "Programs",
    titleAr: "البرامج",
    description: "Create and manage your nutrition programs, packages, and featured offerings.",
    descriptionAr: "إنشاء وإدارة برامجك ووحزمك التغذوية.",
    illustrationVariant: "services",
  },
  faqs: {
    title: "FAQs",
    titleAr: "الأسئلة الشائعة",
    description: "Manage frequently asked questions shown on your public website.",
    descriptionAr: "إدارة الأسئلة الشائعة المعروضة على موقعك العام.",
    illustrationVariant: "assessment",
  },
  "success-stories": {
    title: "Success Stories",
    titleAr: "قصص النجاح",
    description: "Showcase client transformations and results on your public website.",
    descriptionAr: "إبراز تحولات ونتائج العملاء على موقعك العام.",
    illustrationVariant: "testimonials",
  },
  "media-library": {
    title: "Media Library",
    titleAr: "مكتبة الوسائط",
    description: "Upload and organise all images, documents, and media files used across the platform.",
    descriptionAr: "تحميل وتنظيم جميع الصور والمستندات وملفات الوسائط المستخدمة عبر المنصة.",
    illustrationVariant: "media",
  },
  bookings: {
    title: "Bookings",
    titleAr: "الحجوزات",
    description: "View, confirm, and manage all client consultation bookings in one place.",
    descriptionAr: "عرض وتأكيد وإدارة جميع حجوزات استشارات العملاء في مكان واحد.",
    illustrationVariant: "calendar",
  },
  clients: {
    title: "Clients",
    titleAr: "العملاء",
    description: "Browse your client list, view profiles, health history, and assessment results.",
    descriptionAr: "تصفح قائمة عملائك وعرض الملفات الشخصية والتاريخ الصحي ونتائج التقييم.",
    illustrationVariant: "clients",
  },
  payments: {
    title: "Payments",
    titleAr: "المدفوعات",
    description: "Track invoices, revenue, and payment history across all your services and packages.",
    descriptionAr: "تتبع الفواتير والإيرادات وسجل المدفوعات عبر جميع خدماتك وحزمك.",
    illustrationVariant: "payments",
  },
  messages: {
    title: "Messages",
    titleAr: "الرسائل",
    description: "Read and respond to client messages, contact form submissions, and inquiries.",
    descriptionAr: "قراءة والرد على رسائل العملاء وإرسالات نموذج الاتصال والاستفسارات.",
    illustrationVariant: "messages",
  },
  "question-library": {
    title: "Question Library",
    titleAr: "مكتبة الأسئلة",
    description: "Manage reusable bilingual questions shared across all assessment templates.",
    descriptionAr: "إدارة الأسئلة ثنائية اللغة القابلة لإعادة الاستخدام عبر جميع قوالب التقييم.",
    illustrationVariant: "assessment",
  },
  analytics: {
    title: "Analytics",
    titleAr: "التحليلات",
    description: "Deep insights into website traffic, booking trends, client retention, and revenue.",
    descriptionAr: "رؤى عميقة حول حركة مرور الموقع واتجاهات الحجوزات والاحتفاظ بالعملاء والإيرادات.",
    illustrationVariant: "analytics",
  },
  seo: {
    title: "SEO",
    titleAr: "تحسين محركات البحث",
    description: "Manage meta tags, Open Graph, sitemaps, and keyword rankings for every page.",
    descriptionAr: "إدارة العلامات الوصفية وOpen Graph وخرائط الموقع وتصنيفات الكلمات الرئيسية لكل صفحة.",
    illustrationVariant: "seo",
  },
  settings: {
    title: "Settings",
    titleAr: "الإعدادات",
    description: "Configure your portal, branding, integrations, team members, and notification preferences.",
    descriptionAr: "تكوين بوابتك والعلامة التجارية والتكاملات وأعضاء الفريق وتفضيلات الإشعارات.",
    illustrationVariant: "settings",
  },
};
