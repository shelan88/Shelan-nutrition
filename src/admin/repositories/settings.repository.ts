/**
 * settings.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the website_settings table.
 * Key-value pattern: each setting is a row with a unique key and JSONB value.
 */

import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database.types";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<Json | null> {
  const { data, error } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) { console.error("[settings] getSetting:", error.message); return null; }
  return data?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, Json>> {
  const { data, error } = await supabase
    .from("website_settings")
    .select("key, value");
  if (error) { console.error("[settings] getAllSettings:", error.message); return {}; }
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function setSetting(key: string, value: Json): Promise<boolean> {
  const { error } = await supabase
    .from("website_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) { console.error("[settings] setSetting:", error.message); return false; }
  return true;
}

export async function deleteSetting(key: string): Promise<boolean> {
  const { error } = await supabase
    .from("website_settings")
    .delete()
    .eq("key", key);
  if (error) { console.error("[settings] deleteSetting:", error.message); return false; }
  return true;
}
