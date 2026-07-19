/**
 * GlobalSearchModal — keyboard-accessible search across Clients, Bookings,
 * Assessments and Nutrition Plans.
 *
 * Open:  search button in Topbar (or Cmd/Ctrl + K)
 * Close: Escape · click backdrop · click result
 *
 * Each result set is capped at 4 rows to keep the panel compact.
 * Results navigate directly to the relevant admin page.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Users, Calendar, ClipboardList, Utensils, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Result shape ──────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  category: "client" | "booking" | "assessment" | "nutrition";
  label: string;
  sublabel?: string;
  href: string;
}

const CATEGORY_META: Record<SearchResult["category"], { icon: typeof Users; color: string; title: string; titleAr: string }> = {
  client:     { icon: Users,         color: "text-purple-500",  title: "Clients",        titleAr: "العملاء"         },
  booking:    { icon: Calendar,      color: "text-blue-500",    title: "Bookings",       titleAr: "الحجوزات"        },
  assessment: { icon: ClipboardList, color: "text-emerald-500", title: "Assessments",    titleAr: "التقييمات"       },
  nutrition:  { icon: Utensils,      color: "text-pink-500",    title: "Nutrition Plans",titleAr: "خطط التغذية"     },
};

const ORDER: SearchResult["category"][] = ["client", "booking", "assessment", "nutrition"];

// ── Queries ───────────────────────────────────────────────────────────────────

async function runSearch(q: string): Promise<SearchResult[]> {
  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  const [clients, bookings, assessments, plans] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, email")
      .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(4),

    supabase
      .from("appointments")
      .select("id, client_name, client_email, date, type")
      .or(`client_name.ilike.${pattern},client_email.ilike.${pattern}`)
      .limit(4),

    supabase
      .from("assessment_responses")
      .select("id, client_email, client_id, status, submitted_at")
      .ilike("client_email", pattern)
      .limit(4),

    supabase
      .from("nutrition_plans")
      .select("id, name, client_id, status")
      .ilike("name", pattern)
      .limit(4),
  ]);

  for (const row of clients.data ?? []) {
    results.push({
      id:       row.id,
      category: "client",
      label:    row.full_name || row.email || "—",
      sublabel: row.email,
      href:     `/admin/clients/${row.id}`,
    });
  }

  for (const row of bookings.data ?? []) {
    results.push({
      id:       row.id,
      category: "booking",
      label:    row.client_name || row.client_email || "—",
      sublabel: row.date ? `${row.date}${row.type ? " · " + row.type : ""}` : undefined,
      href:     `/admin/bookings`,
    });
  }

  for (const row of assessments.data ?? []) {
    results.push({
      id:       row.id,
      category: "assessment",
      label:    row.client_email || "—",
      sublabel: row.status,
      href:     row.client_id ? `/admin/clients/${row.client_id}` : `/admin/assessment-templates`,
    });
  }

  for (const row of plans.data ?? []) {
    results.push({
      id:       row.id,
      category: "nutrition",
      label:    row.name || "—",
      sublabel: row.status,
      href:     row.client_id ? `/admin/clients/${row.client_id}` : `/admin/clients`,
    });
  }

  return results;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  lang: "en" | "ar";
}

export default function GlobalSearchModal({ open, onClose, lang }: Props) {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setFocused(-1);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!open) return; // let Topbar handle opening
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await runSearch(q.trim());
      setResults(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation through results
  const flatResults = ORDER.flatMap(cat => results.filter(r => r.category === cat));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(f => Math.min(f + 1, flatResults.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && focused >= 0 && flatResults[focused]) {
      go(flatResults[focused].href);
    }
  };

  const go = (href: string) => {
    onClose();
    navigate(href);
  };

  const grouped = ORDER.map(cat => ({
    cat,
    items: results.filter(r => r.category === cat),
  })).filter(g => g.items.length > 0);

  let flatIdx = 0;

  const isAr = lang === "ar";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{ opacity: 0,    y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[1101] w-full max-w-lg px-4"
          >
            <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">

              {/* Search input row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--admin-border)]">
                {loading
                  ? <Loader2 size={16} className="text-[var(--admin-text-faint)] animate-spin shrink-0" />
                  : <Search   size={16} className="text-[var(--admin-text-faint)] shrink-0" strokeWidth={1.8} />
                }
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setFocused(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isAr ? "ابحث في العملاء، الحجوزات، التقييمات…" : "Search clients, bookings, assessments…"}
                  className="flex-1 bg-transparent text-[14px] text-[var(--admin-text)] placeholder:text-[var(--admin-text-faint)] outline-none min-w-0"
                  style={{ border: "none" }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--admin-hover-bg)] text-[var(--admin-text-faint)] transition-colors"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Results / empty states */}
              <div className="max-h-[420px] overflow-y-auto">
                {query.trim().length < 2 && (
                  <div className="px-5 py-8 text-center">
                    <Search size={28} className="mx-auto text-[var(--admin-text-faint)] mb-2" strokeWidth={1.4} />
                    <p className="text-[13px] text-[var(--admin-text-faint)]">
                      {isAr ? "اكتب حرفين للبحث" : "Type at least 2 characters to search"}
                    </p>
                  </div>
                )}

                {query.trim().length >= 2 && !loading && results.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[13px] text-[var(--admin-text-faint)]">
                      {isAr ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`}
                    </p>
                  </div>
                )}

                {grouped.map(({ cat, items }) => {
                  const meta = CATEGORY_META[cat];
                  const Icon = meta.icon;
                  return (
                    <div key={cat}>
                      {/* Group header */}
                      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                        <Icon size={12} className={meta.color} strokeWidth={2} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-faint)]">
                          {isAr ? meta.titleAr : meta.title}
                        </span>
                      </div>

                      {/* Result rows */}
                      {items.map(item => {
                        const idx = flatIdx++;
                        const isFocused = focused === idx;
                        return (
                          <button
                            key={item.id + cat}
                            type="button"
                            onClick={() => go(item.href)}
                            onMouseEnter={() => setFocused(idx)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors
                              ${isFocused
                                ? "bg-[var(--admin-active-bg)]"
                                : "hover:bg-[var(--admin-hover-bg)]"
                              }
                            `}
                          >
                            <Icon size={14} className={`${meta.color} shrink-0`} strokeWidth={1.8} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[var(--admin-text)] truncate">{item.label}</p>
                              {item.sublabel && (
                                <p className="text-[11px] text-[var(--admin-text-faint)] truncate">{item.sublabel}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Bottom padding */}
                {results.length > 0 && <div className="h-2" />}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-[var(--admin-border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--admin-text-faint)]">
                  {isAr ? "↑↓ للتنقل · Enter للفتح · Esc للإغلاق" : "↑↓ navigate · Enter open · Esc close"}
                </span>
                <kbd className="text-[10px] text-[var(--admin-text-faint)] bg-[var(--admin-hover-bg)] px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
