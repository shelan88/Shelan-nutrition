/**
 * client-files.repository.ts — SHELAN Admin Portal
 *
 * Upload / delete files shared with a client.
 * Files are stored in Supabase Storage under clients/{clientId}/
 * and tracked in the uploaded_files table.
 *
 * Storage operations use the unified upload service from @/lib/upload.
 */

import { supabase } from "@/lib/supabase";
import { uploadToStorage, deleteFromStorage, buildPath } from "@/lib/upload";
import type { UploadedFileRow } from "@/types/database.types";

export async function uploadClientFile(
  clientId: string,
  file: File,
): Promise<UploadedFileRow | null> {
  const path = buildPath(`clients/${clientId}`, file.name);

  const { url: publicUrl, error: uploadError } = await uploadToStorage(file, { path });

  if (uploadError || !publicUrl) {
    console.error("[client-files] upload:", uploadError);
    return null;
  }

  const type = file.type.startsWith("image/")
    ? "Image"
    : file.type === "application/pdf"
    ? "PDF"
    : file.type.startsWith("video/")
    ? "Video"
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
    // Clean up orphaned storage object
    await deleteFromStorage(publicUrl);
    return null;
  }

  return row as UploadedFileRow;
}

export async function deleteClientFile(
  fileId: string,
  publicUrl: string | null,
): Promise<boolean> {
  await deleteFromStorage(publicUrl);

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
