/**
 * database.types.ts — SHELAN PostgreSQL schema types
 *
 * Manually maintained; regenerate with `supabase gen types typescript` when needed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Row shapes ────────────────────────────────────────────────────────────────

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
  consultations: Json | null;
  risk_indicators: Json | null;
  created_at: string;
  updated_at: string;
  // ── Client portal columns (added by client_portal migration) ──────────────
  user_id: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;   // "YYYY-MM-DD"
  city: string | null;
  preferred_language: string | null;
  bio: string | null;
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

  // Version tracking — all versions of one logical plan share plan_group_id
  plan_group_id: string;
  version: number;

  // Metadata
  name: string;
  description: string | null;
  start_date: string | null;   // ISO date "YYYY-MM-DD"
  end_date: string | null;     // ISO date
  status: "draft" | "active" | "completed" | "archived";

  // Meals (JSONB keyed by slot name)
  meals: Json;

  // Additional guidance
  water_intake_goal: string | null;
  steps_goal: string | null;
  exercise_recommendations: string | null;
  supplement_recommendations: string | null;
  general_instructions: string | null;

  created_at: string;
  updated_at: string;
}

export interface NutritionPlanFileRow {
  id: string;
  plan_id: string;
  client_id: string;
  filename: string;
  url: string;
  file_type: "pdf" | "image" | "document";
  size: number | null;
  created_at: string;
}

export interface ProgressEntryRow {
  id: string;
  client_id: string;
  entry_date: string;           // "YYYY-MM-DD"

  // Body weight & height
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;           // auto-calculated in UI

  // Circumferences (cm)
  waist_cm: number | null;
  hip_cm: number | null;
  thigh_cm: number | null;
  arm_cm: number | null;
  chest_cm: number | null;

  // Optional body composition
  body_fat_pct: number | null;
  muscle_mass_pct: number | null;
  water_pct: number | null;

  // Goal
  goal_weight_kg: number | null;

  // Notes
  nutritionist_notes: string | null;
  client_notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface ProgressPhotoRow {
  id: string;
  entry_id: string;
  client_id: string;
  photo_type: "front" | "side" | "back";
  url: string;
  created_at: string;
}

export interface UploadedFileRow {
  id: string;
  client_id: string;
  filename: string;
  type: string;
  size: number | null;
  url: string | null;
  uploaded_at: string;
  created_at: string;
}

export interface AppointmentRow {
  id: string;
  client_id: string | null;
  /** auth.users UUID — set when the booking is made by an authenticated user. */
  user_id: string | null;
  client_name: string | null;
  client_email: string | null;
  date: string;
  time: string | null;
  type: string | null;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | null;
  notes: string | null;
  created_at: string;
  // Assessment columns (added by assessment migration)
  assessment_template_id: string | null;
  assessment_response_id: string | null;
  assessment_status: "none" | "awaiting_assessment" | "assessment_submitted" | null;
}

