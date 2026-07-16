/**
 * success_stories.repository.ts — SHELAN Admin Portal
 * Supabase wrapper for the success_stories table.
 */
import { supabase } from "@/lib/supabase";
import type { SuccessStoryRow } from "@/types/database.types";

export type { SuccessStoryRow as SuccessStory };

export async function getAllStories(): Promise<SuccessStoryRow[]> {
  const { data, error } = await supabase
    .from("success_stories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) { console.error("[success_stories] getAllStories:", error.message); return []; }
  return data ?? [];
}

export async function getPublishedStories(): Promise<SuccessStoryRow[]> {
  const { data, error } = await supabase
    .from("success_stories")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) { console.error("[success_stories] getPublishedStories:", error.message); return []; }
  return data ?? [];
}

export async function createStory(
  story: Omit<SuccessStoryRow, "id" | "created_at" | "updated_at">,
): Promise<SuccessStoryRow | null> {
  const { data, error } = await supabase.from("success_stories").insert(story).select().single();
  if (error) { console.error("[success_stories] createStory:", error.message); return null; }
  return data;
}

export async function updateStory(
  id: string,
  updates: Partial<SuccessStoryRow>,
): Promise<boolean> {
  const { error } = await supabase.from("success_stories").update(updates).eq("id", id);
  if (error) { console.error("[success_stories] updateStory:", error.message); return false; }
  return true;
}

export async function deleteStory(id: string): Promise<boolean> {
  const { error } = await supabase.from("success_stories").delete().eq("id", id);
  if (error) { console.error("[success_stories] deleteStory:", error.message); return false; }
  return true;
}
