/**
 * appointments.repository.ts — SHELAN Admin Portal
 *
 * Thin Supabase wrapper for the appointments table.
 * Falls back to an empty array when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AppointmentRow } from "@/types/database.types";

export type { AppointmentRow as Appointment };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUpcomingAppointments(limit = 20): Promise<AppointmentRow[]> {
  if (!isSupabaseConfigured) return [];
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
  if (!isSupabaseConfigured) return [];
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
  if (!isSupabaseConfigured) return null;
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
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) { console.error("[appointments] updateAppointmentStatus:", error.message); return false; }
  return true;
}
