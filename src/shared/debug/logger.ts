/**
 * logger.ts — Unified debug logger singleton.
 *
 * All functions are no-ops when import.meta.env.DEV is false.
 * Vite dead-code-eliminates dead branches in production builds.
 *
 * To remove all debug tooling after the project ships:
 *   1. Delete src/shared/debug/
 *   2. Remove <DebugPanel /> from App.tsx
 *   3. Remove installDebugInterceptors() from main.tsx
 */

export type LogLevel = "log" | "warn" | "error";

export type LogCategory =
  | "navigation" | "database"    | "media"      | "forms"
  | "auth"       | "sections"    | "components" | "network"
  | "performance"| "errors"      | "storage"    | "language"
  | "trace"      | "general";

export interface DebugEntry {
  id:          number;
  timestamp:   string;        // HH:MM:SS.mmm
  level:       LogLevel;
  category:    LogCategory;
  module:      string;        // e.g. "AboutCms"
  component:   string;        // e.g. "AboutCertifications"
  action:      string;        // e.g. "getActiveCertifications"
  result:      "success" | "warning" | "error" | "info";
  table?:      string;        // Supabase table name
  recordId?:   string;        // DB row id
  durationMs?: number;        // operation duration
  error?:      string;        // error message
  data?:       unknown;       // extra payload
}

type Listener = (e: DebugEntry | "__clear__" | "__pause__" | "__resume__") => void;

// ── Singleton state ────────────────────────────────────────────────────────────
let _seq    = 0;
let _paused = false;
const MAX_ENTRIES = 500;
const _buf: DebugEntry[] = [];
const _subs = new Set<Listener>();

function _ts(): string {
  const n = new Date();
  return (
    String(n.getHours()).padStart(2, "0")   + ":" +
    String(n.getMinutes()).padStart(2, "0") + ":" +
    String(n.getSeconds()).padStart(2, "0") + "." +
    String(n.getMilliseconds()).padStart(3, "0")
  );
}

function _push(entry: DebugEntry): void {
  _buf.push(entry);
  if (_buf.length > MAX_ENTRIES) _buf.splice(0, _buf.length - MAX_ENTRIES);
  if (!_paused) _subs.forEach((fn) => fn(entry));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function debugLog(partial: Omit<DebugEntry, "id" | "timestamp">): void {
  if (!import.meta.env.DEV) return;
  const entry: DebugEntry = { id: ++_seq, timestamp: _ts(), ...partial };
  _push(entry);
  const tag = `[DBG:${partial.category.toUpperCase()}] ${partial.module}›${partial.action}`;
  if      (partial.level === "error") console.error(tag, partial.error ?? partial.data ?? "");
  else if (partial.level === "warn")  console.warn(tag,  partial.data ?? "");
  else                                console.debug(tag, partial.data ?? "");
}

export function getLogs(): readonly DebugEntry[] { return _buf; }
export function isPaused(): boolean              { return _paused; }

export function clearLogs(): void {
  if (!import.meta.env.DEV) return;
  _buf.splice(0, _buf.length);
  _subs.forEach((fn) => fn("__clear__"));
}

export function pauseLogs(): void {
  if (!import.meta.env.DEV) return;
  _paused = true;
  _subs.forEach((fn) => fn("__pause__"));
}

export function resumeLogs(): void {
  if (!import.meta.env.DEV) return;
  _paused = false;
  _subs.forEach((fn) => fn("__resume__"));
}

export function subscribe(fn: Listener): () => void {
  if (!import.meta.env.DEV) return () => {};
  _subs.add(fn);
  return () => _subs.delete(fn);
}

export function copyLogsToClipboard(): void {
  if (!import.meta.env.DEV) return;
  const text = _buf
    .map((e) =>
      `[${e.timestamp}][${e.category.toUpperCase()}] ${e.module}›${e.action}` +
      (e.table      ? ` table=${e.table}`          : "") +
      (e.recordId   ? ` id=${e.recordId}`          : "") +
      (e.durationMs != null ? ` ${e.durationMs}ms` : "") +
      (e.result !== "info" ? ` → ${e.result.toUpperCase()}` : "") +
      (e.error      ? ` | ${e.error}`              : "")
    )
    .join("\n");
  navigator.clipboard.writeText(text).catch(() => {});
}

export function exportLogsAsJson(): void {
  if (!import.meta.env.DEV) return;
  const blob = new Blob([JSON.stringify(_buf, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `shelan-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
