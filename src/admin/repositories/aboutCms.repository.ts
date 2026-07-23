/**
 * About page CMS repository.
 *
 * Covers:
 *   • about_qualifications   — credential/qualification bullet items
 *   • about_expertise        — area of expertise bullet items
 *   • about_certifications   — certification logo/initials cards
 *   • about_certifications_settings — section-level config (single row)
 */
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QualificationRow {
  id:         string;
  text_en:    string;
  text_ar:    string;
  active:     boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExpertiseRow {
  id:         string;
  text_en:    string;
  text_ar:    string;
  active:     boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationRow {
  id:           string;
  title_en:     string;
  title_ar:     string;
  subtitle_en:  string | null;
  subtitle_ar:  string | null;
  logo_url:     string | null;
  initials:     string | null;
  display_mode: "logo" | "initials";
  active:       boolean;
  sort_order:   number;
  created_at:   string;
  updated_at:   string;
}

export interface CertSettingsRow {
  id:             string;
  visible:        boolean;
  heading_en:     string;
  heading_ar:     string;
  description_en: string | null;
  description_ar: string | null;
  bg_color:       string;
  note_en:        string | null;
  note_ar:        string | null;
  created_at:     string;
  updated_at:     string;
}

// ── Qualifications ────────────────────────────────────────────────────────────

export async function getQualifications(): Promise<QualificationRow[]> {
  const { data, error } = await supabase
    .from("about_qualifications")
    .select("*")
    .order("sort_order");
  if (error) { console.error("[aboutCms] getQualifications:", error.message); return []; }
  return (data ?? []) as QualificationRow[];
}

export async function getActiveQualifications(): Promise<QualificationRow[]> {
  const { data, error } = await supabase
    .from("about_qualifications")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) { console.error("[aboutCms] getActiveQualifications:", error.message); return []; }
  return (data ?? []) as QualificationRow[];
}

export async function createQualification(
  patch: Pick<QualificationRow, "text_en" | "text_ar" | "active" | "sort_order">
): Promise<QualificationRow | null> {
  const { data, error } = await supabase
    .from("about_qualifications")
    .insert(patch)
    .select()
    .single();
  if (error) { console.error("[aboutCms] createQualification:", error.message); return null; }
  return data as QualificationRow;
}

export async function updateQualification(
  id: string,
  patch: Partial<Omit<QualificationRow, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase.from("about_qualifications").update(patch).eq("id", id);
  if (error) { console.error("[aboutCms] updateQualification:", error.message); return false; }
  return true;
}

export async function deleteQualification(id: string): Promise<boolean> {
  const { error } = await supabase.from("about_qualifications").delete().eq("id", id);
  if (error) { console.error("[aboutCms] deleteQualification:", error.message); return false; }
  return true;
}

export async function reorderQualifications(
  items: Array<{ id: string; sort_order: number }>
): Promise<void> {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("about_qualifications").update({ sort_order }).eq("id", id)
    )
  );
}

// ── Expertise ─────────────────────────────────────────────────────────────────

export async function getExpertise(): Promise<ExpertiseRow[]> {
  const { data, error } = await supabase
    .from("about_expertise")
    .select("*")
    .order("sort_order");
  if (error) { console.error("[aboutCms] getExpertise:", error.message); return []; }
  return (data ?? []) as ExpertiseRow[];
}

export async function getActiveExpertise(): Promise<ExpertiseRow[]> {
  const { data, error } = await supabase
    .from("about_expertise")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) { console.error("[aboutCms] getActiveExpertise:", error.message); return []; }
  return (data ?? []) as ExpertiseRow[];
}

export async function createExpertise(
  patch: Pick<ExpertiseRow, "text_en" | "text_ar" | "active" | "sort_order">
): Promise<ExpertiseRow | null> {
  const { data, error } = await supabase
    .from("about_expertise")
    .insert(patch)
    .select()
    .single();
  if (error) { console.error("[aboutCms] createExpertise:", error.message); return null; }
  return data as ExpertiseRow;
}

export async function updateExpertise(
  id: string,
  patch: Partial<Omit<ExpertiseRow, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase.from("about_expertise").update(patch).eq("id", id);
  if (error) { console.error("[aboutCms] updateExpertise:", error.message); return false; }
  return true;
}

