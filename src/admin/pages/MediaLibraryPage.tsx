/**
 * MediaLibraryPage — Read-only client file browser.
 *
 * Organises files by client. Upload functionality has been removed — files are
 * uploaded from:
 *   • Client Profile → Files tab        (client direct files)
 *   • Client Profile → Nutrition Plans  (plan-attached files)
 *
 * Left panel:  searchable client list
 * Right panel: selected client's files split into two sections
 *              • Client Files (uploaded_files table)
 *              • Nutrition Plan Files (nutrition_plan_files table)
 */
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  File as FileIcon, Image as ImageIcon, Film as FilmIcon,
  Search, Download, Eye, ChevronRight, X as XIcon,
  Users, BookOpen, ArrowLeft,
} from "lucide-react";
import { getAllClients } from "@/admin/repositories/clients.repository";
import { getClientFiles } from "@/admin/repositories/client-files.repository";
import { getClientPlanFiles } from "@/admin/repositories/nutrition-plans.repository";
import type { Client } from "@/admin/data/clients";
import type { UploadedFileRow } from "@/types/database.types";
import type { PlanFileWithName } from "@/admin/repositories/nutrition-plans.repository";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function fmtBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return iso; }
}

function FileIcon2({ type }: { type: string }) {
  const t = type.toLowerCase();
  const Ic = t === "image" ? ImageIcon : t === "video" ? FilmIcon : FileIcon;
  return <Ic size={15} strokeWidth={1.8} className="text-[var(--admin-text-muted)]" />;
}

function typeBadgeCls(type: string): string {
  const t = type.toLowerCase();
  if (t === "image")    return "bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
  if (t === "video")    return "bg-purple-50 text-purple-600 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-400";
  if (t === "pdf")      return "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400";
  return "bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)] ring-1 ring-[var(--admin-border)]";
}

function canPreviewType(type: string): boolean {
  const t = type.toLowerCase();
  return t === "image" || t === "pdf" || t === "video";
}

// ─── Preview target ───────────────────────────────────────────────────────────

interface PreviewTarget { url: string; name: string; type: string }

// ─── FileRow ──────────────────────────────────────────────────────────────────

function FileRow({
  filename, type, size, date, url, subtitle, onPreview,
}: {
  filename: string;
  type: string;
  size: number | null | undefined;
  date: string | null | undefined;
  url: string | null | undefined;
  subtitle?: string;
  onPreview: (t: PreviewTarget) => void;
}) {
  const showPreview = !!url && canPreviewType(type);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover-bg)] transition-colors group">
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-[var(--admin-hover-bg)] border border-[var(--admin-border)] flex items-center justify-center shrink-0">
        <FileIcon2 type={type} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-[var(--admin-text)] truncate">{filename}</p>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${typeBadgeCls(type)}`}>
            {type.toUpperCase()}
          </span>
          {size ? <span className="text-[11px] text-[var(--admin-text-faint)]">{fmtBytes(size)}</span> : null}
          {date ? <span className="text-[11px] text-[var(--admin-text-faint)]">{fmtDate(date)}</span> : null}
        </div>
        {subtitle && (
          <p className="text-[10.5px] text-[var(--admin-text-faint)] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Actions — fade in on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {showPreview && (
          <button
            onClick={() => onPreview({ url: url!, name: filename, type })}
            title="Preview"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/8 transition-all"
          >
            <Eye size={13} strokeWidth={2} />
          </button>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={filename}
            title="Download"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/8 transition-all"
          >
            <Download size={13} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── FileSection ─────────────────────────────────────────────────────────────

function FileSection({
  title, icon: Icon, count, emptyMsg, children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  emptyMsg: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--admin-hover-bg)]/60 border-b border-[var(--admin-border)] sticky top-0 z-10">
        <Icon size={13} strokeWidth={2} className="text-[var(--admin-text-faint)] shrink-0" />
        <span className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">
          {title}
        </span>
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-[var(--admin-border)] text-[10px] font-bold text-[var(--admin-text-faint)]">
          {count}
        </span>
      </div>
      {/* Content */}
      {count === 0 ? (
        <p className="px-4 py-3 text-[11.5px] text-[var(--admin-text-faint)] italic">{emptyMsg}</p>
      ) : (
        children
      )}
    </div>
  );
}

// ─── PreviewModal ─────────────────────────────────────────────────────────────

