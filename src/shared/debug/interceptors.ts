/**
 * interceptors.ts — Global debug interceptors installed at app startup.
 *
 * Patches: window.fetch, history.pushState/replaceState, popstate,
 * localStorage.setItem, unhandledrejection, uncaught errors, and a
 * capture-phase click listener for Trace Mode.
 *
 * All patches are skipped in production and installed at most once.
 * Safe to call multiple times (idempotent).
 */

import { debugLog } from "./logger";
import { startTrace } from "./traceStore";

let _installed = false;

export function installDebugInterceptors(): void {
  if (!import.meta.env.DEV) return;
  if (_installed) return;
  _installed = true;

  // ── fetch ──────────────────────────────────────────────────────────────────
  const _origFetch = window.fetch.bind(window);
  window.fetch = async function debugFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"  ? input
      : input instanceof URL     ? input.href
      : (input as Request).url;
    const method     = init?.method ?? (input instanceof Request ? input.method : "GET");
    const isSupabase = url.includes("supabase");   // proxy already handles these
    const start      = Date.now();

    if (!isSupabase) {
      debugLog({
        level: "log", category: "network",
        module: "Fetch", component: "interceptors",
        action: `${method} ${url.replace(/\?.*$/, "")}`,
        result: "info",
      });
    }

    try {
      const res = await _origFetch(input, init);
      if (!isSupabase) {
        debugLog({
          level:      res.ok ? "log" : "warn",
          category:   "network",
          module:     "Fetch", component: "interceptors",
          action:     `${method} ${url.replace(/\?.*$/, "")} → ${res.status}`,
          result:     res.ok ? "success" : "warning",
          durationMs: Date.now() - start,
          error:      res.ok ? undefined : `HTTP ${res.status}`,
        });
      }
      return res;
    } catch (err) {
      debugLog({
        level: "error", category: "network",
        module: "Fetch", component: "interceptors",
        action: `${method} ${url.replace(/\?.*$/, "")} FAILED`,
        result: "error",
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };

  // ── Unhandled promise rejections ──────────────────────────────────────────
  window.addEventListener("unhandledrejection", (e) => {
    debugLog({
      level: "error", category: "errors",
      module: "Runtime", component: "window",
      action: "unhandledrejection",
      result: "error",
      error: e.reason instanceof Error ? e.reason.message : String(e.reason),
    });
  });

  // ── Uncaught runtime errors ───────────────────────────────────────────────
  window.addEventListener("error", (e) => {
    if (!e.message) return;
    debugLog({
      level: "error", category: "errors",
      module: "Runtime",
      component: e.filename?.split("/").pop() ?? "unknown",
      action: "uncaughtError",
      result: "error",
      error: `${e.message} (${e.filename}:${e.lineno})`,
    });
  });

  // ── History API (SPA navigation) ──────────────────────────────────────────
  const _origPush    = history.pushState.bind(history);
  const _origReplace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    debugLog({
      level: "log", category: "navigation",
      module: "Router", component: "history",
      action: `navigate → ${url ?? location.pathname}`,
      result: "info",
    });
    return _origPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    debugLog({
      level: "log", category: "navigation",
      module: "Router", component: "history",
      action: `replace → ${url ?? location.pathname}`,
      result: "info",
    });
    return _origReplace(state, title, url);
  };

  window.addEventListener("popstate", () => {
    debugLog({
      level: "log", category: "navigation",
      module: "Router", component: "history",
      action: `popstate → ${location.pathname}`,
      result: "info",
    });
  });

  // ── localStorage ──────────────────────────────────────────────────────────
  const _origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    if (import.meta.env.DEV) {
      debugLog({
        level: "log", category: "storage",
        module: "LocalStorage", component: "interceptors",
        action: `set("${key}")`,
        result: "info",
        data: { length: value.length },
      });
    }
    return _origSetItem.call(this, key, value);
  };

  // ── Global click for Trace Mode ───────────────────────────────────────────
  // Capture phase so we see the click before any React handler runs.
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target as HTMLElement;
      // Skip clicks on the debug panel itself
      if (el.closest("[data-debug-panel]")) return;
      const label =
        el.getAttribute("aria-label")
        ?? el.getAttribute("title")
        ?? el.closest("button,a,[role='button']")?.textContent?.trim().slice(0, 60)
        ?? el.textContent?.trim().slice(0, 60)
        ?? el.tagName.toLowerCase();
      startTrace(label || "(click)");
    },
    { capture: true },
  );
}
