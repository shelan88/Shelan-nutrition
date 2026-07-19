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
  //    If fileRef.current identity changes between renders, React replaced the DOM node.
  const prevInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (prevInputRef.current && prevInputRef.current !== fileRef.current) {
      console.error("[ImageUpload] ⚠ INPUT ELEMENT WAS RECREATED by React — " +
        "fileRef.current identity changed. A new <input> DOM node exists. " +
        "If this fires after Samsung Gallery closes, React unmounted/remounted " +
        "the input before onChange could deliver the file.");
    }
    prevInputRef.current = fileRef.current;
  });

  // ── Forensic: track uploading state changes ───────────────────────────────────
  const uploadingRef = useRef(uploading);
  useEffect(() => {
    if (uploadingRef.current !== uploading) {
      console.log(`[ImageUpload] uploading state changed: ${uploadingRef.current} → ${uploading}` +
        (uploading ? " (input is now disabled)" : " (input is now enabled)"));
      uploadingRef.current = uploading;
    }
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
    // FORENSIC STEP 1 — onChange fired
    // Log everything about the event and input element BEFORE touching anything.
    // input.value is read HERE, before e.target.value = "" clears it.
    // ════════════════════════════════════════════════════════════════════════
    const inputEl    = e.target;
    const fileList   = inputEl.files;
    const file       = fileList?.[0] ?? null;
    const inputValue = inputEl.value; // capture BEFORE clearing

    console.group("[input] onChange fired");
    console.log("[input] navigator.userAgent  :", navigator.userAgent);
    console.log("[input] event.target         :", inputEl);
    console.log("[input] event.target.files   :", fileList);
    console.log("[input] files.length         :", fileList?.length ?? "null — FileList is null");
    console.log("[input] input.value (raw)    :", inputValue || "(empty)");
    console.log("[input] input.accept         :", inputEl.accept);
    console.log("[input] input.disabled       :", inputEl.disabled);

    if (!file) {
      console.warn("[input] ⚠ file is null/undefined — files[0] did not exist. " +
        "Possible causes: Samsung Internet fired onChange with empty FileList, " +
        "or the picker was dismissed without selection.");
      console.groupEnd();
      return;
    }

    // ── Full File object forensics ───────────────────────────────────────────
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
    console.log("[input] constructor.name     :", file.constructor?.name ?? "(unknown)");
    console.log("[input] file.name            :", file.name);
    console.log("[input] file.type            :", file.type || "(empty — MIME omitted by Samsung Gallery)");
    console.log("[input] file.size            :", file.size, "bytes",
      file.size === 0 ? "⚠ ZERO BYTES — Android content URI may not have resolved yet" : "");
    console.log("[input] file.lastModified    :", file.lastModified,
      `(${new Date(file.lastModified).toISOString()})`);
    console.log("[input] Object.keys(file)    :", objectKeys.length ? objectKeys : "(none — File properties are non-enumerable, this is normal)");
    console.log("[input] file.slice(0,16) hex :", slicePreview);
    console.groupEnd();
    // ════════════════════════════════════════════════════════════════════════

    // ── Clear input value so the same file can be re-selected ───────────────
    // NOTE: this happens AFTER we've already read file from e.target.files[0].
    // The File object reference in `file` is still valid after this clear.
    // If Samsung Internet invalidates the File object when input.value is cleared,
    // subsequent reads (file.size, file.slice) would change or throw.
    console.log("[input] clearing e.target.value (was:", inputValue, ")");
    e.target.value = "";
    console.log("[input] after clear: file.name =", file.name, "| file.size =", file.size,
      "← if these changed after the clear, Samsung Internet is invalidating the File object");

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 2 — client-side size guard (validateFile equivalent here)
    // ════════════════════════════════════════════════════════════════════════
    console.log("[ImageUpload] BEFORE size guard — file.size:", file.size, "| maxSizeMb:", maxSizeMb);
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الحجم الأقصى ${maxSizeMb} ميغابايت`
        : `Max file size is ${maxSizeMb} MB`;
      console.warn("[ImageUpload] size guard REJECTED — file too large:", msg);
      onError?.(msg);
      return;
    }
    console.log("[ImageUpload] AFTER size guard — passed, continuing");

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 3 — FileReader preview (base64)
    // ════════════════════════════════════════════════════════════════════════
    console.log("[ImageUpload] BEFORE FileReader.readAsDataURL — file identity:", file.name, file.size);
    const reader = new FileReader();
    reader.onload  = (ev) => {
      const result = ev.target?.result as string;
      console.log("[ImageUpload] FileReader.onload fired — result length:", result?.length ?? 0,
        "| starts with:", result?.slice(0, 30));
      setPreview(result);
    };
    reader.onerror = (ev) => {
      console.error("[ImageUpload] ⚠ FileReader.onerror — Samsung Internet may have " +
        "invalidated the File object by the time FileReader tried to read it:", ev);
    };
    reader.readAsDataURL(file);

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 4 — upload.run()
    // ════════════════════════════════════════════════════════════════════════
    console.log("[ImageUpload] BEFORE upload.run() — file:", file.name, file.size, "bytes", file.type || "(no type)");
    console.log("[ImageUpload] uploading state at this point:", uploading);
    const url = await run(file, upload);
    console.log("[ImageUpload] AFTER upload.run() — returned url:", url);

    if (!url) {
      setPreview(null); // revert to original on failure
      const msg = lang === "ar" ? "فشل رفع الصورة" : "Image upload failed";
      console.error("[ImageUpload] upload.run() returned null/undefined — " +
        "check upload.service.ts logs for the exact failure reason");
      onError?.(msg);
      return;
    }

    // 3. Replace preview with final URL + notify parent
    console.log("[ImageUpload] SUCCESS — setting preview and calling onSuccess:", url);
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
            onClick={() => {
              // ── Forensic: log the onClick that opens the file picker ─────
              console.group("[input] onClick fired — opening file picker");
              console.log("[input] fileRef.current      :", fileRef.current);
              console.log("[input] input.disabled       :", fileRef.current?.disabled);
              console.log("[input] input.accept         :", fileRef.current?.accept);
              console.log("[input] input.value (before) :", fileRef.current?.value || "(empty)");
              console.log("[input] navigator.userAgent  :", navigator.userAgent);
              console.groupEnd();
              fileRef.current?.click();
            }}
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
      {/*
        NOTE: This input is always rendered (no conditional). Its `key` prop never
        changes. React will update it in-place, not recreate the DOM node.
        If the [ImageUpload] UNMOUNTED or INPUT ELEMENT WAS RECREATED warnings
        appear in the console, that assumption is wrong and React is destroying
        this element, which would explain why Samsung Internet never fires onChange.
      */}
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
