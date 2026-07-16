/**
 * MediaLibraryPage — File upload and management page.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { uploadFile, deleteMediaFile, getMediaLibrary } from "@/admin/repositories/storage.repository";
import type { MediaLibraryRow } from "@/types/database.types";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

type FilterTab = "all" | "image" | "document" | "video";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "document", label: "Documents" },
  { key: "video", label: "Videos" },
];

function MediaCard({ item, onDelete }: { item: MediaLibraryRow; onDelete: (id: string, url: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${item.filename}"? This cannot be undone.`)) {
      onDelete(item.id, item.url);
    }
  };

  return (
    <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden flex flex-col group">
      {/* Thumbnail */}
      <div className="relative h-36 bg-[var(--admin-hover-bg)] flex items-center justify-center overflow-hidden">
        {item.type === "image" ? (
          <img
            src={item.url}
            alt={item.alt_text ?? item.filename}
            className="w-full h-full object-cover"
          />
        ) : item.type === "video" ? (
          <div className="flex flex-col items-center gap-1 text-[var(--admin-text-faint)]">
            <span className="text-3xl">🎬</span>
            <span className="text-[11px] font-medium uppercase tracking-wide">Video</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-primary-pink to-lavender-purple flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold uppercase">PDF</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <p className="text-[12px] font-medium text-[var(--admin-text)] truncate" title={item.filename}>
          {item.filename}
        </p>
        <div className="flex items-center justify-between text-[11px] text-[var(--admin-text-faint)]">
          <span>{formatBytes(item.size ?? 0)}</span>
          <span>{formatDate(item.created_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-[var(--admin-border)]">
          <button
            onClick={handleCopy}
            className="flex-1 px-2 py-1 rounded-lg border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-colors text-center"
          >
            {copied ? "Copied! ✓" : "Copy URL"}
          </button>
          <button
            onClick={handleDelete}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<MediaLibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const type = filter === "all" ? undefined : filter;
    const data = await getMediaLibrary(type);
    setItems(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
    setUploading(false);
    loadItems();
  };

  const handleDelete = async (id: string, url: string) => {
    await deleteMediaFile(id, url);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "مكتبة الوسائط" : "Media Library"}
        description={lang === "ar" ? "رفع وإدارة الصور والمستندات ومقاطع الفيديو." : "Upload and manage images, documents, and videos."}
      />

      {/* Upload Zone */}
      <motion.div {...fadeUp(0)} className="mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all py-12 flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? "border-primary-pink bg-pink-50/40"
              : "border-[var(--admin-border)] hover:border-primary-pink/40 hover:bg-[var(--admin-hover-bg)]"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
              <p className="text-[13px] font-medium text-[var(--admin-text-muted)]">Uploading…</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-pink/10 to-lavender-purple/10 flex items-center justify-center">
                <Plus size={22} className="text-primary-pink" />
              </div>
              <p className="text-[14px] font-semibold text-[var(--admin-text)]">Drop files here or click to browse</p>
              <p className="text-[12px] text-[var(--admin-text-faint)]">Images, PDFs, Videos — up to 50 MB each</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,video/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div {...fadeUp(0.05)} className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTER_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              filter === t.key
                ? "bg-gradient-to-r from-primary-pink to-lavender-purple text-white shadow-sm"
                : "border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div {...fadeUp(0.1)}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] py-20 flex flex-col items-center gap-4 text-center">
            <span className="text-5xl">🖼️</span>
            <p className="text-[14px] font-semibold text-[var(--admin-text)]">No files yet</p>
            <p className="text-[12px] text-[var(--admin-text-faint)] max-w-xs">
              Upload your first file using the drop zone above.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all mt-2"
            >
              <Plus size={14} />
              Upload Files
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <MediaCard item={item} onDelete={handleDelete} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
