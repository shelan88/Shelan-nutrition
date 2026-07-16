/**
 * database.types.ts
 *
 * TypeScript type stubs that mirror the SHELAN PostgreSQL schema.
 * Generated manually; regenerate with `supabase gen types typescript` once auth is wired.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Row shapes (snake_case, matching DB columns) ────────────────────────────

export interface ClientRow {
  id: string;
  full_name: string;
  full_name_ar: string | null;
  email: string | null;
  phone: string | null;
  age: number | null;
  gender: "Female" | "Male" | "Other" | null;
  status: "Active" | "Inactive" | "Waiting" | "Completed" | null;
  risk_level: "Low" | "Medium" | "High" | "Critical" | null;
  risk_percentage: number | null;
  occupation: string | null;
  location: string | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  blood_type: string | null;
  medical_conditions: string[] | null;
  allergies: string[] | null;
  medications: string[] | null;
  initials: string | null;
  avatar_color: string | null;
  join_date: string | null;
  last_visit: string | null;
  diagnosis_category: string | null;
  diagnosis_category_ar: string | null;
  notes: string | null;
  notes_ar: string | null;
  consultations: Json | null;       // JSONB array of Consultation
  risk_indicators: Json | null;     // JSONB array of RiskIndicator
  created_at: string;
  updated_at: string;
}

export interface AssessmentRow {
  id: string;
  client_id: string;
  score: number | null;
  risk_level: "Low" | "Medium" | "High" | "Critical" | null;
  risk_percentage: number | null;
  diagnosis_category: string | null;
  diagnosis_category_ar: string | null;
  answers: Json | null;
  submitted_at: string;
  created_at: string;
}

export interface TimelineEventRow {
  id: string;
  client_id: string;
  event: string;
  event_ar: string | null;
  type: "appointment" | "assessment" | "note" | "plan" | "message" | "system" | null;
  date: string;
  created_at: string;
}

export interface NutritionPlanRow {
  id: string;
  client_id: string;
  plan_data: Json;  // full NutritionPlan object serialised as JSON
  created_at: string;
  updated_at: string;
}

export interface UploadedFileRow {
  id: string;
  client_id: string;
  filename: string;
  type: string;
  size: number | null;
  uploaded_at: string;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  date: string;
  time: string | null;
  type: string | null;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | null;
  notes: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  content: string;
  status: "unread" | "read" | "replied" | null;
  source: "website" | "assessment" | "admin" | null;
  created_at: string;
}

export interface BlogPostRow {
  id: string;
  title_en: string;
  title_ar: string | null;
  slug: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: number | null;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonialRow {
  id: string;
  client_name: string;
  client_name_ar: string | null;
  content_en: string;
  content_ar: string | null;
  rating: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaLibraryRow {
  id: string;
  filename: string;
  url: string;
  alt_text: string | null;
  type: "image" | "video" | "document" | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface WebsiteSettingRow {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
}

export interface AdminProfileRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  role: "admin" | "staff" | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Database type map (used by createClient<Database>) ─────────────────────

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: ClientRow;
        Insert: Omit<ClientRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ClientRow>;
      };
      assessments: {
        Row: AssessmentRow;
        Insert: Omit<AssessmentRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AssessmentRow>;
      };
      timeline_events: {
        Row: TimelineEventRow;
        Insert: Omit<TimelineEventRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<TimelineEventRow>;
      };
      nutrition_plans: {
        Row: NutritionPlanRow;
        Insert: Omit<NutritionPlanRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<NutritionPlanRow>;
      };
      uploaded_files: {
        Row: UploadedFileRow;
        Insert: Omit<UploadedFileRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<UploadedFileRow>;
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Omit<AppointmentRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AppointmentRow>;
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MessageRow>;
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: Omit<BlogPostRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BlogPostRow>;
      };
      services: {
        Row: ServiceRow;
        Insert: Omit<ServiceRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ServiceRow>;
      };
      testimonials: {
        Row: TestimonialRow;
        Insert: Omit<TestimonialRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TestimonialRow>;
      };
      media_library: {
        Row: MediaLibraryRow;
        Insert: Omit<MediaLibraryRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MediaLibraryRow>;
      };
      website_settings: {
        Row: WebsiteSettingRow;
        Insert: Omit<WebsiteSettingRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<WebsiteSettingRow>;
      };
      admin_profiles: {
        Row: AdminProfileRow;
        Insert: Omit<AdminProfileRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AdminProfileRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
