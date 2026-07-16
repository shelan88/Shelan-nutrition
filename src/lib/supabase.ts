/**
 * supabase.ts — single typed Supabase client for the entire SHELAN app.
 *
 * Both the public Assessment Wizard (anon) and the admin portal use this client.
 * RLS policies on each table control what each role can read/write.
 *
 * Env vars consumed:
 *   VITE_SUPABASE_URL      — your project's REST endpoint
 *   VITE_SUPABASE_ANON_KEY — safe-to-expose public anon key
 */

import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  console.warn(
    "[SHELAN] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. " +
    "The app will fall back to mock data until Supabase is configured.",
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(
  url  ?? "https://placeholder.supabase.co",
  key  ?? "placeholder-anon-key",
  {
    auth: { persistSession: true, autoRefreshToken: true },
  },
);

/** True when env vars are present and non-placeholder */
export const isSupabaseConfigured =
  !!url && !!key && !url.includes("placeholder");
