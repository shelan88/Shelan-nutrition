/**
 * FileUploadField — shared file/image upload field for admin CMS pages.
 *
 * Renders a URL text input + "Upload" button side-by-side.
 * On file selection: uploads to Supabase Storage via storage.repository,
 * shows a real percentage progress bar (via useUpload), then injects the
 * returned public URL into the URL input.
 * For image accept types, shows a thumbnail preview below the field.
 * Shows a Remove (×) button when a value is present.
 *
 * External interface is UNCHANGED — all existing CMS pages that use
 * <FileUploadField value onChange accept folder lang placeholder />
 * need zero edits.
 */
import { useRef } from "react";
import { Upload, X, RefreshCw } from "lucide-react";
import { uploadFile } from "@/admin/repositories/storage.repository";
import { useUpload } from "@/lib/upload";
import UploadProgressBar from "@/shared/components/upload/UploadProgressBar";

interface FileUploadFieldProps {
  /** Current URL value */
  value: string;
  /** Called with the new URL after a successful upload, or "" on remove */
  onChange: (url: string) => void;
  /** Accepted MIME types — e.g. "image/*" or "image/*,application/pdf" */
  accept?: string;
  /** Supabase Storage sub-folder, defaults to "uploads" */
  folder?: string;
  /** Active UI language for button labels / error messages */
  lang?: "en" | "ar";
  /** Placeholder for the URL text input */
  placeholder?: string;
  className?: string;
}

export default function FileUploadField({
  value,
  onChange,
  accept = "image/*",
  folder = "uploads",
  lang = "en",
  placeholder = "https://…",
  className,
}: FileUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { run, uploading, progress, error, retry } = useUpload();

  const isImage = accept.includes("image");

  async function handleFile(file: File) {
    const url = await run(file, async (f) => {
      const row = await uploadFile(f, folder);
      return row?.url ?? null;
    });
    if (url) onChange(url);
  }

  const btnBase =
    "flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors whitespace-nowrap disabled:opacity-50 shrink-0";

  return (
    <div className={className}>
      {/* URL text input + Upload button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[13px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors min-w-0"
        />
        {/* Label wraps the input so the user's tap/click directly activates the
            native file picker — no programmatic .click() required.            */}
        <label
          className={`${btnBase} ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        >
          <Upload size={13} />
          {uploading
            ? (lang === "ar" ? "جارٍ الرفع…" : "Uploading…")
            : (lang === "ar" ? "رفع" : "Upload")}
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="sr-only"
            tabIndex={-1}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            title={lang === "ar" ? "حذف" : "Remove"}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Upload progress bar — real percentage from useUpload */}
      {uploading && (
        <div className="mt-2">
          <UploadProgressBar
            progress={progress > 0 ? progress : null}
            className="h-0.5 rounded-full bg-[var(--admin-border)]"
          />
        </div>
      )}

      {/* Error message + retry */}
      {error && !uploading && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <p className="text-[11px] text-red-500 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => retry().then((url) => { if (url) onChange(url); })}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-pink hover:underline shrink-0"
          >
            <RefreshCw size={10} />
            {lang === "ar" ? "إعادة" : "Retry"}
          </button>
        </div>
      )}

      {/* Image thumbnail preview */}
      {isImage && value && !uploading && (
        <div className="mt-2">
          <img
            src={value}
            alt=""
            className="h-20 w-auto max-w-[160px] object-cover rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover-bg)]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* File input is now inside the Upload label above — no second input needed */}
    </div>
  );
}
