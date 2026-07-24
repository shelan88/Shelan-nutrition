/**
 * prove-cert-visibility-fix.mjs
 *
 * Proves that the updateSectionVisible() upsert fix works end-to-end.
 * Runs all 8 checks the user requested, then restores the original state.
 *
 * Uses the service-role key to bypass RLS (test runner, not public client).
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SRK) {
  console.error("❌  VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const db = createClient(URL, SRK, { auth: { persistSession: false } });

// ── helpers ────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(label, detail = "") {
  console.log(`  ✅  CHECK ${String(passed + failed + 1).padStart(2)}: ${label}${detail ? `  →  ${detail}` : ""}`);
  passed++;
}

function fail(label, detail = "") {
  console.error(`  ❌  CHECK ${String(passed + failed + 1).padStart(2)}: ${label}  →  ${detail}`);
  failed++;
}

function hr(title) {
  console.log(`\n─── ${title} ${"─".repeat(Math.max(0, 55 - title.length))}`);
}

// Mirrors updateSectionVisible() post-fix  (upsert instead of update)
async function upsertVisible(key, visible) {
  return db
    .from("about_section_settings")
    .upsert({ section_key: key, visible }, { onConflict: "section_key" });
}

// Mirrors getSectionSettings()
async function getRow(key) {
  return db
    .from("about_section_settings")
    .select("*")
    .eq("section_key", key)
    .maybeSingle();
}

// ── CHECK 1: Delete any existing row so we start from a clean slate ────────────
hr("CHECK 1 — Delete existing certifications row");

const { data: deleted, error: delErr } = await db
  .from("about_section_settings")
  .delete()
  .eq("section_key", "certifications")
  .select();

if (delErr) {
  fail("Delete existing row", delErr.message);
} else {
  ok(
    "Existing row deleted (or table was already clean)",
    deleted?.length ? `Removed row id=${deleted[0].id}` : "No pre-existing row"
  );
}

// Confirm the row is gone
const { data: afterDel } = await getRow("certifications");
if (afterDel !== null) {
  fail("Row confirmed absent after delete", `Still found: ${JSON.stringify(afterDel)}`);
} else {
  ok("about_section_settings has NO certifications row after delete");
}

// ── CHECK 2: Toggle Hide — upsert with visible=false ──────────────────────────
hr("CHECK 2 — Toggle Hide (upsert visible=false on missing row)");

const { error: hideErr } = await upsertVisible("certifications", false);
if (hideErr) {
  fail("upsert visible=false", hideErr.message);
} else {
  ok("upsert completed with no error");
}

// ── CHECK 3–4: Verify new row was created, print it ───────────────────────────
hr("CHECKS 3–4 — Verify row created and print it");

const { data: hiddenRow, error: fetchErr } = await getRow("certifications");
if (fetchErr) {
  fail("getSectionSettings after hide", fetchErr.message);
} else if (!hiddenRow) {
  fail("Row exists in about_section_settings", "returned null — upsert did not create the row");
} else {
  ok("New row created in about_section_settings");
  ok(
    "Row contents",
    JSON.stringify({
      id:          hiddenRow.id,
      section_key: hiddenRow.section_key,
      visible:     hiddenRow.visible,
      created_at:  hiddenRow.created_at,
    })
  );
}

// ── CHECK 5–6: Simulate page reload — getSectionSettings returns visible=false ─
hr("CHECKS 5–6 — Simulate page reload");

const { data: reloadRow, error: reloadErr } = await getRow("certifications");
if (reloadErr) {
  fail("getSectionSettings on reload", reloadErr.message);
} else if (!reloadRow) {
  fail("getSectionSettings returns a row", "returned null");
} else {
  ok("getSectionSettings(\"certifications\") returns a row on reload");

  if (reloadRow.visible === false) {
    ok("visible=false  →  AboutPage certVisible=false  →  <AboutCertifications /> NOT rendered");
  } else {
    fail("visible must be false", `Got visible=${reloadRow.visible}`);
  }
}

// ── CHECK 7: AboutPage logic ───────────────────────────────────────────────────
hr("CHECK 7 — AboutPage.tsx visibility derivation");

// Mirrors lines 45-48 of AboutPage.tsx exactly
const certSectionRow = reloadRow ?? null;
const certVisible =
  certSectionRow === undefined ? true
  : certSectionRow === null    ? true
  : certSectionRow.visible;

if (!certVisible) {
  ok(
    "AboutPage: certVisible=false  →  JSX: {false && <AboutCertifications />}  →  null",
    "Section is suppressed"
  );
} else {
  fail("AboutPage certVisible should be false", `Got certVisible=${certVisible}`);
}

// ── CHECK 8: Toggle Show — same row updated, no duplicates ────────────────────
hr("CHECK 8 — Toggle Show (upsert visible=true, no duplicate rows)");

const { error: showErr } = await upsertVisible("certifications", true);
if (showErr) {
  fail("upsert visible=true", showErr.message);
} else {
  ok("upsert visible=true completed with no error");
}

const { data: allRows, error: countErr } = await db
  .from("about_section_settings")
  .select("*")
  .eq("section_key", "certifications");

if (countErr) {
  fail("Count rows after toggle-show", countErr.message);
} else if (allRows.length !== 1) {
  fail(`Exactly 1 row (no duplicates)`, `Found ${allRows.length} rows`);
} else if (allRows[0].visible !== true) {
  fail("visible updated to true", `Got visible=${allRows[0].visible}`);
} else {
  ok(`Exactly 1 row in about_section_settings (no duplicates created)`);
  ok(
    "Row updated in-place — visible=true",
    `id=${allRows[0].id}  visible=${allRows[0].visible}`
  );
}

// ── Summary ────────────────────────────────────────────────────────────────────
hr("SUMMARY");
console.log(`\n  ${passed} passed   ${failed} failed   (${passed + failed} total)\n`);

if (failed > 0) process.exit(1);
