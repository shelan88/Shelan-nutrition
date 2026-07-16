/**
 * media.repository.ts — SHELAN Admin Portal
 *
 * Supabase wrapper for the media_library table.
 * Stores file metadata; actual binaries go to Supabase Storage.
 */

import { supabase } from "@/lib/supabase";
import type { MediaLibraryRow } from "@/types/database.types";

export type { MediaLibraryRow as MediaItem };

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getMediaLibrary(
  type?: MediaLibraryRow["type"],
): Promise<MediaLibraryRow[]> {
  let query = supabase
    .from("media_library")
    .select("*")
    .order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) { console.error("[media] getMediaLibrary:", error.message); return []; }
  return data ?? [];
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createMediaItem(
  item: Omit<MediaLibraryRow, "id" | "created_at">,
): Promise<MediaLibraryRow | null> {
  const { data, error } = await supabase
    .from("media_library")
    .insert(item)
    .select()
    .single();
  if (error) { console.error("[media] createMediaItem:", error.message); return null; }
  return data;
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  const { error } = await supabase.from("media_library").delete().eq("id", id);
  if (error) { console.error("[media] deleteMediaItem:", error.message); return false; }
  return true;
}
