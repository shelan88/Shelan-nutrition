/**
 * api/delete-account.js
 *
 * Vercel Serverless Function  →  POST /api/delete-account
 * Also imported by api/server.js for local Express routing on Replit.
 *
 * Permanently deactivates a client account:
 *   1. Verifies the caller's JWT (rejects 401 if invalid/missing)
 *   2. Archives the clients row: status=Inactive, deleted_at=now(), user_id=NULL
 *   3. Hard-deletes the Supabase Auth user → login permanently disabled
 *
 * The SUPABASE_SERVICE_ROLE_KEY is read only here on the server.
 * It is never sent to the browser.
 */

import { adminClient } from "./_lib/clients.js";
import { verifyJwt }   from "./_lib/auth.js";

export default async function handler(req, res) {
  // Method guard — Vercel functions receive all HTTP methods for the path.
  // Express wires only POST, but the check is harmless there too.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

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
      // Row is already archived; rolling back would leave things inconsistent.
      // Return 500 so the caller knows something went wrong; the row IS archived.
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
}
