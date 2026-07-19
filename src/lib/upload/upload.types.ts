/**
 * upload.types.ts — SHELAN unified upload system
 * Shared types used by upload.service, useUpload, and all UI components.
 */

export interface UploadOptions {
  /** Supabase Storage bucket name. Defaults to "media". */
  bucket?: string;
  /** Full storage path including filename, e.g. "avatars/123/avatar.jpg". */
  path: string;
  /** Replace existing file at the same path. Default false. */
  upsert?: boolean;
  /** Cache-Control header value. Defaults to "3600". */
  cacheControl?: string;
  /** Maximum allowed file size in megabytes. Default 50 MB. */
  maxSizeMb?: number;
  /**
   * Allowed MIME type patterns, e.g. ["image/*", "application/pdf"].
   * When omitted, all types are accepted.
   */
  allowedTypes?: string[];
  /**
   * When true, images wider than maxWidthPx are re-encoded as JPEG.
   * Non-image files are never compressed.
   */
  compress?: boolean;
  /** Maximum image width in pixels before compression kicks in. Default 1400. */
  maxWidthPx?: number;
  /** JPEG quality 0–1. Default 0.85. */
  quality?: number;
  /** Called with simulated upload percentage 0–100. */
  onProgress?: (pct: number) => void;
  /** Maximum upload attempts. Default 3. */
  maxAttempts?: number;
}

export interface UploadResult {
  /** Permanent public CDN URL on success; null on failure. */
  url: string | null;
  /** Storage path used (useful for subsequent delete). */
  path: string | null;
  /** Human-readable error description; null on success. */
  error: string | null;
}
