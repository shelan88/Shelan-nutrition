/**
 * services.repository.ts — SHELAN Admin Portal
 *
 * Thin Supabase wrapper for the services table.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ServiceRow } from "@/types/database.types";

export type { ServiceRow as Service };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getActiveServices(): Promise<ServiceRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) { console.error("[services] getActiveServices:", error.message); return []; }
  return data ?? [];
}

export async function getAllServices(): Promise<ServiceRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) { console.error("[services] getAllServices:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createService(
  service: Omit<ServiceRow, "id" | "created_at" | "updated_at">,
): Promise<ServiceRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();
  if (error) { console.error("[services] createService:", error.message); return null; }
  return data;
}

export async function updateService(id: string, updates: Partial<ServiceRow>): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from("services").update(updates).eq("id", id);
  if (error) { console.error("[services] updateService:", error.message); return false; }
  return true;
}

export async function deleteService(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) { console.error("[services] deleteService:", error.message); return false; }
  return true;
}