export async function deleteExpertise(id: string): Promise<boolean> {
  const { error } = await supabase.from("about_expertise").delete().eq("id", id);
  if (error) { console.error("[aboutCms] deleteExpertise:", error.message); return false; }
  return true;
}

export async function reorderExpertise(
  items: Array<{ id: string; sort_order: number }>
): Promise<void> {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("about_expertise").update({ sort_order }).eq("id", id)
    )
  );
}

// ── Certifications ────────────────────────────────────────────────────────────

export async function getCertifications(): Promise<CertificationRow[]> {
  const { data, error } = await supabase
    .from("about_certifications")
    .select("*")
    .order("sort_order");
  if (error) { console.error("[aboutCms] getCertifications:", error.message); return []; }
  return (data ?? []) as CertificationRow[];
}

export async function getActiveCertifications(): Promise<CertificationRow[]> {
  const { data, error } = await supabase
    .from("about_certifications")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) { console.error("[aboutCms] getActiveCertifications:", error.message); return []; }
  return (data ?? []) as CertificationRow[];
}

export async function createCertification(
  patch: Omit<CertificationRow, "id" | "created_at" | "updated_at">
): Promise<CertificationRow | null> {
  const { data, error } = await supabase
    .from("about_certifications")
    .insert(patch)
    .select()
    .single();
  if (error) { console.error("[aboutCms] createCertification:", error.message); return null; }
  return data as CertificationRow;
}

export async function updateCertification(
  id: string,
  patch: Partial<Omit<CertificationRow, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase.from("about_certifications").update(patch).eq("id", id);
  if (error) { console.error("[aboutCms] updateCertification:", error.message); return false; }
  return true;
}

export async function deleteCertification(id: string): Promise<boolean> {
  const { error } = await supabase.from("about_certifications").delete().eq("id", id);
  if (error) { console.error("[aboutCms] deleteCertification:", error.message); return false; }
  return true;
}

export async function reorderCertifications(
  items: Array<{ id: string; sort_order: number }>
): Promise<void> {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("about_certifications").update({ sort_order }).eq("id", id)
    )
  );
}

// ── Certification settings ────────────────────────────────────────────────────

export async function getCertSettings(): Promise<CertSettingsRow | null> {
  const { data, error } = await supabase
    .from("about_certifications_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) { console.error("[aboutCms] getCertSettings:", error.message); return null; }
  return data as CertSettingsRow | null;
}

export async function updateCertSettings(
  id: string,
  patch: Partial<Omit<CertSettingsRow, "id" | "created_at" | "updated_at">>
): Promise<boolean> {
  const { error } = await supabase
    .from("about_certifications_settings")
    .update(patch)
    .eq("id", id);
  if (error) { console.error("[aboutCms] updateCertSettings:", error.message); return false; }
  return true;
}

// ── Section settings (qualifications / expertise visibility) ──────────────────

export interface SectionSettingsRow {
  id:          string;
  section_key: "qualifications" | "expertise";
  visible:     boolean;
  created_at:  string;
  updated_at:  string;
}

export async function getSectionSettings(
  key: "qualifications" | "expertise"
): Promise<SectionSettingsRow | null> {
  const { data, error } = await supabase
    .from("about_section_settings")
    .select("*")
    .eq("section_key", key)
    .maybeSingle();
  if (error) { console.error("[aboutCms] getSectionSettings:", error.message); return null; }
  return data as SectionSettingsRow | null;
}

export async function updateSectionVisible(
  key: "qualifications" | "expertise",
  visible: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("about_section_settings")
    .update({ visible })
    .eq("section_key", key);
  if (error) { console.error("[aboutCms] updateSectionVisible:", error.message); return false; }
  return true;
}

// ── Logo upload ───────────────────────────────────────────────────────────────

export async function uploadCertLogo(certId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${certId}.${ext}`;
  const { error } = await supabase.storage
    .from("cert-logos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { console.error("[aboutCms] uploadCertLogo:", error.message); return null; }
  const { data } = supabase.storage.from("cert-logos").getPublicUrl(path);
  return data.publicUrl + `?t=${Date.now()}`;
}

export async function deleteCertLogo(certId: string): Promise<void> {
  // Try all common extensions — if one fails silently we don't care
  const exts = ["png", "jpg", "jpeg", "webp", "svg"];
  await Promise.allSettled(
    exts.map((ext) =>
      supabase.storage.from("cert-logos").remove([`${certId}.${ext}`])
    )
  );
}
