/**
 * appointments.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the appointments table.
 */

import { supabase } from "@/lib/supabase";
import type { AppointmentRow } from "@/types/database.types";

export type { AppointmentRow as Appointment };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUpcomingAppointments(limit = 20): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .order("time", { ascending: true })
    .limit(limit);
  if (error) { console.error("[appointments] getUpcomingAppointments:", error.message); return []; }
  return data ?? [];
}

export async function getAllAppointments(): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("date", { ascending: false });
  if (error) { console.error("[appointments] getAllAppointments:", error.message); return []; }
  return data ?? [];
}

export async function getAppointmentById(id: string): Promise<AppointmentRow | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[appointments] getAppointmentById:", error.message); return null; }
  return data;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/** Appointment fields required for creation — assessment columns are optional. */
export type AppointmentInsert = Omit<
  AppointmentRow,
  "id" | "created_at" | "assessment_template_id" | "assessment_response_id" | "assessment_status"
> & {
  assessment_template_id?: string | null;
  assessment_response_id?: string | null;
  assessment_status?: "none" | "awaiting_assessment" | "assessment_submitted" | null;
};

export async function createAppointment(
  appt: AppointmentInsert,
): Promise<AppointmentRow | null> {
  const { data, error } = await supabase
    .from("appointments")
    .insert(appt)
    .select()
    .single();
  if (error) { console.error("[appointments] createAppointment:", error.message); return null; }
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentRow["status"],
): Promise<boolean> {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) { console.error("[appointments] updateAppointmentStatus:", error.message); return false; }
  return true;
}
