/**
 * consultations.repository.ts — SHELAN Admin Portal
 * Supabase wrapper for the consultations table.
 */
import { supabase } from "@/lib/supabase";
import type { ConsultationRow } from "@/types/database.types";

export type { ConsultationRow as Consultation };

export async function getAllConsultations(): Promise<ConsultationRow[]> {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) { console.error("[consultations] getAllConsultations:", error.message); return []; }
  return data ?? [];
}

export async function getActiveConsultations(): Promise<ConsultationRow[]> {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) { console.error("[consultations] getActiveConsultations:", error.message); return []; }
  return data ?? [];
}

export async function createConsultation(
  row: Omit<ConsultationRow, "id" | "created_at" | "updated_at">,
): Promise<ConsultationRow | null> {
  const { data, error } = await supabase
    .from("consultations")
    .insert(row)
    .select()
    .single();
  if (error) { console.error("[consultations] createConsultation:", error.message); return null; }
  return data;
}

export async function updateConsultation(
  id: string,
  updates: Partial<ConsultationRow>,
): Promise<boolean> {
  const { error } = await supabase.from("consultations").update(updates).eq("id", id);
  if (error) { console.error("[consultations] updateConsultation:", error.message); return false; }
  return true;
}

export async function deleteConsultation(id: string): Promise<boolean> {
  const { error } = await supabase.from("consultations").delete().eq("id", id);
  if (error) { console.error("[consultations] deleteConsultation:", error.message); return false; }
  return true;
}
