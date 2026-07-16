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

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createAppointment(
  appt: Omit<AppointmentRow, "id" | "created_at">,
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
