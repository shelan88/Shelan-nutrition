/**
 * upload.service.ts — SHELAN unified upload service
 *
 * Single source of truth for all Supabase Storage uploads.
 * Features: validation, canvas-based image compression, simulated progress,
 *           automatic retry with exponential back-off (default 3 attempts).
 *
 * RULE: No other file in this project may call
 *       supabase.storage.from(...).upload() directly.
 *       All uploads must go through uploadToStorage().
 */

import { supabase } from "@/lib/supabase";
import type { UploadOptions, UploadResult } from "./upload.types";

export const MEDIA_BUCKET = "media";

// ── Internal helpers ───────────────────────────────────────────────────────────

function mimeMatches(mime: string, pattern: string): boolean {
  if (pattern === "*/*" || pattern === "*") return true;
  if (pattern.endsWith("/*")) return mime.startsWith(pattern.slice(0, -1));
  return mime === pattern;
}

function validateFile(
  file: File,
  maxSizeMb: number,
  allowedTypes?: string[],
): string | null {
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File is too large (max ${maxSizeMb} MB)`;
  }
  if (allowedTypes && allowedTypes.length > 0) {
    const ok = allowedTypes.some((p) => mimeMatches(file.type, p));
    if (!ok) return `File type "${file.type}" is not allowed`;
  }
  return null;
}

/**
 * Compresses an image using a canvas if it exceeds maxWidthPx.
 * Returns the original file unchanged for non-images or on any error.
 */
async function compressImage(
  file: File,
  maxWidthPx: number,
  quality: number,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      if (img.width <= maxWidthPx) { resolve(file); return; }
      const scale = maxWidthPx / img.width;
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

/**
 * Drives onProgress from 0 → 90% while the upload is in flight.
 * Returns a stop function — call it once the upload completes.
 */
function simulateProgress(onProgress: (pct: number) => void): () => void {
  let pct = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const inc = pct < 30 ? 7 : pct < 60 ? 4 : pct < 80 ? 2 : 0.6;
    pct = Math.min(90, pct + inc);
    onProgress(Math.round(pct));
    if (pct < 90) setTimeout(tick, 120);
  };
  setTimeout(tick, 60);
  return () => { stopped = true; };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage.
 * Handles validation, optional compression, progress reporting, and retry.
 */
export async function uploadToStorage(
  file: File,
  options: UploadOptions,
): Promise<UploadResult> {
  const {
    bucket       = MEDIA_BUCKET,
    path,
    upsert       = false,
    cacheControl  = "3600",
    maxSizeMb    = 50,
    allowedTypes,
    compress     = false,
    maxWidthPx   = 1400,
    quality      = 0.85,
    onProgress,
    maxAttempts  = 3,
  } = options;

  // 1. Validate
  const validationErr = validateFile(file, maxSizeMb, allowedTypes);
  if (validationErr) return { url: null, path: null, error: validationErr };

  // 2. Optionally compress
  const fileToUpload = compress && file.type.startsWith("image/")
    ? await compressImage(file, maxWidthPx, quality)
    : file;

  // 3. Start simulated progress
  const stopProgress = onProgress ? simulateProgress(onProgress) : null;

  // 4. Upload with retry
  let lastError = "Upload failed";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        upsert,
        contentType:  fileToUpload.type || "application/octet-stream",
        cacheControl,
      });

    if (!uploadErr) {
      stopProgress?.();
      onProgress?.(100);
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: urlData.publicUrl, path, error: null };
    }

    lastError = uploadErr.message;
    console.error(`[upload] attempt ${attempt + 1}/${maxAttempts} failed:`, uploadErr.message);
    const isFatal = uploadErr.message.includes("already exists") ||
                    uploadErr.message.includes("Duplicate");
    if (isFatal) break;
  }

  stopProgress?.();
  onProgress?.(0);
  return { url: null, path: null, error: lastError };
}

// ── Shared utilities ───────────────────────────────────────────────────────────

/**
 * Extracts the Supabase Storage path from a public URL.
 * Canonical single copy — do NOT duplicate this in repositories.
 *
 * "https://…/storage/v1/object/public/media/avatars/123/avatar.jpg"
 *   → "avatars/123/avatar.jpg"
 */
export function storagePathFromUrl(
  publicUrl: string | null | undefined,
  bucket = MEDIA_BUCKET,
): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx < 0 ? null : publicUrl.slice(idx + marker.length);
}

/**
 * Deletes a file from Supabase Storage given its public URL.
 * Best-effort: logs a warning but does not throw.
 * Canonical single copy — do NOT duplicate this in repositories.
 */
export async function deleteFromStorage(
  publicUrl: string | null | undefined,
  bucket = MEDIA_BUCKET,
): Promise<void> {
  const p = storagePathFromUrl(publicUrl, bucket);
  if (!p) return;
  const { error } = await supabase.storage.from(bucket).remove([p]);
  if (error) console.warn("[upload] deleteFromStorage:", error.message);
}

/** Sanitises a filename so it is safe for use in a storage path. */
export function safeName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Builds a timestamped storage path: `{folder}/{timestamp}_{safename}`. */
export function buildPath(folder: string, filename: string): string {
  return `${folder}/${Date.now()}_${safeName(filename)}`;
}
