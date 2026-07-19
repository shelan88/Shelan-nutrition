/**
 * storage.repository.ts — SHELAN Admin Portal
 *
 * Generic media library uploads and management.
 * Storage uploads now go through the unified upload service.
 * The storagePathFromUrl / deleteFromStorage utilities are canonical
 * in @/lib/upload — do NOT add inline implementations here.
 */
import { supabase } from "@/lib/supabase";
import { uploadToStorage, deleteFromStorage, buildPath } from "@/lib/upload";
import type { MediaLibraryRow } from "@/types/database.types";

export const MEDIA_BUCKET = "media";

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  folder = "uploads",
): Promise<MediaLibraryRow | null> {
  const path = buildPath(folder, file.name);

  const { url: publicUrl, error: uploadError } = await uploadToStorage(file, {
    path,
    upsert: false,
    maxSizeMb: 50,
    allowedTypes: ["image/*", "application/pdf", "video/*"],
  });

  if (uploadError || !publicUrl) {
    console.error("[storage] uploadFile:", uploadError);
    return null;
  }

  const fileType: MediaLibraryRow["type"] =
    file.type.startsWith("image/")    ? "image"
    : file.type === "application/pdf" ? "document"
    : file.type.startsWith("video/")  ? "video"
    : "document";

  const { data: row, error: dbError } = await supabase
    .from("media_library")
    .insert({
      filename: file.name,
      url:      publicUrl,
      alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      type:     fileType,
      size:     file.size,
    })
    .select()
    .single();

  if (dbError) {
    console.error("[storage] media_library insert:", dbError.message);
    return null;
  }

  return row;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteMediaFile(id: string, url: string): Promise<boolean> {
  await deleteFromStorage(url);

  const { error } = await supabase.from("media_library").delete().eq("id", id);
  if (error) { console.error("[storage] delete media_library:", error.message); return false; }
  return true;
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function getMediaLibrary(
  type?: MediaLibraryRow["type"],
): Promise<MediaLibraryRow[]> {
  let q = supabase.from("media_library").select("*").order("created_at", { ascending: false });
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) { console.error("[storage] getMediaLibrary:", error.message); return []; }
  return data ?? [];
}
