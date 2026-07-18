/**
 * portal/repositories/appointments.repository.ts
 * Fetches the authenticated client's own appointments.
 * Matches on both user_id (auth-linked) and client_id (assessment-created).
 */

import { supabase } from "@/lib/supabase";
import type { AppointmentRow } from "@/types/database.types";

export type { AppointmentRow };

export interface PortalAppointment extends AppointmentRow {
  isPast: boolean;
}

export async function getOwnAppointments(
  clientId: string,
): Promise<PortalAppointment[]> {
  // RLS ensures we only see our own rows; client_id filter is an extra guard.
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error) {
    console.error("[portal/appointments] getOwnAppointments:", error.message);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? []).map((row) => ({
    ...(row as AppointmentRow),
    isPast:
      row.status === "completed" ||
      row.status === "cancelled" ||
      new Date(row.date) < today,
  }));
}
