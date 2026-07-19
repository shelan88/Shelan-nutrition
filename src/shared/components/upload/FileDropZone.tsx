/**
 * FileDropZone — unified file upload drop zone for documents, mixed files,
 *               and multi-file upload surfaces.
 *
 * Features:
 *   • Drag-and-drop or click to browse
 *   • Optional multiple-file support
 *   • UploadProgressBar during upload
 *   • Filename + size shown while uploading
 *   • Inline error with Retry button
 *   • Accepts any MIME types via `accept` prop
 *
 * The component manages upload state via useUpload internally.
 * The caller supplies an `upload(file) → Promise<string|null>` function.
 * On success, `onSuccess(url, file)` is called; on error `onError(msg)`.
 *
 * For multiple-file uploads (when `multiple` is true) the component queues
 * files and calls `upload` serially, notifying `onSuccess` per file.
 */

import { useRef, useState, useEffect } from "react";
import { Upload, RefreshCw, AlertCircle } from "lucide-react";
import { useUpload } from "@/lib/upload";
import UploadProgressBar from "./UploadProgressBar";

interface FileDropZoneProps {
  upload: (file: File) => Promise<string | null>;
  onSuccess?: (url: string, file: File) => void;
  onError?: (err: string) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  lang?: "en" | "ar";
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export default function FileDropZone({
  upload,
  onSuccess,
  onError,
  accept,
  multiple = false,
  maxSizeMb = 50,
  lang = "en",
  label,
  hint,
  disabled = false,
  className,
}: FileDropZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, uploading, progress, error, retry } = useUpload();
  const [dragOver, setDragOver] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // ── Forensic: detect component mount/unmount around the Gallery interaction ──
  useEffect(() => {
    console.log("[FileDropZone] MOUNTED — ref attached:", !!fileRef.current);
    return () => {
      console.warn("[FileDropZone] UNMOUNTED — if this fires while Samsung Gallery " +
        "is open, the component is being destroyed before onChange can fire.");
    };
  }, []);

