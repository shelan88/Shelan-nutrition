/**
 * ImageUpload — unified image picker used for every photo/avatar upload surface.
 *
 * Behaviour:
 *   • Click/tap anywhere on the component to open the file picker.
 *   • Immediately shows a FileReader-based base64 preview (works on all browsers,
 *     including Samsung Browser where blob: URLs fail).
 *   • Calls the caller-supplied `upload` function (which handles the actual
 *     Supabase write + any DB updates).
 *   • Shows UploadProgressBar overlay while uploading.
 *   • On success calls `onSuccess(url)`.
 *   • On error shows an inline error message with a Retry button.
 *   • `onError` on the <img> hides it so the fallback slot is always visible.
 *
 * Props:
 *   value     — current URL to display (DB-backed); cleared preview takes over.
 *   upload    — async fn that receives the File and returns the public URL or null.
 *   onSuccess — called with the new public URL after a successful upload.
 *   onError   — called with the error string on failure.
 *   shape     — "circle" | "square" | "rect" — controls border-radius and aspect.
 *   accept    — file picker MIME filter; defaults to "image/*".
 *   maxSizeMb — client-side guard (in MB) before even calling upload; default 10.
 *   lang      — UI language.
 *   fallback  — ReactNode shown when no image is available (initials, icon, etc.).
 *   disabled  — blocks interaction.
 *   className — applied to the outermost wrapper.
 */

import { useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { useUpload } from "@/lib/upload";
import UploadProgressBar from "./UploadProgressBar";

interface ImageUploadProps {
  value?: string | null;
  upload: (file: File) => Promise<string | null>;
  onSuccess?: (url: string) => void;
  onError?: (err: string) => void;
  shape?: "circle" | "square" | "rect";
  accept?: string;
  maxSizeMb?: number;
  lang?: "en" | "ar";
  fallback?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  upload,
  onSuccess,
  onError,
  shape = "square",
  accept = "image/*",
  maxSizeMb = 10,
  lang = "en",
  fallback,
  disabled = false,
  className,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, uploading, progress, error, retry } = useUpload();
  const [preview, setPreview] = useState<string | null>(null);

  // Shape styles
  const shapeClass =
    shape === "circle" ? "rounded-full" :
    shape === "rect"   ? "rounded-xl aspect-video" :
    "rounded-xl aspect-square";

  const displaySrc = preview ?? value;

  // ── File selection handler ─────────────────────────────────────────────────
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file

    // ── Samsung Internet / Android diagnostic ─────────────────────────────────
    // Logs the raw File object as the browser hands it to JS — before any MIME
    // sniffing, compression, or validation. Compare these values between Chrome
    // Android and Samsung Internet to isolate browser-specific File differences.
    console.group("[ImageUpload] file-selection diagnostic");
    console.log("file.name           :", file.name);
    console.log("file.type           :", file.type          || "(empty string — Samsung Gallery may omit MIME)");
    console.log("file.size           :", file.size, "bytes", file.size === 0 ? "⚠ ZERO BYTES" : "");
    console.log("file.lastModified   :", file.lastModified, `(${new Date(file.lastModified).toISOString()})`);
    console.log("file instanceof File:", file instanceof File);
    console.log("file.constructor    :", file.constructor?.name ?? "(unknown)");
    console.log("navigator.userAgent :", navigator.userAgent);
    console.groupEnd();
    // ─────────────────────────────────────────────────────────────────────────

    // Client-side size guard
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الحجم الأقصى ${maxSizeMb} ميغابايت`
        : `Max file size is ${maxSizeMb} MB`;
      onError?.(msg);
      return;
    }

    // 1. Immediate base64 preview — works on Samsung Browser, avoids blob: failures
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // 2. Upload
    const url = await run(file, upload);

    if (!url) {
      setPreview(null); // revert to original on failure
      const msg = lang === "ar" ? "فشل رفع الصورة" : "Image upload failed";
      onError?.(msg);
      return;
    }

    // 3. Replace preview with final URL + notify parent
    setPreview(url);
    onSuccess?.(url);
  }

  // ── Retry handler ──────────────────────────────────────────────────────────
  async function handleRetry() {
    const url = await retry();
    if (url) {
      setPreview(url);
      onSuccess?.(url);
    }
  }

  return (
    <div className={`relative group inline-block ${className ?? ""}`}>
      {/* ── Image / fallback ──────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden bg-black/5 ${shapeClass} ${
          shape !== "rect" ? "w-full h-full" : ""
        }`}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt=""
            className={`w-full h-full object-cover ${shapeClass}`}
            onError={(e) => {
              // Broken URL — hide img so fallback slot shows through
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${shapeClass}`}>
            {fallback}
          </div>
        )}

        {/* ── Progress overlay ────────────────────────────────────────────── */}
        {uploading && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 ${shapeClass}`}>
            <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin mb-2" />
            <div className="w-3/4">
              <UploadProgressBar progress={progress || null} className="h-0.5 rounded-full bg-white/20" />
            </div>
          </div>
        )}

        {/* ── Camera hover overlay (not shown while uploading) ────────────── */}
        {!uploading && !disabled && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity ${shapeClass}`}
            aria-label={lang === "ar" ? "تغيير الصورة" : "Change image"}
          >
            <Camera size={20} className="text-white drop-shadow" />
          </button>
        )}
      </div>

      {/* ── Error + retry (shown below the image) ─────────────────────────── */}
      {error && !uploading && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <p className="text-[11px] text-red-500 flex-1 leading-tight">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-pink hover:underline shrink-0"
          >
            <RefreshCw size={10} />
            {lang === "ar" ? "إعادة" : "Retry"}
          </button>
        </div>
      )}

      {/* ── Hidden file input ─────────────────────────────────────────────── */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={handleChange}
      />
    </div>
  );
}
