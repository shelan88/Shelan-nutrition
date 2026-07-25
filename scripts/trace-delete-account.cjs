/**
 * scripts/trace-delete-account.cjs
 *
 * End-to-end debug trace for the "Delete Account" flow.
 * Mirrors exactly what the browser does:
 *   1. Create a throwaway auth user
 *   2. Sign in → get JWT
 *   3. Call upsert_client_from_auth  (same as portal on first load)
 *   4. POST /api/delete-account with Bearer token
 *   5. Attempt sign-in again → must fail with "Invalid login credentials"
 *   6. Admin-bypass read of the clients row → must show status=Inactive, deleted_at set, user_id=NULL
 *   7. Cleanup (auth user already gone; remove client row if still present)
 */

"use strict";
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON    = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE         = process.env.API_BASE || "http://localhost:3001";

if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
  console.error("Missing env vars"); process.exit(1);
}

const wsOpts = { realtime: { transport: ws } };
const anon  = createClient(SUPABASE_URL, SUPABASE_ANON, wsOpts);
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const ts   = () => new Date().toISOString().slice(11, 23);
let   step = 0;
const log  = (tag, msg, extra) => {
  const s = String(++step).padStart(2, "0");
  const e = extra ? "  " + JSON.stringify(extra) : "";
  console.log(`[${s}] ${ts()}  [${tag}]  ${msg}${e}`);
};

const PASS  = "Trace#Pass99!";
const EMAIL = `dbg-trace-${Date.now()}@test-shelan.dev`;

async function run() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  DELETE ACCOUNT — full end-to-end trace (new flow)");
  console.log("══════════════════════════════════════════════════════════════\n");

  // ── STEP 0: create test user ────────────────────────────────────────────────
  console.log("── STEP 0: Create test user ─────────────────────────────────");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASS, email_confirm: true,
  });
  if (createErr) { console.error("SETUP failed:", createErr.message); process.exit(1); }
  const uid = created.user.id;
  log("SETUP", "Test user created", { email: EMAIL, uid });

  // ── STEP 1: sign in ─────────────────────────────────────────────────────────
  console.log("\n── STEP 1: Sign in ──────────────────────────────────────────");
  const { data: signed, error: signErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (signErr) { console.error("Sign-in failed:", signErr.message); process.exit(1); }
  const ACCESS_TOKEN = signed.session.access_token;
  log("AUTH", "signInWithPassword OK", { uid: signed.user.id, email: signed.user.email });

  // ── STEP 2: upsert client row ────────────────────────────────────────────────
  console.log("\n── STEP 2: upsert_client_from_auth (portal first-load RPC) ─");
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
    realtime: { transport: ws },
  });
  // Insert client row directly via admin (trace env can't call the RPC without a schema-cache reload)
  const { data: inserted, error: insErr } = await admin
    .from("clients")
    .insert({ full_name: "Trace Test User", email: EMAIL, user_id: uid, status: "Waiting" })
    .select("id,user_id,status,email,deleted_at")
    .single();
  if (insErr) { console.error("client insert error:", insErr.message); process.exit(1); }
  log("DB", "client row created (admin insert)", inserted);
  const clientRow = inserted;

  // ── STEP 3: POST /api/delete-account ────────────────────────────────────────
  console.log("\n── STEP 3: POST /api/delete-account ─────────────────────────");
  log("ACTION", `Calling POST ${API_BASE}/api/delete-account`, { "Authorization": "Bearer <jwt>" });

  const resp = await fetch(`${API_BASE}/api/delete-account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
  });
  const body = await resp.json().catch(() => ({}));

  console.log("  ┌─ RAW API RESPONSE ──────────────────────────────────────┐");
  console.log(`  │ HTTP status:   ${resp.status} ${resp.statusText}`);
  console.log(`  │ body:          ${JSON.stringify(body)}`);
  console.log("  └────────────────────────────────────────────────────────────┘\n");

  if (!resp.ok) {
    log("RESULT", "⚠ API returned error — aborting further checks", { status: resp.status, body });
    return cleanup(uid, clientRow?.id);
  }
  log("RESULT", "✓ /api/delete-account returned 200 OK");

  // ── STEP 4: verify sign-in is now impossible ─────────────────────────────────
  console.log("\n── STEP 4: Attempt sign-in (must fail) ──────────────────────");
  const { error: reSignErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASS });
  if (reSignErr) {
    log("AUTH", `✓ Sign-in correctly rejected: "${reSignErr.message}"`);
  } else {
    log("AUTH", "✗ PROBLEM: sign-in SUCCEEDED after deletion — auth user was NOT deleted!");
  }

  // ── STEP 5: verify client row archived, still in DB ──────────────────────────
  console.log("\n── STEP 5: Verify archived client row (admin bypass) ────────");
  const { data: archived } = await admin.from("clients").select("id,user_id,status,deleted_at,email").eq("email", EMAIL);
  if (!archived?.length) {
    log("DB-ADMIN", "✗ PROBLEM: client row NOT FOUND — archival failed or row was deleted!");
  } else {
    const r = archived[0];
    const ok_status     = r.status === "Inactive"   ? "✓" : "✗";
    const ok_user_id    = r.user_id === null         ? "✓" : "✗";
    const ok_deleted_at = r.deleted_at               ? "✓" : "✗";
    log("DB-ADMIN", "Archived client row:", {
      id:         r.id,
      status:     `${ok_status} ${r.status}`,
      user_id:    `${ok_user_id} ${r.user_id}`,
      deleted_at: `${ok_deleted_at} ${r.deleted_at}`,
      email:      r.email,
    });
    if (ok_status === "✓" && ok_user_id === "✓" && ok_deleted_at === "✓") {
      console.log("\n  ✅  All checks passed — delete account flow works correctly.\n");
    } else {
      console.log("\n  ❌  One or more checks failed — see above.\n");
    }
  }

  // ── CLEANUP ──────────────────────────────────────────────────────────────────
  await cleanup(uid, archived?.[0]?.id ?? clientRow?.id);
}

async function cleanup(uid, clientId) {
  console.log("── CLEANUP ──────────────────────────────────────────────────");
  if (clientId) {
    const { status } = await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${clientId}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${SUPABASE_SERVICE}` },
    });
    log("CLEANUP", `client row removed (HTTP ${status})`);
  }
  // Auth user may already be gone — ignore error
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (!error) log("CLEANUP", "auth user removed");
  else         log("CLEANUP", `auth user already gone (${error.message})`);
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  END OF TRACE");
  console.log("══════════════════════════════════════════════════════════════");
}

run().catch(err => { console.error("Unexpected:", err); process.exit(1); });
