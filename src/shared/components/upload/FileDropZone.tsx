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

import { useRef, useState } from "react";
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

  const defaultLabel = lang === "ar"
    ? "أفلت الملفات هنا أو اضغط للتصفح"
    : "Drop files here or click to browse";

  const defaultHint = lang === "ar"
    ? `الحجم الأقصى ${maxSizeMb} MB`
    : `Max ${maxSizeMb} MB`;

  // ── Upload a single file ───────────────────────────────────────────────────
  async function processFile(file: File) {
    console.log("[FileDropZone] processFile:", file.name, file.size, "bytes", file.type || "(no type)");
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = lang === "ar"
        ? `الملف كبير جداً (الحد الأقصى ${maxSizeMb} MB)`
        : `File too large (max ${maxSizeMb} MB)`;
      console.warn("[FileDropZone] client-side size check failed:", msg);
      onError?.(msg);
      return;
    }

    setCurrentFile(file);
    const url = await run(file, upload);
    console.log("[FileDropZone] run() result:", url);

    if (!url) {
      const msg = lang === "ar" ? "فشل رفع الملف" : "File upload failed";
      console.error("[FileDropZone] upload returned null — calling onError");
      onError?.(msg);
      return;
    }

    console.log("[FileDropZone] SUCCESS — calling onSuccess with url:", url);
    onSuccess?.(url, file);
    setCurrentFile(null);
  }

  // ── Handle file list (multiple or single) ─────────────────────────────────
  async function handleFiles(files: FileList | null) {
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
        onClick={() => !uploading && fileRef.current?.click()}
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
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled || uploading}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
