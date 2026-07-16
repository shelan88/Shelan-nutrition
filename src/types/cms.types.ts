/**
 * CMS Type Definitions
 *
 * These interfaces are intentionally shaped to match future Supabase table rows.
 * When integrating Supabase, the ONLY change needed is in `src/data/*.data.ts` —
 * replace the static export with an async fetch:
 *
 *   const { data } = await supabase
 *     .from('about_page')
 *     .select('*')
 *     .eq('locale', lang)
 *     .single();
 *
 * All section components (`src/sections/**`) and UI primitives (`src/components/ui/**`)
 * remain completely unchanged.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface CMSHero {
  kicker: string;
  headline: string;
  subheadline: string;
  coverImage?: string;
  coverImageAlt?: string;
}

export interface CMSCTABanner {
  kicker: string;
  headline: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

export interface CMSFAQItem {
  question: string;
  answer: string;
}

export interface CMSAuthor {
  name: string;
  avatarUrl: string;
  bio: string;
}

// ─── About page ───────────────────────────────────────────────────────────────

export interface CMSPhilosophyPillar {
  iconName: string; // lucide-react icon name
  title: string;
  description: string;
}

export interface CMSApproachStep {
  number: string;
  title: string;
  description: string;
}

export interface CMSCertification {
  title: string;
  issuer: string;
  year: string;
  iconName: string;
}

export interface CMSTrustReason {
  iconName: string;
  title: string;
  description: string;
  stat?: string;
}

export interface CMSAboutData {
  hero: CMSHero;
  story: {
    kicker: string;
    headline: string;
    paragraphs: string[];
    imageUrl: string;
    imageAlt: string;
  };
  missionVision: {
    kicker: string;
    headline: string;
    missionLabel: string;
    missionText: string;
    visionLabel: string;
    visionText: string;
  };
  philosophy: {
    kicker: string;
    headline: string;
    subtitle: string;
    pillars: CMSPhilosophyPillar[];
  };
  approach: {
    kicker: string;
    headline: string;
    subtitle: string;
    steps: CMSApproachStep[];
  };
  certifications: {
    kicker: string;
    headline: string;
    subtitle: string;
    items: CMSCertification[];
  };
  whyTrust: {
    kicker: string;
    headline: string;
    subtitle: string;
    reasons: CMSTrustReason[];
  };
  cta: CMSCTABanner;
}

// ─── Services page ────────────────────────────────────────────────────────────

export interface CMSConsultationStep {
  title: string;
  description: string;
}

export interface CMSService {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  accentFrom: string; // Tailwind color class e.g. "from-primary-pink"
  accentTo: string;   // Tailwind color class e.g. "to-soft-pink"
  iconName: string;
  fullDescription: string;
  whoIsItFor: {
    headline: string;
    description: string;
    points: string[];
  };
  benefits: {
    headline: string;
    items: string[];
  };
  consultation: {
    headline: string;
    steps: CMSConsultationStep[];
  };
  faq: CMSFAQItem[];
  cta: {
    headline: string;
    description: string;
    buttonLabel: string;
  };
}

export interface CMSServicesData {
  hero: CMSHero;
  services: CMSService[];
}

// ─── Blog page ────────────────────────────────────────────────────────────────

export interface CMSArticleSection {
  type: "heading2" | "heading3" | "paragraph" | "list" | "quote" | "image";
  content: string;
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
}

export interface CMSBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  accentFrom: string;
  accentTo: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string; // ISO date string
  author: CMSAuthor;
  featured: boolean;
  tags: string[];
  body?: CMSArticleSection[];
  relatedSlugs?: string[];
}

export interface CMSBlogData {
  hero: CMSHero;
  categories: string[];
  posts: CMSBlogPost[];
}

// ─── Contact page ─────────────────────────────────────────────────────────────

export interface CMSBusinessHour {
  day: string;
  hours: string;
  closed?: boolean;
}

export interface CMSContactData {
  hero: CMSHero;
  info: {
    whatsappNumber: string;
    whatsappLabel: string;
    email: string;
    locationName: string;
    locationDescription: string;
    mapEmbedUrl: string;
    hours: CMSBusinessHour[];
  };
}

// ─── Assessment page ──────────────────────────────────────────────────────────

export type CMSAssessmentQuestionType =
  | "text"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "range"
  | "selection_cards";

export interface CMSAssessmentOption {
  value: string;
  label: string;
  description?: string;
  iconName?: string; // lucide-react icon name
}

/**
 * Conditional visibility: the question is shown only when another question's
 * answer matches the specified value(s). Supports both single and multi answers.
 */
export interface CMSAssessmentConditional {
  questionId: string;
  value: string | string[];
}

/**
 * CMSAssessmentQuestion — fully dynamic question schema.
 *
 * The wizard renders questions by filtering on `stepId` and sorting by `order`.
 * To connect an admin dashboard: swap the static data file for a Supabase
 * select, e.g.:
 *   supabase.from('assessment_questions').select('*').eq('locale', lang).order('order')
 *
 * All fields except `id`, `stepId`, `category`, `title`, `type`, `required`,
 * and `order` are optional so the admin can add new question types gracefully.
 */
export interface CMSAssessmentQuestion {
  id: string;
  stepId: string;
  category: string;
  title: string;
  description?: string;
  type: CMSAssessmentQuestionType;
  options?: CMSAssessmentOption[];
  required: boolean;
  order: number;
  placeholder?: string;
  unit?: string; // e.g. "cm", "kg", "hours"
  rangeMin?: number;
  rangeMax?: number;
  rangeStep?: number;
  rangeLabels?: [string, string]; // [minLabel, maxLabel]
  inputType?: string; // e.g. "email" | "tel" for text fields
  conditional?: CMSAssessmentConditional;
}

export interface CMSAssessmentStep {
  id: string;
  title: string;
  description?: string;
  iconName?: string; // lucide-react icon name
  order: number;
}

export interface CMSAssessmentData {
  welcome: {
    kicker: string;
    headline: string;
    subheadline: string;
    estimatedTime: string;
    estimatedTimeLabel: string;
    startLabel: string;
  };
  steps: CMSAssessmentStep[];
  questions: CMSAssessmentQuestion[];
  summary: {
    headline: string;
    description: string;
    editLabel: string;
    submitLabel: string;
    noneSelectedLabel: string;
  };
  submission: {
    kicker: string;
    headline: string;
    description: string;
    primaryCTA: string;
    primaryHref: string;
    secondaryCTA: string;
    secondaryHref: string;
  };
}

// ─── Booking page ─────────────────────────────────────────────────────────────

export interface CMSBookingService {
  id: string;
  name: string;
  duration: string;
  price: string;
  priceNote: string;
  description: string;
  iconName: string;
}

export interface CMSTimeSlot {
  time: string;
  available: boolean;
}

export interface CMSBookingData {
  hero: CMSHero;
  services: CMSBookingService[];
  timeSlots: CMSTimeSlot[];
  paymentNote: string;
  confirmButtonLabel: string;
  successMessage: string;
}
