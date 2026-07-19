/**
 * upload.service.ts — SHELAN unified upload service
 *
 * Single source of truth for all Supabase Storage uploads.
 * Features: validation, canvas-based image compression, simulated progress,
 *           automatic retry with exponential back-off (default 3 attempts).
 *
 * Samsung Gallery / Android compatibility notes (bugs fixed here):
 *   1. Samsung phones produce HEIC/HEIF files. Their ISO Base Media File Format
 *      header contains an "ftyp" box (same as MP4/MOV) — the MIME sniff must
 *      check the brand bytes to distinguish HEIC from video.
 *   2. "image/jpg" (non-standard) is normalised to "image/jpeg".
 *   3. File.size === 0 is guarded — some Android content URIs resolve late.
 *   4. HEIC/HEIF files are converted to JPEG via createImageBitmap + canvas
 *      before compression/upload so the stored URL is always browser-renderable.
 *      If the browser cannot decode HEIC a clear error is surfaced instead of
 *      silently storing an unrenderable file.
 *
 * RULE: No other file in this project may call
 *       supabase.storage.from(...).upload() directly.
 *       All uploads must go through uploadToStorage().
 */

import { supabase } from "@/lib/supabase";
import type { UploadOptions, UploadResult } from "./upload.types";

export const MEDIA_BUCKET = "media";

// ── Internal helpers ───────────────────────────────────────────────────────────

/**
 * Reads the first 12 bytes of a file and matches known magic-number signatures.
 * Falls back to the file extension when magic numbers are inconclusive.
 * Returns an empty string when neither strategy resolves a type.
 */
async function sniffMimeType(file: File): Promise<string> {
  // Extension → MIME fallback map
  const EXT_MAP: Record<string, string> = {
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    png:  "image/png",
    webp: "image/webp",
    pdf:  "application/pdf",
    gif:  "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
    mp4:  "video/mp4",
    m4v:  "video/mp4",
    mov:  "video/quicktime",
    webm: "video/webm",
  };

  try {
    const headerBytes = await file.slice(0, 12).arrayBuffer();
    const b = new Uint8Array(headerBytes);

    // JPEG: FF D8 FF
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
    // PDF: 25 50 44 46 (%PDF)
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
    // WEBP: RIFF????WEBP
    if (
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    ) return "image/webp";
    // GIF: GIF87a or GIF89a
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
    // WEBM: 1A 45 DF A3 (EBML header)
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
    // ISO Base Media File Format: "ftyp" box at offset 4–7, major brand at 8–11.
    // Used by MP4, MOV, HEIC, HEIF, AVIF — must distinguish by brand.
    if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
      // Build the 4-char brand string from bytes 8–11
      const brand =
        String.fromCharCode(b[8]) +
        String.fromCharCode(b[9]) +
        String.fromCharCode(b[10]) +
        String.fromCharCode(b[11]);

      // HEIC / HEIF brands (Samsung Galaxy, iPhone export)
      // heic = still HEIC, heis = HEIC sequence, mif1 / msf1 = HEIF container
      if (brand === "heic" || brand === "heis" || brand === "mif1" || brand === "msf1") {
        return "image/heic";
      }
      // HEIF brands
      if (brand === "heif" || brand === "MiHE" || brand === "miaf") {
        return "image/heif";
      }
      // AVIF (AV1 Image File Format)
      if (brand === "avif" || brand === "avis") {
        return "image/avif";
      }
      // QuickTime MOV: "qt  "
      if (brand === "qt  ") return "video/quicktime";
      // Everything else (isom, mp41, mp42, M4V , avc1, …) → MP4
      return "video/mp4";
    }
  } catch {
    // If reading fails, fall through to extension lookup
  }

  // Extension-based fallback
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? "";
}

/**
 * Normalises non-standard MIME types produced by Samsung Gallery and
 * other Android pickers so the rest of the pipeline sees canonical values.
 *   "image/jpg" → "image/jpeg"   (Samsung Gallery non-standard)
 */
