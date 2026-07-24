/**
 * supabase.ts — single typed Supabase client for the entire SHELAN app.
 *
 * Both the public site (anon) and the admin portal use this client.
 * RLS policies on each table control what each role can read/write.
 *
 * In DEV mode the client is wrapped with a debug proxy that logs every
 * .from() / .rpc() call, its duration, and any error into the debug panel.
 * The proxy is stripped entirely in production (import.meta.env.DEV guard).
 *
 * Env vars consumed:
 *   VITE_SUPABASE_URL      — your project's REST endpoint
 *   VITE_SUPABASE_ANON_KEY — safe-to-expose public anon key
 */

import { createClient } from "@supabase/supabase-js";
import { createSupabaseProxy } from "@/shared/debug/supabaseProxy";

const url = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.warn(
    "[SHELAN] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. " +
    "The app will fall back to mock data until Supabase is configured.",
  );
}

const _rawClient = createClient(
  url  ?? "https://placeholder.supabase.co",
  key  ?? "placeholder-anon-key",
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
);

/**
 * The Supabase client used everywhere in the app.
 * In dev mode: wrapped with a debug proxy that logs queries to the panel.
 * In prod mode: the raw client, no overhead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = import.meta.env.DEV
  ? createSupabaseProxy(_rawClient)
  : _rawClient;

/** True when env vars are present and non-placeholder */
export const isSupabaseConfigured =
  !!url && !!key && !url.includes("placeholder");
