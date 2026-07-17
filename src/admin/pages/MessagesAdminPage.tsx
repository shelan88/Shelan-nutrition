/**
 * MessagesAdminPage — /admin/messages
 *
 * Inbox for all contact form messages submitted via the public website.
 * Features: search, tab filter (Inbox / Archived), per-message actions
 * (mark read, mark unread, archive, delete).
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MailOpen, Archive, Trash2, RefreshCw, Search, X,
  MailCheck, AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import PageHeader from "../components/PageHeader";
import {
  getMessages,
  markMessageRead,
  markMessageUnread,
  archiveMessage,
  unarchiveMessage,
  deleteMessage,
} from "@/admin/repositories/messages.repository";
import type { MessageRow } from "@/types/database.types";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 2)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const STATUS_BADGE: Record<string, string> = {
  unread:  "bg-primary-pink/10 text-primary-pink ring-1 ring-primary-pink/25",
  read:    "bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] ring-1 ring-[var(--admin-border)]",
  replied: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
};

const STATUS_LABEL_EN: Record<string, string> = { unread: "Unread", read: "Read", replied: "Replied" };
const STATUS_LABEL_AR: Record<string, string> = { unread: "غير مقروء", read: "مقروء", replied: "تم الرد" };

export default function MessagesAdminPage() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const [messages,   setMessages]   = useState<MessageRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"inbox" | "archived">("inbox");
  const [search,     setSearch]     = useState("");
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [actioningId,setActioningId]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load both inbox and archived in one shot so counts are accurate
      const [inbox, archived] = await Promise.all([
        getMessages(200),
        getMessages(200, true),
      ]);
      setMessages([...inbox, ...archived]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const inboxMessages   = messages.filter((m) => !m.archived);
  const archivedMessages = messages.filter((m) => m.archived);
  const displayed       = tab === "inbox" ? inboxMessages : archivedMessages;

  const filtered = displayed.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.sender_name.toLowerCase().includes(q) ||
      (m.sender_email ?? "").toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q)
    );
  });

  const unreadCount = inboxMessages.filter((m) => m.status === "unread").length;

  async function doAction(
    id: string,
    fn: (id: string) => Promise<boolean>,
  ): Promise<boolean> {
    setActioningId(id);
    const ok = await fn(id);
    if (ok) await load();
    setActioningId(null);
    return ok;
  }

  return (
    <div>
      <PageHeader
        title={isAr ? "الرسائل" : "Messages"}
        description={
          isAr
            ? "رسائل نموذج التواصل من الموقع الإلكتروني."
            : "Contact form messages from the public website."
        }
        breadcrumbs={[
          { label: isAr ? "الإدارة" : "Admin", href: "/admin" },
          { label: isAr ? "الرسائل" : "Messages" },
        ]}
        actions={
          <button
            onClick={() => load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--admin-border)] text-[12px] font-semibold text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {isAr ? "تحديث" : "Refresh"}
          </button>
        }
      />

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.04)} className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: isAr ? "إجمالي الرسائل" : "Total",
            value: inboxMessages.length,
            color: "from-primary-pink to-soft-pink",
          },
          {
            label: isAr ? "غير مقروءة" : "Unread",
            value: unreadCount,
            color: "from-amber-400 to-orange-400",
          },
          {
            label: isAr ? "أرشيف" : "Archived",
            value: archivedMessages.length,
            color: "from-[var(--admin-text-faint)] to-[var(--admin-text-muted)]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] p-4"
          >
            <p className="text-[11px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className={`text-[26px] font-bold tabular-nums bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>
              {s.value}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Main card ─────────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0.08)}
        className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden"
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[var(--admin-border)]">
          {/* Tabs */}
          <div className="flex rounded-lg border border-[var(--admin-border)] overflow-hidden shrink-0">
            {(["inbox", "archived"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-[12.5px] font-semibold transition-all ${
                  tab === t
                    ? "bg-primary-pink/10 text-primary-pink"
                    : "text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover-bg)]"
                }`}
              >
                {t === "inbox"
                  ? (isAr ? "البريد الوارد" : "Inbox") + (unreadCount > 0 && t === "inbox" ? ` (${unreadCount})` : "")
                  : (isAr ? "الأرشيف" : "Archived")}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو البريد أو المحتوى…" : "Search by name, email, or content…"}
              className="w-full h-9 ps-8 pe-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover-bg)] text-[13px] text-[var(--admin-text)] placeholder:text-[var(--admin-text-faint)] focus:outline-none focus:border-primary-pink/40 focus:ring-2 focus:ring-primary-pink/10 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-faint)] hover:text-[var(--admin-text)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[var(--admin-text-faint)] ms-auto">
            {filtered.length} {isAr ? "رسالة" : filtered.length === 1 ? "message" : "messages"}
          </span>
        </div>

        {/* Message list */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-6 h-6 rounded-full border-2 border-primary-pink/30 border-t-primary-pink animate-spin mb-3" />
            <p className="text-[13px] text-[var(--admin-text-muted)]">{isAr ? "جارٍ التحميل…" : "Loading…"}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Mail size={28} strokeWidth={1.4} className="text-[var(--admin-text-faint)]" />
            <p className="text-[13.5px] font-semibold text-[var(--admin-text-muted)]">
              {tab === "inbox"
                ? (isAr ? "لا توجد رسائل" : "No messages yet")
                : (isAr ? "الأرشيف فارغ" : "Archive is empty")}
            </p>
            <p className="text-[12px] text-[var(--admin-text-faint)]">
              {tab === "inbox"
                ? (isAr ? "ستظهر رسائل نموذج التواصل هنا." : "Contact form messages will appear here.")
                : (isAr ? "الرسائل المؤرشفة ستظهر هنا." : "Archived messages will appear here.")}
            </p>
          </div>
        ) : (
          <div>
            <AnimatePresence initial={false}>
              {filtered.map((msg, idx) => {
                const isExpanded = expanded === msg.id;
                const isUnread   = msg.status === "unread";
                const actioning  = actioningId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="border-b border-[var(--admin-border)] last:border-0"
                  >
                    {/* Row */}
                    <div
                      className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--admin-hover-bg)] transition-colors group ${isUnread ? "bg-primary-pink/[0.025]" : ""}`}
                      onClick={() => {
                        setExpanded(isExpanded ? null : msg.id);
                        if (isUnread) doAction(msg.id, markMessageRead);
                      }}
                    >
                      {/* Avatar initials */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${isUnread ? "bg-gradient-to-br from-primary-pink to-lavender-purple" : "bg-gradient-to-br from-soft-purple to-lavender-purple"}`}>
                        {msg.sender_name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0]?.toUpperCase() ?? "")
                          .join("")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-[13.5px] font-${isUnread ? "bold" : "semibold"} text-[var(--admin-text)] truncate`}>
                            {msg.sender_name}
                          </p>
                          {msg.status && (
                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[msg.status] ?? ""}`}>
                              {isAr ? STATUS_LABEL_AR[msg.status] : STATUS_LABEL_EN[msg.status]}
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--admin-text-faint)] ms-auto shrink-0">
                            {relativeTime(msg.created_at)}
                          </span>
                        </div>
                        {msg.sender_email && (
                          <p className="text-[11.5px] text-[var(--admin-text-faint)] truncate mb-0.5">
                            {msg.sender_email}
                            {msg.sender_phone && ` · ${msg.sender_phone}`}
                          </p>
                        )}
                        <p className={`text-[12.5px] text-[var(--admin-text-muted)] ${isExpanded ? "" : "line-clamp-1"}`}>
                          {msg.content}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary-pink shrink-0 mt-1.5" />
                      )}
                    </div>

                    {/* Expanded actions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-2 px-5 py-3 bg-[var(--admin-hover-bg)] border-t border-[var(--admin-border)] flex-wrap">
                            {/* Source badge */}
                            {msg.source && (
                              <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[var(--admin-surface)] text-[var(--admin-text-faint)] border border-[var(--admin-border)] me-2">
                                {isAr ? "المصدر:" : "Source:"} {msg.source}
                              </span>
                            )}

                            {/* Mark unread */}
                            {msg.status !== "unread" && (
                              <button
                                disabled={actioning}
                                onClick={(e) => { e.stopPropagation(); doAction(msg.id, markMessageUnread); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-colors disabled:opacity-50"
                              >
                                <Mail size={12} />
                                {isAr ? "علّم كغير مقروء" : "Mark unread"}
                              </button>
                            )}

                            {/* Mark read */}
                            {msg.status === "unread" && (
                              <button
                                disabled={actioning}
                                onClick={(e) => { e.stopPropagation(); doAction(msg.id, markMessageRead); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-colors disabled:opacity-50"
                              >
                                <MailOpen size={12} />
                                {isAr ? "علّم كمقروء" : "Mark read"}
                              </button>
                            )}

                            {/* Archive / Unarchive */}
                            {!msg.archived ? (
                              <button
                                disabled={actioning}
                                onClick={(e) => { e.stopPropagation(); doAction(msg.id, archiveMessage); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-colors disabled:opacity-50"
                              >
                                <Archive size={12} />
                                {isAr ? "أرشفة" : "Archive"}
                              </button>
                            ) : (
                              <button
                                disabled={actioning}
                                onClick={(e) => { e.stopPropagation(); doAction(msg.id, unarchiveMessage); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--admin-border)] text-[12px] font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface)] transition-colors disabled:opacity-50"
                              >
                                <MailCheck size={12} />
                                {isAr ? "استعادة للبريد" : "Move to inbox"}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              disabled={actioning}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!window.confirm(isAr ? "هل تريدين حذف هذه الرسالة نهائياً؟" : "Permanently delete this message?")) return;
                                doAction(msg.id, deleteMessage);
                                setExpanded(null);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 ms-auto"
                            >
                              <Trash2 size={12} />
                              {isAr ? "حذف" : "Delete"}
                            </button>

                            {actioning && (
                              <span className="ms-2">
                                <AlertCircle size={13} className="text-[var(--admin-text-faint)] animate-pulse" />
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--admin-border)] bg-[var(--admin-hover-bg)]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
            <span className="text-[11px] text-[var(--admin-text-faint)]">
              {loading ? (isAr ? "جارٍ التحميل…" : "Loading…") : (isAr ? "البيانات: Supabase مباشر" : "Data: live via Supabase")}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
