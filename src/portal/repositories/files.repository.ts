/**
 * portal/repositories/files.repository.ts
 * Lists files shared with the client and generates signed download URLs.
 */

import { supabase } from "@/lib/supabase";
import type { UploadedFileRow } from "@/types/database.types";

export type { UploadedFileRow };

export interface PortalFile extends UploadedFileRow {
  sizeLabel: string;
}

export async function getOwnFiles(clientId: string): Promise<PortalFile[]> {
  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[portal/files] getOwnFiles:", error.message);
    return [];
  }

  return (data ?? []).map((row: UploadedFileRow) => ({
    ...row,
    sizeLabel: row.size
      ? row.size >= 1_048_576
        ? `${(row.size / 1_048_576).toFixed(1)} MB`
        : `${Math.round(row.size / 1024)} KB`
      : "",
  }));
}

/**
 * Generates a short-lived signed URL for a file stored in Supabase Storage.
 * Falls back to the public URL pattern if the path cannot be resolved.
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("[portal/files] getSignedDownloadUrl:", error?.message);
    return null;
  }
  return data.signedUrl;
}

/** Extracts the storage path from a public URL (for uploaded_files without explicit path column). */
export function storagePathFromUrl(publicUrl: string): string | null {
  const marker = "/storage/v1/object/public/media/";
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return publicUrl.slice(idx + marker.length);
}