function PreviewModal({ target, isAr, onClose }: {
  target: PreviewTarget;
  isAr: boolean;
  onClose: () => void;
}) {
  const t = target.type.toLowerCase();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--admin-border)] shrink-0">
          <p className="text-[13px] font-semibold text-[var(--admin-text)] truncate pr-4">{target.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={target.url}
              target="_blank"
              rel="noopener noreferrer"
              download={target.name}
              title={isAr ? "تنزيل" : "Download"}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-primary-pink hover:bg-primary-pink/8 transition-all"
            >
              <Download size={14} strokeWidth={2} />
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-hover-bg)] transition-all"
            >
              <XIcon size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
          {t === "image" && (
            <img src={target.url} alt={target.name} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
          )}
          {t === "video" && (
            <video src={target.url} controls className="max-w-full max-h-[70vh] rounded-lg" />
          )}
          {(t === "pdf" || t === "document") && (
            <iframe
              src={target.url}
              title={target.name}
              className="w-full rounded-lg border border-[var(--admin-border)]"
              style={{ height: "70vh" }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaLibraryPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Client list
  const [clients,        setClients]        = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [search,         setSearch]         = useState("");

  // Selected client
  const [selected, setSelected] = useState<Client | null>(null);

  // File data for selected client
  const [clientFiles,  setClientFiles]  = useState<UploadedFileRow[]>([]);
  const [planFiles,    setPlanFiles]    = useState<PlanFileWithName[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Preview
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  // ── Load client list ──────────────────────────────────────────────────────
  useEffect(() => {
    getAllClients().then(list => {
      setClients(list);
      setClientsLoading(false);
    });
  }, []);

  // ── Load files when a client is selected ─────────────────────────────────
  useEffect(() => {
    if (!selected) {
      setClientFiles([]);
      setPlanFiles([]);
      return;
    }
    setFilesLoading(true);
    setClientFiles([]);
    setPlanFiles([]);
    Promise.all([
      getClientFiles(selected.id),
      getClientPlanFiles(selected.id),
    ]).then(([cf, pf]) => {
      setClientFiles(cf);
      setPlanFiles(pf);
      setFilesLoading(false);
    });
  }, [selected?.id]);

  // ── Filtered client list ──────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q),
    );
  }, [clients, search]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clientDisplayName = (c: Client) => isAr && c.fullNameAr ? c.fullNameAr : c.fullName;
  const totalFiles = clientFiles.length + planFiles.length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <motion.div {...fadeUp(0)}>
        <PageHeader
          title={isAr ? "مكتبة الوسائط" : "Media Library"}
          description={
            isAr
              ? "استعراض ملفات العملاء. الرفع يتم من ملف العميل أو خطط التغذية."
              : "Browse client files. Upload from the client profile or nutrition plans."
          }
        />
      </motion.div>

      {/* ── Split layout ─────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} className="flex gap-4" style={{ minHeight: 560 }}>

        {/* ── Left: client list ────────────────────────────────────────── */}
        <div
          className={[
            "flex-none bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] flex flex-col overflow-hidden",
            // Mobile: full-width when no client selected, hidden when client selected
            // Desktop (lg+): always visible at fixed width
            selected ? "hidden lg:flex lg:w-64" : "flex w-full lg:w-64",
          ].join(" ")}
        >
          {/* Search */}
          <div className="p-3 border-b border-[var(--admin-border)] shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAr ? "بحث عن عميل…" : "Search clients…"}
                className="
                  w-full pl-8 pr-3 py-1.5 rounded-xl
                  bg-[var(--admin-hover-bg)] border border-[var(--admin-border)]
                  text-[12px] text-[var(--admin-text)] placeholder:text-[var(--admin-text-faint)]
                  focus:outline-none focus:border-primary-pink/50 transition-colors
                "
              />
            </div>
          </div>

          {/* Client rows */}
          <div className="flex-1 overflow-y-auto">
            {clientsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
                <Users size={22} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
                <p className="text-[12px] text-[var(--admin-text-faint)]">
                  {search
                    ? (isAr ? "لم يُعثر على عملاء" : "No clients found")
                    : (isAr ? "لا يوجد عملاء" : "No clients")}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredClients.map(client => {
                  const isSelected = selected?.id === client.id;
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelected(isSelected ? null : client)}
                      className={[
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-left",
                        isSelected
                          ? "bg-primary-pink/10"
                          : "hover:bg-[var(--admin-hover-bg)]",
                      ].join(" ")}
                    >
                      {/* Avatar */}
                      <div className={[
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                        isSelected
                          ? "bg-primary-pink text-white"
                          : `${client.avatarGradient} text-white`,
                      ].join(" ")}>
                        {client.avatarInitials}
                      </div>
                      {/* Name + count */}
                      <div className="flex-1 min-w-0">
                        <p className={[
                          "text-[12.5px] font-semibold truncate",
                          isSelected ? "text-primary-pink" : "text-[var(--admin-text)]",
                        ].join(" ")}>
                          {clientDisplayName(client)}
                        </p>
                        <p className="text-[10.5px] text-[var(--admin-text-faint)]">
                          {client.files.length}{" "}
                          {isAr
                            ? "ملف"
                            : client.files.length === 1 ? "file" : "files"}
                        </p>
                      </div>
                      <ChevronRight
                        size={13}
                        className={isSelected ? "text-primary-pink shrink-0" : "text-[var(--admin-text-faint)] shrink-0"}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: file viewer ───────────────────────────────────────── */}
        <div
          className={[
            "flex-1 bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] flex flex-col overflow-hidden",
            !selected ? "hidden lg:flex" : "flex",
          ].join(" ")}
        >
          {!selected ? (
            /* No client selected — empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
                <Users size={24} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[var(--admin-text)]">
                  {isAr ? "اختر عميلاً" : "Select a client"}
                </p>
                <p className="text-[12px] text-[var(--admin-text-faint)] mt-1 max-w-xs leading-relaxed">
                  {isAr
                    ? "اختر عميلاً من القائمة لعرض ملفاته المرفوعة."
                    : "Choose a client from the list to view their uploaded files."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Client header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--admin-border)] shrink-0">
                {/* Mobile back button */}
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
                  title={isAr ? "رجوع" : "Back"}
                >
                  <ArrowLeft size={15} strokeWidth={2} />
                </button>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white ${selected.avatarGradient}`}>
                  {selected.avatarInitials}
                </div>
                {/* Name + count */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[var(--admin-text)] truncate">
                    {clientDisplayName(selected)}
                  </p>
                  <p className="text-[11px] text-[var(--admin-text-faint)]">
                    {filesLoading
                      ? (isAr ? "جارٍ التحميل…" : "Loading…")
                      : `${totalFiles} ${isAr ? "ملف" : totalFiles === 1 ? "file" : "files"}`}
                  </p>
                </div>
              </div>

              {/* File content */}
              {filesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary-pink/20 border-t-primary-pink rounded-full animate-spin" />
                </div>
              ) : totalFiles === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
                    <FileIcon size={20} strokeWidth={1.2} className="text-[var(--admin-text-faint)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--admin-text)]">
                      {isAr ? "لا توجد ملفات" : "No files yet"}
                    </p>
                    <p className="text-[11.5px] text-[var(--admin-text-faint)] mt-1 max-w-xs leading-relaxed">
                      {isAr
                        ? "يمكنك رفع الملفات من ملف العميل أو خطط التغذية."
                        : "Upload files from the client profile or nutrition plans."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-[var(--admin-border)]">

                  {/* ── Client Files ───────────────────────────────────── */}
                  <FileSection
                    title={isAr ? "ملفات العميل" : "Client Files"}
                    icon={FileIcon}
                    count={clientFiles.length}
                    emptyMsg={
                      isAr
                        ? "لا توجد ملفات مرفوعة مباشرة لهذا العميل."
                        : "No files uploaded directly for this client."
                    }
                  >
                    {clientFiles.map(f => (
                      <FileRow
                        key={f.id}
                        filename={f.filename}
                        type={f.type}
                        size={f.size}
                        date={f.uploaded_at}
                        url={f.url}
                        onPreview={setPreview}
                      />
                    ))}
                  </FileSection>

                  {/* ── Nutrition Plan Files ───────────────────────────── */}
                  <FileSection
                    title={isAr ? "ملفات خطط التغذية" : "Nutrition Plan Files"}
                    icon={BookOpen}
                    count={planFiles.length}
                    emptyMsg={
                      isAr
                        ? "لا توجد ملفات مرفوعة على خطط التغذية."
                        : "No files attached to nutrition plans."
                    }
                  >
                    {planFiles.map(f => (
                      <FileRow
                        key={f.id}
                        filename={f.filename}
                        type={f.file_type}
                        size={f.size}
                        date={f.created_at}
                        url={f.url}
                        subtitle={
                          f.plan_name
                            ? (isAr ? `الخطة: ${f.plan_name}` : `Plan: ${f.plan_name}`)
                            : undefined
                        }
                        onPreview={setPreview}
                      />
                    ))}
                  </FileSection>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {preview && (
          <PreviewModal
            key="preview"
            target={preview}
            isAr={isAr}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
