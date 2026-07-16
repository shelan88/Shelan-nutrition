/**
 * programs.repository.ts — SHELAN Admin Portal
 * Supabase wrapper for the programs table.
 */
import { supabase } from "@/lib/supabase";
import type { ProgramRow } from "@/types/database.types";

export type { ProgramRow as Program };

export async function getAllPrograms(): Promise<ProgramRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) { console.error("[programs] getAllPrograms:", error.message); return []; }
  return data ?? [];
}

export async function getActivePrograms(): Promise<ProgramRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) { console.error("[programs] getActivePrograms:", error.message); return []; }
  return data ?? [];
}

export async function createProgram(
  program: Omit<ProgramRow, "id" | "created_at" | "updated_at">,
): Promise<ProgramRow | null> {
  const { data, error } = await supabase
    .from("programs")
    .insert(program)
    .select()
    .single();
  if (error) { console.error("[programs] createProgram:", error.message); return null; }
  return data;
}

export async function updateProgram(
  id: string,
  updates: Partial<ProgramRow>,
): Promise<boolean> {
  const { error } = await supabase.from("programs").update(updates).eq("id", id);
  if (error) { console.error("[programs] updateProgram:", error.message); return false; }
  return true;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) { console.error("[programs] deleteProgram:", error.message); return false; }
  return true;
}
