/**
 * Free Guide / Lead Magnet repository.
 *
 * Manages:
 *   • free_guide_settings — single-row admin-controlled config
 *   • lead_emails         — visitor emails collected via the public form
 */
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FreeGuideSettings {
  id:                       string;
  title_en:                 string;
  title_ar:                 string;
  subtitle_en:              string | null;
  subtitle_ar:              string | null;
  description_en:           string | null;
  description_ar:           string | null;
  cta_text_en:              string;
  cta_text_ar:              string;
  pdf_url:                  string | null;
  email_collection_enabled: boolean;
  active:                   boolean;
  created_at:               string;
  updated_at:               string;
}

export interface LeadEmail {
  id:         string;
  email:      string;
  created_at: string;
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** Fetch the single guide-settings row (public — no auth required). */
export async function getGuideSettings(): Promise<FreeGuideSettings | null> {
  const { data, error } = await supabase
    .from("free_guide_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) { console.error("[freeGuide] getGuideSettings:", error.message); return null; }
  return data as FreeGuideSettings | null;
}

/** Update the guide-settings row (admin only). */
export async function updateGuideSettings(
  id: string,
  patch: Partial<Omit<FreeGuideSettings, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase
    .from("free_guide_settings")
    .update(patch)
    .eq("id", id);
  if (error) { console.error("[freeGuide] updateGuideSettings:", error.message); return false; }
  return true;
}

// ── Lead emails ───────────────────────────────────────────────────────────────

/**
 * Save a visitor email after they submit the free-guide form.
 * Uses anon key — no auth required (policy: public_insert_lead_emails).
 */
export async function saveLeadEmail(email: string): Promise<boolean> {
  const { error } = await supabase
    .from("lead_emails")
    .insert({ email: email.trim().toLowerCase() });
  if (error) {
    // Ignore duplicate emails silently — treat as success
    if (error.code === "23505") return true;
    console.error("[freeGuide] saveLeadEmail:", error.message);
    return false;
  }
  return true;
}

/** Fetch all collected lead emails (admin only). */
export async function getLeadEmails(): Promise<LeadEmail[]> {
  const { data, error } = await supabase
    .from("lead_emails")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[freeGuide] getLeadEmails:", error.message); return []; }
  return (data ?? []) as LeadEmail[];
}

/** Delete a single lead email by id (admin only). */
export async function deleteLeadEmail(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("lead_emails")
    .delete()
    .eq("id", id);
  if (error) { console.error("[freeGuide] deleteLeadEmail:", error.message); return false; }
  return true;
}
