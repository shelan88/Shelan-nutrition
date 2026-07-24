/**
 * DebugPanel — floating, draggable, collapsible developer debug panel.
 *
 * Available on every page (public + admin) in DEV mode only.
 * Renders nothing in production (import.meta.env.DEV guard).
 *
 * TEMPORARY — remove this file + the <DebugPanel /> in App.tsx when
 * the project ships to production.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getLogs, subscribe, clearLogs, pauseLogs, resumeLogs,
  copyLogsToClipboard, exportLogsAsJson, isPaused,
  type DebugEntry, type LogCategory,
} from "./logger";
import {
  isTraceModeActive, setTraceModeActive,
  subscribeTrace, getCurrentTrace, getLastTrace,
  type Trace,
} from "./traceStore";
import InspectOverlay, { type InspectedInfo } from "./InspectOverlay";

// ── Category metadata ─────────────────────────────────────────────────────────

type FilterId = LogCategory | "all";

const CAT: Record<LogCategory, { label: string; dot: string; chip: string }> = {
  navigation:  { label: "NAV",   dot: "#60a5fa", chip: "bg-blue-900/60 text-blue-300"    },
  database:    { label: "DB",    dot: "#c084fc", chip: "bg-purple-900/60 text-purple-300" },
  media:       { label: "MEDIA", dot: "#fb923c", chip: "bg-orange-900/60 text-orange-300" },
  forms:       { label: "FORM",  dot: "#22d3ee", chip: "bg-cyan-900/60 text-cyan-300"    },
  auth:        { label: "AUTH",  dot: "#818cf8", chip: "bg-indigo-900/60 text-indigo-300" },
  sections:    { label: "SECT",  dot: "#2dd4bf", chip: "bg-teal-900/60 text-teal-300"    },
  components:  { label: "COMP",  dot: "#38bdf8", chip: "bg-sky-900/60 text-sky-300"      },
  network:     { label: "NET",   dot: "#a78bfa", chip: "bg-violet-900/60 text-violet-300" },
  performance: { label: "PERF",  dot: "#a3e635", chip: "bg-lime-900/60 text-lime-300"    },
  errors:      { label: "ERR",   dot: "#f87171", chip: "bg-red-900/60 text-red-300"      },
  storage:     { label: "STOR",  dot: "#fbbf24", chip: "bg-amber-900/60 text-amber-300"  },
  language:    { label: "LANG",  dot: "#f472b6", chip: "bg-pink-900/60 text-pink-300"    },
  trace:       { label: "TRACE", dot: "#34d399", chip: "bg-emerald-900/60 text-emerald-300" },
  general:     { label: "GEN",   dot: "#94a3b8", chip: "bg-zinc-700/60 text-zinc-300"    },
};

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all",         label: "All"   },
  { id: "navigation",  label: "NAV"   },
  { id: "database",    label: "DB"    },
  { id: "network",     label: "NET"   },
  { id: "forms",       label: "FORM"  },
  { id: "auth",        label: "AUTH"  },
  { id: "sections",    label: "SECT"  },
  { id: "components",  label: "COMP"  },
  { id: "media",       label: "MEDIA" },
  { id: "performance", label: "PERF"  },
  { id: "errors",      label: "ERR"   },
  { id: "storage",     label: "STOR"  },
  { id: "language",    label: "LANG"  },
];

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({ entry }: { entry: DebugEntry }) {
  const cat  = CAT[entry.category];
  const rowBg =
    entry.level === "error" ? "bg-red-950/30 border-red-900/20"
    : entry.level === "warn" ? "bg-yellow-950/20 border-yellow-900/20"
    : "border-white/5";

  const resultIcon =
    entry.result === "success" ? <span className="text-emerald-400">✓</span>
    : entry.result === "error"   ? <span className="text-red-400">✕</span>
    : entry.result === "warning" ? <span className="text-yellow-400">⚠</span>
    : null;

  return (
    <div className={`flex items-start gap-1.5 px-2 py-[4px] border-b ${rowBg} font-mono text-[10.5px] leading-tight`}>
      {/* Level dot */}
      <span
        className="mt-[3px] shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ background: cat.dot }}
      />

      {/* Timestamp */}
      <span className="shrink-0 text-white/30 w-[72px]">{entry.timestamp}</span>

      {/* Category chip */}
      <span className={`shrink-0 px-1 rounded text-[9px] font-bold uppercase mt-px ${cat.chip}`}>
        {cat.label}
      </span>

      {/* Module›Action */}
      <span className="flex-1 min-w-0 truncate text-white/80">
        <span className="text-white/50">{entry.module}</span>
        <span className="text-white/30 mx-0.5">›</span>
        <span>{entry.action}</span>
      </span>

      {/* Result */}
      {resultIcon && <span className="shrink-0 mt-px">{resultIcon}</span>}

      {/* Duration */}
      {entry.durationMs != null && (
        <span className="shrink-0 text-white/30 text-[9px] mt-px">{entry.durationMs}ms</span>
      )}

      {/* Table chip */}
      {entry.table && (
        <span className="shrink-0 px-1 rounded bg-purple-900/40 text-purple-300 text-[9px] mt-px truncate max-w-[100px]">
          {entry.table}
        </span>
      )}

      {/* Error */}
      {entry.error && (
        <span className="shrink-0 text-red-400 text-[9px] mt-px max-w-[120px] truncate" title={entry.error}>
          {entry.error}
        </span>
      )}
    </div>
  );
}

