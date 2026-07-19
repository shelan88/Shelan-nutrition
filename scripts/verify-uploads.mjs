/**
 * verify-uploads.mjs
 *
 * End-to-end verification of every upload path in the SHELAN app.
 * Uses direct HTTP/fetch calls to Supabase REST + Storage APIs
 * (no WebSocket / realtime dependency).
 *
 * Surfaces tested:
 *  1.  Avatar upload          (portal › Profile)
 *  2.  Media Library          (admin › Media Library)
 *  3.  Client file            (admin › Client Profile › Files tab)
 *  4.  Nutrition Plan file    (admin › Client › Plans › Files modal)
 *  5.  Progress photo         (admin › Client › Progress › Photos tab)
 *  6.  Blog image             (admin › Blog — FileUploadField)
 *  7.  Service image          (admin › Services — FileUploadField)
 *  8.  Success Story image    (admin › Success Stories — FileUploadField)
 *  9.  Testimonial image      (admin › Testimonials — FileUploadField)
 * 10.  Website asset          (admin › Website Builder / Settings — FileUploadField)
 *
 * Per surface checks:
 *  ✓ Upload file to storage
 *  ✓ Public URL returns HTTP 200
 *  ✓ Storage object visible in bucket listing
 *  ✓ DB row inserted (where applicable)
 *  ✓ Delete from storage
 *  ✓ Storage object gone after delete
 *  ✓ Re-upload (edit/replace flow)
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = "media";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

// ── Minimal valid 10×10 PNG ───────────────────────────────────────────────────
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mP8" +
  "z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
const PNG_BUF = Buffer.from(PNG_B64, "base64");

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function storageUpload(path, buf, contentType = "image/png") {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": contentType, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    return { ok: false, error: `${r.status} ${body.slice(0, 120)}` };
  }
  return { ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}` };
}

async function storageDelete(path) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}`;
  const r = await fetch(url, {
    method: "DELETE",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
  return r.ok;
}

async function storageExists(path) {
  // list the parent folder and look for the file
  const folder = path.split("/").slice(0, -1).join("/");
  const name   = path.split("/").pop();
  const url    = `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`;
  const r = await fetch(url, {
    method:  "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body:    JSON.stringify({ prefix: folder, search: name, limit: 10 }),
  });
  if (!r.ok) return false;
  const data = await r.json().catch(() => []);
  return Array.isArray(data) && data.some(f => f.name === name);
}

async function urlOk(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.status === 200 || r.status === 206;
  } catch { return false; }
}

async function dbInsert(table, row) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const r = await fetch(url, {
    method:  "POST",
    headers: {
      ...HEADERS,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) return { ok: false, error: body, status: r.status };
  const rec = Array.isArray(body) ? body[0] : body;
  return { ok: true, id: rec?.id };
}

async function dbDelete(table, id) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  await fetch(url, { method: "DELETE", headers: HEADERS });
}

async function dbQuery(table, select = "id", filter = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=1${filter}`;
  const r = await fetch(url, { headers: { ...HEADERS, Accept: "application/json" } });
  const data = await r.json().catch(() => []);
  return Array.isArray(data) ? data[0] ?? null : null;
}

// ── Result tracking ───────────────────────────────────────────────────────────

let failures = 0;
const log = [];

function pass(label, detail = "") {
  const line = `  ✓ PASS  ${label}${detail ? "  →  " + detail : ""}`;
  console.log(line); log.push({ ok: true, label });
}
function fail(label, detail = "") {
  const line = `  ✗ FAIL  ${label}${detail ? "  →  " + detail : ""}`;
  console.log(line); log.push({ ok: false, label });
  failures++;
}
function check(ok, label, detail = "") { ok ? pass(label, detail) : fail(label, detail); return ok; }

// ── Per-surface test ──────────────────────────────────────────────────────────

async function testSurface(name, { path, insertDb, cleanDb }) {
  console.log(`\n── ${name}`);
  console.log(`   Storage path: ${path}`);

  // 1. Upload
  const up = await storageUpload(path, PNG_BUF);
  if (!check(up.ok, "Upload succeeds", up.error ?? "")) return;

  // 2. Public URL accessible
  const accessible = await urlOk(up.url);
  check(accessible, "Public URL returns HTTP 200", up.url.slice(0, 80));

  // 3. Storage object visible in bucket
  const exists = await storageExists(path);
  check(exists, "Storage object exists in bucket listing");

  // 4. DB row (optional)
  let dbId = null;
  if (insertDb) {
    const ins = await insertDb(up.url, path);
    check(ins.ok, "DB row created", ins.ok ? `id=${ins.id}` : ins.error?.message ?? JSON.stringify(ins.error));
    if (ins.ok) dbId = ins.id;
  }

  // 5. Delete
  const deleted = await storageDelete(path);
  check(deleted, "Delete from storage succeeds");

  // 6. Gone after delete
  // Small delay to allow eventual consistency
  await new Promise(r => setTimeout(r, 600));
  const gone = !(await storageExists(path));
  check(gone, "Storage object is gone after delete");

  // 7. DB cleanup
  if (dbId && cleanDb) await cleanDb(dbId);

  // 8. Re-upload (edit/replace flow)
  console.log(`   ── Re-upload (edit / replace flow)`);
  const up2 = await storageUpload(path, PNG_BUF);
  check(up2.ok, "Re-upload succeeds");
  if (up2.ok) {
    const accessible2 = await urlOk(up2.url);
    check(accessible2, "Re-uploaded file is accessible");
    await storageDelete(path); // cleanup
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  SHELAN Upload Verification — all surfaces");
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Bucket:   ${BUCKET}`);
  console.log("═══════════════════════════════════════════════════════");

  // Fetch anchor IDs for FK-constrained tables
  const client    = await dbQuery("clients",         "id");
  const plan      = await dbQuery("nutrition_plans", "id,client_id");
  const clientId  = client?.id  ?? null;
  const planId    = plan?.id    ?? null;
  const planCId   = plan?.client_id ?? clientId;
  console.log(`\n  Anchor client ID: ${clientId ?? "(none — FK tests will be storage-only)"}`);
  console.log(`  Anchor plan ID:   ${planId   ?? "(none — FK tests will be storage-only)"}`);

  const ts = Date.now();

  // ── 1. Avatar ──────────────────────────────────────────────────────────────
  await testSurface("1. Avatar Upload  (portal › Profile)", {
    path: `avatars/verify-test-user/avatar.png`,
    // No separate DB row — caller writes clients.avatar_url; storage-only test
  });

  // ── 2. Media Library ───────────────────────────────────────────────────────
  await testSurface("2. Media Library Upload  (admin › Media Library)", {
    path: `uploads/${ts}_verify-media.png`,
    insertDb: async (url) => dbInsert("media_library", {
      filename: "verify-media.png",
      url,
      alt_text: "verify-media",
      type:     "image",
      size:     PNG_BUF.length,
    }),
    cleanDb: (id) => dbDelete("media_library", id),
  });

  // ── 3. Client File ─────────────────────────────────────────────────────────
  if (clientId) {
    await testSurface("3. Client File Upload  (admin › Client Profile › Files)", {
      path: `clients/${clientId}/${ts}_verify-client.png`,
      insertDb: async (url) => dbInsert("uploaded_files", {
        client_id:   clientId,
        filename:    "verify-client.png",
        type:        "Image",
        size:        PNG_BUF.length,
        url,
        uploaded_at: new Date().toISOString(),
      }),
      cleanDb: (id) => dbDelete("uploaded_files", id),
    });
  } else {
    console.log("\n── 3. Client File Upload — SKIPPED (no clients in DB)");
  }

  // ── 4. Nutrition Plan File ─────────────────────────────────────────────────
  if (planId && planCId) {
    await testSurface("4. Nutrition Plan File Upload  (admin › Plans › Files modal)", {
      path: `nutrition-plans/${planId}/${ts}_verify-plan.png`,
      insertDb: async (url) => dbInsert("nutrition_plan_files", {
        plan_id:   planId,
        client_id: planCId,
        filename:  "verify-plan.png",
        url,
        file_type: "image",
        size:      PNG_BUF.length,
      }),
      cleanDb: (id) => dbDelete("nutrition_plan_files", id),
    });
  } else {
    console.log("\n── 4. Nutrition Plan File Upload — SKIPPED (no plans in DB)");
  }

  // ── 5. Progress Photo ──────────────────────────────────────────────────────
  // progress_photos requires a real entry_id; test storage path only
  await testSurface("5. Progress Photo Upload  (admin › Client › Progress › Photos)", {
    path: clientId
      ? `progress/${clientId}/verify-entry/front_${ts}_verify.png`
      : `progress/verify-client/verify-entry/front_${ts}_verify.png`,
  });

  // ── 6. Blog Image (FileUploadField → uploads/) ────────────────────────────
  await testSurface("6. Blog Image Upload  (admin › Blog — FileUploadField)", {
    path: `uploads/${ts}_verify-blog.png`,
    // CMS saves url to blog_posts.featured_image_url; upload itself is storage-only
  });

  // ── 7. Service Image ───────────────────────────────────────────────────────
  await testSurface("7. Service Image Upload  (admin › Services — FileUploadField)", {
    path: `uploads/${ts}_verify-service.png`,
  });

  // ── 8. Success Story Image ─────────────────────────────────────────────────
  await testSurface("8. Success Story Image Upload  (admin › Success Stories — FileUploadField)", {
    path: `uploads/${ts}_verify-story.png`,
  });

  // ── 9. Testimonial Image ───────────────────────────────────────────────────
  await testSurface("9. Testimonial Image Upload  (admin › Testimonials — FileUploadField)", {
    path: `uploads/${ts}_verify-testimonial.png`,
  });

  // ── 10. Website Asset ─────────────────────────────────────────────────────
  await testSurface("10. Website Asset Upload  (admin › Website Builder / Settings — FileUploadField)", {
    path: `uploads/${ts}_verify-asset.png`,
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  const total  = log.length;
  const passed = log.filter(l => l.ok).length;
  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  Results: ${passed}/${total} checks passed`);
  if (failures === 0) {
    console.log("  ✓ ALL CHECKS PASSED");
  } else {
    console.log(`  ✗ ${failures} check(s) FAILED`);
    log.filter(l => !l.ok).forEach(l => console.log(`    - ${l.label}`));
  }
  console.log("═══════════════════════════════════════════════════════\n");

  process.exit(failures > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
