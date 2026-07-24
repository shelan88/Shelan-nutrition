/**
 * supabaseProxy.ts — Wraps the Supabase client to intercept all DB queries.
 *
 * Uses a JS Proxy to intercept .from() and .rpc(). Each intercepted call
 * wraps the returned query builder so the final .then() (actual network hit)
 * is also intercepted for duration logging and trace step injection.
 *
 * Returns the original client unchanged when import.meta.env.DEV is false.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { debugLog } from "./logger";
import { addTraceStep } from "./traceStore";

type AnyObj = Record<string | symbol, unknown>;

/**
 * Recursively wraps a Supabase query builder. Every chained method that
 * returns another builder is also wrapped, ensuring .then() is always
 * intercepted regardless of how deep the fluent chain goes.
 */
function wrapBuilder(
  builder: AnyObj,
  table:   string,
  op:      string,
  start:   number,
): AnyObj {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      // ── Intercept the final resolution (actual DB request) ──────────────────
      if (prop === "then") {
        return (
          onFulfilled: ((v: unknown) => unknown) | null | undefined,
          onRejected:  ((e: unknown) => unknown) | null | undefined,
        ) => {
          // Preserve `this` context so Supabase/PostgREST builder instance
          // methods work correctly — never call target.then unbound.
          const originalThen = target.then as (
            onfulfilled?: ((v: unknown) => unknown) | null,
            onrejected?:  ((e: unknown) => unknown) | null,
          ) => Promise<unknown>;

          return Reflect.apply(originalThen, target, [
            (res: { data?: unknown; error?: { message: string } | null }) => {
              const ms       = Date.now() - start;
              const hasError = !!res?.error;
              const firstRow = Array.isArray(res?.data)
                ? (res.data as AnyObj[])[0]
                : null;

              debugLog({
                level:      hasError ? "error" : "log",
                category:   "database",
                module:     "Supabase",
                component:  "supabaseProxy",
                action:     `${op}(${table})`,
                result:     hasError ? "error" : "success",
                table,
                recordId:   typeof firstRow?.id === "string" ? firstRow.id : undefined,
                durationMs: ms,
                error:      hasError ? res.error!.message : undefined,
                data:       hasError ? undefined : {
                  rows: Array.isArray(res.data)
                    ? res.data.length
                    : res.data != null ? 1 : 0,
                },
              });

              addTraceStep({
                label:  "Supabase",
                detail: `${op}("${table}") → ${
                  hasError ? "ERROR: " + res.error!.message : "OK"
                } (${ms}ms)`,
                durationMs: ms,
              });

              return onFulfilled ? onFulfilled(res) : res;
            },
            onRejected,
          ]);
        };
      }

      // Pass catch/finally through unwrapped
      if (prop === "catch" || prop === "finally") {
        return Reflect.get(target, prop, receiver);
      }

      const val = Reflect.get(target, prop, receiver);

      // Wrap each chained method so the full fluent chain stays proxied
      if (typeof val === "function" && typeof prop === "string") {
        return (...args: unknown[]) => {
          const ret = (val as Function).apply(target, args);
          if (ret && typeof ret === "object" && "then" in ret) {
            const detectedOp = ["select", "insert", "update", "delete", "upsert"].includes(prop)
              ? prop : op;
            return wrapBuilder(ret as AnyObj, table, detectedOp, start);
          }
          return ret;
        };
      }

      return val;
    },
  });
}

export function createSupabaseProxy(client: SupabaseClient): SupabaseClient {
  if (!import.meta.env.DEV) return client;

  return new Proxy(client as unknown as AnyObj, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => {
          const start = Date.now();
          return wrapBuilder(
            Reflect.apply(target.from as (...a: unknown[]) => AnyObj, target, [table]),
            table, "select", start,
          );
        };
      }
      if (prop === "rpc") {
        return (fn: string, params?: object, opts?: object) => {
          const start = Date.now();
          return wrapBuilder(
            Reflect.apply(target.rpc as (...a: unknown[]) => AnyObj, target, [fn, params, opts]),
            `rpc:${fn}`, "rpc", start,
          );
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as unknown as SupabaseClient;
}