// ── Trace step list ───────────────────────────────────────────────────────────

function TraceStepList({ trace }: { trace: Trace }) {
  const STEP_COLORS: Record<string, string> = {
    "Click":      "bg-blue-500",
    "Component":  "bg-sky-500",
    "Function":   "bg-cyan-500",
    "Repository": "bg-purple-500",
    "Supabase":   "bg-violet-500",
  };
  return (
    <div className="space-y-0">
      {trace.steps.map((step, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex flex-col items-center">
            <span className={`w-2 h-2 rounded-full mt-[5px] shrink-0 ${STEP_COLORS[step.label] ?? "bg-zinc-500"}`} />
            {i < trace.steps.length - 1 && (
              <span className="w-px flex-1 bg-white/10 mt-1" />
            )}
          </div>
          <div className="pb-2 min-w-0">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{step.label}</span>
            <p className="font-mono text-[10px] text-white/50 break-all leading-tight mt-0.5">{step.detail}</p>
            {step.durationMs != null && (
              <span className="text-[9px] text-white/30">{step.durationMs}ms</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main inner panel ─────────────────────────────────────────────────────────

type TabId = "logs" | "inspector" | "trace";

const PANEL_W = 560;

function DebugPanelInner() {
  // Panel state
  const [open,      setOpen]      = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("logs");
  const [pos,       setPos]       = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(0, window.innerWidth  - PANEL_W - 16) : 20,
    y: typeof window !== "undefined" ? Math.max(0, window.innerHeight - 540)          : 20,
  }));

  // Drag
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // Logs state
  const [entries, setEntries] = useState<DebugEntry[]>(() => [...getLogs()]);
  const [filter,  setFilter]  = useState<FilterId>("all");
  const [paused,  setPaused]  = useState(() => isPaused());
  const listRef    = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  // Inspector state
  const [inspectMode,   setInspectMode]   = useState(false);
  const [inspectedInfo, setInspectedInfo] = useState<InspectedInfo | null>(null);

  // Trace state
  const [traceMode,   setTraceModeLocal] = useState(() => isTraceModeActive());
  const [currentTrace, setCurrentTrace]  = useState<Trace | null>(() => getCurrentTrace());
  const [lastTrace,    setLastTrace]     = useState<Trace | null>(() => getLastTrace());

  // ── Subscribe to logger ────────────────────────────────────────────────────
  useEffect(() => {
    return subscribe((event) => {
      if (event === "__clear__")  { setEntries([]);                return; }
      if (event === "__pause__")  { setPaused(true);               return; }
      if (event === "__resume__") { setPaused(false);              return; }
      setEntries((prev) => [...prev, event]);
    });
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoScroll.current || !open || activeTab !== "logs") return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, open, activeTab]);

  // ── Subscribe to trace ─────────────────────────────────────────────────────
  useEffect(() => {
    return subscribeTrace(() => {
      setCurrentTrace(getCurrentTrace());
      setLastTrace(getLastTrace());
    });
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    setIsDragging(true);
  }, [pos]);

  useEffect(() => {
    if (!isDragging) return;
    function onMove(e: MouseEvent) {
      if (!dragStart.current) return;
      const { mx, my, px, py } = dragStart.current;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - PANEL_W, px + e.clientX - mx)),
        y: Math.max(0, Math.min(window.innerHeight - 40,      py + e.clientY - my)),
      });
    }
    function onUp() { setIsDragging(false); dragStart.current = null; }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, [isDragging]);

  // ── Derived counters ───────────────────────────────────────────────────────
  const errorCount     = entries.filter((e) => e.level === "error").length;
  const warnCount      = entries.filter((e) => e.level === "warn").length;
  const slowQueryCount = entries.filter(
    (e) => e.level === "warn" && e.category === "performance" && e.module === "Supabase",
  ).length;
  const filtered   = filter === "all" ? entries : entries.filter((e) => e.category === filter);

  // ── Toolbar actions ────────────────────────────────────────────────────────
  function togglePause() {
    if (paused) resumeLogs(); else pauseLogs();
  }
  function toggleTrace() {
    const next = !traceMode;
    setTraceModeLocal(next);
    setTraceModeActive(next);
  }

  // ── Inspect callback ───────────────────────────────────────────────────────
  const handleInspect = useCallback((info: InspectedInfo) => {
    setInspectedInfo(info);
    setActiveTab("inspector");
  }, []);

  // ── Collapsed pill ─────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        data-debug-panel=""
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 999999,
          background: "rgba(8,8,20,0.95)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          fontFamily: "ui-monospace, monospace", fontSize: 11, fontWeight: 700,
          cursor: "pointer", userSelect: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <span className="text-white/50">🐛</span>
        <span className="text-white/70">{entries.length}</span>
        {slowQueryCount > 0 && <span className="text-amber-300">🐢{slowQueryCount}</span>}
        {warnCount > 0  && <span className="text-yellow-400">⚠{warnCount}</span>}
        {errorCount > 0 && <span className="text-red-400">✕{errorCount}</span>}
        <span className="text-white/30">▲</span>
      </button>
    );
  }

  // ── Full panel ─────────────────────────────────────────────────────────────
  return (
    <>
      <InspectOverlay active={inspectMode} onInspect={handleInspect} />

      <div
        data-debug-panel=""
        style={{
          position:    "fixed",
          left:        pos.x,
          top:         pos.y,
          width:       PANEL_W,
          maxHeight:   "72vh",
          zIndex:      999999,
          display:     "flex",
          flexDirection: "column",
          background:  "rgba(7,7,18,0.97)",
          backdropFilter: "blur(16px)",
          border:      "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          boxShadow:   "0 25px 60px rgba(0,0,0,0.7)",
          fontFamily:  "ui-monospace, SFMono-Regular, monospace",
          userSelect:  isDragging ? "none" : "auto",
          cursor:      isDragging ? "grabbing" : "default",
          overflow:    "hidden",
        }}
      >
        {/* ── Header (drag handle) ─────────────────────────────────────── */}
        <div
          onMouseDown={onDragStart}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 shrink-0"
        >
          <span className="text-white/40 text-[12px]">🐛</span>
          <span className="text-white/70 text-[11px] font-bold tracking-wider flex-1">SHELAN DEV</span>

          {/* Mode badges */}
          {inspectMode && (
            <span className="px-1.5 py-0.5 rounded bg-teal-600/30 text-teal-300 text-[9px] font-bold uppercase">INSPECT</span>
          )}
          {traceMode && (
            <span className="px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 text-[9px] font-bold uppercase">TRACE</span>
          )}

          {/* Counters */}
          <span className="text-white/30 text-[10px]">{entries.length}</span>
          {slowQueryCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase ring-1 ring-amber-500/40" title={`${slowQueryCount} slow query${slowQueryCount > 1 ? "s" : ""} detected (>${800}ms)`}>
              🐢 {slowQueryCount} slow
            </span>
          )}
          {warnCount  > 0 && <span className="text-yellow-400 text-[10px] font-bold">⚠{warnCount}</span>}
          {errorCount > 0 && <span className="text-red-400   text-[10px] font-bold">✕{errorCount}</span>}

          {/* Collapse */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setOpen(false)}
            className="text-white/30 hover:text-white/60 transition-colors text-[14px] leading-none px-1"
          >−</button>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex border-b border-white/10 shrink-0">
          {(["logs", "inspector", "trace"] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-white border-sky-400"
                  : "text-white/30 border-transparent hover:text-white/60"
              }`}
            >
              {tab}
              {tab === "logs" && entries.length > 0 && (
                <span className="ml-1 opacity-50">({entries.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          {/* ── LOGS TAB ─────────────────────────────────────────────── */}
          {activeTab === "logs" && (
            <>
              {/* Filter chips */}
              <div className="flex flex-wrap gap-1 px-2 pt-2 pb-1 border-b border-white/5 shrink-0">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                      filter === f.id
                        ? "bg-sky-500/30 text-sky-300 ring-1 ring-sky-500/50"
                        : "bg-white/5 text-white/30 hover:text-white/60"
                    }`}
                  >
                    {f.label}
                    {f.id !== "all" && (
                      <span className="ml-0.5 opacity-60">
                        ({entries.filter((e) => e.category === f.id).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1.5 px-2 py-1 border-b border-white/5 shrink-0">
                <button
                  onClick={togglePause}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                    paused
                      ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40"
                      : "bg-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button onClick={() => clearLogs()} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/40 hover:text-white/70 uppercase">
                  🗑 Clear
                </button>
                <button onClick={() => copyLogsToClipboard()} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/40 hover:text-white/70 uppercase">
                  📋 Copy
                </button>
                <button onClick={() => exportLogsAsJson()} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/40 hover:text-white/70 uppercase">
                  ⬇ Export
                </button>
                {paused && (
                  <span className="text-yellow-400/70 text-[9px] ml-auto">Logging paused</span>
                )}
              </div>

              {/* Log list */}
              <div
                ref={listRef}
                onScroll={() => {
                  const el = listRef.current;
                  if (!el) return;
                  autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
                }}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
                style={{ minHeight: 120 }}
              >
                {filtered.length === 0 && (
                  <p className="text-white/20 text-center py-8 text-[11px]">
                    {entries.length === 0 ? "No logs yet — interact with the app." : "No logs match this filter."}
                  </p>
                )}
                {filtered.map((entry) => <LogRow key={entry.id} entry={entry} />)}
              </div>
            </>
          )}

          {/* ── INSPECTOR TAB ─────────────────────────────────────────── */}
          {activeTab === "inspector" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <button
                onClick={() => setInspectMode((v) => !v)}
                className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  inspectMode
                    ? "bg-teal-600/30 text-teal-200 ring-1 ring-teal-500/50"
                    : "bg-white/5 text-white/40 hover:text-white/70"
                }`}
              >
                {inspectMode ? "🔍 Inspect Mode ON — click any element" : "Enable Inspect Mode"}
              </button>

              {inspectedInfo ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1.5 text-[10.5px]">
                  <Row k="Component"   v={inspectedInfo.componentName} accent />
                  {inspectedInfo.sourceFile  && <Row k="Source"     v={inspectedInfo.sourceFile} />}
                  {inspectedInfo.sectionId   && <Row k="Section ID" v={inspectedInfo.sectionId} />}
                  {inspectedInfo.dbTable     && <Row k="DB Table"   v={inspectedInfo.dbTable} />}
                  {inspectedInfo.dbRecordId  && <Row k="Record ID"  v={inspectedInfo.dbRecordId} />}
                  <Row k="Element" v={inspectedInfo.tagName} />
                  {inspectedInfo.visible !== null && (
                    <Row
                      k="Visible"
                      v={inspectedInfo.visible}
                      color={inspectedInfo.visible === "false" ? "text-red-400" : "text-emerald-400"}
                    />
                  )}
                  {inspectedInfo.hiddenReason && (
                    <Row k="Hidden reason" v={inspectedInfo.hiddenReason} color="text-yellow-400" />
                  )}
                </div>
              ) : (
                <p className="text-white/20 text-center text-[11px] py-6">
                  {inspectMode ? "Click any element on the page →" : "Enable inspect mode above, then click any element."}
                </p>
              )}
            </div>
          )}

          {/* ── TRACE TAB ─────────────────────────────────────────────── */}
          {activeTab === "trace" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <button
                onClick={toggleTrace}
                className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  traceMode
                    ? "bg-purple-600/30 text-purple-200 ring-1 ring-purple-500/50"
                    : "bg-white/5 text-white/40 hover:text-white/70"
                }`}
              >
                {traceMode ? "🔀 Trace Mode ON — click any button" : "Enable Trace Mode"}
              </button>

              {(currentTrace ?? lastTrace) ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-[9px] text-white/30 uppercase font-bold mb-2">
                    {currentTrace ? "Active trace" : "Last trace"} — {(currentTrace ?? lastTrace)!.trigger}
                  </p>
                  <TraceStepList trace={(currentTrace ?? lastTrace)!} />
                </div>
              ) : (
                <p className="text-white/20 text-center text-[11px] py-6">
                  {traceMode
                    ? "Click any button or link to start a trace →"
                    : "Enable trace mode, then click any button to trace its execution flow."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Key-value row helper ──────────────────────────────────────────────────────

function Row({
  k, v, accent, color,
}: {
  k: string; v: string; accent?: boolean; color?: string;
}) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-white/30 w-24 shrink-0">{k}</span>
      <span className={`flex-1 min-w-0 break-all font-mono ${color ?? (accent ? "text-sky-300" : "text-white/70")}`}>
        {v}
      </span>
    </div>
  );
}

// ── Public export (production-safe wrapper) ───────────────────────────────────

export default function DebugPanel() {
  if (!import.meta.env.DEV) return null;
  return <DebugPanelInner />;
}
