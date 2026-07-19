/**
 * ImageUpload — unified image picker used for every photo/avatar upload surface.
 *
 * Behaviour:
 *   • Tap/click anywhere on the component to open the file picker.
 *   • The <input type="file"> is absolutely positioned as a transparent overlay
 *     covering the entire interactive area so the user's finger touches it
 *     directly — no programmatic .click() involved.
 *   • Immediately shows a FileReader-based base64 preview (works on all browsers,
 *     including Samsung Browser where blob: URLs fail).
 *   • Calls the caller-supplied `upload` function (which handles the actual
 *     Supabase write + any DB updates).
 *   • Shows UploadProgressBar overlay while uploading.
 *   • On success calls `onSuccess(url)`.
 *   • On error shows an inline error message with a Retry button.
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

import { useRef, useState, useEffect } from "react";
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

  // ── Forensic: detect component mount/unmount around the Gallery interaction ──
  useEffect(() => {
    console.log("[ImageUpload] MOUNTED — ref attached:", !!fileRef.current);
    return () => {
      console.warn("[ImageUpload] UNMOUNTED — if this fires while Galaxy Gallery is open, " +
        "the component is being destroyed before onChange can fire.");
    };
  }, []);

  // ── Forensic: detect when the input element itself is recreated by React ─────
  const prevInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (prevInputRef.current && prevInputRef.current !== fileRef.current) {
      console.error("[ImageUpload] ⚠ INPUT ELEMENT WAS RECREATED by React — " +
        "fileRef.current identity changed. A new <input> DOM node exists.");
    }
    prevInputRef.current = fileRef.current;
  });

  // Shape styles
  const shapeClass =
    shape === "circle" ? "rounded-full" :
    shape === "rect"   ? "rounded-xl aspect-video" :
    "rounded-xl aspect-square";

  const displaySrc = preview ?? value;

  // ── File selection handler ─────────────────────────────────────────────────
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC — onChange fired. Log everything before touching anything.
    // ════════════════════════════════════════════════════════════════════════
    const inputEl    = e.target;
    const fileList   = inputEl.files;
    const file       = fileList?.[0] ?? null;
    const inputValue = inputEl.value; // capture BEFORE clearing

    console.group("[input] onChange fired (ImageUpload)");
    console.log("[input] navigator.userAgent  :", navigator.userAgent);
    console.log("[input] files.length         :", fileList?.length ?? "null — FileList is null");
    console.log("[input] input.value (raw)    :", inputValue || "(empty)");
    console.log("[input] input.accept         :", inputEl.accept);
    console.log("[input] input.disabled       :", inputEl.disabled);

    if (!file) {
      console.warn("[input] ⚠ file is null/undefined — files[0] did not exist.");
      console.groupEnd();
      return;
    }

    // Full File object forensics
    let objectKeys: string[] = [];
    try { objectKeys = Object.keys(file); } catch { objectKeys = ["(Object.keys threw)"]; }

    let slicePreview = "(slice failed)";
    try {
      const buf = await file.slice(0, 16).arrayBuffer();
      slicePreview = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
    } catch (sliceErr) {
      slicePreview = `(slice threw: ${sliceErr})`;
    }

    console.log("[input] file instanceof File :", file instanceof File);
    console.log("[input] file.name            :", file.name);
    console.log("[input] file.type            :", file.type || "(empty)");
    console.log("[input] file.size            :", file.size, "bytes",
      file.size === 0 ? "⚠ ZERO BYTES" : "");
    console.log("[input] Object.keys(file)    :", objectKeys.length ? objectKeys : "(none — non-enumerable, normal)");
    console.log("[input] file.slice(0,16) hex :", slicePreview);
    console.groupEnd();
    // ════════════════════════════════════════════════════════════════════════

    // Client-side size guard
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الحجم الأقصى ${maxSizeMb} ميغابايت`
        : `Max file size is ${maxSizeMb} MB`;
      onError?.(msg);
      return;
    }

    // FileReader preview (base64, works on Samsung Internet where blob: URLs fail)
    const reader = new FileReader();
    reader.onloadstart = () => {
      console.log("[FileReader] onloadstart — browser accepted the read. file.size:", file.size);
    };
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      console.log("[FileReader] onload — result length:", result?.length ?? 0,
        "| prefix:", result?.slice(0, 40));
      setPreview(result);
    };
    reader.onabort = () => {
      console.error("[FileReader] ⚠ onabort — read was aborted mid-flight.");
    };
    reader.onerror = (ev) => {
      console.error("[FileReader] ⚠ onerror — FileReader failed to read the File.", ev);
    };
    reader.readAsDataURL(file);

    // Run upload
    console.log("[ImageUpload] calling upload.run — file:", file.name, file.size, "bytes");
    const url = await run(file, upload);
    console.log("[ImageUpload] upload.run returned:", url);

    if (!url) {
      setPreview(null);
      const msg = lang === "ar" ? "فشل رفع الصورة" : "Image upload failed";
      onError?.(msg);
      // Clear input value only after the upload attempt is fully settled
      e.target.value = "";
      return;
    }

    setPreview(url);
    onSuccess?.(url);
    // Clear input value only after FileReader + upload have both finished,
    // so Samsung Internet cannot drop the temporary file pointer mid-flight
    e.target.value = "";
  }

  // ── Retry handler ──────────────────────────────────────────────────────────
  async function handleRetry() {
    const url = await retry();
    if (url) {
      setPreview(url);
      onSuccess?.(url);
    }
  }

  // Whether interaction is blocked (passed to CSS + disabled attr on the input)
  const inactive = disabled || uploading;

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

        {/* ── Camera icon — visual only, pointer-events-none ──────────────── */}
        {/*    The input overlay behind this receives all touches.            */}
        {!inactive && (
          <div
            aria-hidden
            className={`absolute inset-0 flex items-center justify-center bg-black/40
              opacity-0 group-hover:opacity-100 group-active:opacity-100
              transition-opacity pointer-events-none ${shapeClass}`}
          >
            <Camera size={20} className="text-white drop-shadow" />
          </div>
        )}

        {/* ── Transparent <input> overlay — user's finger lands here directly  */}
        {/*    No programmatic .click() anywhere. The native file picker opens  */}
        {/*    because the user directly touched this input element.            */}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          aria-label={lang === "ar" ? "تغيير الصورة" : "Change image"}
          className={`absolute inset-0 w-full h-full opacity-0
            ${inactive ? "pointer-events-none cursor-default" : "cursor-pointer"}`}
          tabIndex={inactive ? -1 : 0}
          onChange={handleChange}
        />
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
    </div>
  );
}
