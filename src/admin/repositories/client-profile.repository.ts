/**
 * client-profile.repository.ts — SHELAN Admin Portal
 *
 * Profile-specific Supabase queries: appointments and assessment responses
 * scoped to a single client, used by ClientProfilePage.
 */
import { supabase } from "@/lib/supabase";
import type { AppointmentRow, AssessmentResponseRow } from "@/types/database.types";

export interface ClientAssessmentResponse extends AssessmentResponseRow {
  template_name_en: string | null;
  template_name_ar: string | null;
}

// ─── Appointments for one client ──────────────────────────────────────────────

export async function getClientAppointments(
  clientId: string,
): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  if (error) {
    console.error("[client-profile] getClientAppointments:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Assessment responses for one client ──────────────────────────────────────

export async function getClientAssessmentResponses(
  clientId: string,
): Promise<ClientAssessmentResponse[]> {
  const { data, error } = await supabase
    .from("assessment_responses")
    .select("*, assessment_templates(name_en, name_ar)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[client-profile] getClientAssessmentResponses:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    template_name_en: row.assessment_templates?.name_en ?? null,
    template_name_ar: row.assessment_templates?.name_ar ?? null,
    assessment_templates: undefined,
  }));
}
