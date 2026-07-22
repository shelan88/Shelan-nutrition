/**
 * DebugPanel — floating on-screen log panel for mobile upload diagnostics.
 *
 * Subscribes to uploadDebug event bus and renders every entry in a scrollable
 * fixed overlay. Works without DevTools — visible on Android/iOS directly.
 *
 * TEMPORARY — remove with uploadDebug.ts when investigation is done.
 */

import { useEffect, useRef, useState } from "react";
import { getLogs, clearLogs, subscribe, type LogEntry } from "./uploadDebug";

const LEVEL_STYLES: Record<string, string> = {
  info:  "text-sky-300",
  ok:    "text-emerald-400",
  warn:  "text-yellow-400",
  error: "text-red-400",
};

const LEVEL_DOT: Record<string, string> = {
  info:  "bg-sky-400",
  ok:    "bg-emerald-400",
  warn:  "bg-yellow-400",
  error: "bg-red-500",
};

const LEVEL_BADGE: Record<string, string> = {
  info:  "bg-sky-900/60 text-sky-300",
  ok:    "bg-emerald-900/60 text-emerald-300",
  warn:  "bg-yellow-900/60 text-yellow-300",
  error: "bg-red-900/60 text-red-300",
};

export default function DebugPanel() {
  const [open, setOpen]       = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>(() => [...getLogs()]);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const listRef               = useRef<HTMLDivElement>(null);

  // Subscribe to new log events
  useEffect(() => {
    return subscribe((payload) => {
      if (payload === "__clear__") {
        setEntries([]);
        return;
      }
      setEntries((prev) => [...prev, payload]);
    });
  }, []);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, open]);

  const errorCount = entries.filter((e) => e.level === "error").length;
  const warnCount  = entries.filter((e) => e.level === "warn").length;

  return (
    <div
      style={{ zIndex: 99999 }}
      className="fixed bottom-0 left-0 right-0 font-mono text-[11px] leading-tight pointer-events-none"
    >
      {/* Panel body */}
      {open && (
        <div
          className="pointer-events-auto mx-2 mb-10 rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: "rgba(10,10,20,0.96)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
            <span className="text-white font-semibold tracking-wide text-[11px] flex-1">
              📡 Upload Debug
            </span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-900/70 text-red-300 text-[10px] font-bold">
                {errorCount} ERR
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-900/70 text-yellow-300 text-[10px] font-bold">
                {warnCount} WARN
              </span>
            )}
            <span className="text-white/40 text-[10px]">{entries.length} entries</span>
            <button
              className="px-2 py-0.5 rounded bg-white/10 text-white/60 hover:bg-white/20 text-[10px]"
              onClick={() => clearLogs()}
            >
              Clear
            </button>
          </div>

          {/* Log list */}
          <div
            ref={listRef}
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "40vh" }}
          >
            {entries.length === 0 && (
              <p className="text-white/30 text-center py-4 text-[11px]">
                Waiting for upload activity…
              </p>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex gap-2 items-start px-3 py-[5px] border-b border-white/5 ${
                  entry.level === "error" ? "bg-red-950/30" :
                  entry.level === "warn"  ? "bg-yellow-950/20" :
                  entry.level === "ok"    ? "bg-emerald-950/20" : ""
                }`}
              >
                {/* Dot */}
                <span
                  className={`mt-[3px] shrink-0 w-2 h-2 rounded-full ${LEVEL_DOT[entry.level]}`}
                />

                {/* Timestamp */}
                <span className="shrink-0 text-white/30 text-[10px] mt-px">{entry.ts}</span>

                {/* Badge */}
                <span
                  className={`shrink-0 px-1 rounded text-[9px] uppercase font-bold mt-px ${LEVEL_BADGE[entry.level]}`}
                >
                  {entry.level}
                </span>

                {/* Label + detail */}
                <span className="flex-1 min-w-0">
                  <span className={`${LEVEL_STYLES[entry.level]} font-semibold break-words`}>
                    {entry.label}
                  </span>
                  {entry.detail && (
                    <span className="text-white/50 ml-1 break-all">{entry.detail}</span>
                  )}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Toggle pill — always visible */}
      <div
        className="pointer-events-auto fixed bottom-2 right-3 flex gap-2"
        style={{ zIndex: 99999 }}
      >
        {errorCount > 0 && !open && (
          <span className="px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
            {errorCount} ERR
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg border border-white/20"
          style={{ background: "rgba(10,10,25,0.92)", color: "rgba(255,255,255,0.85)" }}
        >
          {open ? "▼ Hide Logs" : `▲ Debug (${entries.length})`}
        </button>
      </div>
    </div>
  );
}
