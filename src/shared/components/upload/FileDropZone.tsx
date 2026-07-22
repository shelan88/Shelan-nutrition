/**
 * FileDropZone — unified file upload drop zone for documents, mixed files,
 *               and multi-file upload surfaces.
 *
 * Features:
 *   • Drag-and-drop or tap/click to browse
 *   • The <input type="file"> is absolutely positioned as a transparent overlay
 *     covering the entire drop zone so the user's finger touches it directly —
 *     no programmatic .click() involved.
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
import { dbg, dbgOk, dbgWarn, dbgError } from "@/shared/debug/uploadDebug";

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
    dbg("FileDropZone MOUNTED", `ref attached: ${!!fileRef.current} | ua: ${navigator.userAgent.slice(0, 80)}`);
    return () => {
      console.warn("[FileDropZone] UNMOUNTED — if this fires while Samsung Gallery " +
        "is open, the component is being destroyed before onChange can fire.");
      dbgWarn("FileDropZone UNMOUNTED ⚠", "If picker was open, onChange will never fire");
    };
  }, []);

  // ── Forensic: detect when the input element itself is recreated by React ─────
  const prevInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (prevInputRef.current && prevInputRef.current !== fileRef.current) {
      console.error("[FileDropZone] ⚠ INPUT ELEMENT WAS RECREATED by React — " +
        "fileRef.current identity changed between renders. A new <input> DOM node exists.");
      dbgError("INPUT ELEMENT RECREATED ⚠", "React replaced the <input> DOM node — onChange on old element is dead");
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
    // FORENSIC — File object at the moment processFile is called.
    // ════════════════════════════════════════════════════════════════════════
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
    console.log("[input] file.name            :", file.name);
    console.log("[input] file.type            :", file.type || "(empty)");
    console.log("[input] file.size            :", file.size, "bytes",
      file.size === 0 ? "⚠ ZERO BYTES" : "");
    console.log("[input] file.slice(0,16) hex :", slicePreview);
    console.groupEnd();
    // ════════════════════════════════════════════════════════════════════════

    // ── DBG instrumentation ────────────────────────────────────────────────
    dbg("processFile called", `name="${file.name}" size=${file.size}B type="${file.type || "(empty)"}"`);
    if (file.size === 0) dbgError("File size is ZERO ⚠", "Android content URI resolved before bytes available");
    dbg("File bytes[0..15]", slicePreview);
    // ──────────────────────────────────────────────────────────────────────

    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الملف كبير جداً (الحد الأقصى ${maxSizeMb} MB)`
        : `File too large (max ${maxSizeMb} MB)`;
      dbgError("File too large — rejected before upload", `${(file.size / 1024 / 1024).toFixed(1)} MB > ${maxSizeMb} MB limit`);
      onError?.(msg);
      return;
    }

    setCurrentFile(file);

    console.log("[FileDropZone] calling upload.run — file:", file.name, file.size, "bytes");
    dbg("Calling useUpload.run()", `file="${file.name}"`);
    const url = await run(file, upload);
    console.log("[FileDropZone] upload.run returned:", url);

    if (!url) {
      const msg = lang === "ar" ? "فشل رفع الملف" : "File upload failed";
      dbgError("useUpload.run() returned null", "upload fn returned null or threw — check entries above");
      onError?.(msg);
      return;
    }

    dbgOk("useUpload.run() returned URL ✓", url.slice(0, 80));
    onSuccess?.(url, file);
    setCurrentFile(null);
  }

  // ── Handle file list from onChange or drop ─────────────────────────────────
  async function handleFiles(files: FileList | null) {
    // ════════════════════════════════════════════════════════════════════════
    // FORENSIC — file list delivered to handleFiles
    // ════════════════════════════════════════════════════════════════════════
    console.group("[input] onChange fired (FileDropZone)");
    console.log("[input] navigator.userAgent  :", navigator.userAgent);
    console.log("[input] files === null        :", files === null);
    console.log("[input] files.length         :", files?.length ?? "null");
    console.log("[input] input.accept         :", fileRef.current?.accept);
    console.log("[input] input.disabled       :", fileRef.current?.disabled);
    if (!files || files.length === 0) {
      console.warn("[input] ⚠ FileList is null or empty — onChange fired with no files.");
    }
    console.groupEnd();
    // ════════════════════════════════════════════════════════════════════════

    // ── DBG instrumentation ────────────────────────────────────────────────
    const fileCount = files?.length ?? 0;
    dbg("onChange fired ✓", `${fileCount} file(s) | disabled=${disabled} | uploading=${uploading}`);
    if (!files || fileCount === 0) {
      dbgWarn("onChange: FileList is null/empty ⚠", "Picker returned no files — common on Android");
    } else {
      for (let i = 0; i < fileCount; i++) {
        const f = files[i];
        dbg(`File [${i}]`, `name="${f.name}" size=${f.size}B type="${f.type || "(empty)"}" lastModified=${f.lastModified}`);
      }
    }
    if (disabled)   dbgWarn("onChange: component is disabled — upload blocked");
    if (uploading)  dbgWarn("onChange: upload already in progress — upload blocked");
    // ──────────────────────────────────────────────────────────────────────

    if (!files || files.length === 0 || disabled || uploading) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
  }

  // Whether interaction is blocked
  const inactive = disabled || uploading;

  // Drop zone base styles (no cursor-pointer — the input overlay controls cursor)
  const zoneBase = `
    relative rounded-2xl border-2 border-dashed transition-all
    flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
    ${dragOver ? "border-primary-pink bg-pink-50/30" : "border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-[var(--admin-hover-bg)]"}
    ${inactive ? "opacity-50" : "cursor-pointer"}
  `;

  return (
    <div className={className}>
      {/* Drop zone wrapper — position:relative so the input overlay is contained */}
      <div
        className={zoneBase}
        // Keyboard activation: Space/Enter on the focused input (tabIndex=0)
        // opens the picker natively without JS .click()
        aria-label={lang === "ar" ? "منطقة رفع الملفات" : "File upload zone"}
      >
        {/* ── Visual content — pointer-events-none so touches reach the input ── */}
        <div className="pointer-events-none w-full flex flex-col items-center gap-3">
          {uploading ? (
            <>
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
            </>
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

        {/* ── Transparent <input> overlay — user's finger lands here directly  ── */}
        {/*    Drag handlers live here too since the input sits on top.            */}
        {/*    No programmatic .click() anywhere.                                  */}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-hidden
          className={`absolute inset-0 w-full h-full opacity-0
            ${inactive ? "pointer-events-none cursor-default" : "cursor-pointer"}`}
          tabIndex={inactive ? -1 : 0}
          disabled={inactive}
          onClick={() => {
            dbg("File picker opened ✓", `accept="${accept ?? "any"}" multiple=${multiple} inactive=${inactive}`);
          }}
          onDragOver={(e) => { e.preventDefault(); if (!inactive) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            dbg("File dropped (drag-and-drop)", `${e.dataTransfer.files.length} file(s)`);
            handleFiles(e.dataTransfer.files);
          }}
          onChange={(e) => {
            // NOTE: files extracted BEFORE resetting value — FileList is a live
            // reference on Android and empties when e.target.value is cleared.
            const extracted = e.target.files;
            dbg("onChange event received", `files=${extracted?.length ?? "null"} (before value reset)`);
            handleFiles(extracted);
            e.target.value = "";
          }}
        />
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
    </div>
  );
}