export interface MessageRow {
  id: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  content: string;
  status: "unread" | "read" | "replied" | null;
  source: "website" | "assessment" | "admin" | null;
  archived: boolean;
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
  // Extended columns (added by CMS migration)
  read_time_minutes: number | null;
  category: string | null;
  author_name: string | null;
  author_avatar: string | null;
  details: Json | null; // { accentFrom, accentTo, featured }
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  // Extended columns (added by CMS migration)
  short_description_en: string | null;
  short_description_ar: string | null;
  icon: string | null;
  image_url: string | null;
  slug: string | null;
  details: Json | null; // { accentFrom, accentTo, whoIsItFor, benefits, consultation, faq, cta }
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
  // Extended columns (added by CMS migration)
  avatar_url: string | null;
  role_en: string | null;
  role_ar: string | null;
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

// ── New tables (added by CMS migration) ───────────────────────────────────────

export interface ProgramRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  short_description_en: string | null;
  short_description_ar: string | null;
  full_description_en: string | null;
  full_description_ar: string | null;
  icon: string | null;
  price: number | null;
  duration_weeks: number | null;
  features_en: string[] | null;
  features_ar: string[] | null;
  active: boolean;
  sort_order: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FAQRow {
  id: string;
  question_en: string;
  question_ar: string | null;
  answer_en: string;
  answer_ar: string | null;
  category: string | null;
  sort_order: number | null;
  published: boolean;
  created_at: string;
}

export interface SuccessStoryRow {
  id: string;
  title_en: string | null;
  title_ar: string | null;
  client_name_en: string | null;
  client_name_ar: string | null;
  story_en: string | null;
  story_ar: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  publish_date: string | null;
  published: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// ── Assessment system tables (added by assessment migration) ──────────────────

export interface AssessmentTemplateRow {
  id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type QuestionType =
  | "short_text"
  | "paragraph"
  | "yes_no"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "number"
  | "date"
  | "file_upload"
  | "image_upload"
  | "scale";

export interface TemplateQuestionRow {
  id: string;
  template_id: string;
  type: QuestionType;
  label_en: string;
  label_ar: string | null;
  placeholder_en: string | null;
  placeholder_ar: string | null;
  help_en: string | null;
  help_ar: string | null;
  required: boolean;
  sort_order: number;
  conditional_question_id: string | null;
  conditional_value: string | null;
  enabled: boolean;
  library_question_id: string | null;
  created_at: string;
}

export interface QuestionOptionRow {
  id: string;
  question_id: string;
  label_en: string;
  label_ar: string | null;
  value: string;
  sort_order: number;
  created_at: string;
}

export interface ServiceTemplateAssignmentRow {
  id: string;
  service_id: string;
  template_id: string;
  created_at: string;
}

export interface AssessmentResponseRow {
  id: string;
  appointment_id: string | null;
  template_id: string;
  client_id: string | null;
  user_id: string | null;
  status: "pending" | "in_progress" | "submitted";
  submitted_at: string | null;
  created_at: string;
  // Scoring columns — added by critical-fix migration (assessment unification)
  score: number | null;
  risk_level: string | null;
  risk_percentage: number | null;
  diagnosis_category: string | null;
  diagnosis_category_ar: string | null;
}

export interface ResponseAnswerRow {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_json: Json | null;
  created_at: string;
}

// ─── Database type map ─────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      clients:         { Row: ClientRow;         Insert: Omit<ClientRow,         "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<ClientRow>; };
      assessments:     { Row: AssessmentRow;     Insert: Omit<AssessmentRow,     "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<AssessmentRow>; };
      timeline_events: { Row: TimelineEventRow;  Insert: Omit<TimelineEventRow,  "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<TimelineEventRow>; };
      nutrition_plans: { Row: NutritionPlanRow;  Insert: Omit<NutritionPlanRow,  "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<NutritionPlanRow>; };
      uploaded_files:  { Row: UploadedFileRow;   Insert: Omit<UploadedFileRow,   "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<UploadedFileRow>; };
      appointments:    { Row: AppointmentRow;    Insert: Omit<AppointmentRow,    "id"|"created_at"|"assessment_template_id"|"assessment_response_id"|"assessment_status"> & { id?:string; created_at?:string; assessment_template_id?:string|null; assessment_response_id?:string|null; assessment_status?:"none"|"awaiting_assessment"|"assessment_submitted"|null; }; Update: Partial<AppointmentRow>; };
      messages:        { Row: MessageRow;        Insert: Omit<MessageRow,        "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<MessageRow>; };
      blog_posts:      { Row: BlogPostRow;       Insert: Omit<BlogPostRow,       "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<BlogPostRow>; };
      services:        { Row: ServiceRow;        Insert: Omit<ServiceRow,        "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<ServiceRow>; };
      testimonials:    { Row: TestimonialRow;    Insert: Omit<TestimonialRow,    "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<TestimonialRow>; };
      media_library:   { Row: MediaLibraryRow;   Insert: Omit<MediaLibraryRow,   "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<MediaLibraryRow>; };
      website_settings:{ Row: WebsiteSettingRow; Insert: Omit<WebsiteSettingRow, "id"|"updated_at"> & { id?:string; updated_at?:string; }; Update: Partial<WebsiteSettingRow>; };
      admin_profiles:  { Row: AdminProfileRow;   Insert: Omit<AdminProfileRow,   "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<AdminProfileRow>; };
      programs:                    { Row: ProgramRow;                   Insert: Omit<ProgramRow,                   "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<ProgramRow>; };
      success_stories:             { Row: SuccessStoryRow;              Insert: Omit<SuccessStoryRow,              "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<SuccessStoryRow>; };
      faqs:                        { Row: FAQRow;                       Insert: Omit<FAQRow,                       "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<FAQRow>; };
      assessment_templates:        { Row: AssessmentTemplateRow;        Insert: Omit<AssessmentTemplateRow,        "id"|"created_at"|"updated_at"> & { id?:string; created_at?:string; updated_at?:string; }; Update: Partial<AssessmentTemplateRow>; };
      template_questions:          { Row: TemplateQuestionRow;          Insert: Omit<TemplateQuestionRow,          "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<TemplateQuestionRow>; };
      question_options:            { Row: QuestionOptionRow;            Insert: Omit<QuestionOptionRow,            "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<QuestionOptionRow>; };
      service_template_assignments:{ Row: ServiceTemplateAssignmentRow; Insert: Omit<ServiceTemplateAssignmentRow, "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<ServiceTemplateAssignmentRow>; };
      assessment_responses:        { Row: AssessmentResponseRow;        Insert: Omit<AssessmentResponseRow,        "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<AssessmentResponseRow>; };
      response_answers:            { Row: ResponseAnswerRow;            Insert: Omit<ResponseAnswerRow,            "id"|"created_at"> & { id?:string; created_at?:string; }; Update: Partial<ResponseAnswerRow>; };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
