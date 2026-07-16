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
