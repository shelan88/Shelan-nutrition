/**
 * uploadDebug.ts — lightweight on-screen debug event bus
 *
 * Temporary diagnostics only. Import dbg() / dbgOk() / dbgWarn() / dbgError()
 * anywhere in the upload flow to emit an entry that appears in DebugPanel.
 *
 * All entries are also forwarded to the browser console.
 * Remove this file (and DebugPanel) when the investigation is done.
 */

export type LogLevel = "info" | "ok" | "warn" | "error";

export interface LogEntry {
  id: number;
  ts: string;       // HH:MM:SS.mmm
  level: LogLevel;
  label: string;
  detail?: string;
}

type Listener = (entry: LogEntry | "__clear__") => void;

let _seq = 0;
const _logs: LogEntry[] = [];
const _listeners = new Set<Listener>();

function _emit(label: string, rawDetail: unknown, level: LogLevel): void {
  const now = new Date();
  const ts =
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0") + ":" +
    String(now.getSeconds()).padStart(2, "0") + "." +
    String(now.getMilliseconds()).padStart(3, "0");

  let detail: string | undefined;
  if (rawDetail !== undefined && rawDetail !== null && rawDetail !== "") {
    if (typeof rawDetail === "string") {
      detail = rawDetail;
    } else {
      try {
        detail = JSON.stringify(rawDetail);
      } catch {
        detail = String(rawDetail);
      }
    }
  }

  const entry: LogEntry = { id: ++_seq, ts, level, label, detail };
  _logs.push(entry);
  if (_logs.length > 300) _logs.splice(0, _logs.length - 300);
  _listeners.forEach((fn) => fn(entry));

  // Mirror to browser console
  const args: unknown[] = [`[DBG/${level.toUpperCase()}] ${label}`, ...(rawDetail !== undefined ? [rawDetail] : [])];
  if      (level === "error") console.error(...args);
  else if (level === "warn")  console.warn(...args);
  else if (level === "ok")    console.info(...args);
  else                        console.log(...args);
}

/** Log an informational step. */
export function dbg(label: string, detail?: unknown): void {
  _emit(label, detail, "info");
}

/** Log a successful outcome (green). */
export function dbgOk(label: string, detail?: unknown): void {
  _emit(label, detail, "ok");
}

/** Log a warning (yellow). */
export function dbgWarn(label: string, detail?: unknown): void {
  _emit(label, detail, "warn");
}

/** Log an error (red). */
export function dbgError(label: string, detail?: unknown): void {
  _emit(label, detail, "error");
}

/** Returns a read-only snapshot of all buffered entries. */
export function getLogs(): readonly LogEntry[] {
  return _logs;
}

/** Clears all buffered entries and notifies subscribers. */
export function clearLogs(): void {
  _logs.splice(0, _logs.length);
  _listeners.forEach((fn) => fn("__clear__"));
}

/**
 * Subscribe to new log entries.
 * The callback receives each LogEntry as it arrives, or the string "__clear__"
 * when clearLogs() is called.
 * Returns an unsubscribe function.
 */
export function subscribe(fn: Listener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
