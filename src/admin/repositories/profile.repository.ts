/**
 * profile.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the admin_profiles table.
 * Each admin user has one row linked to a Supabase Auth user_id.
 */

import { supabase } from "@/lib/supabase";
import type { AdminProfileRow } from "@/types/database.types";

export type { AdminProfileRow as AdminProfile };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAdminProfile(id: string): Promise<AdminProfileRow | null> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[profile] getAdminProfile:", error.message); return null; }
  return data;
}

export async function getAllAdminProfiles(): Promise<AdminProfileRow[]> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) { console.error("[profile] getAllAdminProfiles:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createAdminProfile(
  profile: Omit<AdminProfileRow, "id" | "created_at" | "updated_at">,
): Promise<AdminProfileRow | null> {
  const { data, error } = await supabase
    .from("admin_profiles")
    .insert(profile)
    .select()
    .single();
  if (error) { console.error("[profile] createAdminProfile:", error.message); return null; }
  return data;
}

export async function updateAdminProfile(
  id: string,
  updates: Partial<AdminProfileRow>,
): Promise<boolean> {
  const { error } = await supabase
    .from("admin_profiles")
    .update(updates)
    .eq("id", id);
  if (error) { console.error("[profile] updateAdminProfile:", error.message); return false; }
  return true;
}
