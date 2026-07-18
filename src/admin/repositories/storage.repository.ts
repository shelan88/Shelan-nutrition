/**
 * storage.repository.ts — SHELAN Admin Portal
 *
 * Supabase Storage wrapper.
 * Bucket: "media" (public) — created once on first upload if missing.
 *
 * Upload flow:
 *   1. ensureBucket() checks / creates the bucket
 *   2. supabase.storage.from('media').upload(path, file)
 *   3. getPublicUrl(path) → permanent public CDN URL
 *   4. Save URL + metadata to media_library table
 */
import { supabase } from "@/lib/supabase";
import type { MediaLibraryRow } from "@/types/database.types";

export const MEDIA_BUCKET = "media";

// ── Bucket setup ──────────────────────────────────────────────────────────────

let _bucketReady = false;

export async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === MEDIA_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      allowedMimeTypes: ["image/*", "application/pdf", "video/*"],
      fileSizeLimit: 52_428_800, // 50 MB
    });
  }
  _bucketReady = true;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  folder = "uploads",
): Promise<MediaLibraryRow | null> {
  await ensureBucket();

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}_${safe}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    console.error("[storage] upload:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const fileType: MediaLibraryRow["type"] =
    file.type.startsWith("image/")       ? "image"
    : file.type === "application/pdf"    ? "document"
    : file.type.startsWith("video/")     ? "video"
    : "document";

  const { data: row, error: dbError } = await supabase
    .from("media_library")
    .insert({
      filename:  file.name,
      url:       publicUrl,
      alt_text:  file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
      type:      fileType,
      size:      file.size,
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
  // Extract storage path from public URL
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx    = url.indexOf(marker);
  const storagePath = idx >= 0 ? url.slice(idx + marker.length) : null;

  if (storagePath) {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    if (error) console.warn("[storage] remove from bucket:", error.message);
  }

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
