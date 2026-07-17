/**
 * SocialMediaAdminPage — Standalone CMS page for managing social media links.
 *
 * Features:
 *  - Add any of 16 preset platforms (with official brand SVG icons) or a custom platform
 *  - Edit URL per platform
 *  - Toggle visibility (eye / eye-off)
 *  - Reorder with up / down arrows
 *  - Delete with confirmation
 *  - Saves to Supabase as site.social (same key as before — Footer reads it unchanged)
 */
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown,
  Eye, EyeOff, Share2, ExternalLink, X, Copy, Check,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getSetting, setSetting } from "@/admin/repositories/settings.repository";
import {
  getSocialIcon,
  getPlatformEntry,
  PRESET_PLATFORM_NAMES,
} from "@/components/SocialIcons";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SocialLink = {
  id: string;
  platform: string;
  iconEmoji: string;        // kept for backward-compat
  customIconUrl?: string;
  url: string;
  visible: boolean;
  order: number;
};

// ─── Legacy migration ─────────────────────────────────────────────────────────

function migrateLegacySocial(val: unknown): SocialLink[] {
  if (!val || typeof val !== "object" || Array.isArray(val)) return [];
  const old = val as Record<string, string>;
  const mapping = [
    { key: "instagram", platform: "Instagram" },
    { key: "tiktok",    platform: "TikTok" },
    { key: "youtube",   platform: "YouTube" },
    { key: "facebook",  platform: "Facebook" },
    { key: "snapchat",  platform: "Snapchat" },
    { key: "whatsapp",  platform: "WhatsApp" },
    { key: "telegram",  platform: "Telegram" },
  ];
  return mapping
    .filter(m => old[m.key])
    .map((m, i) => ({ id: m.key, platform: m.platform, iconEmoji: "", url: old[m.key], visible: true, order: i }));
}

// ─── Small reusable field ──────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

// ─── Platform Picker Modal ─────────────────────────────────────────────────────

