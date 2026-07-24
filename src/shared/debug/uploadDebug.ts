/**
 * uploadDebug.ts — Upload-specific debug helpers.
 *
 * Thin bridge over the unified logger in logger.ts.
 * Existing callers (upload.service.ts, FileDropZone.tsx, useUpload.ts)
 * continue working unchanged; all entries now appear in the main debug panel.
 */

import { debugLog, getLogs as _getLogs, subscribe as _subscribe, clearLogs as _clearLogs } from "./logger";
import type { DebugEntry } from "./logger";

// ── Legacy types (kept for call-site compatibility) ────────────────────────────

export type LogLevel = "info" | "ok" | "warn" | "error";

/** Subset of DebugEntry exposed via the old API. */
export interface LogEntry {
  id:      number;
  ts:      string;
  level:   LogLevel;
  label:   string;
  detail?: string;
}

// ── Internal mapping ──────────────────────────────────────────────────────────

function _levelToNew(level: LogLevel): "log" | "warn" | "error" {
  if (level === "error") return "error";
  if (level === "warn")  return "warn";
  return "log";
}

function _levelToResult(level: LogLevel): "success" | "warning" | "error" | "info" {
  if (level === "ok")    return "success";
  if (level === "warn")  return "warning";
  if (level === "error") return "error";
  return "info";
}

function _emit(label: string, rawDetail: unknown, level: LogLevel): void {
  let detail: string | undefined;
  if (rawDetail !== undefined && rawDetail !== null && rawDetail !== "") {
    detail = typeof rawDetail === "string" ? rawDetail : (() => {
      try { return JSON.stringify(rawDetail); } catch { return String(rawDetail); }
    })();
  }

  debugLog({
    level:     _levelToNew(level),
    category:  "media",
    module:    "Upload",
    component: "uploadDebug",
    action:    label,
    result:    _levelToResult(level),
    error:     level === "error" ? (detail ?? label) : undefined,
    data:      level !== "error" ? detail : undefined,
  });
}

// ── Public API (identical to old uploadDebug.ts) ──────────────────────────────

export function dbg(label: string,      detail?: unknown): void { _emit(label, detail, "info");  }
export function dbgOk(label: string,    detail?: unknown): void { _emit(label, detail, "ok");    }
export function dbgWarn(label: string,  detail?: unknown): void { _emit(label, detail, "warn");  }
export function dbgError(label: string, detail?: unknown): void { _emit(label, detail, "error"); }

/** Returns buffered log entries in the old LogEntry shape (for any remaining consumers). */
export function getLogs(): readonly LogEntry[] {
  return _getLogs().map((e: DebugEntry): LogEntry => ({
    id:     e.id,
    ts:     e.timestamp,
    level:  e.level === "error" ? "error" : e.level === "warn" ? "warn"
            : e.result === "success" ? "ok" : "info",
    label:  `${e.module}›${e.action}`,
    detail: e.error ?? (typeof e.data === "string" ? e.data : undefined),
  }));
}

/** Subscribe to log events (delegates to the unified logger). */
export { _subscribe as subscribe, _clearLogs as clearLogs };