function normaliseMime(mime: string): string {
  if (mime === "image/jpg") return "image/jpeg";
  return mime;
}

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
  // Guard against zero-byte files — Android content URIs can resolve late and
  // deliver a File with size === 0 before the actual bytes are available.
  if (file.size === 0) {
    return "File appears to be empty. Please try again or choose a different file.";
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File is too large (max ${maxSizeMb} MB)`;
  }
  if (allowedTypes && allowedTypes.length > 0) {
    const ok = allowedTypes.some((p) => mimeMatches(file.type, p));
    if (!ok) return `File type "${file.type}" is not allowed`;
  }
  return null;
}

/** True when the MIME type is a HEIC/HEIF/AVIF container format. */
function isContainerImage(mime: string): boolean {
  return mime === "image/heic" || mime === "image/heif" || mime === "image/avif";
}

/**
 * Compresses an image using a canvas if it exceeds maxWidthPx.
 *
 * HEIC/HEIF/AVIF handling (Samsung Galaxy compatibility):
 *   Chrome's <img> element cannot decode HEIC from a blob: URL, but
 *   createImageBitmap() can on Chrome 64+ / Android.  We try that path first.
 *   If the browser cannot decode the container format at all, we throw a
 *   human-readable error instead of silently storing an unrenderable file.
 *
 * Samsung Browser blob: URL note:
 *   Samsung Internet Browser fails to load blob: URLs in <img>.  We fall back
 *   to createImageBitmap() for all image types when URL.createObjectURL fails.
 *
 * Returns the original file unchanged for non-images.
 */
async function compressImage(
  file: File,
  maxWidthPx: number,
  quality: number,
): Promise<File> {
  console.group("[compressImage] ENTERED — file:", file.name, "size:", file.size, "type:", file.type);

  if (!file.type.startsWith("image/")) {
    console.log("[compressImage] not an image type — returning original unchanged");
    console.groupEnd();
    return file;
  }

  // ── Path 1: HEIC / HEIF / AVIF — use createImageBitmap (Chrome 64+) ────────
  if (isContainerImage(file.type)) {
    console.log("[compressImage] PATH 1 — container format (HEIC/HEIF/AVIF), using createImageBitmap");
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
      console.log("[compressImage] createImageBitmap succeeded — width:", bitmap.width, "height:", bitmap.height);
    } catch (bitmapErr) {
      // Browser cannot decode this container format (e.g. older WebView).
      console.error("[compressImage] createImageBitmap THREW — browser cannot decode format:", bitmapErr);
      console.groupEnd();
      throw new Error(
        "This photo format (HEIC/HEIF) is not supported. " +
        "Please convert it to JPEG or PNG and try again.",
      );
    }

    const targetW = Math.min(bitmap.width, maxWidthPx);
    const scale   = targetW / bitmap.width;
    const canvas  = document.createElement("canvas");
    canvas.width  = targetW;
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("[compressImage] PATH 1 — getContext('2d') returned null — returning original");
      bitmap.close();
      console.groupEnd();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    console.log("[compressImage] PATH 1 — canvas drawn", canvas.width, "x", canvas.height, "— calling toBlob...");

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn("[compressImage] PATH 1 — toBlob returned null blob — returning original");
            console.groupEnd();
            resolve(file);
            return;
          }
          const out = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
          console.log("[compressImage] PATH 1 — toBlob SUCCEEDED — compressed size:", out.size, "bytes");
          console.groupEnd();
          resolve(out);
        },
        "image/jpeg",
        quality,
      );
      // Timeout safety — toBlob should always fire but guard it
      setTimeout(() => {
        console.error("[compressImage] PATH 1 — toBlob TIMED OUT after 15s");
        console.groupEnd();
        reject(new Error("Canvas toBlob timed out"));
      }, 15_000);
    });
  }

  // ── Path 2: Standard JPEG / PNG / WebP — <img> via blob: URL ───────────────
  // Falls back to createImageBitmap if blob: URL fails (Samsung Internet Browser).
  const tryBitmapFallback = async (): Promise<File> => {
    console.log("[compressImage] PATH 2 bitmap-fallback — trying createImageBitmap...");
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
      console.log("[compressImage] PATH 2 bitmap-fallback — createImageBitmap succeeded", bitmap.width, "x", bitmap.height);
    } catch (bitmapErr) {
      console.warn("[compressImage] PATH 2 bitmap-fallback — createImageBitmap THREW, uploading uncompressed:", bitmapErr);
      return file; // give up, upload uncompressed
    }
    const targetW = Math.min(bitmap.width, maxWidthPx);
    if (bitmap.width <= maxWidthPx) {
      console.log("[compressImage] PATH 2 bitmap-fallback — image already <= maxWidthPx, returning original");
      bitmap.close();
      return file;
    }
    const scale   = targetW / bitmap.width;
    const canvas  = document.createElement("canvas");
    canvas.width  = targetW;
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("[compressImage] PATH 2 bitmap-fallback — getContext null, returning original");
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    console.log("[compressImage] PATH 2 bitmap-fallback — canvas drawn, calling toBlob...");
    return new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const out = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
            console.log("[compressImage] PATH 2 bitmap-fallback — toBlob SUCCEEDED, size:", out.size);
            resolve(out);
          } else {
            console.warn("[compressImage] PATH 2 bitmap-fallback — toBlob returned null, returning original");
            resolve(file);
          }
        },
        "image/jpeg",
        quality,
      );
    });
  };

  console.log("[compressImage] PATH 2 — standard image, attempting blob: URL...");
  return new Promise<File>((resolve) => {
    const img    = new Image();
    let blobUrl  = "";
    let settled  = false;

    const settle = (result: File, reason: string) => {
      if (settled) return;
      settled = true;
      console.log("[compressImage] PATH 2 — settle called:", reason, "size:", result.size);
      console.groupEnd();
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ } }
      resolve(result);
    };

    try {
      blobUrl = URL.createObjectURL(file);
      console.log("[compressImage] PATH 2 — createObjectURL succeeded:", blobUrl.slice(0, 50));
    } catch (urlErr) {
      // URL.createObjectURL not available or failed — go straight to bitmap path
      console.warn("[compressImage] PATH 2 — createObjectURL THREW, falling back to bitmap:", urlErr);
      tryBitmapFallback().then(resolve);
      return;
    }

    img.onload = () => {
      console.log("[compressImage] PATH 2 — img.onload fired, naturalWidth:", img.width, "naturalHeight:", img.height);
      if (img.width <= maxWidthPx) {
        settle(file, "img already <= maxWidthPx — no resize needed");
        return;
      }
      const scale  = maxWidthPx / img.width;
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        settle(file, "getContext('2d') returned null");
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log("[compressImage] PATH 2 — canvas drawn", canvas.width, "x", canvas.height, ", calling toBlob...");
      canvas.toBlob(
        (blob) => {
          settle(
            blob
              ? (() => {
                  const out = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
                  console.log("[compressImage] PATH 2 — toBlob SUCCEEDED, compressed size:", out.size);
                  return out;
                })()
              : (() => {
                  console.warn("[compressImage] PATH 2 — toBlob returned null blob");
                  return file;
                })(),
            "toBlob callback resolved",
          );
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      // blob: URL failed to load (Samsung Internet Browser quirk).
      // Try createImageBitmap as a fallback.
      console.warn("[compressImage] PATH 2 — img.onerror fired (blob: URL failed to load), falling back to bitmap path");
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ } blobUrl = ""; }
      settled = true; // prevent double-settle from the outer settle()
      tryBitmapFallback().then((result) => {
        console.log("[compressImage] PATH 2 bitmap-fallback complete, size:", result.size);
        console.groupEnd();
        resolve(result);
      });
    };

    img.src = blobUrl;
    console.log("[compressImage] PATH 2 — set img.src, waiting for onload/onerror...");
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

  // ── DEBUG ──────────────────────────────────────────────────────────────────
  console.group(`[upload] START — "${file.name}"`);
  console.log("[upload] file.size   :", file.size, "bytes (~" + (file.size / 1024 / 1024).toFixed(2) + " MB)");
  console.log("[upload] file.type   :", file.type || "(empty — will sniff)");
  console.log("[upload] bucket      :", bucket);
  console.log("[upload] path        :", path);
  console.log("[upload] maxSizeMb   :", maxSizeMb);
  console.log("[upload] allowedTypes:", allowedTypes ?? "any");
  console.log("[upload] upsert      :", upsert);
  // ───────────────────────────────────────────────────────────────────────────

  // 1. Resolve MIME type — sniff from magic numbers when file.type is absent,
  //    then normalise non-standard variants (e.g. Samsung Gallery's "image/jpg").
  const rawType     = file.type || (await sniffMimeType(file)) || "application/octet-stream";
  const resolvedType = normaliseMime(rawType);
  console.log("[upload] resolvedType:", resolvedType, rawType !== resolvedType ? `(normalised from "${rawType}")` : "");
  if (!file.type) {
    console.info(`[upload] sniffed/resolved MIME type "${resolvedType}" for "${file.name}"`);
  }

  // 2. Build a file with the resolved type for validation + upload.
  //    We always recreate so the correct contentType is sent to Supabase,
  //    even when file.type was already set but non-standard (e.g. "image/jpg").
  const fileForValidation = resolvedType !== file.type
    ? new File([file], file.name, { type: resolvedType })
    : file;

  const validationErr = validateFile(fileForValidation, maxSizeMb, allowedTypes);
  if (validationErr) {
    console.error("[upload] VALIDATION FAILED:", validationErr);
    console.groupEnd();
    return { url: null, path: null, error: validationErr };
  }
  console.log("[upload] validation  : PASSED");

  // 3. Start simulated progress (must come before compress so we can stop it on error)
  const stopProgress = onProgress ? simulateProgress(onProgress) : null;

  // 4. Optionally compress.
  //    compressImage may throw for unsupported container formats (HEIC on old
  //    WebViews) — surface that as a user-visible error rather than crashing.
  let fileToUpload: File;
  if (compress && resolvedType.startsWith("image/")) {
    try {
      fileToUpload = await compressImage(fileForValidation, maxWidthPx, quality);
    } catch (compressErr) {
      const msg = compressErr instanceof Error ? compressErr.message : "Image processing failed";
      console.error("[upload] compressImage THREW:", msg);
      stopProgress?.();
      console.groupEnd();
      return { url: null, path: null, error: msg };
    }
  } else {
    fileToUpload = fileForValidation;
  }
  console.log("[upload] fileToUpload:", fileToUpload.name, fileToUpload.size, "bytes", fileToUpload.type);

  // 5. Upload with retry
  let lastError = "Upload failed";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
    console.log(`[upload] attempt ${attempt + 1}/${maxAttempts} — calling supabase.storage.from("${bucket}").upload("${path}", ...)`);
    const uploadResponse = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, {
        upsert,
        contentType: fileToUpload.type || resolvedType,
        cacheControl,
      });
    console.log(`[upload] attempt ${attempt + 1} raw response:`, JSON.stringify(uploadResponse));

    const { error: uploadErr } = uploadResponse;
    if (!uploadErr) {
      stopProgress?.();
      onProgress?.(100);
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      console.log("[upload] SUCCESS — publicUrl:", urlData.publicUrl);
      console.groupEnd();
      return { url: urlData.publicUrl, path, error: null };
    }

    lastError = uploadErr.message;
    console.error(`[upload] attempt ${attempt + 1}/${maxAttempts} FAILED:`, uploadErr.message);
    // Errors that will never succeed on retry — break immediately
    const msg = uploadErr.message.toLowerCase();
    const isFatal =
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("security policy") ||      // RLS violation
      msg.includes("unauthorized") ||          // missing / expired JWT
      msg.includes("jwt") ||                   // JWT errors
      msg.includes("payload too large") ||     // file exceeds bucket limit
      msg.includes("file size limit") ||       // Supabase size-limit wording
      msg.includes("entity too large");        // HTTP 413 variant
    if (isFatal) break;
  }

  stopProgress?.();
  onProgress?.(0);
  console.error("[upload] ALL ATTEMPTS FAILED — final error:", lastError);
  console.groupEnd();
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
