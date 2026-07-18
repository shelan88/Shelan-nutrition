/**
 * client-files.repository.ts — SHELAN Admin Portal
 *
 * Upload / delete files shared with a client.
 * Files are stored in Supabase Storage under clients/{clientId}/
 * and tracked in the uploaded_files table (with a url column).
 */

import { supabase } from "@/lib/supabase";
import { ensureBucket, MEDIA_BUCKET } from "@/admin/repositories/storage.repository";
import type { UploadedFileRow } from "@/types/database.types";

/**
 * Uploads a file to Supabase Storage, then inserts a row in uploaded_files
 * with the public URL.  Returns the new row on success, null on failure.
 */
export async function uploadClientFile(
  clientId: string,
  file: File,
): Promise<UploadedFileRow | null> {
  await ensureBucket();

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `clients/${clientId}/${Date.now()}_${safe}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    console.error("[client-files] upload:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Derive a simple type label
  const type = file.type.startsWith("image/")
    ? "Image"
    : file.type === "application/pdf"
    ? "PDF"
    : "Document";

  const { data: row, error: dbError } = await supabase
    .from("uploaded_files")
    .insert({
      client_id:   clientId,
      filename:    file.name,
      type,
      size:        file.size,
      url:         publicUrl,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    console.error("[client-files] db insert:", dbError.message);
    // Try to clean up the orphaned storage object
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return null;
  }

  return row as UploadedFileRow;
}

/**
 * Deletes a file from both Supabase Storage (if a URL is known) and
 * the uploaded_files table.
 */
export async function deleteClientFile(
  fileId: string,
  publicUrl: string | null,
): Promise<boolean> {
  // Remove from storage first (best-effort)
  if (publicUrl) {
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const idx    = publicUrl.indexOf(marker);
    const storagePath = idx >= 0 ? publicUrl.slice(idx + marker.length) : null;
    if (storagePath) {
      const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      if (error) console.warn("[client-files] storage remove:", error.message);
    }
  }

  const { error } = await supabase
    .from("uploaded_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    console.error("[client-files] db delete:", error.message);
    return false;
  }
  return true;
}