  // ── Forensic: detect when the input element itself is recreated by React ─────
  const prevInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (prevInputRef.current && prevInputRef.current !== fileRef.current) {
      console.error("[FileDropZone] ⚠ INPUT ELEMENT WAS RECREATED by React — " +
        "fileRef.current identity changed between renders. A new <input> DOM node " +
        "now exists. If this fires after Samsung Gallery closes, React unmounted " +
        "and remounted the input before onChange could deliver the file.");
    }
    prevInputRef.current = fileRef.current;
  });

  const defaultLabel = lang === "ar"
    ? "أفلت الملفات هنا أو اضغط للتصفح"
    : "Drop files here or click to browse";

  const defaultHint = lang === "ar"
    ? `الحجم الأقصى ${maxSizeMb} MB`
    : `Max ${maxSizeMb} MB`;

  // ── Upload a single file ───────────────────────────────────────────────────
  async function processFile(file: File) {

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 1 — File object at the moment processFile is called.
    // This runs from handleFiles, which runs from the input's onChange.
    // ════════════════════════════════════════════════════════════════════════
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

    console.group("[FileDropZone] processFile — file forensics");
    console.log("[input] navigator.userAgent  :", navigator.userAgent);
    console.log("[input] file instanceof File :", file instanceof File);
    console.log("[input] constructor.name     :", file.constructor?.name ?? "(unknown)");
    console.log("[input] file.name            :", file.name);
    console.log("[input] file.type            :", file.type || "(empty — MIME omitted by Samsung Gallery)");
    console.log("[input] file.size            :", file.size, "bytes",
      file.size === 0 ? "⚠ ZERO BYTES — Android content URI may not have resolved" : "");
    console.log("[input] file.lastModified    :", file.lastModified,
      `(${new Date(file.lastModified).toISOString()})`);
    console.log("[input] Object.keys(file)    :", objectKeys.length ? objectKeys : "(none — File properties are non-enumerable, this is normal)");
    console.log("[input] file.slice(0,16) hex :", slicePreview);
    console.groupEnd();
    // ════════════════════════════════════════════════════════════════════════

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 2 — size guard (mirrors validateFile in upload.service.ts)
    // ════════════════════════════════════════════════════════════════════════
    console.log("[FileDropZone] BEFORE size guard — file.size:", file.size, "| maxSizeMb:", maxSizeMb);
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الملف كبير جداً (الحد الأقصى ${maxSizeMb} MB)`
        : `File too large (max ${maxSizeMb} MB)`;
      console.warn("[FileDropZone] size guard REJECTED:", msg);
      onError?.(msg);
      return;
    }
    console.log("[FileDropZone] AFTER size guard — passed");

    setCurrentFile(file);

    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC STEP 3 — upload.run()
    // ════════════════════════════════════════════════════════════════════════
    console.log("[FileDropZone] BEFORE upload.run() — file:", file.name, file.size, "bytes", file.type || "(no type)");
    const url = await run(file, upload);
    console.log("[FileDropZone] AFTER upload.run() — returned url:", url);

    if (!url) {
      const msg = lang === "ar" ? "فشل رفع الملف" : "File upload failed";
      console.error("[FileDropZone] upload.run() returned null/undefined — " +
        "check upload.service.ts logs for the exact failure reason");
      onError?.(msg);
      return;
    }

    console.log("[FileDropZone] SUCCESS — calling onSuccess with url:", url);
    onSuccess?.(url, file);
    setCurrentFile(null);
  }

  // ── Handle file list (multiple or single) ─────────────────────────────────
  async function handleFiles(files: FileList | null) {
    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC — onChange delivered to handleFiles
    // ════════════════════════════════════════════════════════════════════════
    console.group("[input] onChange fired (FileDropZone)");
    console.log("[input] navigator.userAgent  :", navigator.userAgent);
    console.log("[input] event.target.files   :", files);
    console.log("[input] files === null        :", files === null);
    console.log("[input] files.length         :", files?.length ?? "null");
    console.log("[input] input.value          :", fileRef.current?.value || "(empty or already cleared)");
    console.log("[input] input.accept         :", fileRef.current?.accept);
    console.log("[input] input.disabled       :", fileRef.current?.disabled);
    if (!files || files.length === 0) {
      console.warn("[input] ⚠ FileList is null or empty — onChange fired with no files. " +
        "Samsung Internet may have fired onChange on dismiss, or the FileList was " +
        "cleared before this handler ran.");
    }
    console.groupEnd();

    if (!files || files.length === 0 || disabled || uploading) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
  }

  // ── Drag events ───────────────────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled && !uploading) setDragOver(true);
  }
  function onDragLeave() { setDragOver(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  const zoneBase = `
    rounded-2xl border-2 border-dashed transition-all cursor-pointer
    flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
    ${dragOver ? "border-primary-pink bg-pink-50/30" : "border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-[var(--admin-hover-bg)]"}
    ${disabled ? "opacity-50 pointer-events-none" : ""}
  `;

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        className={zoneBase}
        onClick={() => {
          if (uploading) return;
          // ── Forensic: log the onClick that opens the file picker ─────────
          console.group("[input] onClick fired — opening file picker (FileDropZone)");
          console.log("[input] fileRef.current      :", fileRef.current);
          console.log("[input] input.disabled       :", fileRef.current?.disabled);
          console.log("[input] input.accept         :", fileRef.current?.accept);
          console.log("[input] input.value (before) :", fileRef.current?.value || "(empty)");
          console.log("[input] navigator.userAgent  :", navigator.userAgent);
          console.groupEnd();
          fileRef.current?.click();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        aria-label={lang === "ar" ? "منطقة رفع الملفات" : "File upload zone"}
      >
        {uploading ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
            {currentFile && (
              <p className="text-[12.5px] font-medium text-[var(--admin-text-muted)] max-w-[200px] truncate">
                {currentFile.name}
              </p>
            )}
            <div className="w-48">
              <UploadProgressBar
                progress={progress || null}
                className="h-1 rounded-full bg-[var(--admin-border)]"
              />
            </div>
            <p className="text-[11.5px] text-[var(--admin-text-faint)]">
              {lang === "ar" ? "جارٍ الرفع…" : "Uploading…"}{progress > 0 ? ` ${progress}%` : ""}
            </p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 flex items-center justify-center shrink-0">
              <Upload size={20} className="text-primary-pink" />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-[var(--admin-text)]">
                {label ?? defaultLabel}
              </p>
              <p className="text-[12px] text-[var(--admin-text-faint)] mt-0.5">
                {hint ?? defaultHint}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error + retry */}
      {error && !uploading && (
        <div className="mt-2 flex items-center gap-2">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-[11.5px] text-red-500 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => retry().then((url) => {
              if (url && currentFile) onSuccess?.(url, currentFile);
            })}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-primary-pink hover:underline shrink-0"
          >
            <RefreshCw size={10} />
            {lang === "ar" ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      {/*
        NOTE: This input is always rendered (no conditional). Its key prop never
        changes. React will update it in-place, not recreate the DOM node.
        If the [FileDropZone] UNMOUNTED or INPUT ELEMENT WAS RECREATED warnings
        appear in the console, that assumption is wrong.
      */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={(e) => {
          // Note: value is cleared AFTER handleFiles reads from e.target.files.
          // handleFiles captures the FileList reference immediately, so clearing
          // input.value here does not affect the File objects already in hand.
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