function PlatformPicker({
  lang,
  existing,
  onAdd,
  onClose,
}: {
  lang: "en" | "ar";
  existing: SocialLink[];
  onAdd: (link: SocialLink) => void;
  onClose: () => void;
}) {
  const [customName, setCustomName] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const addedSet = new Set(existing.map(l => l.platform.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.22 }}
        className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl shadow-black/20 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--admin-border)]">
          <p className="text-[13px] font-bold text-[var(--admin-text)]">
            {lang === "ar" ? "إضافة منصة" : "Add Platform"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Preset grid */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-faint)] mb-2 px-1">
            {lang === "ar" ? "المنصات المتاحة" : "Available Platforms"}
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
            {PRESET_PLATFORM_NAMES.map(name => {
              const alreadyAdded = addedSet.has(name.toLowerCase());
              return (
                <button
                  key={name}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => {
                    onAdd({
                      id: crypto.randomUUID(),
                      platform: name,
                      iconEmoji: "",
                      url: "",
                      visible: true,
                      order: existing.length,
                    });
                    onClose();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-start transition-colors
                    ${alreadyAdded
                      ? "opacity-40 cursor-default"
                      : "hover:bg-[var(--admin-hover-bg)] text-[var(--admin-text-muted)]"
                    }`}
                >
                  {getSocialIcon(name, { size: 20 })}
                  <span className="truncate">{name}</span>
                  {alreadyAdded && (
                    <span className="ms-auto text-[10px] text-[var(--admin-text-faint)]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom platform */}
        <div className="border-t border-[var(--admin-border)] mx-3 my-2" />
        <div className="px-3 pb-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-faint)] mb-1.5 px-1">
            {lang === "ar" ? "منصة مخصصة" : "Custom Platform"}
          </p>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder={lang === "ar" ? "اسم المنصة" : "Platform name"}
            className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
          />
          <input
            value={customIconUrl}
            onChange={e => setCustomIconUrl(e.target.value)}
            placeholder={lang === "ar" ? "رابط أيقونة (اختياري)" : "Icon image URL (optional)"}
            className="w-full px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors"
          />
          <button
            type="button"
            disabled={!customName.trim()}
            onClick={() => {
              onAdd({
                id: crypto.randomUUID(),
                platform: customName.trim(),
                iconEmoji: "",
                customIconUrl: customIconUrl.trim() || undefined,
                url: "",
                visible: true,
                order: existing.length,
              });
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[12px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            {lang === "ar" ? "إضافة" : "Add Custom"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SocialMediaAdminPage() {
  const { lang } = useLanguage();

  const [links, setLinks]           = useState<SocialLink[]>([]);
  const [loaded, setLoaded]         = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [copiedId, setCopiedId]     = useState<string | null>(null);

  const copyUrl = (id: string, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  // Load from DB
  useEffect(() => {
    getSetting("site.social").then(val => {
      if (Array.isArray(val)) {
        setLinks(val as SocialLink[]);
      } else if (val && typeof val === "object") {
        setLinks(migrateLegacySocial(val));
      } else {
        setLinks([]);
      }
      setLoaded(true);
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await setSetting("site.social", links as any);
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }, [links]);

  const sorted = [...links].sort((a, b) => a.order - b.order);

  const move = (idx: number, dir: -1 | 1) => {
    setLinks(prev => {
      const s = [...prev].sort((a, b) => a.order - b.order).map((l, i) => ({ ...l, order: i }));
      const a = s[idx], b = s[idx + dir];
      s[idx] = { ...a, order: b.order };
      s[idx + dir] = { ...b, order: a.order };
      return s;
    });
  };

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "روابط التواصل الاجتماعي" : "Social Media"}
        description={
          lang === "ar"
            ? "أضف روابط منصات التواصل الاجتماعي وتحكم في ترتيبها وظهورها في تذييل الموقع."
            : "Add social platform links and control their order and visibility in the public website footer."
        }
        breadcrumbs={[
          { label: lang === "ar" ? "الإدارة" : "Admin", href: "/admin" },
          { label: lang === "ar" ? "التواصل الاجتماعي" : "Social Media" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={14} />
            {lang === "ar" ? "إضافة منصة" : "Add Platform"}
          </button>
        }
      />

      <motion.div {...fadeUp(0)} className="space-y-3">

        {/* ── Empty state ─────────────────────────────────────────────────────── */}
        {loaded && sorted.length === 0 && (
          <motion.div {...fadeUp(0.05)} className="rounded-2xl border-2 border-dashed border-[var(--admin-border)] p-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--admin-hover-bg)] flex items-center justify-center">
              <Share2 size={26} className="text-[var(--admin-text-faint)]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--admin-text)]">
                {lang === "ar" ? "لا توجد منصات بعد" : "No platforms yet"}
              </p>
              <p className="text-[12px] text-[var(--admin-text-faint)] mt-1 max-w-xs mx-auto">
                {lang === "ar"
                  ? "أضف أول منصة تواصل اجتماعي لتظهر في تذييل الموقع."
                  : "Add your first social platform and it will appear in the website footer."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={13} />
              {lang === "ar" ? "إضافة منصة" : "Add Platform"}
            </button>
          </motion.div>
        )}

        {/* ── Platform rows ────────────────────────────────────────────────────── */}
        {loaded && sorted.length > 0 && (
          <motion.div
            {...fadeUp(0.05)}
            className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden"
          >
            <div className="divide-y divide-[var(--admin-border)]">
              {sorted.map((link, idx) => {
                const { frameClass } = getPlatformEntry(link.platform);
                const isCopied = copiedId === link.id;
                return (
                  <div
                    key={link.id}
                    className={`px-4 py-3.5 space-y-2.5 transition-colors hover:bg-[var(--admin-hover-bg)]/30 ${!link.visible ? "opacity-50" : ""}`}
                  >
                    {/* ── Row 1: icon + name + controls ────────────────────── */}
                    <div className="flex items-center gap-2.5">
                      {/* Brand icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${frameClass} shrink-0`}>
                        {getSocialIcon(link.platform, {
                          customIconUrl: link.customIconUrl,
                          iconEmoji: link.iconEmoji,
                          size: 20,
                        })}
                      </div>

                      {/* Platform name */}
                      <span className="flex-1 text-[13px] font-semibold text-[var(--admin-text)] truncate min-w-0">
                        {link.platform}
                      </span>

                      {/* Controls: visibility · up · down · delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title={link.visible ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "إظهار" : "Show")}
                          onClick={() => setLinks(prev => prev.map(l => l.id === link.id ? { ...l, visible: !l.visible } : l))}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors
                            ${link.visible
                              ? "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
                              : "border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)]"
                            }`}
                        >
                          {link.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => move(idx, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sorted.length - 1}
                          onClick={() => move(idx, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          title={lang === "ar" ? "حذف" : "Delete"}
                          onClick={() => {
                            if (window.confirm(lang === "ar" ? `حذف ${link.platform}؟` : `Delete ${link.platform}?`)) {
                              setLinks(prev => prev.filter(l => l.id !== link.id));
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:border-red-800 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* ── Row 2: full-width URL + copy + open ──────────────── */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => setLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                        placeholder="https://..."
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] text-[12px] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink/40 transition-colors overflow-x-auto"
                        dir="ltr"
                        style={{ textOverflow: "clip" }}
                      />
                      {/* Copy URL */}
                      <button
                        type="button"
                        title={lang === "ar" ? "نسخ الرابط" : "Copy URL"}
                        disabled={!link.url}
                        onClick={() => copyUrl(link.id, link.url)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors shrink-0
                          ${isCopied
                            ? "border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
                            : "border-[var(--admin-border)] text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] disabled:opacity-30"
                          }`}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      {/* Open link */}
                      <a
                        href={link.url || "#"}
                        target={link.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        title={lang === "ar" ? "فتح الرابط" : "Open link"}
                        tabIndex={link.url ? 0 : -1}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--admin-border)] transition-colors shrink-0
                          ${link.url
                            ? "text-[var(--admin-text-faint)] hover:bg-[var(--admin-hover-bg)] hover:text-[var(--admin-text-muted)]"
                            : "opacity-30 pointer-events-none"
                          }`}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Footer preview hint ──────────────────────────────────────────────── */}
        {loaded && sorted.length > 0 && (
          <motion.p {...fadeUp(0.1)} className="text-[11px] text-[var(--admin-text-faint)] text-center">
            {lang === "ar"
              ? "الأيقونات الظاهرة فقط ستظهر في تذييل الموقع العام."
              : "Only visible platforms will appear in the public website footer."}
          </motion.p>
        )}

        {/* ── Save bar ─────────────────────────────────────────────────────────── */}
        {loaded && (
          <motion.div {...fadeUp(0.12)} className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-pink to-lavender-purple text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              <Save size={14} />
              {saving
                ? (lang === "ar" ? "جارٍ الحفظ…" : "Saving…")
                : saved
                ? (lang === "ar" ? "تم الحفظ ✓" : "Saved! ✓")
                : (lang === "ar" ? "حفظ التغييرات" : "Save Changes")}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Platform picker modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {pickerOpen && (
          <PlatformPicker
            lang={lang}
            existing={links}
            onAdd={link => setLinks(prev => [...prev, link])}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
