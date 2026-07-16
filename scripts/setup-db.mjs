/**
 * setup-db.mjs — SHELAN admin bootstrap
 * Uses raw fetch against Supabase REST + Auth Admin APIs (no realtime).
 * Run with: node scripts/setup-db.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY    = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function restGet(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

async function restPost(path, payload, key = SERVICE_KEY) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

async function authAdmin(method, path, payload) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

// ── 1. Check tables ───────────────────────────────────────────────────────────
async function checkTables() {
  const tables = ['clients', 'admin_profiles', 'assessments', 'appointments',
                  'messages', 'blog_posts', 'services', 'testimonials',
                  'website_settings', 'media_library'];
  const missing = [], present = [];
  for (const t of tables) {
    const { ok, body } = await restGet(`${t}?limit=1`);
    if (!ok && body?.code === '42P01') missing.push(t);
    else present.push(t);
  }
  return { missing, present };
}

// ── 2. Apply migrations via Management API ─────────────────────────────────────
import { readFileSync } from 'fs';

async function applyMigrations() {
  const files = [
    'supabase/migrations/20260716000001_initial_schema.sql',
    'supabase/migrations/20260716000002_auth_setup.sql',
  ];
  for (const file of files) {
    const query = readFileSync(file, 'utf8');
    console.log(`\nApplying ${file} ...`);
    const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query }),
    });
    const text = await r.text();
    if (r.ok) {
      console.log(`✓ Applied (HTTP ${r.status})`);
    } else {
      console.log(`  HTTP ${r.status}: ${text.slice(0, 300)}`);
    }
  }
}

// ── 3. Ensure admin user exists ───────────────────────────────────────────────
async function ensureAdminUser() {
  const ADMIN_EMAIL    = 'admin@shelan.com';
  const ADMIN_PASSWORD = 'Shelan@Admin2026!';

  // List users and find existing admin
  const { ok: listOk, body: listBody } = await authAdmin('GET', 'users?page=1&per_page=100');
  if (!listOk) throw new Error(`listUsers: ${JSON.stringify(listBody)}`);

  const users = listBody.users ?? listBody;
  let adminUser = users.find(u => u.email === ADMIN_EMAIL);

  if (adminUser) {
    console.log('\n✓ Auth user already exists:', adminUser.id);
  } else {
    console.log(`\nCreating auth user ${ADMIN_EMAIL} ...`);
    const { ok, body } = await authAdmin('POST', 'users', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (!ok) throw new Error(`createUser: ${JSON.stringify(body)}`);
    adminUser = body;
    console.log('✓ Auth user created:', adminUser.id);
  }

  return { adminUser, password: ADMIN_PASSWORD };
}

// ── 4. Ensure admin_profiles row ──────────────────────────────────────────────
async function ensureAdminProfile(userId, email) {
  const { ok, status, body } = await restGet(`admin_profiles?user_id=eq.${userId}&select=id,role`);

  if (!ok) {
    if (body?.code === '42P01') {
      console.log('⚠  admin_profiles table does not exist — migrations need to be applied manually.');
      return;
    }
    throw new Error(`admin_profiles select: ${JSON.stringify(body)}`);
  }

  const rows = Array.isArray(body) ? body : [];
  if (rows.length > 0) {
    console.log('✓ admin_profiles row exists (role:', rows[0].role + ')');
  } else {
    console.log('Creating admin_profiles row ...');
    const { ok: insertOk, body: insertBody } = await restPost('admin_profiles', {
      user_id:      userId,
      display_name: 'Shelan',
      role:         'admin',
      email,
    });
    if (!insertOk) throw new Error(`admin_profiles insert: ${JSON.stringify(insertBody)}`);
    console.log('✓ admin_profiles row created (role: admin)');
  }
}

// ── 5. Verify login via anon key ──────────────────────────────────────────────
async function verifyLogin(password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ email: 'admin@shelan.com', password }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Login: ${JSON.stringify(body)}`);
  console.log('\n✓ Login verified. User:', body.user?.email);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('=== SHELAN DB Setup ===');
console.log('Project:', PROJECT_REF);

console.log('\n--- Checking schema ---');
const { missing, present } = await checkTables();
console.log('Present:', present.join(', ') || 'none');
console.log('Missing:', missing.join(', ') || 'none');

if (missing.length > 0) {
  console.log('\n--- Applying migrations ---');
  await applyMigrations();

  const { missing: stillMissing } = await checkTables();
  if (stillMissing.length > 0) {
    console.log('\n⚠  Still missing after migration attempt:', stillMissing.join(', '));
    console.log('   The /database/query endpoint requires a Supabase Management PAT, not the service role key.');
    console.log('   Please paste the two SQL files in Supabase Dashboard > SQL Editor manually.');
  } else {
    console.log('\n✓ All tables now present');
  }
} else {
  console.log('\n✓ All tables present — skipping migrations');
}

console.log('\n--- Admin user ---');
const { adminUser, password } = await ensureAdminUser();
await ensureAdminProfile(adminUser.id, adminUser.email);

console.log('\n--- Verifying login ---');
await verifyLogin(password);

console.log('\n✅  Setup complete!');
console.log('   Email:    admin@shelan.com');
console.log('   Password: Shelan@Admin2026!');
