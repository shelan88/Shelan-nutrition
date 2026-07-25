/**
 * Playwright trace script — Delete Account debug reproduction
 * Captures every [DBG:*] console event emitted by the built-in debug panel
 * during the full delete-account flow.
 *
 * Usage:  node scripts/trace-delete-account.js
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// ── config ────────────────────────────────────────────────────────────────────
const APP_URL          = 'http://127.0.0.1:5000';
const SUPABASE_URL     = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_EMAIL    = `dbg-trace-${Date.now()}@test-shelan.dev`;
const TEST_PASSWORD = 'TraceTest#2026!';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

// ── helpers ───────────────────────────────────────────────────────────────────
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const events = [];  // chronological list of captured debug events

function timestamp() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

function record(source, msg) {
  const entry = { t: timestamp(), source, msg };
  events.push(entry);
  const prefix = source === 'CONSOLE' ? '  [browser]' : `  [${source}]`;
  console.log(`${entry.t}  ${prefix}  ${msg}`);
}

// ── main ──────────────────────────────────────────────────────────────────────
(async () => {
  // ── Step 1: Create throwaway user via admin API ───────────────────────────
  console.log('\n━━━ STEP 1 — Create test user via Supabase Admin API ━━━');
  record('SETUP', `Creating test user: ${TEST_EMAIL}`);

  const { data: createData, error: createError } =
    await adminClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,   // skip email confirmation
    });

  if (createError) {
    console.error('Failed to create user:', createError.message);
    process.exit(1);
  }

  const testUserId = createData.user.id;
  record('SETUP', `User created OK — uid: ${testUserId}`);

  // ── Step 2: Launch browser ────────────────────────────────────────────────
  console.log('\n━━━ STEP 2 — Browser boot ━━━');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  // Capture EVERY console message from the browser
  page.on('console', msg => {
    const text = msg.text();
    // Capture everything — DBG events, errors, warnings
    record('CONSOLE', `[${msg.type().toUpperCase()}] ${text}`);
  });

  page.on('pageerror', err => {
    record('PAGE-ERROR', err.message);
  });

  // ── Step 3: Navigate to app ───────────────────────────────────────────────
  console.log('\n━━━ STEP 3 — Navigate to app ━━━');
  record('NAV', `→ ${APP_URL}`);
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ── Step 4: Open login modal ──────────────────────────────────────────────
  console.log('\n━━━ STEP 4 — Open auth modal & sign in ━━━');
  record('ACTION', 'Clicking Login / Sign Up button');
  await page.getByText('Login / Sign Up').click();
  await page.waitForTimeout(800);

  // Fill email
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(TEST_EMAIL);
  record('ACTION', `Filled email: ${TEST_EMAIL}`);

  // Fill password
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(TEST_PASSWORD);
  record('ACTION', 'Filled password');

  // Submit
  const signInBtn = page.locator('button').filter({ hasText: /sign in/i }).first();
  record('ACTION', 'Clicking Sign In');
  await signInBtn.click();
  await page.waitForTimeout(2500);

  // ── Step 5: Navigate to portal/settings ──────────────────────────────────
  console.log('\n━━━ STEP 5 — Navigate to portal settings ━━━');
  record('NAV', `→ ${APP_URL}/portal/settings`);
  await page.goto(`${APP_URL}/portal/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot for reference
  await page.screenshot({ path: '/tmp/trace-01-settings.png' });
  record('SCREENSHOT', '/tmp/trace-01-settings.png');

  // ── Step 6: Scroll to Delete Account section ──────────────────────────────
  console.log('\n━━━ STEP 6 — Locate Delete Account section ━━━');
  const deleteHeading = page.locator('text=Delete Account').first();
  await deleteHeading.scrollIntoViewIfNeeded().catch(() =>
    record('WARN', 'Delete Account heading not found by text — scrolling to bottom')
  );
  await page.waitForTimeout(500);

  // ── Step 7: Click "Delete My Account" button ──────────────────────────────
  console.log('\n━━━ STEP 7 — Click primary Delete button ━━━');
  const deleteBtn = page.locator('button').filter({ hasText: /delete my account/i }).first();
  record('ACTION', 'Clicking "Delete My Account"');
  await deleteBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/trace-02-confirm-dialog.png' });
  record('SCREENSHOT', '/tmp/trace-02-confirm-dialog.png');

  // ── Step 8: Type confirmation phrase ──────────────────────────────────────
  console.log('\n━━━ STEP 8 — Type confirmation phrase ━━━');
  const confirmInput = page.locator('input[type="text"]').filter({ hasText: '' }).last();
  // Also try placeholder-based selector
  const phraseInput =
    (await page.locator('input[placeholder*="DELETE"]').count()) > 0
      ? page.locator('input[placeholder*="DELETE"]').first()
      : page.locator('input').last();

  await phraseInput.fill('DELETE MY ACCOUNT');
  record('ACTION', 'Typed confirmation phrase: DELETE MY ACCOUNT');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/trace-03-phrase-filled.png' });
  record('SCREENSHOT', '/tmp/trace-03-phrase-filled.png');

  // ── Step 9: Click Confirm / final submit ──────────────────────────────────
  console.log('\n━━━ STEP 9 — Click Confirm Delete ━━━');

  // Snapshot events BEFORE the click so we can diff
  const eventsBefore = events.length;
  record('MARKER', '──────── CONFIRM CLICK ────────');

  const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes.*delete|permanently/i }).first();
  await confirmBtn.click();
  record('ACTION', 'Clicked Confirm button');

  // Wait for the operation to complete (sign-out redirect or error toast)
  await Promise.race([
    page.waitForURL(/\/$/, { timeout: 8000 }).catch(() => {}),
    page.waitForSelector('[data-testid="toast"], .toast, [role="alert"]', { timeout: 8000 }).catch(() => {}),
    page.waitForTimeout(8000),
  ]);

  await page.waitForTimeout(1500);  // let trailing events settle

  await page.screenshot({ path: '/tmp/trace-04-after-delete.png' });
  record('SCREENSHOT', '/tmp/trace-04-after-delete.png');

  const eventsAfter = events.length;

  // ── Step 10: Teardown ─────────────────────────────────────────────────────
  await browser.close();

  // Clean up test user (best-effort)
  await adminClient.auth.admin.deleteUser(testUserId).catch(() => {});
  record('SETUP', 'Test user cleaned up');

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DEBUG PANEL TRACE — events during Delete Account operation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const dbgEvents = events.filter(e =>
    e.source === 'CONSOLE' && e.msg.includes('DBG:')
  );

  const deleteEvents = events.slice(eventsBefore - 1); // from MARKER onward

  console.log(`Total events captured:        ${events.length}`);
  console.log(`DBG panel events total:       ${dbgEvents.length}`);
  console.log(`Events after confirm click:   ${eventsAfter - eventsBefore}\n`);

  console.log('── DBG events during delete (from CONFIRM CLICK onward) ──\n');
  const deleteDbgEvents = deleteEvents.filter(e =>
    e.source === 'CONSOLE' && e.msg.includes('DBG:')
  );

  if (deleteDbgEvents.length === 0) {
    console.log('  ⚠  NO [DBG:*] events captured after confirm click.');
    console.log('     This means the debug system has no instrumentation for this operation.\n');
  } else {
    deleteDbgEvents.forEach(e => console.log(`  ${e.t}  ${e.msg}`));
  }

  console.log('\n── ALL events after confirm click (errors, warnings, any type) ──\n');
  deleteEvents.forEach(e => {
    if (e.source !== 'SCREENSHOT') {
      console.log(`  ${e.t}  [${e.source}]  ${e.msg}`);
    }
  });

  console.log('\n── Complete DBG event log (full session) ──\n');
  dbgEvents.forEach(e => console.log(`  ${e.t}  ${e.msg}`));

})();
