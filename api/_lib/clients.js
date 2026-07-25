/**
 * api/_lib/clients.js
 *
 * Shared Supabase client instances used by all API handlers.
 * Imported by both the Vercel serverless functions and the local Express
 * server (api/server.js) — no duplication, same initialisation path.
 *
 * ws is passed as the realtime transport because Node 20 (used by both
 * Replit and Vercel's Node 20 runtime) has no native WebSocket.
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL         = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY    = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "[api] Missing required Supabase environment variables: " +
    "VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

/** Anon client — used only to verify caller JWTs via auth.getUser(). */
export const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: ws },
});

/** Admin client — service_role key, bypasses RLS, used for destructive ops. */
export const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});
