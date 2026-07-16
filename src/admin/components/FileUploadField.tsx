/**
 * FileUploadField — shared file/image upload field for admin CMS pages.
 *
 * Renders a URL text input + "Upload" button side-by-side.
 * On file selection: uploads to Supabase Storage via storage.repository,
 * shows an animated progress bar, then injects the returned public URL.
 * For image accept types, shows a thumbnail preview below the field.
 * Shows a Remove (×) button when a value is present.
 */
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadFile } from "@/admin/repositories/storage.repository";

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImage = accept.includes("image");

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const result = await uploadFile(file, folder);
    setUploading(false);
    if (result) {
      onChange(result.url);
    } else {
      setError(
        lang === "ar"
          ? "فشل الرفع. حاولي مرة أخرى."
          : "Upload failed. Please try again."
      );
    }
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
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className={btnBase}
        >
          <Upload size={13} />
          {uploading
            ? lang === "ar" ? "جارٍ الرفع…" : "Uploading…"
            : lang === "ar" ? "رفع" : "Upload"}
        </button>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => { onChange(""); setError(null); }}
            title={lang === "ar" ? "حذف" : "Remove"}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="mt-2 h-0.5 rounded-full bg-[var(--admin-border)] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-primary-pink to-lavender-purple animate-pulse" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-500">{error}</p>
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

      {/* Hidden native file picker */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
