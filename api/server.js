/**
 * api/server.js  —  Secure server-side API for operations that require the
 * Supabase service_role key.  The service_role key is NEVER sent to the
 * browser; all callers must supply a valid user JWT which is verified here.
 *
 * Endpoints
 *   POST /api/delete-account   — permanently deactivates a client account:
 *       1. Verifies the caller's JWT with supabase.auth.getUser()
 *       2. Archives the clients row  (status=Inactive, deleted_at, user_id=NULL)
 *       3. Hard-deletes the Supabase Auth user  →  login permanently disabled
 */

import express from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const app = express();
app.use(express.json());

// ── Supabase clients ──────────────────────────────────────────────────────────
const SUPABASE_URL          = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error("[api] Missing required Supabase environment variables — server will not start.");
  process.exit(1);
}

// Anon client — used only to verify the caller's JWT (auth.getUser)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: ws },
});

// Admin client — service_role, bypasses RLS, used for destructive ops
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract and verify the Bearer token; returns the Supabase user or null. */
async function verifyJwt(req) {
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ── POST /api/delete-account ─────────────────────────────────────────────────

app.post("/api/delete-account", async (req, res) => {
  // 1. Authenticate caller
  const user = await verifyJwt(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized — valid session required." });
  }

  const uid   = user.id;
  const email = user.email;
  console.log(`[api/delete-account] Request from uid=${uid} email=${email}`);

  try {
    // 2. Archive the client row — keep data, sever the auth link
    const { error: archiveErr, count } = await adminClient
      .from("clients")
      .update({
        status:     "Inactive",
        deleted_at: new Date().toISOString(),
        user_id:    null,
      })
      .eq("user_id", uid)
      .select("id", { count: "exact", head: true });

    if (archiveErr) {
      console.error("[api/delete-account] archive error:", archiveErr.message);
      return res.status(500).json({ error: "Failed to archive client record." });
    }

    console.log(`[api/delete-account] client row archived (rows matched: ${count ?? "unknown"})`);

    // 3. Hard-delete the Supabase Auth user — login permanently disabled
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteErr) {
      console.error("[api/delete-account] auth.admin.deleteUser error:", deleteErr.message);
      // Row is already archived; roll back would leave things inconsistent.
      // Return 500 so the client knows something went wrong, but the row IS archived.
      return res.status(500).json({
        error:   "Account data archived but auth-user deletion failed.",
        partial: true,
      });
    }

    console.log(`[api/delete-account] Auth user ${uid} permanently deleted — login impossible.`);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("[api/delete-account] unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.API_PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[api] Server listening on port ${PORT}`);
});
